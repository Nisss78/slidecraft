import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Deck } from '@slideharness/core';
import { getCanvasDimensions } from '@slideharness/renderer';
import type { CanvasSize } from '@slideharness/renderer';
import type { ExportResult } from './types.js';

/**
 * v2: Export deck as a single HTML file.
 * Requires pre-loaded slide HTML content.
 */
export async function exportToHtml(
  deck: Deck,
  slideHtmls: string[],
  outputPath: string,
  canvasSize?: CanvasSize,
): Promise<ExportResult> {
  try {
    const dims = canvasSize ? getCanvasDimensions(canvasSize) : getCanvasDimensions();
    const fullHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${deck.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1a1a2e; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; gap: 40px; min-height: 100vh; }
    .slide-container { width: 960px; aspect-ratio: ${dims.width}/${dims.height}; box-shadow: 0 8px 32px rgba(0,0,0,0.3); overflow: hidden; background: #fff; }
    .slide-container iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
${slideHtmls.map((html, i) => {
  return `<div class="slide-container"><iframe srcdoc="${html.replace(/"/g, '&quot;')}" scrolling="no"></iframe></div>`;
}).join('\n')}
</body>
</html>`;

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, fullHtml, 'utf-8');
    return { success: true, outputPath, format: 'html' };
  } catch (err) {
    return {
      success: false,
      outputPath,
      format: 'html',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
