import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Deck } from '@slidecraft/core';
import { getAspectRatioDimensions } from '@slidecraft/renderer';
import type { ExportResult } from './types.js';

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

/**
 * Export deck as PPTX.
 * Uses Playwright to screenshot each slide HTML, then embeds as full-screen images in pptxgenjs.
 */
export async function exportToPptx(
  deck: Deck,
  slideHtmls: string[],
  outputPath: string,
  aspectRatio: '16:9' | '4:3' | '16:10' | '1:1' = '16:9',
): Promise<ExportResult> {
  try {
    const pw = await getPlaywright();
    const PptxGenJS = await getPptxGenJs();
    const dims = getAspectRatioDimensions(aspectRatio);

    const browser = await pw.chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize(dims);

    // Create PPTX
    const pptx = new PptxGenJS();
    // Set slide dimensions in inches (96 DPI)
    const widthInches = dims.width / 96;
    const heightInches = dims.height / 96;
    pptx.defineLayout({ name: 'CUSTOM', width: widthInches, height: heightInches });
    pptx.layout = 'CUSTOM';
    pptx.title = deck.title;
    pptx.author = deck.author || 'SlideCraft';

    // Screenshot each slide and add to PPTX
    for (const html of slideHtmls) {
      await page.setContent(html, { waitUntil: 'networkidle' });
      const screenshotBuffer = await page.screenshot({ fullPage: false });
      const base64 = screenshotBuffer.toString('base64');

      const slide = pptx.addSlide();
      slide.addImage({
        data: `image/png;base64,${base64}`,
        x: 0,
        y: 0,
        w: widthInches,
        h: heightInches,
      });
    }

    await browser.close();

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
