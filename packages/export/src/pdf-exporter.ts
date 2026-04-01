import { mkdir } from 'node:fs/promises';
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
 * Requires pre-loaded slide HTML content.
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

    const fullHtml = `<!DOCTYPE html>
<html><head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: ${dims.width}px ${dims.height}px; margin: 0; }
  .page-break { page-break-after: always; }
  .slide-page { width: ${dims.width}px; height: ${dims.height}px; overflow: hidden; }
</style>
</head><body>
${slideHtmls.map((html, i) => {
  // Extract body content from full HTML, or use as-is
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;
  return `<div class="slide-page ${i < slideHtmls.length - 1 ? 'page-break' : ''}">${bodyContent}</div>`;
}).join('\n')}
</body></html>`;

    await page.setContent(fullHtml, { waitUntil: 'networkidle' });
    await mkdir(dirname(outputPath), { recursive: true });
    await page.pdf({
      path: outputPath,
      width: `${dims.width}px`,
      height: `${dims.height}px`,
      printBackground: true,
    });

    await browser.close();
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
