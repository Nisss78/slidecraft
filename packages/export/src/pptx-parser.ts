import JSZip from 'jszip';
import type { TemplateAnalysis, TemplateTheme, TemplateSlideInfo } from './types.js';

// EMU to points conversion (1 inch = 914400 EMU, 1 inch = 72 points)
const EMU_TO_PT = 72 / 914400;

function extractAttr(xml: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, 'i');
  const m = xml.match(re);
  return m ? m[1] : null;
}

function extractColorScheme(themeXml: string): Record<string, string> {
  const colors: Record<string, string> = {};
  const schemeMatch = themeXml.match(/<a:clrScheme[^>]*>([\s\S]*?)<\/a:clrScheme>/);
  if (!schemeMatch) return colors;

  const schemeBody = schemeMatch[1];
  const colorNames = ['dk1', 'dk2', 'lt1', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6', 'hlink', 'folHlink'];

  for (const name of colorNames) {
    const re = new RegExp(`<a:${name}>\\s*<a:srgbClr\\s+val="([^"]+)"`, 'i');
    const m = schemeBody.match(re);
    if (m) {
      colors[name] = `#${m[1]}`;
    } else {
      // Try sysClr
      const sysRe = new RegExp(`<a:${name}>\\s*<a:sysClr[^>]*lastClr="([^"]+)"`, 'i');
      const sysM = schemeBody.match(sysRe);
      if (sysM) {
        colors[name] = `#${sysM[1]}`;
      }
    }
  }
  return colors;
}

function extractFonts(themeXml: string): { majorFont: string; minorFont: string } {
  let majorFont = '';
  let minorFont = '';

  const majorMatch = themeXml.match(/<a:majorFont>[\s\S]*?<a:latin\s+typeface="([^"]+)"/);
  if (majorMatch) majorFont = majorMatch[1];

  const minorMatch = themeXml.match(/<a:minorFont>[\s\S]*?<a:latin\s+typeface="([^"]+)"/);
  if (minorMatch) minorFont = minorMatch[1];

  return { majorFont, minorFont };
}

function extractSlideSize(presentationXml: string): { width: number; height: number } {
  const cxStr = extractAttr(presentationXml, 'p:sldSz', 'cx');
  const cyStr = extractAttr(presentationXml, 'p:sldSz', 'cy');
  const cx = cxStr ? parseInt(cxStr, 10) : 12192000; // default 10" in EMU
  const cy = cyStr ? parseInt(cyStr, 10) : 6858000;  // default 7.5" in EMU
  return {
    width: Math.round(cx * EMU_TO_PT),
    height: Math.round(cy * EMU_TO_PT),
  };
}

function extractTextElements(slideXml: string): string[] {
  const texts: string[] = [];
  const matches = slideXml.matchAll(/<a:t>([^<]*)<\/a:t>/g);
  for (const m of matches) {
    const text = m[1].trim();
    if (text) texts.push(text);
  }
  return texts;
}

function extractSlideTitle(slideXml: string): string {
  // Look for title-typed shapes (ph type="title" or type="ctrTitle")
  const titleShapeRe = /<p:sp>[\s\S]*?<p:ph[^>]*type="(?:title|ctrTitle)"[\s\S]*?<\/p:sp>/gi;
  const titleMatch = slideXml.match(titleShapeRe);
  if (titleMatch) {
    const titleTexts = extractTextElements(titleMatch[0]);
    if (titleTexts.length > 0) return titleTexts.join(' ');
  }
  return '';
}

function extractLayoutName(slideXml: string, relsXml: string, layoutXmls: Map<string, string>): string {
  // From slide rels, find the slideLayout reference
  const layoutRelMatch = relsXml.match(/Target="[^"]*?(slideLayout\d+)\.xml"/i);
  if (!layoutRelMatch) return 'unknown';
  const layoutFile = layoutRelMatch[1];

  // Try to get name from the layout XML
  const layoutXml = layoutXmls.get(layoutFile);
  if (layoutXml) {
    const nameMatch = layoutXml.match(/<p:cSld\s+name="([^"]+)"/);
    if (nameMatch) return nameMatch[1];
  }
  return layoutFile;
}

export async function parsePptxBuffer(buffer: Buffer): Promise<TemplateAnalysis> {
  const zip = await JSZip.loadAsync(buffer);

  // Extract presentation.xml for slide size
  const presentationXml = await zip.file('ppt/presentation.xml')?.async('text') ?? '';
  const { width, height } = extractSlideSize(presentationXml);

  // Determine aspect ratio
  let aspectRatio = `${width}:${height}`;
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.02) aspectRatio = '16:9';
  else if (Math.abs(ratio - 4 / 3) < 0.02) aspectRatio = '4:3';
  else if (Math.abs(ratio - 16 / 10) < 0.02) aspectRatio = '16:10';

  // Extract theme
  const themeXml = await zip.file('ppt/theme/theme1.xml')?.async('text') ?? '';
  const colors = extractColorScheme(themeXml);
  const { majorFont, minorFont } = extractFonts(themeXml);
  const theme: TemplateTheme = { colors, majorFont, minorFont };

  // Pre-load slide layout XMLs
  const layoutXmls = new Map<string, string>();
  const layoutFiles = Object.keys(zip.files).filter(f => f.match(/^ppt\/slideLayouts\/slideLayout\d+\.xml$/));
  await Promise.all(layoutFiles.map(async (f) => {
    const content = await zip.file(f)?.async('text');
    if (content) {
      const name = f.match(/slideLayout(\d+)/)?.[0] ?? f;
      layoutXmls.set(name, content);
    }
  }));

  // Enumerate slides
  const slideFiles = Object.keys(zip.files)
    .filter(f => f.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)?.[1] ?? '0');
      const nb = parseInt(b.match(/slide(\d+)/)?.[1] ?? '0');
      return na - nb;
    });

  const slides: TemplateSlideInfo[] = [];
  for (let i = 0; i < slideFiles.length; i++) {
    const slideXml = await zip.file(slideFiles[i])?.async('text') ?? '';
    const slideNum = slideFiles[i].match(/slide(\d+)/)?.[1] ?? String(i + 1);
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const relsXml = await zip.file(relsPath)?.async('text') ?? '';

    const title = extractSlideTitle(slideXml);
    const textElements = extractTextElements(slideXml);
    const layoutName = extractLayoutName(slideXml, relsXml, layoutXmls);

    slides.push({
      index: i,
      layoutName,
      title,
      textElements,
    });
  }

  return {
    slideCount: slides.length,
    slideWidth: width,
    slideHeight: height,
    aspectRatio,
    theme,
    slides,
  };
}
