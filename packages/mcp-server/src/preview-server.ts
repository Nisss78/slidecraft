import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { Deck, JsonFileStorage } from '@slideharness/core';
import { createDeck, createSlide, addSlideToDeck, deleteSlideFromDeck, reorderSlides, updateDeckMeta } from '@slideharness/core';
import { exportToPdf, exportToPptx } from '@slideharness/export';
import { generateBlankSlideHtml } from '@slideharness/renderer';
import { randomBytes } from 'node:crypto';
import JSZip from 'jszip';
import { basename } from 'node:path';

const require = createRequire(import.meta.url);

/** Inject word-break CSS into slide HTML if not already present */
function injectWordBreakCss(html: string): string {
  if (html.includes('word-break:keep-all') || html.includes('word-break: keep-all')) {
    return html;
  }
  // Inject into existing body style or add a <style> tag before </head>
  if (html.includes('<style>') && html.includes('body{')) {
    return html.replace(/body\{([^}]*)}/,  'body{$1;word-break:keep-all;overflow-wrap:break-word}');
  }
  // Fallback: inject a style block before </head>
  return html.replace('</head>', '<style>body{word-break:keep-all;overflow-wrap:break-word}</style></head>');
}

function resolveEditorDist(): string | null {
  try {
    const pkgPath = require.resolve('@slideharness/editor/package.json');
    return join(dirname(pkgPath), 'dist');
  } catch {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const fallback = join(__dirname, '../../editor/dist');
    return existsSync(fallback) ? fallback : null;
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Extract thumbnail from PPTX: try docProps thumbnail first, then fall back to slide 1 image */
async function extractPptxThumbnail(buf: Buffer): Promise<Buffer | null> {
  const zip = await JSZip.loadAsync(buf);
  // 1. Try docProps thumbnail
  const thumbFile = zip.file('docProps/thumbnail.jpeg') || zip.file('docProps/thumbnail.png');
  if (thumbFile) {
    return thumbFile.async('nodebuffer');
  }
  // 2. Fall back to first image referenced in slide 1
  const relsFile = zip.file('ppt/slides/_rels/slide1.xml.rels');
  if (relsFile) {
    const relsXml = await relsFile.async('text');
    const imgMatch = relsXml.match(/Target="\.\.\/media\/(image[^"]+)"/);
    if (imgMatch) {
      const mediaFile = zip.file(`ppt/media/${imgMatch[1]}`);
      if (mediaFile) {
        return mediaFile.async('nodebuffer');
      }
    }
  }
  // 3. Fall back to first image in ppt/media/
  const mediaFiles = Object.keys(zip.files)
    .filter(f => f.startsWith('ppt/media/') && /\.(png|jpg|jpeg|gif)$/i.test(f))
    .sort();
  if (mediaFiles.length > 0) {
    const first = zip.file(mediaFiles[0]);
    if (first) return first.async('nodebuffer');
  }
  return null;
}

/** Extract thumbnail from PDF using system tools (qlmanage on macOS, pdftoppm on Linux) */
async function extractPdfThumbnail(pdfPath: string): Promise<Buffer | null> {
  const tmp = tmpdir();
  const base = basename(pdfPath);
  // macOS: qlmanage
  try {
    await new Promise<void>((resolve, reject) => {
      execFile('qlmanage', ['-t', '-s', '800', '-o', tmp, pdfPath], { timeout: 10000 }, (err) => {
        if (err) reject(err); else resolve();
      });
    });
    const thumbPath = join(tmp, base + '.png');
    if (existsSync(thumbPath)) {
      const data = await readFile(thumbPath);
      await unlink(thumbPath);
      return data;
    }
  } catch { /* qlmanage not available */ }
  // Linux: pdftoppm (poppler-utils)
  try {
    const outPrefix = join(tmp, 'slideharness-thumb');
    await new Promise<void>((resolve, reject) => {
      execFile('pdftoppm', ['-png', '-singlefile', '-r', '150', pdfPath, outPrefix], { timeout: 10000 }, (err) => {
        if (err) reject(err); else resolve();
      });
    });
    const thumbPath = outPrefix + '.png';
    if (existsSync(thumbPath)) {
      const data = await readFile(thumbPath);
      await unlink(thumbPath);
      return data;
    }
  } catch { /* pdftoppm not available */ }
  return null;
}

export class PreviewServer {
  private app = express();
  private server = createServer(this.app);
  private wss = new WebSocketServer({ server: this.server });
  private clients = new Set<WebSocket>();
  private port: number;
  private storage: JsonFileStorage;
  private started = false;

  constructor(options: {
    port?: number;
    storage: JsonFileStorage;
  }) {
    this.port = options.port ?? 4983;
    this.storage = options.storage;
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupRoutes(): void {
    this.app.use(express.json());
    this.app.use(express.text({ type: 'text/html' }));

    this.app.use((_req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      if (_req.method === 'OPTIONS') { res.sendStatus(200); return; }
      next();
    });

    // API: List all decks
    this.app.get('/api/decks', async (_req, res) => {
      const decks = await this.storage.listDecks();
      res.json(decks);
    });

    // API: Get deck metadata
    this.app.get('/api/decks/:id', async (req, res) => {
      const deck = await this.storage.loadDeck(req.params.id);
      if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
      res.json(deck);
    });

    // API: Get slide HTML directly (for iframe embedding)
    this.app.get('/api/decks/:deckId/slides/:slideId/html', async (req, res) => {
      const html = await this.storage.loadSlideHtml(req.params.deckId, req.params.slideId);
      if (!html) { res.status(404).send('Slide not found'); return; }
      res.type('html').send(injectWordBreakCss(html));
    });

    // API: Thumbnail - first slide HTML
    this.app.get('/api/decks/:id/thumbnail', async (req, res) => {
      const deck = await this.storage.loadDeck(req.params.id);
      if (!deck || deck.slides.length === 0) {
        res.type('html').send(`<div style="width:100%;height:100%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#94a3b8;font-size:14px">Empty</div>`);
        return;
      }
      const html = await this.storage.loadSlideHtml(req.params.id, deck.slides[0].id);
      if (!html) {
        res.type('html').send(`<div style="width:100%;height:100%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#94a3b8;font-size:14px">No HTML</div>`);
        return;
      }
      res.type('html').send(injectWordBreakCss(html));
    });

    // API: Create deck
    this.app.post('/api/decks', async (req, res) => {
      try {
        const { title } = req.body;
        const deck = createDeck({ title: title || 'Untitled' });
        await this.storage.saveDeck(deck);
        this.notifyDeckUpdate(deck.id);
        res.json({ id: deck.id, title: deck.title });
      } catch (err) {
        res.status(500).json({ error: 'Failed to create deck' });
      }
    });

    // API: Update deck meta
    this.app.patch('/api/decks/:id', async (req, res) => {
      const deck = await this.storage.loadDeck(req.params.id);
      if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
      const updated = updateDeckMeta(deck, req.body);
      await this.storage.saveDeck(updated);
      this.notifyDeckUpdate(updated.id);
      res.json({ id: updated.id, title: updated.title });
    });

    // API: Delete deck
    this.app.delete('/api/decks/:id', async (req, res) => {
      const success = await this.storage.deleteDeck(req.params.id);
      if (!success) { res.status(404).json({ error: 'Deck not found' }); return; }
      res.json({ success: true });
    });

    // API: Reorder slides
    this.app.post('/api/decks/:deckId/reorder', async (req, res) => {
      const deck = await this.storage.loadDeck(req.params.deckId);
      if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
      const { slideIds } = req.body;
      if (!Array.isArray(slideIds)) { res.status(400).json({ error: 'slideIds must be an array' }); return; }
      const updated = reorderSlides(deck, slideIds);
      await this.storage.saveDeck(updated);
      this.notifyDeckUpdate(updated.id);
      res.json({ slideIds: updated.slides.map(s => s.id) });
    });

    // API: Reorder slides (PUT - alternative to POST)
    this.app.put('/api/decks/:deckId/reorder', async (req, res) => {
      const deck = await this.storage.loadDeck(req.params.deckId);
      if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
      const { slideIds } = req.body;
      if (!Array.isArray(slideIds)) { res.status(400).json({ error: 'slideIds must be an array' }); return; }
      const updated = reorderSlides(deck, slideIds);
      await this.storage.saveDeck(updated);
      this.notifyDeckUpdate(updated.id);
      res.json({ slideIds: updated.slides.map(s => s.id) });
    });

    // API: Save slide HTML
    this.app.put('/api/decks/:deckId/slides/:slideId/html', async (req, res) => {
      const { deckId, slideId } = req.params;
      const deck = await this.storage.loadDeck(deckId);
      if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
      const slide = deck.slides.find(s => s.id === slideId);
      if (!slide) { res.status(404).json({ error: 'Slide not found' }); return; }
      const html = req.body as string;
      if (typeof html !== 'string' || html.length === 0) {
        res.status(400).json({ error: 'Request body must be non-empty HTML text' });
        return;
      }
      await this.storage.saveSlideHtml(deckId, slideId, html);
      this.notifyDeckUpdate(deckId);
      res.json({ success: true, deckId, slideId });
    });

    // API: Get editable slide HTML (with editor injection)
    this.app.get('/api/decks/:deckId/slides/:slideId/edit-html', async (req, res) => {
      const { deckId, slideId } = req.params;
      const html = await this.storage.loadSlideHtml(deckId, slideId);
      if (!html) { res.status(404).json({ error: 'Slide HTML not found' }); return; }
      let editableHtml = html.replace(/<\/body>/i, '<script src="/editor-inject.js"></script>\n</body>');
      res.type('html').send(editableHtml);
    });

    // API: Delete slide
    this.app.delete('/api/decks/:deckId/slides/:slideId', async (req, res) => {
      const { deckId, slideId } = req.params;
      const deck = await this.storage.loadDeck(deckId);
      if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
      const updated = deleteSlideFromDeck(deck, slideId);
      await this.storage.saveDeck(updated);
      await this.storage.deleteSlideHtml(deckId, slideId);
      this.notifyDeckUpdate(deckId);
      res.json({ success: true, deckId, slideId });
    });

    // API: Add slide to deck
    this.app.post('/api/decks/:deckId/slides', async (req, res) => {
      const { deckId } = req.params;
      let deck = await this.storage.loadDeck(deckId);
      if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
      const { html, title, notes } = req.body;
      const slide = createSlide(title, notes);
      deck = addSlideToDeck(deck, slide);
      await this.storage.saveDeck(deck);
      const slideHtml = html || generateBlankSlideHtml({ title: title || 'Untitled' });
      await this.storage.saveSlideHtml(deckId, slide.id, slideHtml);
      this.notifyDeckUpdate(deckId);
      res.json({ success: true, slideId: slide.id, totalSlides: deck.slides.length });
    });

    // API: Import file (PPTX/PDF) - raw body
    this.app.post('/api/import', express.raw({ type: () => true, limit: '50mb' }), async (req, res) => {
      try {
        const rawFilename = (req.headers['x-filename'] as string) || 'uploaded.pptx';
        const filename = decodeURIComponent(rawFilename);
        const body = req.body as Buffer;
        if (!body || body.length === 0) {
          res.status(400).json({ error: 'No file data received' });
          return;
        }
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext !== 'pptx' && ext !== 'pdf') {
          res.status(400).json({ error: 'Unsupported file type. Please upload a .pdf or .pptx file.' });
          return;
        }
        const templateId = randomBytes(8).toString('hex');
        const templateName = filename.replace(/\.(pptx|pdf)$/i, '') || 'Uploaded';
        const meta = {
          id: templateId,
          name: templateName,
          filename,
          createdAt: new Date().toISOString(),
        };
        await this.storage.saveTemplate(templateId, meta, body);
        // Extract thumbnail
        try {
          let thumbData: Buffer | null = null;
          if (ext === 'pptx') {
            thumbData = await extractPptxThumbnail(body);
          } else if (ext === 'pdf') {
            const filePath = join(this.storage.getStoragePath(), '..', 'templates', templateId, filename);
            thumbData = await extractPdfThumbnail(filePath);
          }
          if (thumbData) {
            await this.storage.saveTemplateThumbnail(templateId, thumbData);
          }
        } catch { /* ignore thumbnail extraction errors */ }
        res.json({ templateId, name: templateName, filename });
      } catch (err: any) {
        console.error('Import error:', err);
        res.status(500).json({ error: `Import failed: ${err.message}` });
      }
    });

    // ===== IMAGE APIs =====

    const ALLOWED_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);

    const IMAGE_CONTENT_TYPES: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };

    // API: List images for a deck
    this.app.get('/api/decks/:deckId/images', async (req, res) => {
      try {
        const { deckId } = req.params;
        const deck = await this.storage.loadDeck(deckId);
        if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
        const images = await this.storage.listImages(deckId);
        res.json(images.map(img => ({
          ...img,
          url: `/api/decks/${deckId}/images/${img.filename}`,
          thumbnailUrl: `/api/decks/${deckId}/images/${img.filename}`,
        })));
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // API: Upload image for a deck
    this.app.post('/api/decks/:deckId/images', express.raw({ type: () => true, limit: '10mb' }), async (req, res) => {
      try {
        const { deckId } = req.params;
        const deck = await this.storage.loadDeck(deckId);
        if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
        const rawFilename = (req.headers['x-filename'] as string) || '';
        const originalName = decodeURIComponent(rawFilename);
        const ext = originalName.split('.').pop()?.toLowerCase() || '';
        if (!ALLOWED_IMAGE_EXTS.has(ext)) {
          res.status(400).json({ error: `Unsupported image type. Allowed: ${[...ALLOWED_IMAGE_EXTS].join(', ')}` });
          return;
        }
        const body = req.body as Buffer;
        if (!body || body.length === 0) {
          res.status(400).json({ error: 'No image data received' });
          return;
        }
        const filename = `${randomBytes(8).toString('hex')}.${ext}`;
        await this.storage.saveImage(deckId, filename, body);
        res.json({ url: `/api/decks/${deckId}/images/${filename}` });
      } catch (err: any) {
        console.error('Image upload error:', err);
        res.status(500).json({ error: `Upload failed: ${err.message}` });
      }
    });

    // API: Delete image from a deck
    this.app.delete('/api/decks/:deckId/images/:filename', async (req, res) => {
      try {
        const { deckId, filename } = req.params;
        const deck = await this.storage.loadDeck(deckId);
        if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
        const deleted = await this.storage.deleteImage(deckId, filename);
        if (!deleted) { res.status(404).json({ error: 'Image not found' }); return; }
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    });

    // API: Serve uploaded image
    this.app.get('/api/decks/:deckId/images/:filename', async (req, res) => {
      const { deckId, filename } = req.params;
      const ext = filename.split('.').pop()?.toLowerCase() || '';
      const contentType = IMAGE_CONTENT_TYPES[ext];
      if (!contentType) { res.status(400).send('Unsupported image type'); return; }
      const imagePath = this.storage.getImagePath(deckId, filename);
      if (!existsSync(imagePath)) { res.status(404).send('Image not found'); return; }
      res.setHeader('Content-Type', contentType);
      res.sendFile(imagePath);
    });

    // ===== TEMPLATE APIs =====

    // API: List templates
    this.app.get('/api/templates', async (_req, res) => {
      const templates = await this.storage.listTemplates();
      res.json(templates);
    });

    // API: Upload template (store file as-is, return ID)
    this.app.post('/api/templates/upload', express.raw({ type: () => true, limit: '50mb' }), async (req, res) => {
      try {
        const rawFilename = (req.headers['x-filename'] as string) || 'uploaded.pptx';
        const filename = decodeURIComponent(rawFilename);
        const body = req.body as Buffer;
        if (!body || body.length === 0) {
          res.status(400).json({ error: 'No file data received' });
          return;
        }
        const templateId = randomBytes(8).toString('hex');
        const templateName = filename.replace(/\.(pptx|pdf)$/i, '') || 'Template';
        const meta = {
          id: templateId,
          name: templateName,
          filename,
          createdAt: new Date().toISOString(),
        };
        await this.storage.saveTemplate(templateId, meta, body);
        const ext = filename.split('.').pop()?.toLowerCase();
        try {
          let thumbData: Buffer | null = null;
          if (ext === 'pptx') {
            thumbData = await extractPptxThumbnail(body);
          } else if (ext === 'pdf') {
            const filePath = join(this.storage.getStoragePath(), '..', 'templates', templateId, filename);
            thumbData = await extractPdfThumbnail(filePath);
          }
          if (thumbData) {
            await this.storage.saveTemplateThumbnail(templateId, thumbData);
          }
        } catch { /* ignore */ }
        res.json({ templateId, name: templateName, filename });
      } catch (err: any) {
        console.error('Template upload error:', err);
        res.status(500).json({ error: `Template upload failed: ${err.message}` });
      }
    });

    // API: Download template file
    this.app.get('/api/templates/:id/file', async (req, res) => {
      const result = await this.storage.loadTemplateFile(req.params.id);
      if (!result) { res.status(404).json({ error: 'Template not found' }); return; }
      const ext = result.filename.split('.').pop()?.toLowerCase();
      const mime = ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      res.set('Content-Type', mime);
      res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
      res.send(result.buffer);
    });

    // API: Template thumbnail
    this.app.get('/api/templates/:id/thumbnail', async (req, res) => {
      const thumb = await this.storage.loadTemplateThumbnail(req.params.id);
      if (!thumb) {
        // Return a 1x1 transparent pixel as fallback
        res.status(404).end();
        return;
      }
      res.set('Content-Type', 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      res.send(thumb);
    });

    // API: Delete template
    this.app.delete('/api/templates/:id', async (req, res) => {
      const deleted = await this.storage.deleteTemplate(req.params.id);
      if (!deleted) { res.status(404).json({ error: 'Template not found' }); return; }
      res.json({ success: true });
    });

    // API: Export deck as PDF
    this.app.get('/api/decks/:id/export/pdf', async (req, res) => {
      const deck = await this.storage.loadDeck(req.params.id);
      if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
      const slideHtmls: string[] = [];
      for (const slide of deck.slides) {
        const html = await this.storage.loadSlideHtml(deck.id, slide.id);
        if (html) slideHtmls.push(html);
      }
      if (slideHtmls.length === 0) { res.status(400).json({ error: 'No slides to export' }); return; }
      const outPath = join(tmpdir(), `slideharness-${deck.id}-${Date.now()}.pdf`);
      const result = await exportToPdf(deck, slideHtmls, outPath);
      if (!result.success) {
        unlink(outPath).catch(() => {});
        res.status(500).json({ error: result.error ?? '不明なエラー' });
        return;
      }
      res.download(outPath, `${deck.title}.pdf`, () => { unlink(outPath).catch(() => {}); });
    });

    // API: Export deck as PPTX
    this.app.get('/api/decks/:id/export/pptx', async (req, res) => {
      const deck = await this.storage.loadDeck(req.params.id);
      if (!deck) { res.status(404).json({ error: 'Deck not found' }); return; }
      const slideHtmls: string[] = [];
      for (const slide of deck.slides) {
        const html = await this.storage.loadSlideHtml(deck.id, slide.id);
        if (html) slideHtmls.push(html);
      }
      if (slideHtmls.length === 0) { res.status(400).json({ error: 'No slides to export' }); return; }
      const outPath = join(tmpdir(), `slideharness-${deck.id}-${Date.now()}.pptx`);
      const result = await exportToPptx(deck, slideHtmls, outPath);
      if (!result.success) {
        unlink(outPath).catch(() => {});
        res.status(500).json({ error: result.error ?? '不明なエラー' });
        return;
      }
      res.download(outPath, `${deck.title}.pptx`, () => { unlink(outPath).catch(() => {}); });
    });

    // Style picker mode — show 3 previews side by side for A/B/C selection
    this.app.get('/style-picker/:deckId', async (req, res) => {
      const deck = await this.storage.loadDeck(req.params.deckId);
      if (!deck) { res.status(404).send('Deck not found'); return; }

      const labels = ['A', 'B', 'C'];
      const slides = deck.slides.slice(0, 3);
      const iframes = slides.map((s, i) =>
        `<div class="option">
          <div class="label">${labels[i]}</div>
          <div class="frame-wrap">
            <iframe src="/api/decks/${deck.id}/slides/${s.id}/html" sandbox="allow-scripts allow-same-origin"></iframe>
          </div>
          <div class="name">${escHtml(s.title || 'Untitled')}</div>
        </div>`
      ).join('\n');

      res.type('html').send(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Style Picker - ${escHtml(deck.title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f172a; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif; min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 32px; }
    h1 { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .subtitle { color: #94a3b8; margin-bottom: 32px; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; width: 100%; max-width: 1400px; }
    .option { background: #1e293b; border-radius: 12px; overflow: hidden; border: 2px solid #334155; transition: all 0.2s; cursor: pointer; }
    .option:hover { border-color: #818cf8; transform: translateY(-4px); box-shadow: 0 8px 32px rgba(99,102,241,0.2); }
    .label { background: #334155; padding: 8px 16px; font-weight: 700; font-size: 18px; text-align: center; }
    .frame-wrap { position: relative; width: 100%; padding-top: 56.25%; overflow: hidden; }
    .frame-wrap iframe { position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; transform: scale(0.23); transform-origin: top left; border: none; pointer-events: none; }
    .name { padding: 12px 16px; font-size: 13px; color: #94a3b8; text-align: center; }
    .hint { margin-top: 32px; color: #64748b; font-size: 13px; text-align: center; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; max-width: 500px; } }
  </style>
</head>
<body>
  <h1>Style Picker</h1>
  <p class="subtitle">${escHtml(deck.title)}</p>
  <div class="grid">${iframes}</div>
  <p class="hint">Choose A, B, or C and tell the AI your preference</p>
</body>
</html>`);
    });

    // Preview page with code view
    this.app.get('/preview/:deckId', async (req, res) => {
      const deck = await this.storage.loadDeck(req.params.deckId);
      if (!deck) { res.status(404).send('Deck not found'); return; }

      // Redirect to style picker if mode=style-picker
      if (req.query.mode === 'style-picker') {
        res.redirect(`/style-picker/${req.params.deckId}`);
        return;
      }

      const slidesMetaJson = JSON.stringify(
        deck.slides.map((s, i) => ({ index: i, id: s.id, title: s.title || `Slide ${i + 1}` })),
      );

      res.type('html').send(`<!DOCTYPE html>
<html lang="ja" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(deck.title)} - Slide Harness</title>
  <style>
    :root {
      --bg: #ffffff; --text: #202124; --header-bg: #ffffff; --header-border: #e5e7eb;
      --sidebar-bg: #f9fafb; --sidebar-border: #e5e7eb; --thumb-bg: #f3f4f6;
      --accent: #6366f1; --meta-text: #6b7280; --link: #6366f1;
      --code-bg: #f8fafc; --code-text: #334155; --panel-bg: #f9fafb; --panel-border: #e5e7eb;
      --badge-bg: rgba(99,102,241,0.1); --badge-text: #6366f1;
      --btn-bg: #f3f4f6; --btn-border: #d1d5db; --btn-text: #374151; --slide-shadow: rgba(0,0,0,0.12);
      --export-menu-bg: #fff; --export-hover: #f3f4f6; --export-text: #202124;
    }
    [data-theme="dark"] {
      --bg: #0f172a; --text: #e2e8f0; --header-bg: #1e293b; --header-border: #334155;
      --sidebar-bg: #1e293b; --sidebar-border: #334155; --thumb-bg: #334155;
      --meta-text: #94a3b8; --link: #818cf8;
      --code-bg: #0f172a; --code-text: #cbd5e1; --panel-bg: #1e293b; --panel-border: #334155;
      --badge-bg: rgba(129,140,248,0.15); --badge-text: #818cf8;
      --btn-bg: #334155; --btn-border: #475569; --btn-text: #cbd5e1; --slide-shadow: rgba(0,0,0,0.4);
      --export-menu-bg: #1e293b; --export-hover: #334155; --export-text: #e2e8f0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }

    .header { flex-shrink: 0; z-index: 100; background: var(--header-bg); border-bottom: 1px solid var(--header-border); padding: 0 20px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .back-link { color: var(--meta-text); text-decoration: none; font-size: 20px; display: flex; align-items: center; padding: 4px; border-radius: 6px; transition: all 0.15s; }
    .back-link:hover { color: var(--accent); background: var(--badge-bg); }
    .header h1 { font-size: 18px; font-weight: 700; cursor: pointer; line-height: 1.2; }
    .header h1:hover { color: var(--accent); }
    .header .meta { font-size: 12px; color: var(--meta-text); display: flex; align-items: center; gap: 8px; margin-top: 2px; }
    .deck-id-code { font-family: 'SF Mono', monospace; font-size: 11px; background: var(--btn-bg); padding: 1px 6px; border-radius: 3px; cursor: pointer; }
    .deck-id-code:hover { background: var(--accent); color: #fff; }
    .title-edit-input { font-size: 18px; font-weight: 700; color: var(--text); background: var(--bg); border: 2px solid var(--accent); border-radius: 6px; padding: 2px 8px; outline: none; width: 300px; }
    .header-right { display: flex; align-items: center; gap: 8px; }
    .status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--meta-text); }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #22c55e; }
    .status-dot.disconnected { background: #ef4444; }

    .hdr-btn { padding: 7px 14px; border: 1px solid var(--btn-border); border-radius: 8px; background: var(--btn-bg); color: var(--btn-text); cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.15s; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
    .hdr-btn:hover { border-color: var(--accent); color: var(--accent); }
    .hdr-btn.primary { background: var(--accent); color: #fff; border-color: var(--accent); }
    .hdr-btn.primary:hover { background: #4f46e5; }
    .hdr-btn.play { background: #22c55e; color: #fff; border-color: #22c55e; }
    .hdr-btn.play:hover { background: #16a34a; }

    .export-wrap { position: relative; }
    .export-menu { display: none; position: absolute; top: 100%; right: 0; margin-top: 4px; background: var(--export-menu-bg); border: 1px solid var(--btn-border); border-radius: 8px; overflow: hidden; min-width: 160px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); z-index: 200; }
    .export-menu.open { display: block; }
    .export-menu a { display: block; padding: 10px 16px; color: var(--export-text); text-decoration: none; font-size: 13px; transition: background 0.1s; }
    .export-menu a:hover { background: var(--export-hover); }

    .main { flex: 1; display: flex; overflow: hidden; }

    .sidebar { width: 220px; flex-shrink: 0; overflow-y: auto; background: var(--sidebar-bg); border-right: 1px solid var(--sidebar-border); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .thumb-item { cursor: pointer; border-radius: 8px; overflow: hidden; border: 2px solid transparent; transition: all 0.15s; position: relative; }
    .thumb-item:hover { border-color: rgba(99,102,241,0.3); transform: scale(1.02); }
    .thumb-item.selected { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
    .thumb-item.dragging { opacity: 0.4; }
    .thumb-item.drag-over { border-top: 3px solid var(--accent); }
    .thumb-label { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 16px 8px 6px; font-size: 11px; color: #fff; }
    .thumb-iframe-wrap { width: 100%; aspect-ratio: 16/9; overflow: hidden; position: relative; background: var(--thumb-bg); }
    .thumb-iframe-wrap iframe { width: 1920px; height: 1080px; border: none; pointer-events: none; transform-origin: top left; position: absolute; top: 0; left: 0; }

    .slide-area { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px; overflow: hidden; position: relative; }
    .slide-frame { width: 100%; max-width: 960px; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px var(--slide-shadow); background: #fff; position: relative; }
    .slide-frame iframe { width: 1920px; height: 1080px; border: none; transform-origin: top left; position: absolute; top: 0; left: 0; }
    .slide-counter { margin-top: 16px; font-size: 14px; color: var(--meta-text); font-weight: 500; }

    .code-panel { width: 0; overflow: hidden; transition: width 0.3s ease; background: var(--panel-bg); border-left: 1px solid var(--panel-border); display: flex; flex-direction: column; }
    .code-panel.open { width: 520px; }
    .code-header { padding: 12px 16px; border-bottom: 1px solid var(--panel-border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .code-header h3 { font-size: 14px; font-weight: 600; color: var(--text); }
    .code-body { flex: 1; overflow: auto; padding: 0; }
    .code-block { margin: 0; padding: 16px; font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace; font-size: 12.5px; line-height: 1.65; color: var(--code-text); white-space: pre-wrap; word-break: break-all; tab-size: 2; background: var(--code-bg); }
    .slide-info { padding: 10px 16px; background: var(--badge-bg); border-bottom: 1px solid var(--panel-border); font-size: 12px; color: var(--btn-text); flex-shrink: 0; display: flex; gap: 12px; align-items: center; }
    .slide-info .badge { background: var(--badge-bg); color: var(--badge-text); padding: 2px 8px; border-radius: 4px; font-weight: 500; }
    .copy-btn { padding: 5px 12px; border: 1px solid var(--btn-border); border-radius: 6px; background: transparent; color: var(--btn-text); cursor: pointer; font-size: 12px; transition: all 0.15s; }
    .copy-btn:hover { border-color: var(--accent); color: var(--accent); }

    .images-panel { width: 0; overflow: hidden; transition: width 0.3s ease; background: var(--panel-bg); border-left: 1px solid var(--panel-border); display: flex; flex-direction: column; }
    .images-panel.open { width: 400px; }
    .images-panel-header { padding: 12px 16px; border-bottom: 1px solid var(--panel-border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .images-panel-header h3 { font-size: 14px; font-weight: 600; color: var(--text); }
    .images-panel-body { flex: 1; overflow-y: auto; }

    .image-dropzone { margin: 12px 16px; border: 2px dashed var(--btn-border); border-radius: 10px; padding: 24px 16px; text-align: center; cursor: pointer; transition: all 0.2s; }
    .image-dropzone:hover { border-color: var(--accent); background: var(--badge-bg); }
    .image-dropzone.dragover { border-color: var(--accent); background: var(--badge-bg); }
    .image-dropzone-icon { font-size: 28px; margin-bottom: 8px; color: var(--meta-text); }
    .image-dropzone-text { font-size: 13px; color: var(--meta-text); margin-bottom: 4px; }
    .image-dropzone-hint { font-size: 11px; color: var(--meta-text); opacity: 0.6; }

    .image-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 12px 16px; }
    .image-card { background: var(--btn-bg); border: 1px solid var(--btn-border); border-radius: 8px; overflow: hidden; transition: all 0.15s; }
    .image-card:hover { border-color: var(--accent); }
    .image-card img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; cursor: pointer; }
    .image-card-info { padding: 6px 8px; }
    .image-card-name { font-size: 10px; color: var(--meta-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
    .image-card-actions { display: flex; gap: 4px; }
    .image-card-btn { flex: 1; padding: 3px 6px; border: 1px solid var(--btn-border); border-radius: 4px; background: transparent; color: var(--btn-text); cursor: pointer; font-size: 10px; transition: all 0.15s; }
    .image-card-btn:hover { border-color: var(--accent); color: var(--accent); }
    .image-card-btn.danger:hover { border-color: #ef4444; color: #ef4444; }
    .images-empty-msg { padding: 16px; text-align: center; color: var(--meta-text); font-size: 12px; opacity: 0.6; }
    .image-upload-progress { margin: 0 16px 8px; height: 3px; background: var(--btn-bg); border-radius: 2px; overflow: hidden; display: none; }
    .image-upload-progress.active { display: block; }
    .image-upload-progress-bar { height: 100%; background: var(--accent); width: 0%; transition: width 0.3s; }

    .image-copied-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(100px); background: #22c55e; color: #fff; padding: 10px 24px; border-radius: 8px; font-size: 13px; font-weight: 500; z-index: 9999; transition: transform 0.3s ease; pointer-events: none; }
    .image-copied-toast.show { transform: translateX(-50%) translateY(0); }

    /* Slideshow overlay - fullscreen like PowerPoint */
    .slideshow { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 9999; overflow: hidden; cursor: none; }
    .slideshow.active { display: block; }
    .slideshow iframe { border: none; position: absolute; width: 1920px; height: 1080px; transform-origin: top left; }
    .slideshow-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 40px; background: linear-gradient(transparent, rgba(0,0,0,0.8)); display: flex; align-items: center; justify-content: center; gap: 12px; z-index: 10000; opacity: 0; transition: opacity 0.3s; cursor: default; }
    .slideshow.show-ui .slideshow-bar { opacity: 1; }
    .slideshow.show-ui { cursor: default; }
    .ss-btn { border: none; background: rgba(255,255,255,0.2); color: #fff; width: 36px; height: 28px; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background 0.15s; }
    .ss-btn:hover { background: rgba(255,255,255,0.4); }
    .ss-btn:disabled { opacity: 0.3; cursor: default; }
    .ss-counter { color: rgba(255,255,255,0.6); font-size: 13px; min-width: 60px; text-align: center; }
    .ss-close { position: absolute; top: 12px; right: 12px; z-index: 10001; border: none; background: none; color: rgba(255,255,255,0.5); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; opacity: 0; transition: opacity 0.3s; }
    .slideshow.show-ui .ss-close { opacity: 1; }
    .ss-close:hover { background: rgba(255,255,255,0.2); color: #fff; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <a href="/" class="back-link" title="\u30db\u30fc\u30e0">\u2190</a>
      <div>
        <h1 id="deckTitle" onclick="startEditDeckTitle()">${escHtml(deck.title)}</h1>
        <div class="meta">
          <span>${deck.slides.length} \u30b9\u30e9\u30a4\u30c9</span> \u00b7
          <code class="deck-id-code" onclick="copyDeckId()" title="\u30af\u30ea\u30c3\u30af\u3067\u30b3\u30d4\u30fc">${deck.id}</code>
        </div>
      </div>
    </div>
    <div class="header-right">
      <div class="status"><div class="status-dot" id="statusDot"></div><span id="statusText">Live</span></div>
      <button class="hdr-btn" onclick="toggleCodePanel()" id="codeToggle">HTML</button>
      <button class="hdr-btn" onclick="toggleImagesPanel()" id="imagesToggle">\u753b\u50cf</button>
      <div class="export-wrap">
        <button class="hdr-btn" onclick="toggleExportMenu()">\u2b07 \u30a8\u30af\u30b9\u30dd\u30fc\u30c8</button>
        <div class="export-menu" id="exportMenu">
          <a href="#" onclick="exportDeck('pdf');return false">\ud83d\udcc4 PDF</a>
          <a href="#" onclick="exportDeck('pptx');return false">\ud83d\udcca PPTX</a>
        </div>
      </div>
      <a href="/editor/?deck=${deck.id}" class="hdr-btn primary">\u270f\ufe0f \u7de8\u96c6</a>
      <button class="hdr-btn play" onclick="startSlideshow()">\u25b6 \u30b9\u30e9\u30a4\u30c9\u30b7\u30e7\u30fc</button>
    </div>
  </div>

  <div class="main">
    <div class="sidebar" id="sidebar"></div>
    <div class="slide-area">
      <div class="slide-frame">
        <iframe id="mainSlide" src="about:blank"></iframe>
      </div>
      <div class="slide-counter" id="slideCounter"></div>
    </div>
    <div class="code-panel" id="codePanel">
      <div class="code-header">
        <h3>HTML \u30bd\u30fc\u30b9</h3>
        <button class="copy-btn" onclick="copyCode()" id="copyBtn">\u30b3\u30d4\u30fc</button>
      </div>
      <div class="slide-info" id="slideInfo">
        <span class="badge" id="slideInfoBadge">Slide 1</span>
        <span id="slideInfoTitle"></span>
      </div>
      <div class="code-body">
        <pre class="code-block" id="codeContent"></pre>
      </div>
    </div>
    <div class="images-panel" id="imagesPanel">
      <div class="images-panel-header">
        <h3>\u753b\u50cf</h3>
        <span id="imagesCount" style="font-size:12px;color:var(--meta-text)"></span>
      </div>
      <div class="images-panel-body">
        <div class="image-dropzone" id="imageDropzone">
          <div class="image-dropzone-icon">\u2b06</div>
          <div class="image-dropzone-text">\u30af\u30ea\u30c3\u30af\u307e\u305f\u306f\u30c9\u30e9\u30c3\u30b0&\u30c9\u30ed\u30c3\u30d7\u3067\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9</div>
          <div class="image-dropzone-hint">JPG, PNG, GIF, WebP, SVG</div>
          <input type="file" id="imageFileInput" accept="image/*" multiple style="display:none">
        </div>
        <div class="image-upload-progress" id="uploadProgress"><div class="image-upload-progress-bar" id="uploadProgressBar"></div></div>
        <div id="imagesGrid"></div>
      </div>
    </div>
  </div>

  <!-- Slideshow overlay -->
  <div class="slideshow" id="slideshow">
    <iframe id="ssIframe" src="about:blank"></iframe>
    <button class="ss-close" onclick="exitSlideshow()">\u2715</button>
    <div class="slideshow-bar">
      <button class="ss-btn" id="ssPrev" onclick="ssNav(-1)">\u2190</button>
      <span class="ss-counter" id="ssCounter"></span>
      <button class="ss-btn" id="ssNext" onclick="ssNav(1)">\u2192</button>
    </div>
  </div>

  <script>
    const deckId = '${deck.id}';
    let deckTitle = '${escHtml(deck.title).replace(/'/g, "\\\\'")}';
    const slidesMeta = ${slidesMetaJson};
    let selectedIdx = 0;
    let dragSrcIdx = null;

    function updateSlideCounter() {
      document.getElementById('slideCounter').textContent = (selectedIdx + 1) + ' / ' + slidesMeta.length;
    }

    function buildSidebar() {
      const sidebar = document.getElementById('sidebar');
      sidebar.innerHTML = slidesMeta.map((s, i) => {
        const url = '/api/decks/' + deckId + '/slides/' + s.id + '/html';
        return '<div class="thumb-item' + (i === selectedIdx ? ' selected' : '') + '" data-idx="' + i + '" draggable="true" onclick="selectSlide(' + i + ')">' +
          '<div class="thumb-iframe-wrap"><iframe src="' + url + '" loading="lazy" scrolling="no"></iframe></div>' +
          '<div class="thumb-label">' + (i + 1) + '. ' + (s.title || 'Slide') + '</div>' +
        '</div>';
      }).join('');
      sidebar.querySelectorAll('.thumb-item').forEach(el => {
        el.addEventListener('dragstart', onDragStart);
        el.addEventListener('dragover', onDragOver);
        el.addEventListener('dragleave', onDragLeave);
        el.addEventListener('drop', onDrop);
        el.addEventListener('dragend', onDragEnd);
      });
      scaleThumbIframes();
    }

    function onDragStart(e) { dragSrcIdx = parseInt(e.currentTarget.dataset.idx); e.currentTarget.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
    function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('drag-over'); }
    function onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
    function onDragEnd(e) { e.currentTarget.classList.remove('dragging'); document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over')); }
    function onDrop(e) {
      e.preventDefault(); e.currentTarget.classList.remove('drag-over');
      const targetIdx = parseInt(e.currentTarget.dataset.idx);
      if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
      const moved = slidesMeta.splice(dragSrcIdx, 1)[0];
      slidesMeta.splice(targetIdx, 0, moved);
      slidesMeta.forEach((s, i) => s.index = i);
      selectedIdx = targetIdx; buildSidebar(); selectSlide(selectedIdx);
      fetch('/api/decks/' + deckId + '/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slideIds: slidesMeta.map(s => s.id) }) });
      dragSrcIdx = null;
    }

    function selectSlide(idx) {
      selectedIdx = idx;
      const slide = slidesMeta[idx];
      document.getElementById('mainSlide').src = '/api/decks/' + deckId + '/slides/' + slide.id + '/html';
      document.querySelectorAll('.thumb-item').forEach((el, i) => el.classList.toggle('selected', i === idx));
      updateSlideCounter();
      if (codeOpen) loadCode();
      // Scroll selected into view
      const selected = document.querySelector('.thumb-item.selected');
      if (selected) selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function startEditDeckTitle() {
      const h1 = document.getElementById('deckTitle');
      const input = document.createElement('input');
      input.className = 'title-edit-input'; input.value = deckTitle;
      h1.replaceWith(input); input.focus(); input.select();
      function save() {
        const newTitle = input.value.trim() || deckTitle; deckTitle = newTitle;
        const newH1 = document.createElement('h1'); newH1.id = 'deckTitle'; newH1.textContent = newTitle; newH1.onclick = startEditDeckTitle;
        input.replaceWith(newH1); document.title = newTitle + ' - Slide Harness';
        if (newTitle !== deckTitle) fetch('/api/decks/' + deckId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }) });
      }
      input.addEventListener('blur', save);
      input.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); } if (ev.key === 'Escape') { input.value = deckTitle; input.blur(); } });
    }

    function copyDeckId() {
      navigator.clipboard.writeText(deckId).then(() => {
        const el = document.querySelector('.deck-id-code'); const orig = el.textContent;
        el.textContent = '\u2713 \u30b3\u30d4\u30fc\u6e08\u307f'; setTimeout(() => { el.textContent = orig; }, 1500);
      });
    }

    let codeOpen = false;
    let imagesOpen = false;
    let imagesData = [];

    function toggleCodePanel() {
      codeOpen = !codeOpen;
      const panel = document.getElementById('codePanel');
      const btn = document.getElementById('codeToggle');
      if (codeOpen) { panel.classList.add('open'); btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; loadCode(); }
      else { panel.classList.remove('open'); btn.style.background = ''; btn.style.color = ''; }
      setTimeout(scaleMainSlide, 350);
    }

    function toggleImagesPanel() {
      imagesOpen = !imagesOpen;
      const panel = document.getElementById('imagesPanel');
      const btn = document.getElementById('imagesToggle');
      if (imagesOpen) { panel.classList.add('open'); btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; refreshImages(); }
      else { panel.classList.remove('open'); btn.style.background = ''; btn.style.color = ''; }
      setTimeout(scaleMainSlide, 350);
    }

    function refreshImages() {
      fetch('/api/decks/' + deckId + '/images').then(function(r) { return r.json(); }).then(function(data) {
        console.log('Images loaded:', data.length);
        imagesData = data; renderImages(); updateImagesCount();
      }).catch(function(e) { console.error('refreshImages error:', e); });
    }

    function renderImages() {
      const container = document.getElementById('imagesGrid');
      if (!imagesData || imagesData.length === 0) { container.className = ''; container.innerHTML = '<div class="images-empty-msg">\u753b\u50cf\u306a\u3057</div>'; return; }
      container.className = 'image-grid';
      container.innerHTML = imagesData.map(img =>
        '<div class="image-card">' +
          '<img src="' + img.thumbnailUrl + '" alt="' + img.filename + '" onclick="copyImageUrl(\\'' + img.url + '\\')" title="\u30af\u30ea\u30c3\u30af\u3067URL\u30b3\u30d4\u30fc">' +
          '<div class="image-card-info">' +
            '<div class="image-card-name" title="' + img.filename + '">' + img.filename + '</div>' +
            '<div class="image-card-actions">' +
              '<button class="image-card-btn" onclick="copyImageUrl(\\'' + img.url + '\\')">URL</button>' +
              '<button class="image-card-btn danger" onclick="deleteImage(\\'' + img.filename + '\\')">\u524a\u9664</button>' +
            '</div>' +
          '</div>' +
        '</div>'
      ).join('');
    }

    function updateImagesCount() {
      document.getElementById('imagesCount').textContent = imagesData.length > 0 ? imagesData.length + ' \u4ef6' : '';
    }

    function copyImageUrl(url) {
      var fullUrl = location.origin + url;
      navigator.clipboard.writeText(fullUrl).then(function() { showToast('URL\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f'); });
    }

    function showToast(msg) {
      var toast = document.getElementById('copiedToast');
      if (!toast) { toast = document.createElement('div'); toast.id = 'copiedToast'; toast.className = 'image-copied-toast'; document.body.appendChild(toast); }
      toast.textContent = msg;
      requestAnimationFrame(function() { toast.classList.add('show'); });
      setTimeout(function() { toast.classList.remove('show'); }, 2000);
    }

    function deleteImage(filename) {
      if (!confirm(filename + ' \u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f')) return;
      fetch('/api/decks/' + deckId + '/images/' + filename, { method: 'DELETE' }).then(function(r) { return r.json(); }).then(function() { refreshImages(); });
    }

    function uploadFiles(files) {
      if (!files || files.length === 0) return;
      var prog = document.getElementById('uploadProgress');
      var bar = document.getElementById('uploadProgressBar');
      prog.classList.add('active'); bar.style.width = '0%';
      var total = files.length; var done = 0;
      Array.from(files).forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function() {
          fetch('/api/decks/' + deckId + '/images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) },
            body: reader.result
          }).then(function(r) { return r.json(); }).then(function(data) {
            console.log('Upload done:', data);
            done++;
            bar.style.width = (done / total * 100) + '%';
            if (done === total) {
              setTimeout(function() { prog.classList.remove('active'); }, 500);
              refreshImages();
              showToast(total + ' \u4ef6\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u5b8c\u4e86');
            }
          }).catch(function(e) { console.error('Upload error:', e); });
        };
        reader.readAsArrayBuffer(file);
      });
    }

    // Dropzone setup
    (function() {
      var dz = document.getElementById('imageDropzone');
      var input = document.getElementById('imageFileInput');
      dz.addEventListener('click', function() { input.click(); });
      input.addEventListener('change', function() { uploadFiles(input.files); input.value = ''; });
      dz.addEventListener('dragover', function(e) { e.preventDefault(); e.stopPropagation(); dz.classList.add('dragover'); });
      dz.addEventListener('dragleave', function(e) { e.preventDefault(); e.stopPropagation(); dz.classList.remove('dragover'); });
      dz.addEventListener('drop', function(e) { e.preventDefault(); e.stopPropagation(); dz.classList.remove('dragover'); uploadFiles(e.dataTransfer.files); });
    })();

    function setView(mode) {
      var panel = document.getElementById('codePanel');
      var btn = document.getElementById('codeToggle');
      if (mode === 'code') { codeOpen = true; panel.classList.add('open'); btn.style.background = 'var(--accent)'; btn.style.color = '#fff'; loadCode(); }
      else { codeOpen = false; panel.classList.remove('open'); btn.style.background = ''; btn.style.color = ''; }
      setTimeout(scaleMainSlide, 350);
    }

    function loadCode() {
      const slide = slidesMeta[selectedIdx];
      document.getElementById('slideInfoBadge').textContent = 'Slide ' + (selectedIdx + 1);
      document.getElementById('slideInfoTitle').textContent = slide.title || '';
      fetch('/api/decks/' + deckId + '/slides/' + slide.id + '/html').then(r => r.text()).then(html => { document.getElementById('codeContent').textContent = html; });
    }

    function copyCode() {
      const text = document.getElementById('codeContent').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = '\u2713 \u30b3\u30d4\u30fc\u6e08\u307f'; setTimeout(() => { btn.textContent = '\u30b3\u30d4\u30fc'; }, 2000);
      });
    }

    function toggleExportMenu() { document.getElementById('exportMenu').classList.toggle('open'); }
    document.addEventListener('click', (e) => { if (!e.target.closest('.export-wrap')) document.getElementById('exportMenu').classList.remove('open'); });

    async function exportDeck(format) {
      const btn = event.target;
      const origText = btn.textContent;
      btn.textContent = '\u2026 \u30a8\u30af\u30b9\u30dd\u30fc\u30c8\u4e2d';
      btn.style.pointerEvents = 'none';
      try {
        const resp = await fetch('/api/decks/' + deckId + '/export/' + format);
        if (!resp.ok) {
          const text = await resp.text();
          const msg = text.includes('Playwright') ? 'Playwright\u304c\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002\u30b5\u30fc\u30d0\u30fc\u3067 pnpm add playwright && npx playwright install chromium \u3092\u5b9f\u884c\u3057\u3066\u304f\u3060\u3055\u3044\u3002'
            : '\u30a8\u30af\u30b9\u30dd\u30fc\u30c8\u306b\u5931\u6557\u3057\u307e\u3057\u305f: ' + resp.status;
          alert(msg);
          return;
        }
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = deckTitle + '.' + format;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert('\u30a8\u30af\u30b9\u30dd\u30fc\u30c8\u4e2d\u306b\u30a8\u30e9\u30fc\u304c\u767a\u751f\u3057\u307e\u3057\u305f: ' + err.message);
      } finally {
        btn.textContent = origText;
        btn.style.pointerEvents = '';
        document.getElementById('exportMenu').classList.remove('open');
      }
    }

    // ===== SLIDESHOW =====
    let ssIdx = 0;
    let ssActive = false;

    let ssMouseTimer = null;

    function startSlideshow() {
      if (slidesMeta.length === 0) return;
      ssIdx = selectedIdx;
      ssActive = true;
      const el = document.getElementById('slideshow');
      el.classList.add('active');
      // Request browser fullscreen
      (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen || function(){}).call(el);
      ssRender();
      document.addEventListener('keydown', ssKeyHandler);
    }

    function exitSlideshow() {
      ssActive = false;
      const el = document.getElementById('slideshow');
      el.classList.remove('active');
      el.classList.remove('show-ui');
      document.getElementById('ssIframe').src = 'about:blank';
      document.removeEventListener('keydown', ssKeyHandler);
      if (ssMouseTimer) { clearTimeout(ssMouseTimer); ssMouseTimer = null; }
      // Exit browser fullscreen
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        (document.exitFullscreen || document.webkitExitFullscreen || function(){}).call(document);
      }
      selectSlide(ssIdx);
    }

    // Exit slideshow when browser exits fullscreen (e.g. user presses Esc natively)
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && ssActive) exitSlideshow(); });
    document.addEventListener('webkitfullscreenchange', () => { if (!document.webkitFullscreenElement && ssActive) exitSlideshow(); });

    function ssRender() {
      const slide = slidesMeta[ssIdx];
      const iframe = document.getElementById('ssIframe');
      iframe.src = '/api/decks/' + deckId + '/slides/' + slide.id + '/html';
      ssLayout();
      document.getElementById('ssCounter').textContent = (ssIdx + 1) + ' / ' + slidesMeta.length;
      document.getElementById('ssPrev').disabled = ssIdx === 0;
      document.getElementById('ssNext').disabled = ssIdx === slidesMeta.length - 1;
    }

    function ssLayout() {
      const iframe = document.getElementById('ssIframe');
      if (!iframe) return;
      var el = document.getElementById('slideshow');
      var w = el.clientWidth || window.innerWidth;
      var h = el.clientHeight || window.innerHeight;
      var scale = Math.min(w / 1920, h / 1080);
      iframe.style.transform = 'scale(' + scale + ')';
      iframe.style.left = ((w - 1920 * scale) / 2) + 'px';
      iframe.style.top = ((h - 1080 * scale) / 2) + 'px';
    }

    function ssNav(dir) {
      const next = ssIdx + dir;
      if (next < 0 || next >= slidesMeta.length) return;
      ssIdx = next;
      ssRender();
    }

    function ssKeyHandler(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); ssNav(1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'Backspace') { e.preventDefault(); ssNav(-1); }
      else if (e.key === 'Escape') { e.preventDefault(); exitSlideshow(); }
      else if (e.key === 'Home') { e.preventDefault(); ssIdx = 0; ssRender(); }
      else if (e.key === 'End') { e.preventDefault(); ssIdx = slidesMeta.length - 1; ssRender(); }
    }

    // Click to advance slide (like PowerPoint)
    document.getElementById('slideshow').addEventListener('click', function(e) {
      if (e.target.closest('.slideshow-bar') || e.target.closest('.ss-close')) return;
      ssNav(1);
    });

    // Show/hide UI on mouse move
    document.getElementById('slideshow').addEventListener('mousemove', function() {
      var el = document.getElementById('slideshow');
      el.classList.add('show-ui');
      if (ssMouseTimer) clearTimeout(ssMouseTimer);
      ssMouseTimer = setTimeout(function() { el.classList.remove('show-ui'); }, 2500);
    });

    window.addEventListener('resize', () => { if (ssActive) ssLayout(); scaleMainSlide(); scaleThumbIframes(); });

    // ===== KEYBOARD NAV (preview) =====
    document.addEventListener('keydown', (e) => {
      if (ssActive) return;
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); if (selectedIdx < slidesMeta.length - 1) selectSlide(selectedIdx + 1); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); if (selectedIdx > 0) selectSlide(selectedIdx - 1); }
    });

    // ===== WEBSOCKET =====
    let ws;
    function connectWs() {
      ws = new WebSocket('ws://' + location.host);
      ws.onopen = () => { document.getElementById('statusDot').className = 'status-dot'; document.getElementById('statusText').textContent = 'Live'; ws.send(JSON.stringify({ type: 'subscribe', deckId })); };
      ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.type === 'deck-updated' && m.deckId === deckId) { document.getElementById('mainSlide').src = document.getElementById('mainSlide').src; buildSidebar(); setTimeout(() => selectSlide(selectedIdx), 100); if (codeOpen) loadCode(); if (imagesOpen) refreshImages(); } };
      ws.onclose = () => { document.getElementById('statusDot').className = 'status-dot disconnected'; document.getElementById('statusText').textContent = 'Offline'; setTimeout(connectWs, 2000); };
    }

    function scaleMainSlide() { const f = document.querySelector('.slide-frame'); const i = document.getElementById('mainSlide'); if (f && i) i.style.transform = 'scale(' + (f.clientWidth / 1920) + ')'; }
    function scaleThumbIframes() { document.querySelectorAll('.thumb-iframe-wrap').forEach(w => { const i = w.querySelector('iframe'); if (i) i.style.transform = 'scale(' + (w.clientWidth / 1920) + ')'; }); }

    // Theme
    function toggleTheme() { /* removed - always dark for now */ }
    (function initTheme() { const s = localStorage.getItem('slideharness-theme'); if (s) document.documentElement.dataset.theme = s; })();

    buildSidebar();
    if (slidesMeta.length > 0) selectSlide(0);
    connectWs();
    requestAnimationFrame(() => { scaleMainSlide(); scaleThumbIframes(); });
  </script>
</body>
</html>`);
    });

    // ===== TEMPLATES GALLERY PAGE =====
    this.app.get('/templates', async (_req, res) => {
      res.type('html').send(`<!DOCTYPE html>
<html lang="ja" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u30ae\u30e3\u30e9\u30ea\u30fc - Slide Harness</title>
  <style>
    :root {
      --h-bg: #fff; --h-text: #202124; --h-border: #e0e0e0; --h-sub: #5f6368;
      --h-input-bg: #f1f3f4; --h-card-border: #e0e0e0; --h-card-hover: rgba(0,0,0,0.12);
      --h-date: #9aa0a6;
    }
    [data-theme="dark"] {
      --h-bg: #0f0f23; --h-text: #e0e0e0; --h-border: rgba(255,255,255,0.1); --h-sub: #94a3b8;
      --h-input-bg: #1a1b2e; --h-card-border: rgba(255,255,255,0.1); --h-card-hover: rgba(255,255,255,0.08);
      --h-date: #64748b;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--h-bg); color: var(--h-text); font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif; }
    .top-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 40px; border-bottom: 1px solid var(--h-border); position: sticky; top: 0; background: var(--h-bg); z-index: 100; }
    .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .logo-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #818cf8); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 15px; }
    .logo-text { font-size: 20px; font-weight: 400; color: var(--h-sub); }
    .logo-text span { color: var(--h-text); font-weight: 500; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .back-btn { padding: 6px 16px; border: 1px solid var(--h-border); border-radius: 6px; background: transparent; cursor: pointer; font-size: 13px; color: var(--h-sub); text-decoration: none; transition: all 0.15s; }
    .back-btn:hover { border-color: #6366f1; color: #6366f1; }

    .gallery { max-width: 1200px; margin: 0 auto; padding: 40px 24px; }
    .gallery-header { text-align: center; margin-bottom: 48px; }
    .gallery-header h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
    .gallery-header p { font-size: 16px; color: var(--h-sub); }

    .template-section { margin-bottom: 56px; }
    .template-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .template-section-header h2 { font-size: 20px; font-weight: 600; }
    .template-section-header .t-id { font-size: 12px; color: var(--h-date); font-family: monospace; }

    .slides-row { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 12px; scroll-snap-type: x mandatory; }
    .slides-row::-webkit-scrollbar { height: 6px; }
    .slides-row::-webkit-scrollbar-track { background: var(--h-input-bg); border-radius: 3px; }
    .slides-row::-webkit-scrollbar-thumb { background: var(--h-border); border-radius: 3px; }

    .slide-thumb { flex-shrink: 0; width: 280px; scroll-snap-align: start; cursor: pointer; border: 1px solid var(--h-card-border); border-radius: 8px; overflow: hidden; transition: all 0.15s; position: relative; }
    .slide-thumb:hover { border-color: #6366f1; box-shadow: 0 4px 16px var(--h-card-hover); transform: translateY(-2px); }
    .slide-thumb-frame { width: 100%; aspect-ratio: 16/9; background: #fff; overflow: hidden; position: relative; }
    .slide-thumb-frame iframe { width: 1920px; height: 1080px; border: none; pointer-events: none; transform-origin: top left; position: absolute; top: 0; left: 0; }
    .slide-thumb-label { padding: 8px 12px; font-size: 12px; color: var(--h-sub); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .create-section { text-align: center; padding: 48px 0; border-top: 1px solid var(--h-border); margin-top: 16px; }
    .create-section h3 { font-size: 20px; margin-bottom: 16px; font-weight: 500; }
    .create-btn { display: inline-block; padding: 12px 32px; border: none; border-radius: 24px; background: #6366f1; color: #fff; font-size: 15px; font-weight: 500; cursor: pointer; text-decoration: none; transition: background 0.15s; }
    .create-btn:hover { background: #4f46e5; }

    .pf-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--h-border); background: transparent; cursor: pointer; font-size: 13px; color: var(--h-sub); transition: all 0.15s; }
    .pf-btn:hover { border-color: #6366f1; }
  </style>
</head>
<body>
  <div class="top-header">
    <a href="/" class="logo">
      <div class="logo-icon">SC</div>
      <div class="logo-text"><span>Slide Harness</span></div>
    </a>
    <div class="header-actions">
      <a href="/" class="back-btn">\u2190 \u30db\u30fc\u30e0\u306b\u623b\u308b</a>
    </div>
  </div>

  <div class="gallery">
    <div class="gallery-header">
      <h1>\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u30ae\u30e3\u30e9\u30ea\u30fc</h1>
      <p>\u304a\u3059\u3059\u3081\u306e\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u304b\u3089\u9078\u3092\u306b\u59cb\u3081\u3089\u307e\u3057\u3087\u3046\u3046\u3068</p>
    </div>
    <div id="templateSections"></div>
  </div>


  <script>
    const templateSlides = {};

    const templates = {};

    let blobUrls = [];

    function wrapHtml(body) {
      return '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=1920,height=1080"><script src="https://cdn.tailwindcss.com"><\\/script><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet"><style>*{font-family:\\'Noto Sans JP\\',sans-serif}</style></head><body class="w-[1920px] h-[1080px] overflow-hidden">' + body + '</body></html>';
    }

    function render() {
      const container = document.getElementById('templateSections');
      let html = '';
      for (const [id, t] of Object.entries(templates)) {
        html += '<div class="template-section">';
        html += '<div class="template-section-header"><h2>' + t.icon + ' ' + escHtml(t.name) + '</h2><span class="t-id">ID: ' + id + ' <button class="pf-btn" style="padding:2px 8px;font-size:11px" onclick="copyId(\\'' + id + '\\')">\ud83d\udccb</button></span></div>';
        html += '<div class="slides-row">';
        t.slides.forEach((s, i) => {
          const fullHtml = wrapHtml(s.html);
          const blob = new Blob([fullHtml], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          blobUrls.push(url);
          html += '<div class="slide-thumb">';
          html += '<div class="slide-thumb-frame"><iframe src="' + url + '" loading="lazy" scrolling="no"></iframe></div>';
          html += '<div class="slide-thumb-label">' + (i+1) + '. ' + escHtml(s.title) + '</div>';
          html += '</div>';
        });
        html += '</div>';
        html += '<div style="text-align:right;margin-top:12px"><button class="pf-btn" onclick="copyId(\\'' + id + '\\')">\ud83d\udccb ID\u3092\u30b3\u30d4\u30fc</button></div>';
        html += '</div>';
      }
      container.innerHTML = html;
      requestAnimationFrame(scaleThumbs);
    }

    function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function scaleThumbs() {
      document.querySelectorAll('.slide-thumb-frame').forEach(f => {
        const iframe = f.querySelector('iframe');
        if (!iframe) return;
        iframe.style.transform = 'scale(' + (f.clientWidth / 1920) + ')';
      });
    }
    window.addEventListener('resize', scaleThumbs);

    function copyId(id) {
      navigator.clipboard.writeText(id).then(() => {
        const btn = event.currentTarget;
        const orig = btn.textContent;
        btn.textContent = '\u2713 \u30b3\u30d4\u30fc\u6e08\u307f';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    }

    render();
  </script>
</body>
</html>`);
    });

    // ===== HOME PAGE =====
    this.app.get('/', async (_req, res) => {
      const decks = await this.storage.listDecks();
      decks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      const formatDate = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return '\u305f\u3063\u305f\u4eca';
        if (diffMins < 60) return `${diffMins}\u5206\u524d`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}\u6642\u9593\u524d`;
        return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
      };

      const decksJson = JSON.stringify(decks.map(d => ({ id: d.id, title: d.title, slides: d.slides.length, updatedAt: d.updatedAt })));

      res.type('html').send(`<!DOCTYPE html>
<html lang="ja" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slide Harness</title>
  <style>
    :root {
      --h-bg: #fff; --h-text: #202124; --h-border: #e0e0e0; --h-sub: #5f6368;
      --h-input-bg: #f1f3f4; --h-card-border: #e0e0e0; --h-card-hover: rgba(0,0,0,0.12);
      --h-thumb-bg: #f1f3f4; --h-badge-bg: #6366f1; --h-date: #9aa0a6;
      --h-modal-bg: #fff; --h-modal-shadow: rgba(0,0,0,0.2); --h-input-border: #ddd;
      --h-overlay-bg: rgba(0,0,0,0.4); --h-edit-border: #818cf8;
    }
    [data-theme="dark"] {
      --h-bg: #0f0f23; --h-text: #e0e0e0; --h-border: rgba(255,255,255,0.1); --h-sub: #94a3b8;
      --h-input-bg: #1a1b2e; --h-card-border: rgba(255,255,255,0.1); --h-card-hover: rgba(255,255,255,0.08);
      --h-thumb-bg: #1e1e2e; --h-badge-bg: #818cf8; --h-date: #64748b;
      --h-modal-bg: #1a1b2e; --h-modal-shadow: rgba(0,0,0,0.5); --h-input-border: rgba(255,255,255,0.15);
      --h-overlay-bg: rgba(0,0,0,0.6); --h-edit-border: #818cf8;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--h-bg); color: var(--h-text); font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif; }
    .top-header { display: flex; align-items: center; justify-content: space-between; padding: 8px 24px; border-bottom: 1px solid var(--h-border); position: sticky; top: 0; background: var(--h-bg); z-index: 100; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-icon { width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #818cf8); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 18px; }
    .logo-text { font-size: 22px; font-weight: 400; color: var(--h-sub); }
    .logo-text span { color: var(--h-text); font-weight: 500; }
    .search-bar { flex: 1; max-width: 720px; margin: 0 40px; position: relative; }
    .search-bar input { width: 100%; padding: 12px 16px 12px 48px; border-radius: 8px; border: none; background: var(--h-input-bg); font-size: 16px; color: var(--h-text); outline: none; transition: box-shadow 0.2s; }
    .search-bar input:focus { background: var(--h-bg); box-shadow: 0 1px 6px rgba(32,33,36,0.28); }
    .search-bar::before { content: '\ud83d\udd0d'; position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 18px; opacity: 0.5; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .status-badge { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; background: #e8f5e9; color: #2e7d32; font-size: 13px; font-weight: 500; }
    .status-badge .dot { width: 8px; height: 8px; border-radius: 50%; background: #4caf50; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

    .version-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #818cf8; color: #fff; font-size: 11px; font-weight: 600; margin-left: 8px; }

    .section-recent { padding: 28px 80px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .section-header h2 { font-size: 16px; font-weight: 500; color: var(--h-text); }

    .create-btn { padding: 8px 20px; border: none; border-radius: 24px; background: #6366f1; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 6px; }
    .create-btn:hover { background: #4f46e5; }

    .decks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; }
    .deck-card { text-decoration: none; color: inherit; border-radius: 8px; overflow: hidden; border: 1px solid var(--h-card-border); transition: box-shadow 0.2s, transform 0.15s; cursor: pointer; position: relative; }
    .deck-card:hover { box-shadow: 0 4px 16px var(--h-card-hover); transform: translateY(-2px); }
    .deck-thumb { width: 100%; aspect-ratio: 16/9; overflow: hidden; background: var(--h-thumb-bg); position: relative; }
    .deck-thumb iframe { width: 1920px; height: 1080px; border: none; pointer-events: none; transform-origin: top left; position: absolute; top: 0; left: 0; }
    .deck-info { padding: 12px 16px 16px; }
    .deck-title-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
    .deck-title { font-size: 14px; font-weight: 500; color: var(--h-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
    .edit-title-btn { border: none; background: none; cursor: pointer; font-size: 13px; opacity: 0; transition: opacity 0.15s; padding: 2px; color: var(--h-sub); }
    .deck-card:hover .edit-title-btn { opacity: 0.6; }
    .edit-title-btn:hover { opacity: 1 !important; }
    .deck-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--h-sub); flex-wrap: wrap; }
    .deck-badge { color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500; background: var(--h-badge-bg); }
    .deck-date { color: var(--h-date); }

    .card-overlay { position: absolute; top: 0; right: 0; display: flex; gap: 4px; padding: 6px; opacity: 0; transition: opacity 0.15s; z-index: 10; }
    .deck-card:hover .card-overlay { opacity: 1; }
    .overlay-btn { border: none; border-radius: 6px; padding: 4px 8px; font-size: 12px; cursor: pointer; backdrop-filter: blur(4px); transition: background 0.15s; }
    .copy-id-btn { background: rgba(0,0,0,0.6); color: #fff; }
    .copy-id-btn:hover { background: rgba(0,0,0,0.8); }
    .delete-btn { background: rgba(239,68,68,0.85); color: #fff; }
    .delete-btn:hover { background: rgba(220,38,38,0.95); }

    .edit-input { font-size: 14px; font-weight: 500; color: var(--h-text); border: 1px solid var(--h-edit-border); border-radius: 4px; padding: 2px 6px; width: 100%; outline: none; background: var(--h-input-bg); }

    .modal-bg { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--h-overlay-bg); z-index: 1000; align-items: center; justify-content: center; }
    .modal-bg.open { display: flex; }
    .modal { background: var(--h-modal-bg); border-radius: 12px; padding: 28px; width: 420px; max-width: 90vw; box-shadow: 0 16px 48px var(--h-modal-shadow); color: var(--h-text); }
    .modal h3 { font-size: 18px; margin-bottom: 16px; }
    .modal input { width: 100%; padding: 10px 14px; border: 1px solid var(--h-input-border); border-radius: 8px; font-size: 15px; outline: none; margin-bottom: 20px; background: var(--h-input-bg); color: var(--h-text); }
    .modal input:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,0.15); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .modal-actions button { padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; }
    .btn-cancel { background: var(--h-input-bg); color: var(--h-sub); }
    .btn-cancel:hover { background: var(--h-border); }
    .btn-primary { background: #6366f1; color: #fff; }
    .btn-primary:hover { background: #4f46e5; }

    .theme-toggle { padding: 6px 10px; border: 1px solid var(--h-border); border-radius: 6px; background: transparent; cursor: pointer; font-size: 16px; transition: all 0.15s; line-height: 1; }
    .theme-toggle:hover { border-color: #818cf8; }

    .empty-state { text-align: center; padding: 80px 20px; color: var(--h-sub); }
    .empty-state .icon { font-size: 72px; margin-bottom: 16px; }
    .empty-state h3 { font-size: 22px; color: var(--h-text); margin-bottom: 8px; font-weight: 400; }
    .empty-state p { font-size: 14px; max-width: 400px; margin: 0 auto; line-height: 1.6; }
    .empty-state code { background: var(--h-input-bg); padding: 2px 8px; border-radius: 4px; font-size: 13px; color: var(--h-text); }

    .section-templates { padding: 0 80px; margin-bottom: 32px; }
    .templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
    .template-card { border: 1px solid var(--h-card-border); border-radius: 12px; padding: 0; overflow: hidden; cursor: pointer; transition: all 0.15s; background: var(--h-input-bg); text-align: left; position: relative; }
    .template-card:hover { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 4px 16px var(--h-card-hover); }
    .template-card .t-thumb { width: 100%; aspect-ratio: 16/9; overflow: hidden; position: relative; background: var(--h-thumb-bg); }
    .template-card .t-thumb iframe { width: 1920px; height: 1080px; border: none; pointer-events: none; transform-origin: top left; position: absolute; top: 0; left: 0; }
    .template-card .t-body { padding: 12px 16px; }
    .template-card .t-name { font-size: 15px; font-weight: 600; color: var(--h-text); margin-bottom: 4px; }
    .template-card .t-desc { font-size: 12px; color: var(--h-sub); }
    .template-card .t-count { font-size: 11px; color: var(--h-date); margin-top: 6px; display: flex; align-items: center; gap: 6px; }
    .t-id-btn { padding: 2px 6px; border-radius: 4px; border: 1px solid var(--h-border); background: transparent; cursor: pointer; font-size: 11px; color: var(--h-sub); transition: all 0.15s; }
    .t-id-btn:hover { border-color: #6366f1; color: #6366f1; }
    .template-card .t-actions { display: flex; gap: 6px; margin-top: 10px; }
    .t-action-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid var(--h-border); background: transparent; cursor: pointer; font-size: 11px; color: var(--h-sub); transition: all 0.15s; }
    .t-action-btn:hover { border-color: #6366f1; color: #6366f1; }
    .t-action-btn.primary { background: #6366f1; border-color: #6366f1; color: #fff; }
    .t-action-btn.primary:hover { background: #4f46e5; }

    .preview-modal { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--h-overlay-bg); z-index: 1000; align-items: center; justify-content: center; }
    .preview-modal.open { display: flex; }
    .preview-container { background: var(--h-modal-bg); border-radius: 16px; padding: 24px; width: 90vw; max-width: 1000px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 16px 48px var(--h-modal-shadow); }
    .preview-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-shrink: 0; }
    .preview-header h3 { font-size: 18px; font-weight: 600; color: var(--h-text); }
    .preview-nav { display: flex; align-items: center; gap: 8px; }
    .preview-nav button { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--h-border); background: transparent; cursor: pointer; font-size: 16px; color: var(--h-text); transition: all 0.15s; }
    .preview-nav button:hover { border-color: #6366f1; }
    .preview-nav span { font-size: 13px; color: var(--h-sub); min-width: 50px; text-align: center; }
    .preview-slide-area { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .preview-slide-frame { width: 100%; aspect-ratio: 16/9; max-height: 60vh; border-radius: 8px; overflow: hidden; position: relative; background: #fff; flex-shrink: 0; }
    .preview-slide-frame iframe { width: 1920px; height: 1080px; border: none; pointer-events: none; transform-origin: top left; position: absolute; top: 0; left: 0; }
    .preview-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; flex-shrink: 0; }
    .preview-footer button { padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; }
    .pf-copy { background: var(--h-input-bg); color: var(--h-sub); }
    .pf-copy:hover { background: var(--h-border); }
    .pf-create { background: #6366f1; color: #fff; }
    .pf-create:hover { background: #4f46e5; }
    .pf-close { background: transparent; border: 1px solid var(--h-border); color: var(--h-sub); }

    .import-card { border-style: dashed; }
    .import-card:hover { border-color: #6366f1; }
    .import-card.dragover { border-color: #6366f1; background: rgba(99,102,241,0.05); }

    .section-my-templates { padding: 0 80px; margin-bottom: 32px; }
    .my-tmpl-card { border: 1px solid var(--h-card-border); border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.15s; background: var(--h-input-bg); position: relative; }
    .my-tmpl-card:hover { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 4px 16px var(--h-card-hover); }
    .my-tmpl-thumb { width: 100%; aspect-ratio: 16/9; overflow: hidden; position: relative; background: var(--h-thumb-bg); display: flex; align-items: center; justify-content: center; }
    .my-tmpl-thumb iframe { width: 1920px; height: 1080px; border: none; pointer-events: none; transform-origin: top left; position: absolute; top: 0; left: 0; }
    .my-tmpl-thumb .file-icon { font-size: 48px; opacity: 0.7; }
    .my-tmpl-thumb img { width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; }
    .my-tmpl-body { padding: 12px 16px; }
    .my-tmpl-name { font-size: 14px; font-weight: 600; color: var(--h-text); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .my-tmpl-meta { font-size: 12px; color: var(--h-sub); display: flex; align-items: center; gap: 8px; }
    .my-tmpl-meta .badge { padding: 1px 6px; border-radius: 4px; background: var(--h-border); font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .my-tmpl-meta .tmpl-id { font-family: monospace; color: #6366f1; cursor: pointer; }
    .my-tmpl-delete { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; border-radius: 6px; border: none; background: #ef4444; color: #fff; cursor: pointer; font-size: 14px; display: none; align-items: center; justify-content: center; z-index: 5; }
    .my-tmpl-delete:hover { background: #dc2626; }
    .my-tmpl-card:hover .my-tmpl-delete { display: flex; }

    @media (max-width: 768px) { .section-recent { padding-left: 20px; padding-right: 20px; } .section-my-templates { padding: 0 20px; } .search-bar { margin: 0 16px; } .section-mcp { padding: 0 20px !important; } }

    .mcp-guide-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--h-border); background: transparent; color: var(--h-sub); font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .mcp-guide-btn:hover { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,0.08); }
    .mcp-modal-bg { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 2000; align-items: center; justify-content: center; }
    .mcp-modal-bg.open { display: flex; }
    .mcp-modal { background: var(--h-input-bg); border: 1px solid var(--h-card-border); border-radius: 16px; padding: 32px; max-width: 640px; width: 90%; max-height: 85vh; overflow-y: auto; }
    .mcp-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
    .mcp-modal-header h2 { font-size: 20px; font-weight: 700; margin: 0; color: var(--h-text); }
    .mcp-close-btn { background: none; border: none; color: var(--h-sub); cursor: pointer; font-size: 20px; padding: 4px 8px; border-radius: 6px; transition: all 0.15s; }
    .mcp-close-btn:hover { background: var(--h-border); color: var(--h-text); }
    .mcp-sub { font-size: 13px; color: var(--h-sub); margin: 0 0 20px; }
    .mcp-modal h3 { font-size: 13px; font-weight: 600; color: #6366f1; margin: 0 0 10px; }
    .mcp-tabs { display: flex; gap: 0; margin-bottom: 0; flex-wrap: wrap; }
    .mcp-tab { padding: 5px 14px; background: transparent; border: 1px solid var(--h-card-border); border-bottom: none; border-radius: 6px 6px 0 0; color: var(--h-sub); cursor: pointer; font-size: 12px; margin-right: -1px; transition: all 0.15s; }
    .mcp-tab.active { background: var(--h-card-border); color: var(--h-text); font-weight: 600; }
    .mcp-code { background: var(--h-bg); border: 1px solid var(--h-card-border); border-top-left-radius: 0; border-radius: 0 8px 8px 8px; padding: 16px; font-size: 12px; font-family: monospace; white-space: pre; overflow-x: auto; line-height: 1.7; color: var(--h-text); position: relative; margin-bottom: 16px; }
    .mcp-copy-btn { position: absolute; top: 8px; right: 8px; background: var(--h-card-border); border: 1px solid var(--h-border); border-radius: 4px; color: var(--h-sub); cursor: pointer; padding: 3px 10px; font-size: 11px; transition: all 0.15s; }
    .mcp-copy-btn:hover { color: var(--h-text); border-color: #6366f1; }
    .mcp-tools { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 6px; margin-bottom: 20px; }
    .mcp-tool { font-size: 13px; color: var(--h-sub); display: flex; align-items: center; gap: 6px; }
    .mcp-tool code { color: #6366f1; font-size: 12px; font-family: monospace; }
    .mcp-note { font-size: 12px; color: var(--h-date); margin: 0 0 16px; }
    .mcp-usage { font-size: 13px; color: var(--h-sub); line-height: 1.8; margin: 0; }
  </style>
</head>
<body>
  <div class="top-header">
    <div class="logo">
      <div class="logo-icon">SC</div>
      <div class="logo-text"><span>Slide Harness</span> <span class="version-badge">v2</span></div>
    </div>
    <div class="search-bar">
      <input type="text" placeholder="\u691c\u7d22" id="searchInput" oninput="filterDecks()" />
    </div>
    <div class="header-actions">
      <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="\u30c6\u30fc\u30de\u5207\u66ff">\u2600\ufe0f</button>
      <button class="mcp-guide-btn" onclick="toggleMcpGuide()" title="MCP Connection Guide">?</button>
      <div class="status-badge"><div class="dot"></div>MCP\u63a5\u7d9a\u4e2d</div>
    </div>
  </div>

  <div class="section-templates" style="padding-top:28px">
    <div class="section-header">
      <h2>\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8</h2>
      <a href="/templates" style="padding:8px 20px;border:none;border-radius:24px;background:transparent;color:#6366f1;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;display:flex;align-items:center;gap:4px">\u3082\u3063\u3068\u898b\u308b \u2192</a>
    </div>
    <div class="templates-grid" id="templatesGrid">
      <div class="template-card import-card" id="importDrop" onclick="document.getElementById('importFile').click()">
        <div class="t-thumb" style="display:flex;align-items:center;justify-content:center;background:var(--h-input-bg)">
          <div style="text-align:center;color:var(--h-sub)">
            <div style="font-size:48px;margin-bottom:8px">\ud83d\udcc1</div>
            <div style="font-size:14px;font-weight:500">\u30d5\u30a1\u30a4\u30eb\u3092\u30a4\u30f3\u30dd\u30fc\u30c8</div>
          </div>
        </div>
        <div class="t-body">
          <div class="t-name">\u30a4\u30f3\u30dd\u30fc\u30c8</div>
          <div class="t-desc">.pptx, .pdf \u306b\u5bfe\u5fdc</div>
        </div>
        <input type="file" id="importFile" accept=".pptx,.pdf" style="display:none" onchange="handleImport(this.files[0])" />
      </div>
    </div>
  </div>

  <div class="section-my-templates" id="myTemplatesSection" style="display:none">
    <div class="section-header">
      <h2>\u30de\u30a4\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8</h2>
    </div>
    <div class="templates-grid" id="myTemplatesGrid"></div>
  </div>

  <div class="section-recent">
    <div class="section-header">
      <h2>\u6700\u8fd1\u4f7f\u7528\u3057\u305f\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3</h2>
      <button class="create-btn" onclick="openCreateModal()">+ \u65b0\u898f\u4f5c\u6210</button>
    </div>
    <div class="decks-grid" id="decksGrid"></div>
    <div class="empty-state" id="emptyState" style="display:none">
      <div class="icon">\ud83c\udfa8</div>
      <h3>\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3\u304c\u307e\u3060\u3042\u308a\u307e\u305b\u3093</h3>
      <p>\u300c+ \u65b0\u898f\u4f5c\u6210\u300d\u30dc\u30bf\u30f3\u307e\u305f\u306fClaude Code\u306eMCP\u30c4\u30fc\u30eb\u3067\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3\u3092\u4f5c\u6210\u3057\u307e\u3057\u3087\u3046\u3002</p>
    </div>
  </div>

  <div class="mcp-modal-bg" id="mcpGuideModal" onclick="if(event.target===this)toggleMcpGuide()">
    <div class="mcp-modal">
      <div class="mcp-modal-header">
        <h2>MCP Connection Guide</h2>
        <button class="mcp-close-btn" onclick="toggleMcpGuide()">\u2715</button>
      </div>
      <p class="mcp-sub">Slide Harness\u3092AI\u30b3\u30fc\u30c7\u30a3\u30f3\u30b0\u30c4\u30fc\u30eb\u304b\u3089\u64cd\u4f5c\u3059\u308b\u305f\u3081\u306eMCP\u8a2d\u5b9a</p>

      <h3>1. MCP\u8a2d\u5b9a\u3092\u8ffd\u52a0</h3>
      <div class="mcp-tabs" id="mcpTabs">
        <button class="mcp-tab active" onclick="switchMcpTab('claude')">Claude Code</button>
        <button class="mcp-tab" onclick="switchMcpTab('cursor')">Cursor</button>
        <button class="mcp-tab" onclick="switchMcpTab('codex')">Codex</button>
        <button class="mcp-tab" onclick="switchMcpTab('openclaw')">OpenClaw</button>
        <button class="mcp-tab" onclick="switchMcpTab('npx')">npx (publish\u5f8c)</button>
      </div>
      <div class="mcp-code" id="mcpCodeBlock">
        <button class="mcp-copy-btn" onclick="copyMcpConfig()">Copy</button>
        <span id="mcpCodeContent"></span>
      </div>
      <p class="mcp-note" id="mcpNote">\u203b args\u5185\u306e\u30d1\u30b9\u306fSlide Harness\u306e\u5b9f\u969b\u306e\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb\u30d1\u30b9\u306b\u7f6e\u304d\u63db\u3048\u3066\u304f\u3060\u3055\u3044</p>

      <h3>2. \u5229\u7528\u53ef\u80fd\u306a\u30c4\u30fc\u30eb</h3>
      <div class="mcp-tools">
        <div class="mcp-tool"><code>create_deck</code> - \u30c7\u30c3\u30ad\u4f5c\u6210</div>
        <div class="mcp-tool"><code>generate_deck</code> - AI\u69cb\u6210\u751f\u6210</div>
        <div class="mcp-tool"><code>add_slide</code> - \u30b9\u30e9\u30a4\u30c9\u8ffd\u52a0</div>
        <div class="mcp-tool"><code>update_slide</code> - \u30b9\u30e9\u30a4\u30c9\u66f4\u65b0</div>
        <div class="mcp-tool"><code>delete_slide</code> - \u30b9\u30e9\u30a4\u30c9\u524a\u9664</div>
        <div class="mcp-tool"><code>preview</code> - \u30d6\u30e9\u30a6\u30b6\u30d7\u30ec\u30d3\u30e5\u30fc</div>
        <div class="mcp-tool"><code>export_deck</code> - PDF/PPTX/HTML/PNG</div>
        <div class="mcp-tool"><code>search_images</code> - \u753b\u50cf\u691c\u7d22</div>
      </div>

      <h3>3. \u4f7f\u3044\u65b9</h3>
      <p class="mcp-usage" id="mcpUsage">MCP\u63a5\u7d9a\u5f8c\u3001AI\u306b\u300c\u30d7\u30ec\u30bc\u30f3\u3092\u4f5c\u6210\u3057\u3066\u300d\u3068\u4f1d\u3048\u308b\u3060\u3051\u3002\u30c4\u30fc\u30eb\u304c\u81ea\u52d5\u7684\u306b\u547c\u3073\u51fa\u3055\u308c\u3001\u30b9\u30e9\u30a4\u30c9\u304c\u751f\u6210\u3055\u308c\u307e\u3059\u3002</p>
    </div>
  </div>

  <div class="preview-modal" id="templatePreviewModal" onclick="if(event.target===this)closeTemplatePreview()">
    <div class="preview-container">
      <div class="preview-header">
        <div style="display:flex;align-items:center;gap:12px">
          <h3 id="previewTemplateName"></h3>
        </div>
        <div class="preview-nav">
          <button onclick="prevPreviewSlide()">\u25c0</button>
          <span id="previewSlideCounter"></span>
          <button onclick="nextPreviewSlide()">\u25b6</button>
          <button onclick="closeTemplatePreview()" style="margin-left:8px">\u2715</button>
        </div>
      </div>
      <div class="preview-slide-area">
        <div class="preview-slide-frame" id="previewSlideFrame">
          <iframe id="previewSlideIframe" src="about:blank"></iframe>
        </div>
      </div>
      <div class="preview-footer">
        <button class="pf-copy" onclick="closeTemplatePreview()">\u9589\u3058\u308b</button>
        <button class="pf-copy" onclick="copyPreviewTemplateId()" id="previewCopyBtn">\ud83d\udccb ID\u3092\u30b3\u30d4\u30fc</button>
      </div>
    </div>
  </div>

  <div class="modal-bg" id="createModal">
    <div class="modal">
      <h3>\u65b0\u898f\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3</h3>
      <input type="text" id="newDeckTitle" placeholder="\u30bf\u30a4\u30c8\u30eb\u3092\u5165\u529b" autofocus />
      <div class="modal-actions">
        <button class="btn-cancel" onclick="closeCreateModal()">\u30ad\u30e3\u30f3\u30bb\u30eb</button>
        <button class="btn-primary" onclick="createNewDeck()">\u4f5c\u6210</button>
      </div>
    </div>
  </div>


  <script>
    // MCP Guide tabs
    function mcpConfig(cmd, args) {
      return JSON.stringify({ mcpServers: { slideharness: { command: cmd, args: args } } }, null, 2);
    }
    var mcpConfigs = {
      claude: mcpConfig('node', ['path/to/slideharness/packages/mcp-server/dist/bundle.js']),
      cursor: mcpConfig('node', ['path/to/slideharness/packages/mcp-server/dist/bundle.js', '--no-preview']),
      codex: mcpConfig('node', ['path/to/slideharness/packages/mcp-server/dist/bundle.js', '--no-preview']),
      openclaw: mcpConfig('node', ['path/to/slideharness/packages/mcp-server/dist/bundle.js', '--no-preview']),
      npx: mcpConfig('npx', ['slideharness@latest', '--no-preview'])
    };
    var mcpUsages = {
      claude: 'MCP\u63a5\u7d9a\u5f8c\u3001AI\u306b\u300c\u30d7\u30ec\u30bc\u30f3\u3092\u4f5c\u6210\u3057\u3066\u300d\u3068\u4f1d\u3048\u308b\u3060\u3051\u3002\u30d7\u30ec\u30d3\u30e5\u30fc\u30b5\u30fc\u30d0\u30fc\u304c\u6709\u52b9\u306a\u306e\u3067\u3001\u30d6\u30e9\u30a6\u30b6\u3067\u30ea\u30a2\u30eb\u30bf\u30a4\u30e0\u306b\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002',
      npx: 'npm publish\u5f8c\u306f npx slideharness@latest \u3067\u3069\u306e\u74b0\u5883\u304b\u3089\u3067\u3082\u5229\u7528\u53ef\u80fd\u3067\u3059\u3002',
      _default: 'MCP\u63a5\u7d9a\u5f8c\u3001AI\u306b\u300c\u30d7\u30ec\u30bc\u30f3\u3092\u4f5c\u6210\u3057\u3066\u300d\u3068\u4f1d\u3048\u308b\u3060\u3051\u3002--no-preview\u30e2\u30fc\u30c9\u306e\u305f\u3081\u3001export_deck\u3067\u30d5\u30a1\u30a4\u30eb\u51fa\u529b\u3057\u3066\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002'
    };
    var currentMcpTab = 'claude';
    function switchMcpTab(id) {
      currentMcpTab = id;
      document.querySelectorAll('.mcp-tab').forEach(function(t) { t.classList.remove('active'); });
      if (event && event.target) event.target.classList.add('active');
      else document.querySelector('.mcp-tab').classList.add('active');
      document.getElementById('mcpCodeContent').textContent = mcpConfigs[id];
      document.getElementById('mcpNote').style.display = id === 'npx' ? 'none' : '';
      document.getElementById('mcpUsage').textContent = mcpUsages[id] || mcpUsages._default;
    }
    function copyMcpConfig() {
      navigator.clipboard.writeText(mcpConfigs[currentMcpTab]);
      var btn = document.querySelector('.mcp-copy-btn');
      btn.textContent = 'Copied!'; btn.style.color = '#4ade80';
      setTimeout(function() { btn.textContent = 'Copy'; btn.style.color = ''; }, 2000);
    }
    function toggleMcpGuide() {
      var modal = document.getElementById('mcpGuideModal');
      modal.classList.toggle('open');
      if (modal.classList.contains('open')) switchMcpTab('claude');
    }
    document.addEventListener('DOMContentLoaded', function() { switchMcpTab('claude'); });

    const allDecks = ${decksJson};

    function formatDate(iso) {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return '\u305f\u3063\u305f\u4eca';
      if (diffMins < 60) return diffMins + '\u5206\u524d';
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return diffHours + '\u6642\u9593\u524d';
      return d.getFullYear() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0');
    }

    function renderDecks() {
      const grid = document.getElementById('decksGrid');
      const empty = document.getElementById('emptyState');
      if (allDecks.length === 0) { grid.style.display = 'none'; empty.style.display = ''; return; }
      empty.style.display = 'none'; grid.style.display = '';
      grid.innerHTML = allDecks.map(d => '<a href="/preview/' + d.id + '" class="deck-card" data-id="' + d.id + '">'
        + '<div class="card-overlay">'
        + '<button class="overlay-btn copy-id-btn" onclick="copyId(event,\\'' + d.id + '\\')" title="ID\u3092\u30b3\u30d4\u30fc">\ud83d\udccb ' + d.id + '</button>'
        + '<button class="overlay-btn delete-btn" onclick="deleteDeck(event,\\'' + d.id + '\\')" title="\u524a\u9664">\ud83d\uddd1</button>'
        + '</div>'
        + '<div class="deck-thumb"><iframe src="/api/decks/' + d.id + '/thumbnail" loading="lazy" scrolling="no"></iframe></div>'
        + '<div class="deck-info">'
        + '<div class="deck-title-row">'
        + '<span class="deck-title">' + escHtml(d.title) + '</span>'
        + '<button class="edit-title-btn" onclick="startEditTitle(event,\\'' + d.id + '\\')" title="\u540d\u524d\u3092\u5909\u66f4">\u270f\ufe0f</button>'
        + '</div>'
        + '<div class="deck-meta"><span class="deck-badge">' + d.slides + ' slides</span><span class="deck-date">' + formatDate(d.updatedAt) + '</span></div>'
        + '</div></a>').join('');
      requestAnimationFrame(scaleThumbs);
    }

    function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    function filterDecks() {
      const q = document.getElementById('searchInput').value.toLowerCase();
      document.querySelectorAll('.deck-card').forEach(card => {
        const title = card.querySelector('.deck-title')?.textContent?.toLowerCase() || '';
        card.style.display = title.includes(q) ? '' : 'none';
      });
    }

    // Create modal
    function openCreateModal() {
      document.getElementById('createModal').classList.add('open');
      const input = document.getElementById('newDeckTitle');
      input.value = ''; input.focus();
    }
    function closeCreateModal() { document.getElementById('createModal').classList.remove('open'); }
    function createNewDeck() {
      const title = document.getElementById('newDeckTitle').value.trim() || 'Untitled';
      fetch('/api/decks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) })
        .then(r => r.json())
        .then(d => { window.location.href = '/preview/' + d.id; });
    }
    document.getElementById('newDeckTitle').addEventListener('keydown', e => { if (e.key === 'Enter') createNewDeck(); if (e.key === 'Escape') closeCreateModal(); });
    document.getElementById('createModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeCreateModal(); });

    // Template creation
    const templateSlides = {};

    function wrapSlideHtml(body) {
      return '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=1920,height=1080"><script src="https://cdn.tailwindcss.com"><\\/script><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet"><style>*{font-family:\\'Noto Sans JP\\',sans-serif}</style></head><body class="w-[1920px] h-[1080px] overflow-hidden">' + body + '</body></html>';
    }

    const templateNames = {};
    const templateDescs = {};
    let currentPreviewTemplate = '';
    let previewSlideIndex = 0;
    let previewBlobUrls = [];

    // Render template cards - click to open preview
    (function renderTemplateCards() {
      const grid = document.getElementById('templatesGrid');
      if (!grid) return;
      ['business', 'tech', 'pitch'].forEach(function(id) {
        const slides = templateSlides[id];
        if (!slides || !slides.length) return;
        const firstHtml = wrapSlideHtml(slides[0].html);
        const blob = new Blob([firstHtml], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        const card = document.createElement('div');
        card.className = 'template-card';
        card.onclick = function() { openTemplatePreview(id); };
        card.innerHTML = '<div class="t-thumb"><iframe src="' + blobUrl + '" scrolling="no" loading="lazy"></iframe></div>' +
          '<div class="t-body"><div class="t-name">' + (templateNames[id] || id) + '</div>' +
          '<div class="t-desc">' + (templateDescs[id] || '') + '</div>' +
          '<div class="t-count">' + slides.length + '\u679a \u30fb ID: <code style="font-family:monospace;color:#6366f1">' + id + '</code></div></div>';
        grid.appendChild(card);
      });
      requestAnimationFrame(function() {
        document.querySelectorAll('.template-card .t-thumb').forEach(function(w) {
          var iframe = w.querySelector('iframe');
          if (iframe) iframe.style.transform = 'scale(' + (w.clientWidth / 1920) + ')';
        });
      });
      window.addEventListener('resize', function() {
        document.querySelectorAll('.template-card .t-thumb').forEach(function(w) {
          var iframe = w.querySelector('iframe');
          if (iframe) iframe.style.transform = 'scale(' + (w.clientWidth / 1920) + ')';
        });
      });
    })();

    function openTemplatePreview(templateId) {
      const slides = templateSlides[templateId];
      if (!slides) return;
      currentPreviewTemplate = templateId;
      previewSlideIndex = 0;
      document.getElementById('previewTemplateName').textContent = templateNames[templateId] || templateId;
      document.getElementById('templatePreviewModal').classList.add('open');
      previewBlobUrls.forEach(u => URL.revokeObjectURL(u));
      previewBlobUrls = slides.map(s => {
        const html = wrapSlideHtml(s.html);
        const blob = new Blob([html], { type: 'text/html' });
        return URL.createObjectURL(blob);
      });
      showPreviewSlide();
    }

    function showPreviewSlide() {
      const iframe = document.getElementById('previewSlideIframe');
      const slides = templateSlides[currentPreviewTemplate];
      if (!slides) return;
      iframe.src = previewBlobUrls[previewSlideIndex];
      document.getElementById('previewSlideCounter').textContent = (previewSlideIndex + 1) + ' / ' + slides.length;
      requestAnimationFrame(() => {
        const frame = document.getElementById('previewSlideFrame');
        if (frame) iframe.style.transform = 'scale(' + (frame.clientWidth / 1920) + ')';
      });
    }

    function prevPreviewSlide() {
      const slides = templateSlides[currentPreviewTemplate];
      if (!slides) return;
      previewSlideIndex = (previewSlideIndex - 1 + slides.length) % slides.length;
      showPreviewSlide();
    }

    function nextPreviewSlide() {
      const slides = templateSlides[currentPreviewTemplate];
      if (!slides) return;
      previewSlideIndex = (previewSlideIndex + 1) % slides.length;
      showPreviewSlide();
    }

    function closeTemplatePreview() {
      document.getElementById('templatePreviewModal').classList.remove('open');
      document.getElementById('previewSlideIframe').src = 'about:blank';
      previewBlobUrls.forEach(u => URL.revokeObjectURL(u));
      previewBlobUrls = [];
    }

    function copyPreviewTemplateId() {
      navigator.clipboard.writeText(currentPreviewTemplate).then(() => {
        const btn = document.getElementById('previewCopyBtn');
        const orig = btn.textContent;
        btn.textContent = '\u2713 \u30b3\u30d4\u30fc\u6e08\u307f';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    }

    document.addEventListener('keydown', e => {
      if (!document.getElementById('templatePreviewModal').classList.contains('open')) return;
      if (e.key === 'ArrowLeft') prevPreviewSlide();
      else if (e.key === 'ArrowRight') nextPreviewSlide();
      else if (e.key === 'Escape') closeTemplatePreview();
    });

    // File import
    function handleImport(file) {
      if (!file) return;
      const nameEl = document.querySelector('#importDrop .t-name');
      if (nameEl) nameEl.textContent = '\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u4e2d...';
      const reader = new FileReader();
      reader.onload = function(e) {
        fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) },
          body: e.target.result,
        })
        .then(r => r.ok ? r.json() : r.json().then(err => { throw new Error(err.error); }))
        .then(data => {
          try { navigator.clipboard.writeText(data.templateId); } catch(e) {}
          if (nameEl) nameEl.textContent = '\u2713 \u5b8c\u4e86';
          setTimeout(() => { if (nameEl) nameEl.textContent = '\u30a4\u30f3\u30dd\u30fc\u30c8'; }, 2000);
          loadMyTemplates();
        })
        .catch(err => {
          alert('\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u306b\u5931\u6557\u3057\u307e\u3057\u305f: ' + err.message);
          if (nameEl) nameEl.textContent = '\u30a4\u30f3\u30dd\u30fc\u30c8';
        });
      };
      reader.readAsArrayBuffer(file);
    }

    // Drag and drop for import
    const drop = document.getElementById('importDrop');
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('dragover'); });
    drop.addEventListener('dragleave', () => { drop.classList.remove('dragover'); });
    drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('dragover'); if (e.dataTransfer.files[0]) handleImport(e.dataTransfer.files[0]); });

    // My templates
    function loadMyTemplates() {
      fetch('/api/templates').then(r => r.json()).then(templates => {
        const section = document.getElementById('myTemplatesSection');
        const grid = document.getElementById('myTemplatesGrid');
        if (!templates || templates.length === 0) { section.style.display = 'none'; return; }
        section.style.display = '';
        templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        grid.innerHTML = templates.map(t => {
          const ext = (t.filename || '').split('.').pop().toLowerCase();
          const icon = ext === 'pdf' ? '\ud83d\udcc4' : '\ud83d\udcca';
          const badge = ext.toUpperCase();
          return '<div class="my-tmpl-card" onclick="copyMyTemplateId(\\'' + t.id + '\\', this)">'
            + '<button class="my-tmpl-delete" onclick="event.stopPropagation();deleteMyTemplate(\\'' + t.id + '\\')" title="\u524a\u9664">\u2715</button>'
            + '<div class="my-tmpl-thumb"><img src="/api/templates/' + t.id + '/thumbnail" onerror="this.style.display=\\'none\\';this.nextElementSibling.style.display=\\'\\'" /><span class="file-icon" style="display:none">' + icon + '</span></div>'
            + '<div class="my-tmpl-body">'
            + '<div class="my-tmpl-name">' + escHtml(t.name) + '</div>'
            + '<div class="my-tmpl-meta"><span class="badge">' + badge + '</span><span class="tmpl-id">' + t.id + '</span></div>'
            + '</div></div>';
        }).join('');
      }).catch(() => {});
    }

    function copyMyTemplateId(id, card) {
      try { navigator.clipboard.writeText(id); } catch(e) {}
      const nameEl = card.querySelector('.my-tmpl-name');
      if (nameEl) {
        const orig = nameEl.textContent;
        nameEl.textContent = '\u2713 ID\u30b3\u30d4\u30fc\u6e08\u307f';
        setTimeout(() => { nameEl.textContent = orig; }, 1500);
      }
    }

    function deleteMyTemplate(id) {
      if (!confirm('\u3053\u306e\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f')) return;
      fetch('/api/templates/' + id, { method: 'DELETE' }).then(() => loadMyTemplates());
    }

    loadMyTemplates();

    // Copy deck ID
    function copyId(e, id) {
      e.preventDefault(); e.stopPropagation();
      navigator.clipboard.writeText(id).then(() => {
        const btn = e.currentTarget;
        btn.textContent = '\u2713 \u30b3\u30d4\u30fc\u6e08\u307f';
        setTimeout(() => { btn.textContent = '\ud83d\udccb ' + id; }, 1500);
      });
    }

    // Delete deck
    function deleteDeck(e, id) {
      e.preventDefault(); e.stopPropagation();
      if (!confirm('\u3053\u306e\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f')) return;
      fetch('/api/decks/' + id, { method: 'DELETE' })
        .then(() => { const idx = allDecks.findIndex(d => d.id === id); if (idx >= 0) allDecks.splice(idx, 1); renderDecks(); });
    }

    // Inline title edit
    function startEditTitle(e, id) {
      e.preventDefault(); e.stopPropagation();
      const card = e.currentTarget.closest('.deck-card');
      const row = card.querySelector('.deck-title-row');
      const titleEl = row.querySelector('.deck-title');
      const oldTitle = titleEl.textContent;
      row.innerHTML = '<input class="edit-input" value="' + escHtml(oldTitle) + '" />';
      const input = row.querySelector('input');
      input.focus(); input.select();
      function save() {
        const newTitle = input.value.trim() || oldTitle;
        if (newTitle !== oldTitle) {
          fetch('/api/decks/' + id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }) })
            .then(() => { const d = allDecks.find(d => d.id === id); if (d) d.title = newTitle; renderDecks(); });
        } else { renderDecks(); }
      }
      input.addEventListener('blur', save);
      input.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); } if (ev.key === 'Escape') { input.value = oldTitle; input.blur(); } });
      input.addEventListener('click', ev => { ev.preventDefault(); ev.stopPropagation(); });
    }

    let ws;
    function connectWs() {
      ws = new WebSocket('ws://' + location.host);
      ws.onmessage = (e) => { try { const m = JSON.parse(e.data); if (m.type === 'deck-updated') location.reload(); } catch {} };
      ws.onclose = () => setTimeout(connectWs, 3000);
    }
    connectWs();

    function scaleThumbs() {
      document.querySelectorAll('.deck-thumb').forEach(thumb => {
        const iframe = thumb.querySelector('iframe');
        if (!iframe) return;
        const scale = thumb.clientWidth / 1920;
        iframe.style.transform = 'scale(' + scale + ')';
      });
    }
    window.addEventListener('resize', scaleThumbs);

    // Theme
    function toggleTheme() {
      const html = document.documentElement;
      const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.dataset.theme = next;
      document.getElementById('themeToggle').textContent = next === 'dark' ? '\ud83c\udf19' : '\u2600\ufe0f';
      localStorage.setItem('slideharness-theme', next);
    }
    (function initTheme() {
      const saved = localStorage.getItem('slideharness-theme');
      if (saved) {
        document.documentElement.dataset.theme = saved;
        document.getElementById('themeToggle').textContent = saved === 'dark' ? '\ud83c\udf19' : '\u2600\ufe0f';
      }
    })();

    renderDecks();
    window.addEventListener('load', scaleThumbs);
  </script>
</body>
</html>`);
    });

    // ===== EDITOR STATIC FILES =====
    const editorDist = resolveEditorDist();
    if (editorDist && existsSync(editorDist)) {
      // Serve editor-inject.js at root path (loaded inside slide iframes)
      this.app.get('/editor-inject.js', (_req, res) => {
        const injectPath = join(editorDist, 'editor-inject.js');
        if (existsSync(injectPath)) {
          res.sendFile(injectPath);
        } else {
          res.status(404).send('Not found');
        }
      });
      this.app.use('/editor', express.static(editorDist));
      // SPA fallback: any /editor/* that didn't match a static file → index.html
      this.app.get('/editor/*', (_req, res) => {
        res.sendFile(join(editorDist, 'index.html'));
      });
    }
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      ws.on('close', () => this.clients.delete(ws));
      ws.on('error', () => this.clients.delete(ws));
    });
  }

  notifyDeckUpdate(deckId: string): void {
    const message = JSON.stringify({ type: 'deck-updated', deckId });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  async start(): Promise<number> {
    if (this.started) return this.port;
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, () => {
        this.started = true;
        resolve(this.port);
      });
      this.server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          this.port++;
          this.server.listen(this.port, () => {
            this.started = true;
            resolve(this.port);
          });
        } else {
          reject(err);
        }
      });
    });
  }

  isStarted(): boolean { return this.started; }
  getPort(): number { return this.port; }
}
