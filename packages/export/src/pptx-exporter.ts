import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Deck } from '@slideharness/core';
import { getAspectRatioDimensions, getCanvasDimensions } from '@slideharness/renderer';
import type { CanvasSize } from '@slideharness/renderer';
import type { ExportResult } from './types.js';

// =============================================================================
// Dynamic Imports
// =============================================================================

async function getPlaywright() {
  try {
    return await import('playwright');
  } catch {
    throw new Error(
      'Playwright is required for PPTX export. Install it with: pnpm add playwright && npx playwright install chromium',
    );
  }
}

async function getPptxGenJS(): Promise<typeof import('pptxgenjs')> {
  try {
    return await import('pptxgenjs');
  } catch {
    throw new Error(
      'PptxGenJS is required for PPTX export. Install it with: pnpm add pptxgenjs',
    );
  }
}

// =============================================================================
// Types
// =============================================================================

interface ExtractedTextBlock {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  fontFace: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  align: string;
  lineSpacing: number;
}

// =============================================================================
// Helpers
// =============================================================================

function pxToInches(px: number): number {
  return px / 96;
}

function cssPxToPoints(px: number): number {
  return px * 0.75;
}

function cssColorToHex(color: string): { hex: string; transparency?: number } {
  if (!color || color === 'transparent') return { hex: '000000', transparency: 100 };

  // Handle rgb/rgba
  const rgbaMatch = color.match(
    /rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/,
  );
  if (rgbaMatch) {
    const r = Math.round(Number(rgbaMatch[1]));
    const g = Math.round(Number(rgbaMatch[2]));
    const b = Math.round(Number(rgbaMatch[3]));
    const a = rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1;
    const hex =
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0');
    return a < 1 ? { hex, transparency: Math.round((1 - a) * 100) } : { hex };
  }

  // Handle hex
  const hexMatch = color.match(/^#([0-9a-fA-F]{3,8})$/);
  if (hexMatch) {
    let h = hexMatch[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length === 8) {
      const a = parseInt(h.slice(6, 8), 16) / 255;
      return { hex: h.slice(0, 6), transparency: Math.round((1 - a) * 100) };
    }
    return { hex: h.slice(0, 6) };
  }

  return { hex: '000000' };
}

function mapTextAlign(align: string): 'left' | 'center' | 'right' | 'justify' {
  switch (align) {
    case 'center': return 'center';
    case 'right': return 'right';
    case 'end': return 'right';
    case 'justify': return 'justify';
    default: return 'left';
  }
}

function extractPrimaryFont(fontFamily: string): string {
  if (!fontFamily) return 'Arial';
  const first = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
  // Map common web fonts to PowerPoint-friendly names
  if (/^(system-ui|sans-serif|Arial|Helvetica)$/i.test(first)) return 'Arial';
  if (/^(serif|Times|Georgia)$/i.test(first)) return 'Times New Roman';
  if (/^(monospace|Courier)$/i.test(first)) return 'Courier New';
  return first;
}

// =============================================================================
// Text Extraction Script (runs in browser context)
// =============================================================================

const TEXT_EXTRACTION_SCRIPT = `
(() => {
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'SVG', 'IMG', 'CANVAS', 'VIDEO', 'AUDIO', 'NOSCRIPT', 'TEMPLATE']);
  const FA_FONT_FAMILIES = ['Font Awesome', 'FontAwesome', 'fa-solid', 'fa-regular', 'fa-brands', 'fa-light', 'fa-thin'];

  const slideEl = document.querySelector('[data-slide-root]') || document.body.firstElementChild;
  if (!slideEl) return [];

  const slideRect = slideEl.getBoundingClientRect();
  const results = [];

  const walker = document.createTreeWalker(
    slideEl,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;

        const text = node.textContent;
        if (!text || !text.trim()) return NodeFilter.FILTER_REJECT;

        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  // Group text nodes by their parent element
  const parentMap = new Map();
  let textNode;
  while ((textNode = walker.nextNode())) {
    const parent = textNode.parentElement;
    if (!parent) continue;
    if (!parentMap.has(parent)) {
      parentMap.set(parent, []);
    }
    parentMap.get(parent).push(textNode.textContent);
  }

  for (const [el, texts] of parentMap) {
    const cs = getComputedStyle(el);

    // Skip invisible elements
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (parseFloat(cs.opacity) === 0) continue;

    // Skip Font Awesome icons
    const classList = Array.from(el.classList || []);
    if (classList.some(c => /^fa[srlbtdk]?$/.test(c) || c.startsWith('fa-'))) continue;
    const ff = cs.fontFamily || '';
    if (FA_FONT_FAMILIES.some(f => ff.includes(f))) continue;

    // Skip gradient text
    const bgClip = cs.webkitBackgroundClip || cs.backgroundClip || '';
    if (bgClip === 'text') continue;

    // Skip transformed text (rotation etc.) - screenshot handles these
    if (cs.transform && cs.transform !== 'none') continue;

    const fontSize = parseFloat(cs.fontSize);
    if (fontSize < 5) continue;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    // Skip elements outside slide area
    if (rect.right < slideRect.left || rect.left > slideRect.right) continue;
    if (rect.bottom < slideRect.top || rect.top > slideRect.bottom) continue;

    const combinedText = texts.join('');
    if (!combinedText.trim()) continue;

    const lineHeight = parseFloat(cs.lineHeight);
    const lineSpacingRatio = isNaN(lineHeight) ? 1.2 : lineHeight / fontSize;

    results.push({
      text: combinedText,
      x: rect.left - slideRect.left,
      y: rect.top - slideRect.top,
      w: rect.width,
      h: rect.height,
      fontSize: fontSize,
      fontFace: cs.fontFamily,
      bold: parseInt(cs.fontWeight) >= 700,
      italic: cs.fontStyle === 'italic' || cs.fontStyle === 'oblique',
      underline: cs.textDecorationLine.includes('underline'),
      color: cs.color,
      align: cs.textAlign,
      lineSpacing: Math.round(lineSpacingRatio * 100),
    });
  }

  return results;
})()
`;

// =============================================================================
// Main Export
// =============================================================================

export async function exportToPptx(
  deck: Deck,
  slideHtmls: string[],
  outputPath: string,
  aspectRatio: '16:9' | '4:3' | '16:10' | '1:1' = '16:9',
  canvasSize?: CanvasSize,
): Promise<ExportResult> {
  let browser: import('playwright').Browser | undefined;
  try {
    const pw = await getPlaywright();
    const PptxGenJS = await getPptxGenJS();
    const dims = canvasSize ? getCanvasDimensions(canvasSize) : getAspectRatioDimensions(aspectRatio);
    const slideWInches = dims.width / 96;
    const slideHInches = dims.height / 96;

    // Create PptxGenJS presentation
    const pptx = new PptxGenJS.default();
    pptx.defineLayout({ name: 'CUSTOM', width: slideWInches, height: slideHInches });
    pptx.layout = 'CUSTOM';

    browser = await pw.chromium.launch();
    const context = await browser.newContext({ deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.setViewportSize(dims);

    for (let i = 0; i < slideHtmls.length; i++) {
      const html = slideHtmls[i];

      // 1. Load the slide HTML
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);

      // 2. Take screenshot for background
      const screenshotBuffer = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: dims.width, height: dims.height },
      });
      const screenshotBase64 = screenshotBuffer.toString('base64');

      // 3. Extract text blocks
      const textBlocks: ExtractedTextBlock[] = await page.evaluate(TEXT_EXTRACTION_SCRIPT);

      // 4. Create slide with screenshot background
      const slide = pptx.addSlide();
      slide.background = { data: `image/png;base64,${screenshotBase64}` };

      // 5. Add native text boxes for each extracted text block
      for (const block of textBlocks) {
        const colorInfo = cssColorToHex(block.color);
        const fontFace = extractPrimaryFont(block.fontFace);

        slide.addText(block.text, {
          x: pxToInches(block.x),
          y: pxToInches(block.y),
          w: pxToInches(block.w),
          h: pxToInches(block.h),
          fontSize: cssPxToPoints(block.fontSize),
          fontFace,
          bold: block.bold,
          italic: block.italic,
          underline: block.underline ? { style: 'sng' } : undefined,
          color: colorInfo.hex,
          transparency: colorInfo.transparency,
          align: mapTextAlign(block.align),
          lineSpacingMultiple: block.lineSpacing / 100,
          valign: 'top',
          margin: 0,
          wrap: true,
          autoFit: false,
        });
      }
    }

    await browser.close();
    browser = undefined;

    // Write PPTX file
    await mkdir(dirname(outputPath), { recursive: true });
    const pptxOutput = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
    const { writeFile } = await import('node:fs/promises');
    await writeFile(outputPath, pptxOutput);

    return { success: true, outputPath, format: 'pptx' };
  } catch (err) {
    return {
      success: false,
      outputPath,
      format: 'pptx',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
