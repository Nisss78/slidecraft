import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import * as cheerio from 'cheerio';
import type { Deck } from '@slidecraft/core';
import { getAspectRatioDimensions } from '@slidecraft/renderer';
import type { ExportResult } from './types.js';

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

interface ComputedStyle {
  // Text
  color: string;
  fontFamily: string;
  fontSize: number; // pt
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;

  // Layout
  display: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: number;

  // Position & Size
  x: number;
  y: number;
  w: number;
  h: number;

  // Background
  backgroundColor?: string;

  // Border
  borderLeft?: { width: number; color: string };
  borderRadius?: number;

  // Padding/Margin
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
}

interface ParsedElement {
  type: 'text' | 'rect' | 'shape';
  tagName: string;
  text?: string;
  style: ComputedStyle;
  children?: ParsedElement[];
}

interface SlideContent {
  background: string;
  elements: ParsedElement[];
}

// =============================================================================
// CSS Parsing Utilities
// =============================================================================

const CSS_UNIT_TO_PT: Record<string, number> = {
  px: 0.75, // 1px = 0.75pt
  rem: 12, // 1rem = 12pt (assuming 16px base)
  em: 12,
  pt: 1,
};

/**
 * Parse CSS color to hex format (without #)
 */
function parseColor(color: string | undefined): string {
  if (!color) return '000000';

  // Already hex
  if (color.startsWith('#')) {
    return color.replace('#', '');
  }

  // rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return r + g + b;
  }

  // Named colors
  const namedColors: Record<string, string> = {
    white: 'FFFFFF',
    black: '000000',
    red: 'FF0000',
    green: '00FF00',
    blue: '0000FF',
    yellow: 'FFFF00',
    transparent: 'FFFFFF',
  };

  return namedColors[color.toLowerCase()] || '000000';
}

/**
 * Parse CSS length to points
 */
function parseLength(value: string | undefined, defaultPt: number = 0): number {
  if (!value) return defaultPt;

  // Extract number and unit
  const match = value.match(/^([\d.]+)(px|rem|em|pt|%)?/);
  if (!match) return defaultPt;

  const num = parseFloat(match[1]);
  const unit = match[2] || 'px';

  if (unit === '%') {
    return num; // Return percentage as-is, caller must handle
  }

  return num * (CSS_UNIT_TO_PT[unit] || 0.75);
}

/**
 * Parse CSS font-size to points
 */
function parseFontSize(fontSize: string | undefined, defaultSize: number = 18): number {
  if (!fontSize) return defaultSize;

  // Handle large rem values (like 5rem for h1)
  if (fontSize.endsWith('rem')) {
    const rem = parseFloat(fontSize);
    // 1rem = 16px typically, and 1px = 0.75pt
    return Math.round(rem * 16 * 0.75);
  }

  return parseLength(fontSize, defaultSize);
}

/**
 * Parse inline style string to object
 */
function parseInlineStyle(styleStr: string): Record<string, string> {
  const styles: Record<string, string> = {};

  if (!styleStr) return styles;

  styleStr.split(';').forEach((pair) => {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (key && value) {
      // Convert kebab-case to camelCase for easier access
      const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      styles[camelKey] = value;
    }
  });

  return styles;
}

/**
 * Extract background from style (handles gradients)
 */
function extractBackground(styles: Record<string, string>): string {
  const bg = styles.background || styles.backgroundColor;
  if (!bg) return 'FFFFFF';

  // Handle linear-gradient - extract first color
  const gradientMatch = bg.match(/linear-gradient\([^,]+,\s*(#[a-fA-F0-9]+)/);
  if (gradientMatch) {
    return gradientMatch[1].replace('#', '');
  }

  // Handle solid color
  return parseColor(bg);
}

// =============================================================================
// HTML Parsing with Cheerio
// =============================================================================

/**
 * Get default styles for HTML elements
 */
function getDefaultStyles(tagName: string): Partial<ComputedStyle> {
  const defaults: Record<string, Partial<ComputedStyle>> = {
    h1: {
      fontSize: 44,
      fontWeight: 700,
      textAlign: 'center',
      color: 'FFFFFF',
    },
    h2: {
      fontSize: 32,
      fontWeight: 700,
      textAlign: 'center',
      color: 'FFFFFF',
    },
    h3: {
      fontSize: 24,
      fontWeight: 600,
      textAlign: 'left',
      color: 'FFFFFF',
    },
    h4: {
      fontSize: 20,
      fontWeight: 600,
      textAlign: 'left',
      color: 'FFFFFF',
    },
    p: {
      fontSize: 18,
      fontWeight: 400,
      textAlign: 'left',
      color: 'CCCCCC',
    },
    div: {
      fontSize: 18,
      fontWeight: 400,
      textAlign: 'left',
      color: 'FFFFFF',
    },
  };

  return defaults[tagName] || defaults.p;
}

/**
 * Compute element style by merging defaults, class styles, and inline styles
 */
function computeElementStyle(
  $el: cheerio.Cheerio<any>,
  tagName: string,
  parentBounds: { x: number; y: number; w: number; h: number },
  slideWidth: number,
  slideHeight: number,
): ComputedStyle {
  const defaults = getDefaultStyles(tagName);
  const inlineStyles = parseInlineStyle($el.attr('style') || '');
  const classAttr = $el.attr('class') || '';

  // Merge font styles
  const fontSize = parseFontSize(inlineStyles.fontSize, defaults.fontSize || 18);
  const fontWeight = inlineStyles.fontWeight
    ? parseInt(inlineStyles.fontWeight)
    : (defaults.fontWeight || 400);

  // Determine position based on element type and parent
  let x = parentBounds.x;
  let y = parentBounds.y;
  let w = parentBounds.w;
  let h = fontSize * 1.5 / 72; // Estimate height based on font size

  // Handle specific layout patterns
  if (tagName === 'h1') {
    // Title: center top
    x = slideWidth * 0.1;
    y = slideHeight * 0.1;
    w = slideWidth * 0.8;
    h = 1;
  } else if (tagName === 'h2') {
    // Subtitle
    x = slideWidth * 0.1;
    y = slideHeight * 0.25;
    w = slideWidth * 0.8;
    h = 0.8;
  } else if (tagName === 'p') {
    // Paragraph
    x = slideWidth * 0.1;
    w = slideWidth * 0.8;
    h = 0.5;
  }

  // Handle text alignment from inline style
  const textAlign = (inlineStyles.textAlign as 'left' | 'center' | 'right') ||
    defaults.textAlign || 'left';

  // Handle color
  const color = inlineStyles.color
    ? parseColor(inlineStyles.color)
    : (defaults.color || 'FFFFFF');

  // Handle background
  const backgroundColor = inlineStyles.backgroundColor || inlineStyles.background
    ? parseColor(inlineStyles.backgroundColor || inlineStyles.background)
    : undefined;

  // Check for highlight class
  const isHighlight = classAttr.includes('highlight');
  const isSubtitle = classAttr.includes('subtitle');

  return {
    color,
    fontFamily: 'Arial',
    fontSize,
    fontWeight,
    fontStyle: inlineStyles.fontStyle === 'italic' ? 'italic' : 'normal',
    textAlign,
    lineHeight: 1.2,

    display: inlineStyles.display || 'block',
    flexDirection: inlineStyles.flexDirection,
    justifyContent: inlineStyles.justifyContent,
    alignItems: inlineStyles.alignItems,

    x,
    y,
    w,
    h,

    backgroundColor: isHighlight ? '1a1a2e' : backgroundColor,

    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
  };
}

/**
 * Parse a single element and its children recursively
 */
function parseElement(
  $: cheerio.CheerioAPI,
  el: any,
  parentBounds: { x: number; y: number; w: number; h: number },
  slideWidth: number,
  slideHeight: number,
  yOffset: { value: number },
): ParsedElement | null {
  const $el = $(el);
  const tagName = el.tagName?.toLowerCase();

  if (!tagName) return null;

  // Skip non-visual elements
  if (['script', 'style', 'meta', 'link', 'head', 'title'].includes(tagName)) {
    return null;
  }

  const style = computeElementStyle($el, tagName, parentBounds, slideWidth, slideHeight);

  // Update y position based on current offset
  style.y = parentBounds.y + yOffset.value;

  // Get text content
  const text = $el.text().trim();

  // Determine element type
  let type: 'text' | 'rect' | 'shape' = 'text';

  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'a', 'li'].includes(tagName)) {
    type = 'text';
  } else if (tagName === 'i' && $el.hasClass('fas')) {
    // FontAwesome icon - treat as shape
    type = 'shape';
  }

  // Parse children if this is a container
  const children: ParsedElement[] = [];
  if (tagName === 'div' || tagName === 'section' || tagName === 'article') {
    let childYOffset = 0;
    $el.children().each((_, child) => {
      const parsed = parseElement(
        $,
        child,
        { x: style.x, y: style.y, w: style.w, h: style.h },
        slideWidth,
        slideHeight,
        { value: childYOffset },
      );
      if (parsed) {
        children.push(parsed);
        // Estimate height for next sibling
        if (parsed.style.h) {
          childYOffset += parsed.style.h + 0.1;
        }
      }
    });
  }

  // Update y offset for siblings
  if (type === 'text' && text) {
    yOffset.value += style.h + 0.1;
  }

  return {
    type,
    tagName,
    text,
    style,
    children: children.length > 0 ? children : undefined,
  };
}

/**
 * Flatten parsed elements into a linear list
 */
function flattenElements(elements: ParsedElement[]): ParsedElement[] {
  const result: ParsedElement[] = [];

  for (const el of elements) {
    if (el.text && el.type === 'text') {
      result.push(el);
    }
    if (el.children) {
      result.push(...flattenElements(el.children));
    }
  }

  return result;
}

/**
 * Parse HTML slide content using cheerio
 */
function parseSlideHtml(
  html: string,
  widthInches: number,
  heightInches: number,
): SlideContent {
  const $ = cheerio.load(html);
  const result: SlideContent = {
    background: 'FFFFFF',
    elements: [],
  };

  // Extract background from body style or embedded CSS
  const bodyStyle = $('body').attr('style') || '';
  const bodyStyles = parseInlineStyle(bodyStyle);
  result.background = extractBackground(bodyStyles);

  // Also check for embedded style tags
  $('style').each((_, el) => {
    const css = $(el).html() || '';
    // Look for body background
    const bodyBgMatch = css.match(/body\s*\{[^}]*background[^:]*:\s*([^;}\n]+)/i);
    if (bodyBgMatch) {
      const bg = extractBackground({ background: bodyBgMatch[1] });
      if (bg !== 'FFFFFF') {
        result.background = bg;
      }
    }

    // Look for gradient backgrounds
    const gradientMatch = css.match(/background:\s*linear-gradient\([^,]+,\s*(#[a-fA-F0-9]+)/);
    if (gradientMatch) {
      result.background = gradientMatch[1].replace('#', '');
    }
  });

  // Parse body content
  const bodyBounds = {
    x: 0,
    y: 0,
    w: widthInches,
    h: heightInches,
  };

  const processedTexts = new Set<string>(); // Track processed texts to avoid duplicates
  let currentY = heightInches * 0.1; // Start position

  // First, get h1 (main title)
  $('body h1').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text) {
      const style = computeElementStyle($el, 'h1', bodyBounds, widthInches, heightInches);
      style.y = currentY;
      result.elements.push({
        type: 'text',
        tagName: 'h1',
        text,
        style,
      });
      processedTexts.add(text);
      currentY += style.h + 0.2;
    }
  });

  // Get h2 (subtitle) - usually at body level
  $('body > h2').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text && !processedTexts.has(text)) {
      const style = computeElementStyle($el, 'h2', bodyBounds, widthInches, heightInches);
      style.y = currentY;
      result.elements.push({
        type: 'text',
        tagName: 'h2',
        text,
        style,
      });
      processedTexts.add(text);
      currentY += style.h + 0.15;
    }
  });

  // Get p.en (English subtitle) - special class at body level
  $('body > p.en, body > p.subtitle').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text && !processedTexts.has(text)) {
      const style = computeElementStyle($el, 'p', bodyBounds, widthInches, heightInches);
      style.y = currentY;
      style.fontSize = 20;
      style.color = 'CCCCCC';
      style.textAlign = 'center';
      result.elements.push({
        type: 'text',
        tagName: 'p',
        text,
        style,
      });
      processedTexts.add(text);
      currentY += style.h + 0.3;
    }
  });

  // Move down for content area
  currentY = Math.max(currentY, heightInches * 0.35);

  // Get paragraphs inside .text containers (excluding .highlight)
  $('.text p').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text && !processedTexts.has(text)) {
      const tagName = el.tagName?.toLowerCase() || 'p';

      const style = computeElementStyle($el, tagName, bodyBounds, widthInches, heightInches);
      style.y = currentY;
      style.x = widthInches * 0.1;
      style.w = widthInches * 0.8;
      style.textAlign = 'left';

      result.elements.push({
        type: 'text',
        tagName,
        text,
        style,
      });
      processedTexts.add(text);
      currentY += style.h + 0.15;
    }
  });

  // Get highlight boxes
  $('.highlight').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text && !processedTexts.has(text)) {
      const style = computeElementStyle($el, 'div', bodyBounds, widthInches, heightInches);
      style.y = currentY;
      style.x = widthInches * 0.1;
      style.w = widthInches * 0.8;
      style.fontSize = 14;
      style.color = 'FFFFFF';
      result.elements.push({
        type: 'text',
        tagName: 'div',
        text,
        style,
      });
      processedTexts.add(text);
      currentY += style.h + 0.2;
    }
  });

  return result;
}

// =============================================================================
// PPTX Generation
// =============================================================================

/**
 * Add a parsed element to a PowerPoint slide
 */
function addElementToSlide(
  slide: any,
  element: ParsedElement,
): void {
  const { style, text } = element;

  if (element.type === 'text' && text) {
    slide.addText(text, {
      x: style.x,
      y: style.y,
      w: style.w,
      h: style.h,
      fontSize: style.fontSize,
      fontFace: style.fontFamily,
      color: style.color,
      bold: style.fontWeight >= 600,
      italic: style.fontStyle === 'italic',
      align: style.textAlign,
      valign: 'middle',
      wrap: true,
    });
  } else if (element.type === 'shape') {
    // Add icon as a simple shape (placeholder)
    slide.addShape('circle', {
      x: style.x,
      y: style.y,
      w: 0.5,
      h: 0.5,
      fill: { color: style.color },
    });
  }
}

/**
 * Export deck as editable PPTX.
 * Parses HTML content and creates native PowerPoint elements.
 */
export async function exportToPptx(
  deck: Deck,
  slideHtmls: string[],
  outputPath: string,
  aspectRatio: '16:9' | '4:3' | '16:10' | '1:1' = '16:9',
): Promise<ExportResult> {
  try {
    const PptxGenJS = await getPptxGenJs();
    const dims = getAspectRatioDimensions(aspectRatio);

    // Create PPTX
    const pptx = new PptxGenJS();
    // Set slide dimensions in inches (96 DPI)
    const widthInches = dims.width / 96;
    const heightInches = dims.height / 96;
    pptx.defineLayout({ name: 'CUSTOM', width: widthInches, height: heightInches });
    pptx.layout = 'CUSTOM';
    pptx.title = deck.title;
    pptx.author = deck.author || 'SlideCraft';

    // Process each slide
    for (let i = 0; i < slideHtmls.length; i++) {
      const html = slideHtmls[i];
      const parsed = parseSlideHtml(html, widthInches, heightInches);

      const slide = pptx.addSlide();

      // Set background
      slide.background = { color: parsed.background };

      // Add elements
      for (const el of parsed.elements) {
        addElementToSlide(slide, el);
      }
    }

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
  }
}
