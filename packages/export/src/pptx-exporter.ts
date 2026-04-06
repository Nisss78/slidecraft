import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Deck } from '@slideharness/core';
import { getAspectRatioDimensions } from '@slideharness/renderer';
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

async function getPptxGenJs() {
  try {
    const mod = await import('pptxgenjs');
    return mod.default || mod;
  } catch {
    throw new Error(
      'pptxgenjs is required for PPTX export. Install it with: pnpm add pptxgenjs',
    );
  }
}

// =============================================================================
// Types
// =============================================================================

interface ExtractedTextElement {
  text: string;
  x: number; // px
  y: number; // px
  width: number; // px
  height: number; // px
  fontSize: number; // px
  fontFamily: string;
  fontWeight: number;
  fontStyle: string;
  color: string; // rgb(r, g, b) or rgba(...)
  textAlign: string;
  lineHeight: number; // px
}

interface SlideProcessResult {
  screenshot: Buffer;
  textElements: ExtractedTextElement[];
}

// =============================================================================
// Font Fallback
// =============================================================================

const FONT_FALLBACK: Record<string, string> = {
  'Noto Sans JP': 'Yu Gothic',
  'Hiragino Mincho Pro': 'Yu Mincho',
  'Hiragino Mincho ProN': 'Yu Mincho',
  'Hiragino Sans': 'Yu Gothic',
  'Hiragino Kaku Gothic ProN': 'Yu Gothic',
  Inter: 'Calibri',
  'system-ui': 'Calibri',
  '-apple-system': 'Calibri',
  BlinkMacSystemFont: 'Calibri',
  'Segoe UI': 'Segoe UI',
  Roboto: 'Calibri',
  'Helvetica Neue': 'Arial',
  Helvetica: 'Arial',
  'sans-serif': 'Calibri',
  'serif': 'Times New Roman',
  'monospace': 'Courier New',
};

/**
 * Resolve CSS font-family to a PPTX-safe font name.
 * Takes the first font in the stack and maps through fallback table.
 */
function resolveFontFamily(cssFontFamily: string): string {
  // Parse CSS font-family: may be comma-separated, may include quotes
  const fonts = cssFontFamily.split(',').map((f) => f.trim().replace(/['"]/g, ''));

  for (const font of fonts) {
    if (FONT_FALLBACK[font]) {
      return FONT_FALLBACK[font];
    }
    // If the font name looks like a real font (not a generic), use it directly
    if (font && !['system-ui', '-apple-system', 'BlinkMacSystemFont'].includes(font)) {
      return font;
    }
  }

  return 'Calibri';
}

// =============================================================================
// Unit Conversion
// =============================================================================

/** Convert px to inches based on viewport and slide dimensions */
function pxToInches(px: number, viewportPx: number, slideInches: number): number {
  return (px / viewportPx) * slideInches;
}

/** Convert CSS px font size to PowerPoint points (1px = 0.75pt) */
function pxToPt(px: number): number {
  return Math.round(px * 0.75);
}

/**
 * Parse CSS color string to hex (without #) for pptxgenjs.
 */
function cssColorToHex(color: string): string {
  // Handle rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return r + g + b;
  }

  // Handle hex
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      return hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return hex.substring(0, 6);
  }

  return '000000';
}

// =============================================================================
// Icon Class Detection
// =============================================================================

const ICON_CLASSES = ['fas', 'fab', 'far', 'fa-solid', 'fa-brands', 'fa-regular', 'material-icons', 'material-symbols-outlined'];

// =============================================================================
// Browser-side Text Extraction (runs inside page.evaluate)
// =============================================================================

/**
 * Script executed inside the browser to extract text elements and their computed styles.
 */
function extractTextElementsScript(iconClasses: string[]): ExtractedTextElement[] {
  const TEXT_TAGS = new Set([
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'P', 'SPAN', 'A', 'LI', 'TD', 'TH',
    'STRONG', 'EM', 'B', 'I', 'U', 'S',
    'LABEL', 'FIGCAPTION', 'BLOCKQUOTE', 'PRE', 'CODE',
  ]);

  const results: ExtractedTextElement[] = [];
  const processedRects = new Set<string>();

  function isIconElement(el: Element): boolean {
    for (const cls of iconClasses) {
      if (el.classList.contains(cls)) return true;
    }
    // Check if element has Font Awesome content via ::before
    const before = window.getComputedStyle(el, '::before');
    if (before.fontFamily && before.fontFamily.includes('Font Awesome')) return true;
    return false;
  }

  function isTextLeaf(el: Element): boolean {
    // An element is a "text leaf" if it has direct text content
    // and no child elements that themselves contain text
    for (const child of el.children) {
      if (TEXT_TAGS.has(child.tagName) && child.textContent?.trim()) {
        return false; // Has a text-bearing child, so this is not a leaf
      }
    }
    return true;
  }

  function getDirectText(el: Element): string {
    let text = '';
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      }
    }
    return text.trim();
  }

  function walk(el: Element): void {
    // Skip invisible elements
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
      return;
    }

    // Skip icon elements (they'll be captured in the background screenshot)
    if (isIconElement(el)) return;

    if (TEXT_TAGS.has(el.tagName) && isTextLeaf(el)) {
      const text = el.textContent?.trim();
      if (!text) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Dedup by position (rounded)
      const key = `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)}`;
      if (processedRects.has(key)) return;
      processedRects.add(key);

      results.push({
        text,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        fontSize: parseFloat(style.fontSize),
        fontFamily: style.fontFamily,
        fontWeight: parseInt(style.fontWeight) || 400,
        fontStyle: style.fontStyle,
        color: style.color,
        textAlign: style.textAlign,
        lineHeight: parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2,
      });
      return; // Don't recurse into leaves
    }

    // Recurse into children
    for (const child of el.children) {
      walk(child);
    }

    // For non-TEXT_TAG elements, check if they have direct text (e.g., <div>Hello</div>)
    if (!TEXT_TAGS.has(el.tagName)) {
      const directText = getDirectText(el);
      if (directText) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const key = `${Math.round(rect.x)},${Math.round(rect.y)},${Math.round(rect.width)}`;
          if (!processedRects.has(key)) {
            processedRects.add(key);
            results.push({
              text: directText,
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              fontSize: parseFloat(style.fontSize),
              fontFamily: style.fontFamily,
              fontWeight: parseInt(style.fontWeight) || 400,
              fontStyle: style.fontStyle,
              color: style.color,
              textAlign: style.textAlign,
              lineHeight: parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2,
            });
          }
        }
      }
    }
  }

  walk(document.body);
  return results;
}

/**
 * Script executed inside the browser to hide all text by setting color to transparent.
 * Space is preserved so layout doesn't shift.
 */
function hideTextForScreenshotScript(iconClasses: string[]): void {
  const TEXT_TAGS = new Set([
    'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'P', 'SPAN', 'A', 'LI', 'TD', 'TH',
    'STRONG', 'EM', 'B', 'I', 'U', 'S',
    'LABEL', 'FIGCAPTION', 'BLOCKQUOTE', 'PRE', 'CODE',
  ]);

  function isIconElement(el: Element): boolean {
    for (const cls of iconClasses) {
      if (el.classList.contains(cls)) return true;
    }
    const before = window.getComputedStyle(el, '::before');
    if (before.fontFamily && before.fontFamily.includes('Font Awesome')) return true;
    return false;
  }

  function walk(el: Element): void {
    if (isIconElement(el)) return; // Keep icons visible

    const style = window.getComputedStyle(el);
    if (style.display === 'none') return;

    if (TEXT_TAGS.has(el.tagName) || el.childNodes.length > 0) {
      // Check if this element has direct text nodes
      let hasDirectText = false;
      for (const node of el.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          hasDirectText = true;
          break;
        }
      }
      if (hasDirectText) {
        (el as HTMLElement).style.color = 'transparent';
        // Also hide text-shadow and text-decoration
        (el as HTMLElement).style.textShadow = 'none';
        (el as HTMLElement).style.textDecorationColor = 'transparent';
        (el as HTMLElement).style.webkitTextFillColor = 'transparent';
      }
    }

    for (const child of el.children) {
      walk(child);
    }
  }

  walk(document.body);
}

// =============================================================================
// Slide Processing (2-Pass Hybrid)
// =============================================================================

/**
 * Load HTML into the page and wait for fonts, CSS, and Tailwind to fully render.
 */
async function waitForFontsAndRender(
  page: import('playwright').Page,
  html: string,
  dims: { width: number; height: number },
): Promise<void> {
  await page.setViewportSize(dims);
  await page.setContent(html, { waitUntil: 'networkidle' });

  // Wait for all web fonts to finish loading
  await page.evaluate(() => document.fonts.ready);

  // Allow Tailwind JIT / dynamic CSS generation to settle
  await page.waitForTimeout(200);
}

/**
 * Process a single slide: extract text elements + capture background screenshot.
 * This is the core of the 2-Pass Hybrid approach:
 *  1. Render HTML fully in browser
 *  2. Extract text positions and computed styles
 *  3. Hide text (color:transparent) to keep layout but remove visible text
 *  4. Screenshot the background (all visual elements except text)
 */
async function processSlide(
  page: import('playwright').Page,
  html: string,
  dims: { width: number; height: number },
): Promise<SlideProcessResult> {
  // Step 1: Render HTML fully
  await waitForFontsAndRender(page, html, dims);

  // Step 2: Extract text elements with computed styles
  const textElements = await page.evaluate(extractTextElementsScript, ICON_CLASSES);

  // Step 3: Hide text for background screenshot
  await page.evaluate(hideTextForScreenshotScript, ICON_CLASSES);

  // Step 4: Take screenshot of background (text hidden)
  const screenshot = await page.screenshot({ type: 'png' });

  return { screenshot, textElements };
}

// =============================================================================
// Main Export Function
// =============================================================================

/**
 * Export deck as editable PPTX using 2-Pass Hybrid approach.
 *
 * For each slide:
 * 1. Render HTML in Playwright browser
 * 2. Extract text elements with getComputedStyle() for accurate positions/styles
 * 3. Hide text and capture background screenshot
 * 4. In PPTX: set background = screenshot image, overlay native editable text boxes
 *
 * This preserves 100% visual fidelity for backgrounds/gradients/images/SVGs
 * while keeping text natively editable in PowerPoint.
 */
export async function exportToPptx(
  deck: Deck,
  slideHtmls: string[],
  outputPath: string,
  aspectRatio: '16:9' | '4:3' | '16:10' | '1:1' = '16:9',
): Promise<ExportResult> {
  let browser: import('playwright').Browser | undefined;
  try {
    const [pw, PptxGenJS] = await Promise.all([getPlaywright(), getPptxGenJs()]);
    const dims = getAspectRatioDimensions(aspectRatio);

    // PPTX slide dimensions in inches (standard 96 DPI)
    const slideWidthInches = dims.width / 96; // 20 inches for 1920px
    const slideHeightInches = dims.height / 96; // 11.25 inches for 1080px

    // Launch browser with 2x scale for high-res background images
    browser = await pw.chromium.launch();
    const context = await browser.newContext({
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Create PPTX
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'CUSTOM', width: slideWidthInches, height: slideHeightInches });
    pptx.layout = 'CUSTOM';
    pptx.title = deck.title;
    pptx.author = deck.author || 'Slide Harness';

    // Process each slide
    for (let i = 0; i < slideHtmls.length; i++) {
      const { screenshot, textElements } = await processSlide(page, slideHtmls[i], dims);

      const slide = pptx.addSlide();

      // Set background to screenshot image (captures gradients, images, SVGs, icons, etc.)
      const base64 = screenshot.toString('base64');
      slide.background = { data: `image/png;base64,${base64}` };

      // Add native editable text boxes
      for (const el of textElements) {
        // Convert px positions to inches
        const x = pxToInches(el.x, dims.width, slideWidthInches);
        const y = pxToInches(el.y, dims.height, slideHeightInches);
        const w = pxToInches(el.width, dims.width, slideWidthInches);
        const h = pxToInches(el.height, dims.height, slideHeightInches);

        // Skip elements outside the visible area
        if (x + w < 0 || y + h < 0 || x > slideWidthInches || y > slideHeightInches) {
          continue;
        }

        // Skip very small text elements (likely hidden or decorative)
        if (el.fontSize < 6) continue;

        const fontSize = pxToPt(el.fontSize);
        const fontFace = resolveFontFamily(el.fontFamily);
        const color = cssColorToHex(el.color);
        const bold = el.fontWeight >= 600;
        const italic = el.fontStyle === 'italic';

        // Map CSS text-align to pptxgenjs align
        let align: 'left' | 'center' | 'right' | 'justify' = 'left';
        if (el.textAlign === 'center' || el.textAlign === '-webkit-center') {
          align = 'center';
        } else if (el.textAlign === 'right') {
          align = 'right';
        } else if (el.textAlign === 'justify') {
          align = 'justify';
        }

        slide.addText(el.text, {
          x,
          y,
          w,
          h,
          fontSize,
          fontFace,
          color,
          bold,
          italic,
          align,
          valign: 'top',
          wrap: true,
          // Transparent fill so background image shows through
          fill: { color: 'FFFFFF', transparency: 100 },
          // No margin/padding to match browser layout precisely
          margin: 0,
        });
      }
    }

    // Close browser
    await browser.close();
    browser = undefined;

    // Save PPTX
    await mkdir(dirname(outputPath), { recursive: true });
    await pptx.writeFile({ fileName: outputPath });

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
