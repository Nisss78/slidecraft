import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Deck } from '@slideharness/core';
import { getAspectRatioDimensions } from '@slideharness/renderer';
import { PDFDocument } from 'pdf-lib';
import type { ExportResult } from './types.js';

async function getPlaywright() {
  try {
    return await import('playwright');
  } catch {
    throw new Error(
      'Playwright is required for PDF/PNG export. Install it with: pnpm add playwright && npx playwright install chromium',
    );
  }
}

/**
 * Inject @page CSS and print-color-adjust into slide HTML
 * so that page.pdf() produces correctly sized pages with backgrounds.
 */
function injectPrintStyles(
  html: string,
  dims: { width: number; height: number },
): string {
  const printCss = `
<style>
  @page {
    size: ${dims.width}px ${dims.height}px;
    margin: 0;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: ${dims.width}px;
    height: ${dims.height}px;
    overflow: hidden;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
</style>`;

  // Insert before </head> if present, otherwise prepend
  if (html.includes('</head>')) {
    return html.replace('</head>', `${printCss}\n</head>`);
  }
  return `${printCss}\n${html}`;
}

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
 * v2: Export deck as PDF.
 * Uses direct HTML→PDF via page.pdf() for vector text output,
 * then merges per-slide PDFs with pdf-lib.
 */
export async function exportToPdf(
  deck: Deck,
  slideHtmls: string[],
  outputPath: string,
  aspectRatio: '16:9' | '4:3' | '16:10' | '1:1' = '16:9',
): Promise<ExportResult> {
  try {
    const pw = await getPlaywright();
    const dims = getAspectRatioDimensions(aspectRatio);

    const browser = await pw.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Generate a PDF buffer for each slide
    const pdfBuffers: Buffer[] = [];
    for (const html of slideHtmls) {
      const styledHtml = injectPrintStyles(html, dims);
      await waitForFontsAndRender(page, styledHtml, dims);

      const buf = await page.pdf({
        width: `${dims.width}px`,
        height: `${dims.height}px`,
        printBackground: true,
        preferCSSPageSize: true,
      });
      pdfBuffers.push(buf);
    }

    await browser.close();

    // Merge all per-slide PDFs into one document
    const mergedPdf = await PDFDocument.create();
    for (const buf of pdfBuffers) {
      const srcDoc = await PDFDocument.load(buf);
      const pages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
      for (const p of pages) {
        mergedPdf.addPage(p);
      }
    }

    const mergedBytes = await mergedPdf.save();
    await mkdir(dirname(outputPath), { recursive: true });
    const { writeFile } = await import('node:fs/promises');
    await writeFile(outputPath, mergedBytes);

    return { success: true, outputPath, format: 'pdf' };
  } catch (err) {
    return {
      success: false,
      outputPath,
      format: 'pdf',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * v2: Export slides as PNG images.
 * Uses 2x device scale factor for high-DPI output (3840x2160 for 16:9).
 */
export async function exportToPng(
  deck: Deck,
  slideHtmls: string[],
  outputDir: string,
  aspectRatio: '16:9' | '4:3' | '16:10' | '1:1' = '16:9',
): Promise<ExportResult> {
  try {
    const pw = await getPlaywright();
    const dims = getAspectRatioDimensions(aspectRatio);

    const browser = await pw.chromium.launch();
    const context = await browser.newContext({
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await mkdir(outputDir, { recursive: true });

    for (let i = 0; i < slideHtmls.length; i++) {
      await waitForFontsAndRender(page, slideHtmls[i], dims);
      await page.screenshot({
        path: join(outputDir, `slide-${String(i + 1).padStart(3, '0')}.png`),
        fullPage: false,
      });
    }

    await browser.close();
    return { success: true, outputPath: outputDir, format: 'png' };
  } catch (err) {
    return {
      success: false,
      outputPath: outputDir,
      format: 'png',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
