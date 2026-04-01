import { mkdir, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Deck } from '@slidecraft/core';
import { getAspectRatioDimensions } from '@slidecraft/renderer';
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
 * v2: Export deck as PDF.
 * Uses screenshot-based approach for accurate CSS rendering (including gradients).
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
    await page.setViewportSize(dims);

    // Take screenshots of each slide
    const screenshotBuffers: Buffer[] = [];
    for (const html of slideHtmls) {
      await page.setContent(html, { waitUntil: 'networkidle' });
      const screenshot = await page.screenshot({ type: 'png', fullPage: false });
      screenshotBuffers.push(screenshot);
    }

    await browser.close();

    // Create PDF with embedded images
    const slideImages = screenshotBuffers.map((buf, i) => {
      const base64 = buf.toString('base64');
      return `<div class="slide-page"><img src="data:image/png;base64,${base64}" alt="Slide ${i + 1}"></div>`;
    }).join('\n');

    const pdfHtml = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: ${dims.width}px ${dims.height}px; margin: 0; }
  .slide-page {
    width: ${dims.width}px;
    height: ${dims.height}px;
    page-break-after: always;
  }
  .slide-page:last-child { page-break-after: auto; }
  .slide-page img {
    width: ${dims.width}px;
    height: ${dims.height}px;
    object-fit: contain;
  }
</style>
</head><body>
${slideImages}
</body></html>`;

    // Re-launch browser to create PDF from images
    const browser2 = await pw.chromium.launch();
    const context2 = await browser2.newContext();
    const page2 = await context2.newPage();
    await page2.setViewportSize(dims);

    await page2.setContent(pdfHtml, { waitUntil: 'networkidle' });
    await mkdir(dirname(outputPath), { recursive: true });
    await page2.pdf({
      path: outputPath,
      width: `${dims.width}px`,
      height: `${dims.height}px`,
      printBackground: true,
    });

    await browser2.close();
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
 * Requires pre-loaded slide HTML content.
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
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize(dims);

    await mkdir(outputDir, { recursive: true });

    for (let i = 0; i < slideHtmls.length; i++) {
      await page.setContent(slideHtmls[i], { waitUntil: 'networkidle' });
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
