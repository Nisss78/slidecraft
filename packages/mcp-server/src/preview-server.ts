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
import { generateBlankSlideHtml, resolveCanvasSize, CANVAS_PRESETS, BUILT_IN_TEMPLATES } from '@slideharness/renderer';
import { randomBytes } from 'node:crypto';
import JSZip from 'jszip';
import { basename } from 'node:path';

const require = createRequire(import.meta.url);

/** Inject word-break CSS and border reset into slide HTML */
function injectWordBreakCss(html: string): string {
  const fixes: string[] = [];
  if (!html.includes('word-break:keep-all') && !html.includes('word-break: keep-all')) {
    fixes.push('body{word-break:keep-all;overflow-wrap:break-word}');
  }
  // Reset Tailwind Preflight borders that can cause stray lines
  if (!html.includes('border: 0 solid') && !html.includes('border:0 solid')) {
    fixes.push('*,*::before,*::after{border:0 solid transparent}');
  }
  if (fixes.length === 0) return html;
  return html.replace('</head>', `<style>${fixes.join('')}</style>\n</head>`);
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
        const { title, canvasSize } = req.body;
        const metadata: Record<string, unknown> = {};
        if (canvasSize) metadata.canvasSize = canvasSize;
        const deck = createDeck({ title: title || 'Untitled', metadata: Object.keys(metadata).length > 0 ? metadata : undefined });
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
      let updated = updateDeckMeta(deck, req.body);
      // Merge metadata fields (e.g. favorite, canvasSize)
      if (req.body.metadata && typeof req.body.metadata === 'object') {
        updated = { ...updated, metadata: { ...(updated.metadata || {}), ...req.body.metadata } };
      }
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

    // ===== BUILT-IN TEMPLATE APIs =====

    this.app.get('/api/built-in-templates', (_req, res) => {
      const format = _req.query.format as string | undefined;
      const category = _req.query.category as string | undefined;
      const search = _req.query.search as string | undefined;

      let results = BUILT_IN_TEMPLATES;
      if (format) results = results.filter(t => t.format === format);
      if (category) results = results.filter(t => t.category === category);
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(t =>
          t.id.toLowerCase().includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.nameJa.includes(q) ||
          t.descriptionJa.includes(q) ||
          t.tags.some(tag => tag.toLowerCase().includes(q)),
        );
      }

      res.json(results.map(t => ({
        id: t.id,
        name: t.name,
        nameJa: t.nameJa,
        descriptionJa: t.descriptionJa,
        format: t.format,
        suggestedStylePreset: t.suggestedStylePreset,
        slideCount: t.slideCount,
        category: t.category,
        icon: t.icon,
        tags: t.tags,
      })));
    });

    this.app.get('/api/built-in-templates/:id', (req, res) => {
      const template = BUILT_IN_TEMPLATES.find(t => t.id === req.params.id);
      if (!template) { res.status(404).json({ error: 'Template not found' }); return; }
      res.json(template);
    });

    // ===== GLOBAL ASSETS API =====

    this.app.get('/api/assets', async (req, res) => {
      const category = req.query.category as string | undefined;
      const validCategories = ['logo', 'photo', 'icon'];
      const cat = category && validCategories.includes(category) ? category as 'logo' | 'photo' | 'icon' : undefined;
      const assets = await this.storage.listAssets(cat);
      res.json(assets.map(a => ({ ...a, url: `/api/assets/${a.id}/file` })));
    });

    this.app.post('/api/assets', express.raw({ type: () => true, limit: '10mb' }), async (req, res) => {
      const rawName = req.headers['x-filename'];
      const originalName = rawName ? decodeURIComponent(String(rawName)) : 'upload.png';
      const ext = originalName.split('.').pop()?.toLowerCase() || '';
      const allowedExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico']);
      if (!allowedExts.has(ext)) {
        res.status(400).json({ error: 'Unsupported file type. Allowed: ' + [...allowedExts].join(', ') });
        return;
      }
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon',
      };
      const mimeType = mimeMap[ext] || 'application/octet-stream';
      const rawCategory = req.headers['x-category'] as string | undefined;
      const validCategories = ['logo', 'photo', 'icon'];
      const category = rawCategory && validCategories.includes(rawCategory) ? rawCategory as 'logo' | 'photo' | 'icon' : 'photo';
      const asset = await this.storage.saveAsset(Buffer.from(req.body as Buffer), originalName, mimeType, category);
      res.json({ ...asset, url: `/api/assets/${asset.id}/file` });
    });

    this.app.get('/api/assets/:id/file', async (req, res) => {
      const filePath = this.storage.getAssetPath(req.params.id);
      if (!filePath || !existsSync(filePath)) {
        res.status(404).json({ error: 'Asset not found' });
        return;
      }
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      const contentTypes: Record<string, string> = {
        jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon',
      };
      res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(filePath);
    });

    this.app.delete('/api/assets/:id', async (req, res) => {
      const deleted = await this.storage.deleteAsset(req.params.id);
      if (!deleted) { res.status(404).json({ error: 'Asset not found' }); return; }
      res.json({ success: true });
    });

    // ===== COLORS API =====

    this.app.get('/api/colors', async (_req, res) => {
      const colors = await this.storage.listColors();
      res.json(colors);
    });

    this.app.post('/api/colors', express.json(), async (req, res) => {
      const { hex, name } = req.body as { hex?: string; name?: string };
      if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) {
        res.status(400).json({ error: 'Invalid hex color. Must be #RRGGBB format.' });
        return;
      }
      const color = await this.storage.saveColor(hex, name);
      res.json(color);
    });

    this.app.delete('/api/colors/:id', async (req, res) => {
      const deleted = await this.storage.deleteColor(req.params.id);
      if (!deleted) { res.status(404).json({ error: 'Color not found' }); return; }
      res.json({ success: true });
    });

    // ===== FONTS API =====

    this.app.get('/api/fonts', async (_req, res) => {
      const fonts = await this.storage.listFonts();
      res.json(fonts);
    });

    this.app.post('/api/fonts', express.raw({ type: () => true, limit: '20mb' }), async (req, res) => {
      const rawName = req.headers['x-filename'];
      const originalName = rawName ? decodeURIComponent(String(rawName)) : 'font.ttf';
      const ext = originalName.split('.').pop()?.toLowerCase() || '';
      const allowedExts = new Set(['ttf', 'otf', 'woff', 'woff2']);
      if (!allowedExts.has(ext)) {
        res.status(400).json({ error: 'Unsupported font type. Allowed: ' + [...allowedExts].join(', ') });
        return;
      }
      const mimeMap: Record<string, string> = {
        ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2',
      };
      const mimeType = mimeMap[ext] || 'application/octet-stream';
      const font = await this.storage.saveFont(Buffer.from(req.body as Buffer), originalName, mimeType);
      res.json(font);
    });

    this.app.post('/api/fonts/google', express.json(), async (req, res) => {
      const { family } = req.body as { family?: string };
      if (!family || typeof family !== 'string') {
        res.status(400).json({ error: 'family is required' });
        return;
      }
      const font = await this.storage.saveGoogleFont(family);
      res.json(font);
    });

    this.app.get('/api/fonts/:id/file', async (req, res) => {
      const filePath = this.storage.getFontPath(req.params.id);
      if (!filePath || !existsSync(filePath)) {
        res.status(404).json({ error: 'Font not found' });
        return;
      }
      const ext = filePath.split('.').pop()?.toLowerCase() || '';
      const contentTypes: Record<string, string> = {
        ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2',
      };
      res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(filePath);
    });

    this.app.delete('/api/fonts/:id', async (req, res) => {
      const deleted = await this.storage.deleteFont(req.params.id);
      if (!deleted) { res.status(404).json({ error: 'Font not found' }); return; }
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
      const deckCanvasSize = resolveCanvasSize(deck.metadata as Record<string, unknown> | undefined);
      const result = await exportToPdf(deck, slideHtmls, outPath, '16:9', deckCanvasSize);
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
      const pptxCanvasSize = resolveCanvasSize(deck.metadata as Record<string, unknown> | undefined);
      const result = await exportToPptx(deck, slideHtmls, outPath, '16:9', pptxCanvasSize);
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

      const spDims = resolveCanvasSize(deck.metadata as Record<string, unknown> | undefined);
      const spW = spDims.width;
      const spH = spDims.height;
      const spPaddingTop = ((spH / spW) * 100).toFixed(2);

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
    .frame-wrap { position: relative; width: 100%; padding-top: ${spPaddingTop}%; overflow: hidden; }
    .frame-wrap iframe { position: absolute; top: 0; left: 0; width: ${spW}px; height: ${spH}px; transform: scale(0.23); transform-origin: top left; border: none; pointer-events: none; }
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

      const canvasDims = resolveCanvasSize(deck.metadata as Record<string, unknown> | undefined);
      const cW = canvasDims.width;
      const cH = canvasDims.height;

      const slidesMetaJson = JSON.stringify(
        deck.slides.map((s, i) => ({ index: i, id: s.id, title: s.title || `Slide ${i + 1}` })),
      );

      res.type('html').send(`<!DOCTYPE html>
<html lang="ja" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(deck.title)} - Slide Harness</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
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

    /* Left icon rail */
    .editor-rail { width: 60px; flex-shrink: 0; background: var(--sidebar-bg); border-right: 1px solid var(--sidebar-border); display: flex; flex-direction: column; align-items: center; padding: 8px 0; gap: 2px; z-index: 50; }
    .rail-tab { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 4px; border: none; background: none; cursor: pointer; color: var(--meta-text); font-size: 10px; width: 56px; border-radius: 8px; transition: all 0.15s; }
    .rail-tab:hover { background: rgba(99,102,241,0.08); color: var(--text); }
    .rail-tab.active { background: rgba(99,102,241,0.12); color: var(--accent); }
    .rail-tab i { font-size: 20px; }

    /* Expandable side panel */
    .editor-panel { width: 0; overflow: hidden; flex-shrink: 0; background: var(--sidebar-bg); border-right: 1px solid var(--sidebar-border); transition: width 0.25s ease; display: flex; flex-direction: column; }
    .editor-panel.open { width: 280px; }
    .ep-header { padding: 14px 16px; border-bottom: 1px solid var(--sidebar-border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
    .ep-header h3 { font-size: 14px; font-weight: 600; color: var(--text); white-space: nowrap; }
    .ep-close { border: none; background: none; cursor: pointer; color: var(--meta-text); font-size: 16px; padding: 4px; border-radius: 4px; transition: all 0.15s; }
    .ep-close:hover { background: rgba(99,102,241,0.1); color: var(--text); }
    .ep-body { flex: 1; overflow-y: auto; padding: 12px; display: none; }
    .ep-body.active { display: block; }
    .ep-empty { text-align: center; padding: 32px 16px; color: var(--meta-text); font-size: 13px; }
    .ep-empty i { font-size: 32px; display: block; margin-bottom: 12px; opacity: 0.4; }
    .ep-project-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; cursor: pointer; transition: all 0.15s; text-decoration: none; color: var(--text); }
    .ep-project-item:hover { background: rgba(99,102,241,0.08); }
    .ep-project-item .proj-icon { width: 40px; height: 40px; border-radius: 6px; background: var(--thumb-bg); display: flex; align-items: center; justify-content: center; font-size: 16px; color: var(--meta-text); flex-shrink: 0; overflow: hidden; }
    .ep-project-item .proj-icon img { width: 100%; height: 100%; object-fit: cover; }
    .ep-project-item .proj-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ep-project-item .proj-meta { font-size: 11px; color: var(--meta-text); }

    /* Canvas area + filmstrip */
    .canvas-wrap { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .slide-area { flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px; overflow: hidden; position: relative; }
    .slide-frame { width: 100%; max-width: 960px; aspect-ratio: ${cW}/${cH}; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px var(--slide-shadow); background: #fff; position: relative; }
    .slide-frame iframe { width: ${cW}px; height: ${cH}px; border: none; transform-origin: top left; position: absolute; top: 0; left: 0; }

    /* Bottom filmstrip */
    .filmstrip-bar { flex-shrink: 0; border-top: 1px solid var(--sidebar-border); background: var(--sidebar-bg); display: flex; align-items: center; padding: 8px 12px; gap: 8px; }
    .filmstrip { display: flex; gap: 8px; overflow-x: auto; flex: 1; padding: 4px 0; -webkit-overflow-scrolling: touch; }
    .filmstrip::-webkit-scrollbar { height: 4px; }
    .filmstrip::-webkit-scrollbar-thumb { background: var(--sidebar-border); border-radius: 2px; }
    .film-item { flex-shrink: 0; cursor: pointer; border-radius: 6px; overflow: hidden; border: 2px solid transparent; transition: all 0.15s; position: relative; width: 120px; }
    .film-item:hover { border-color: rgba(99,102,241,0.3); }
    .film-item.selected { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(99,102,241,0.2); }
    .film-item.dragging { opacity: 0.4; }
    .film-item.drag-over { border-left: 3px solid var(--accent); }
    .film-num { position: absolute; bottom: 2px; left: 4px; font-size: 9px; color: #fff; background: rgba(0,0,0,0.6); padding: 1px 5px; border-radius: 3px; z-index: 2; }
    .film-iframe-wrap { width: 100%; aspect-ratio: ${cW}/${cH}; overflow: hidden; position: relative; background: var(--thumb-bg); }
    .film-iframe-wrap iframe { width: ${cW}px; height: ${cH}px; border: none; pointer-events: none; transform-origin: top left; position: absolute; top: 0; left: 0; }
    .filmstrip-add { flex-shrink: 0; width: 44px; height: 44px; border: 1px dashed var(--btn-border); border-radius: 8px; background: none; cursor: pointer; color: var(--meta-text); font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .filmstrip-add:hover { border-color: var(--accent); color: var(--accent); background: rgba(99,102,241,0.06); }
    .filmstrip-counter { font-size: 12px; color: var(--meta-text); white-space: nowrap; flex-shrink: 0; }

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
    .slideshow iframe { border: none; position: absolute; width: ${cW}px; height: ${cH}px; transform-origin: top left; }
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
      <a href="/" class="back-link" title="\u30db\u30fc\u30e0"><i class="fa-solid fa-house" style="font-size:16px"></i></a>
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
        <button class="hdr-btn" onclick="toggleExportMenu()"><i class="fa-solid fa-download" style="font-size:12px"></i> \u30a8\u30af\u30b9\u30dd\u30fc\u30c8</button>
        <div class="export-menu" id="exportMenu">
          <a href="#" onclick="exportDeck('pdf');return false"><i class="fa-solid fa-file-pdf" style="margin-right:6px"></i>PDF</a>
          <a href="#" onclick="exportDeck('pptx');return false"><i class="fa-solid fa-file-powerpoint" style="margin-right:6px"></i>PPTX</a>
        </div>
      </div>
      <a href="/editor/?deck=${deck.id}" class="hdr-btn primary"><i class="fa-solid fa-pen" style="font-size:12px"></i> \u7de8\u96c6</a>
      <button class="hdr-btn play" onclick="startSlideshow()"><i class="fa-solid fa-play" style="font-size:12px"></i> \u30b9\u30e9\u30a4\u30c9\u30b7\u30e7\u30fc</button>
    </div>
  </div>

  <div class="main">
    <!-- Left icon rail -->
    <div class="editor-rail">
      <button class="rail-tab" data-panel="templates" onclick="toggleEditorPanel('templates')"><i class="fa-solid fa-shapes"></i><span>\u30c6\u30f3\u30d7\u30ec</span></button>
      <button class="rail-tab" data-panel="assets" onclick="toggleEditorPanel('assets')"><i class="fa-solid fa-cloud-arrow-up"></i><span>MY\u7d20\u6750</span></button>
      <button class="rail-tab" data-panel="projects" onclick="toggleEditorPanel('projects')"><i class="fa-solid fa-folder-open"></i><span>\u30d7\u30ed\u30b8\u30a7\u30af\u30c8</span></button>
    </div>
    <!-- Expandable panel -->
    <div class="editor-panel" id="editorPanel">
      <div class="ep-header">
        <h3 id="epTitle"></h3>
        <button class="ep-close" onclick="closeEditorPanel()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="ep-body" id="epTemplates">
        <div class="ep-empty"><i class="fa-solid fa-shapes"></i>\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u9078\u3093\u3067\u30c7\u30b6\u30a4\u30f3\u3092\u59cb\u3081\u307e\u3057\u3087\u3046</div>
      </div>
      <div class="ep-body" id="epAssets">
        <div class="ep-empty"><i class="fa-solid fa-cloud-arrow-up"></i>\u30ed\u30b4\u3084\u5199\u771f\u306a\u3069\u306e\u7d20\u6750\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9</div>
      </div>
      <div class="ep-body" id="epProjects">
        <div id="epProjectsList"></div>
      </div>
    </div>
    <!-- Canvas + filmstrip -->
    <div class="canvas-wrap">
      <div class="slide-area">
        <div class="slide-frame">
          <iframe id="mainSlide" src="about:blank"></iframe>
        </div>
      </div>
      <div class="filmstrip-bar">
        <span class="filmstrip-counter" id="slideCounter"></span>
        <div class="filmstrip" id="filmstrip"></div>
        <button class="filmstrip-add" onclick="addNewPage()" title="\u30da\u30fc\u30b8\u3092\u8ffd\u52a0"><i class="fa-solid fa-plus"></i></button>
      </div>
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
    const CANVAS_W = ${cW};
    const CANVAS_H = ${cH};
    let selectedIdx = 0;
    let dragSrcIdx = null;

    function updateSlideCounter() {
      document.getElementById('slideCounter').textContent = (selectedIdx + 1) + ' / ' + slidesMeta.length;
    }

    // ===== EDITOR SIDE PANEL =====
    let activePanel = null;
    function toggleEditorPanel(panel) {
      const panelEl = document.getElementById('editorPanel');
      const tabs = document.querySelectorAll('.rail-tab');
      if (activePanel === panel) { closeEditorPanel(); return; }
      activePanel = panel;
      panelEl.classList.add('open');
      tabs.forEach(t => t.classList.toggle('active', t.dataset.panel === panel));
      document.querySelectorAll('.ep-body').forEach(b => b.classList.remove('active'));
      var titles = { templates: '\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8', assets: 'MY\u7d20\u6750', projects: '\u30d7\u30ed\u30b8\u30a7\u30af\u30c8' };
      document.getElementById('epTitle').textContent = titles[panel] || panel;
      var bodyId = { templates: 'epTemplates', assets: 'epAssets', projects: 'epProjects' };
      var body = document.getElementById(bodyId[panel]);
      if (body) body.classList.add('active');
      if (panel === 'projects') loadProjectsList();
      if (panel === 'assets') loadPanelAssets();
      setTimeout(scaleMainSlide, 300);
    }
    function closeEditorPanel() {
      activePanel = null;
      document.getElementById('editorPanel').classList.remove('open');
      document.querySelectorAll('.rail-tab').forEach(t => t.classList.remove('active'));
      setTimeout(scaleMainSlide, 300);
    }
    function loadProjectsList() {
      fetch('/api/decks').then(r => r.json()).then(function(decks) {
        var list = document.getElementById('epProjectsList');
        if (!decks || decks.length === 0) { list.innerHTML = '<div class="ep-empty"><i class="fa-solid fa-folder-open"></i>\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u304c\u3042\u308a\u307e\u305b\u3093</div>'; return; }
        list.innerHTML = decks.map(function(d) {
          var isCurrent = d.id === deckId;
          var cnt = Array.isArray(d.slides) ? d.slides.length : 0;
          return '<a href="/preview/' + d.id + '" class="ep-project-item" style="' + (isCurrent ? 'background:rgba(99,102,241,0.1)' : '') + '">' +
            '<div class="proj-icon"><i class="fa-solid fa-file-lines"></i></div>' +
            '<div><div class="proj-name">' + (d.title || 'Untitled') + (isCurrent ? ' \u2190' : '') + '</div>' +
            '<div class="proj-meta">' + cnt + ' pages</div></div></a>';
        }).join('');
      });
    }
    function loadPanelAssets() {
      fetch('/api/assets').then(r => r.json()).then(function(assets) {
        var body = document.getElementById('epAssets');
        if (!assets || assets.length === 0) { body.innerHTML = '<div class="ep-empty"><i class="fa-solid fa-cloud-arrow-up"></i>\u7d20\u6750\u304c\u307e\u3060\u3042\u308a\u307e\u305b\u3093<br><a href="/#assets" style="color:var(--accent);font-size:12px">\u30db\u30fc\u30e0\u3067\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9</a></div>'; return; }
        body.innerHTML = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">' + assets.map(function(a) {
          var url = '/api/assets/' + a.id + '/file';
          return '<div style="border:1px solid var(--btn-border);border-radius:8px;overflow:hidden;cursor:pointer" onclick="copyAssetUrlPanel(\\'' + a.id + '\\')" title="\u30af\u30ea\u30c3\u30af\u3067URL\u30b3\u30d4\u30fc">' +
            '<img src="' + url + '" style="width:100%;aspect-ratio:1;object-fit:cover;display:block">' +
            '<div style="padding:4px 6px;font-size:10px;color:var(--meta-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (a.originalName || a.id) + '</div></div>';
        }).join('') + '</div>';
      });
    }
    function copyAssetUrlPanel(id) {
      var url = location.origin + '/api/assets/' + id + '/file';
      navigator.clipboard.writeText(url).then(function() { showToast('URL\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f'); });
    }

    // ===== FILMSTRIP (bottom page thumbnails) =====
    function buildFilmstrip() {
      const strip = document.getElementById('filmstrip');
      strip.innerHTML = slidesMeta.map((s, i) => {
        const url = '/api/decks/' + deckId + '/slides/' + s.id + '/html';
        return '<div class="film-item' + (i === selectedIdx ? ' selected' : '') + '" data-idx="' + i + '" draggable="true" onclick="selectSlide(' + i + ')">' +
          '<div class="film-iframe-wrap"><iframe src="' + url + '" loading="lazy" scrolling="no"></iframe></div>' +
          '<span class="film-num">' + (i + 1) + '</span>' +
        '</div>';
      }).join('');
      strip.querySelectorAll('.film-item').forEach(el => {
        el.addEventListener('dragstart', onDragStart);
        el.addEventListener('dragover', onDragOver);
        el.addEventListener('dragleave', onDragLeave);
        el.addEventListener('drop', onDrop);
        el.addEventListener('dragend', onDragEnd);
      });
      scaleFilmIframes();
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
      selectedIdx = targetIdx; buildFilmstrip(); selectSlide(selectedIdx);
      fetch('/api/decks/' + deckId + '/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slideIds: slidesMeta.map(s => s.id) }) });
      dragSrcIdx = null;
    }

    function addNewPage() {
      fetch('/api/decks/' + deckId + '/slides', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
        .then(r => r.json()).then(function(data) {
          slidesMeta.push({ index: slidesMeta.length, id: data.slideId, title: 'Page ' + (slidesMeta.length + 1) });
          buildFilmstrip();
          selectSlide(slidesMeta.length - 1);
        });
    }

    function selectSlide(idx) {
      selectedIdx = idx;
      const slide = slidesMeta[idx];
      document.getElementById('mainSlide').src = '/api/decks/' + deckId + '/slides/' + slide.id + '/html';
      document.querySelectorAll('.film-item').forEach((el, i) => el.classList.toggle('selected', i === idx));
      updateSlideCounter();
      if (codeOpen) loadCode();
      const selected = document.querySelector('.film-item.selected');
      if (selected) selected.scrollIntoView({ inline: 'nearest', behavior: 'smooth' });
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
      var scale = Math.min(w / CANVAS_W, h / CANVAS_H);
      iframe.style.transform = 'scale(' + scale + ')';
      iframe.style.left = ((w - CANVAS_W * scale) / 2) + 'px';
      iframe.style.top = ((h - CANVAS_H * scale) / 2) + 'px';
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

    window.addEventListener('resize', () => { if (ssActive) ssLayout(); scaleMainSlide(); scaleFilmIframes(); });

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
      ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.type === 'deck-updated' && m.deckId === deckId) { document.getElementById('mainSlide').src = document.getElementById('mainSlide').src; buildFilmstrip(); setTimeout(() => selectSlide(selectedIdx), 100); if (codeOpen) loadCode(); if (imagesOpen) refreshImages(); } };
      ws.onclose = () => { document.getElementById('statusDot').className = 'status-dot disconnected'; document.getElementById('statusText').textContent = 'Offline'; setTimeout(connectWs, 2000); };
    }

    function scaleMainSlide() { const f = document.querySelector('.slide-frame'); const i = document.getElementById('mainSlide'); if (f && i) i.style.transform = 'scale(' + (f.clientWidth / CANVAS_W) + ')'; }
    function scaleFilmIframes() { document.querySelectorAll('.film-iframe-wrap').forEach(w => { const i = w.querySelector('iframe'); if (i) i.style.transform = 'scale(' + (w.clientWidth / CANVAS_W) + ')'; }); }

    // Theme
    function toggleTheme() { /* removed - always dark for now */ }
    (function initTheme() { const s = localStorage.getItem('slideharness-theme'); if (s) document.documentElement.dataset.theme = s; })();

    buildFilmstrip();
    if (slidesMeta.length > 0) selectSlide(0);
    connectWs();
    requestAnimationFrame(() => { scaleMainSlide(); scaleFilmIframes(); });
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

      const decksJson = JSON.stringify(decks.map(d => {
        const cs = resolveCanvasSize(d.metadata as Record<string, unknown> | undefined);
        const meta = (d.metadata || {}) as Record<string, unknown>;
        return { id: d.id, title: d.title, slides: d.slides.length, updatedAt: d.updatedAt, cw: cs.width, ch: cs.height, favorite: !!meta.favorite };
      }));

      // Build template data from existing decks (first slide HTML as thumbnail)
      const templateData: Array<{ id: string; title: string; desc: string; slideCount: number; firstHtml: string }> = [];
      for (const deck of decks) {
        if (deck.slides.length === 0) continue;
        const firstHtml = await this.storage.loadSlideHtml(deck.id, deck.slides[0].id);
        if (!firstHtml) continue;
        templateData.push({
          id: deck.id,
          title: deck.title,
          desc: deck.description || '',
          slideCount: deck.slides.length,
          firstHtml,
        });
      }
      const templatesJson = JSON.stringify(templateData);

      res.type('html').send(`<!DOCTYPE html>
<html lang="ja" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slide Harness</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
  <style>
    :root {
      --h-bg: #fff; --h-text: #202124; --h-border: #e0e0e0; --h-sub: #5f6368;
      --h-input-bg: #f1f3f4; --h-card-border: #e0e0e0; --h-card-hover: rgba(0,0,0,0.12);
      --h-thumb-bg: #f1f3f4; --h-badge-bg: #6366f1; --h-date: #9aa0a6;
      --h-modal-bg: #fff; --h-modal-shadow: rgba(0,0,0,0.2); --h-input-border: #ddd;
      --h-overlay-bg: rgba(0,0,0,0.4); --h-edit-border: #818cf8;
      --h-sidebar-bg: #f8f9fa; --h-sidebar-hover: rgba(99,102,241,0.08); --h-sidebar-active: rgba(99,102,241,0.12);
    }
    [data-theme="dark"] {
      --h-bg: #0f0f23; --h-text: #e0e0e0; --h-border: rgba(255,255,255,0.1); --h-sub: #94a3b8;
      --h-input-bg: #1a1b2e; --h-card-border: rgba(255,255,255,0.1); --h-card-hover: rgba(255,255,255,0.08);
      --h-thumb-bg: #1e1e2e; --h-badge-bg: #818cf8; --h-date: #64748b;
      --h-modal-bg: #1a1b2e; --h-modal-shadow: rgba(0,0,0,0.5); --h-input-border: rgba(255,255,255,0.15);
      --h-overlay-bg: rgba(0,0,0,0.6); --h-edit-border: #818cf8;
      --h-sidebar-bg: #12122a; --h-sidebar-hover: rgba(129,140,248,0.1); --h-sidebar-active: rgba(129,140,248,0.15);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--h-bg); color: var(--h-text); font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif; display: flex; height: 100vh; overflow: hidden; }
    /* Sidebar */
    .sidebar { width: 72px; height: 100vh; position: fixed; left: 0; top: 0; background: var(--h-sidebar-bg); border-right: 1px solid var(--h-border); display: flex; flex-direction: column; align-items: center; padding: 12px 0; z-index: 200; }
    .sidebar-logo { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #6366f1, #818cf8); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 16px; margin-bottom: 20px; flex-shrink: 0; cursor: default; }
    .sidebar-nav { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
    .nav-item { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 0; width: 64px; border: none; background: transparent; cursor: pointer; border-radius: 12px; color: var(--h-sub); transition: all 0.15s; }
    .nav-item i { font-size: 20px; width: 40px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 10px; transition: all 0.15s; }
    .nav-item span { font-size: 10px; font-weight: 500; }
    .nav-item:hover { color: var(--h-text); }
    .nav-item:hover i { background: var(--h-sidebar-hover); }
    .nav-item.active { color: #6366f1; }
    .nav-item.active i { background: var(--h-sidebar-active); color: #6366f1; }
    .sidebar-bottom { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; padding-top: 8px; border-top: 1px solid var(--h-border); width: 56px; }
    .sidebar-btn { width: 40px; height: 40px; border-radius: 10px; border: none; background: transparent; cursor: pointer; color: var(--h-sub); font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .sidebar-btn:hover { background: var(--h-sidebar-hover); color: var(--h-text); }

    /* Main Content */
    .main-content { flex: 1; margin-left: 72px; height: 100vh; overflow-y: auto; display: flex; flex-direction: column; }
    .top-bar { display: flex; align-items: center; padding: 10px 28px; border-bottom: 1px solid var(--h-border); position: sticky; top: 0; background: var(--h-bg); z-index: 100; gap: 16px; }
    .search-bar { flex: 1; max-width: 600px; position: relative; }
    .search-bar input { width: 100%; padding: 10px 14px 10px 40px; border-radius: 8px; border: none; background: var(--h-input-bg); font-size: 14px; color: var(--h-text); outline: none; transition: box-shadow 0.2s; }
    .search-bar input:focus { background: var(--h-bg); box-shadow: 0 1px 6px rgba(32,33,36,0.28); }
    .search-bar .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 14px; color: var(--h-sub); }
    .status-badge { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; background: #e8f5e9; color: #2e7d32; font-size: 13px; font-weight: 500; margin-left: auto; }
    .status-badge .dot { width: 8px; height: 8px; border-radius: 50%; background: #4caf50; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

    /* Pages */
    .page { display: none; flex: 1; padding: 24px 28px; }
    .page.active { display: block; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .page-header h2 { font-size: 20px; font-weight: 600; }

    /* Category circles (Canva-style) */
    .category-circles { display: flex; gap: 28px; margin-bottom: 28px; flex-wrap: wrap; }
    .cat-circle { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; flex-shrink: 0; }
    .cat-circle .circle-icon { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: transform 0.2s, box-shadow 0.2s; }
    .cat-circle:hover .circle-icon { transform: scale(1.08); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    .cat-circle .circle-icon i { font-size: 24px; color: #fff; }
    .cat-circle .cat-label { font-size: 12px; color: var(--h-sub); font-weight: 500; text-align: center; max-width: 80px; }
    .cat-circle.active .cat-label { color: var(--h-text); font-weight: 600; }

    /* (preset-grid moved to DCM modal) */

    .version-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #818cf8; color: #fff; font-size: 11px; font-weight: 600; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .section-header h2 { font-size: 16px; font-weight: 500; color: var(--h-text); }

    .create-btn { padding: 8px 20px; border: none; border-radius: 24px; background: #6366f1; color: #fff; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; display: flex; align-items: center; gap: 6px; }
    .create-btn:hover { background: #4f46e5; }

    .decks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; }
    .deck-card { text-decoration: none; color: inherit; border-radius: 8px; overflow: hidden; border: 1px solid var(--h-card-border); transition: box-shadow 0.2s, transform 0.15s; cursor: pointer; position: relative; }
    .deck-card:hover { box-shadow: 0 4px 16px var(--h-card-hover); transform: translateY(-2px); }
    .deck-thumb { width: 100%; aspect-ratio: 16/9; overflow: hidden; background: var(--h-thumb-bg); position: relative; display: flex; align-items: center; justify-content: center; }
    .deck-thumb iframe { border: none; pointer-events: none; transform-origin: top left; position: absolute; top: 50%; left: 50%; }
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
    .fav-btn { position: absolute; top: 6px; left: 6px; border: none; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); color: rgba(255,255,255,0.7); width: 28px; height: 28px; border-radius: 50%; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; z-index: 10; opacity: 0; transition: all 0.15s; }
    .deck-card:hover .fav-btn { opacity: 1; }
    .fav-btn.favorited { opacity: 1; color: #fbbf24; background: rgba(0,0,0,0.6); }
    .fav-btn:hover { transform: scale(1.15); }
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

    /* === Design Create Modal (Canva-style fullscreen) === */
    .dcm-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--h-overlay-bg); z-index: 1500; align-items: center; justify-content: center; }
    .dcm-overlay.open { display: flex; }
    .dcm-box { background: var(--h-modal-bg); border-radius: 16px; width: 92vw; max-width: 1100px; height: 85vh; max-height: 720px; display: flex; overflow: hidden; box-shadow: 0 24px 64px var(--h-modal-shadow); position: relative; }
    .dcm-close { position: absolute; top: 16px; right: 16px; border: none; background: none; cursor: pointer; color: var(--h-sub); font-size: 22px; z-index: 10; padding: 4px 8px; border-radius: 6px; transition: all 0.15s; }
    .dcm-close:hover { background: var(--h-input-bg); color: var(--h-text); }
    .dcm-sidebar { width: 220px; flex-shrink: 0; border-right: 1px solid var(--h-border); display: flex; flex-direction: column; padding: 24px 0; overflow-y: auto; }
    .dcm-sidebar h2 { font-size: 20px; font-weight: 700; padding: 0 20px; margin-bottom: 20px; color: var(--h-text); }
    .dcm-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; cursor: pointer; font-size: 14px; color: var(--h-sub); transition: all 0.15s; border: none; background: none; width: 100%; text-align: left; border-radius: 0; }
    .dcm-nav-item:hover { background: var(--h-input-bg); color: var(--h-text); }
    .dcm-nav-item.active { background: rgba(99,102,241,0.1); color: #6366f1; font-weight: 600; }
    .dcm-nav-item .nav-dot { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .dcm-nav-item .nav-dot i { font-size: 12px; color: #fff; }
    .dcm-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .dcm-main-header { padding: 20px 28px 12px; flex-shrink: 0; }
    .dcm-search { width: 100%; padding: 10px 14px 10px 40px; border-radius: 8px; border: 1px solid var(--h-border); background: var(--h-input-bg); font-size: 14px; color: var(--h-text); outline: none; }
    .dcm-search:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,0.1); }
    .dcm-search-wrap { position: relative; }
    .dcm-search-wrap i { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--h-sub); font-size: 14px; }
    .dcm-body { flex: 1; overflow-y: auto; padding: 8px 28px 28px; }
    .dcm-body h3 { font-size: 15px; font-weight: 600; margin-bottom: 16px; color: var(--h-text); }
    .dcm-preset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
    .dcm-preset { cursor: pointer; border-radius: 12px; overflow: hidden; border: 1px solid var(--h-card-border); transition: all 0.2s; background: var(--h-input-bg); }
    .dcm-preset:hover { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 6px 20px var(--h-card-hover); }
    .dcm-preset .dp-thumb { display: flex; align-items: center; justify-content: center; padding: 16px; background: var(--h-thumb-bg); }
    .dcm-preset .dp-ratio { border-radius: 6px; border: 1px solid var(--h-border); background: var(--h-modal-bg); display: flex; align-items: center; justify-content: center; }
    .dcm-preset .dp-ratio span { font-size: 9px; color: var(--h-sub); }
    .dcm-preset .dp-info { padding: 10px 12px; }
    .dcm-preset .dp-name { font-size: 13px; font-weight: 600; color: var(--h-text); margin-bottom: 2px; }
    .dcm-preset .dp-size { font-size: 11px; color: var(--h-sub); }
    .dcm-custom-row { display: flex; align-items: center; gap: 10px; padding: 16px; background: var(--h-input-bg); border-radius: 12px; border: 1px solid var(--h-card-border); margin-top: 12px; }
    .dcm-custom-row input { width: 80px; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--h-input-border); background: var(--h-modal-bg); color: var(--h-text); font-size: 14px; text-align: center; outline: none; }
    .dcm-custom-row input:focus { border-color: #818cf8; }
    .dcm-custom-row span { color: var(--h-sub); font-size: 14px; }
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

    /* Asset upload & gallery */
    .asset-tabs { display: flex; gap: 4px; margin-bottom: 20px; border-bottom: 1px solid var(--h-border); padding-bottom: 0; }
    .asset-tab { padding: 10px 16px; border: none; background: none; color: var(--h-sub); font-size: 13px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; display: flex; align-items: center; gap: 6px; }
    .asset-tab:hover { color: var(--h-text); }
    .asset-tab.active { color: #6366f1; border-bottom-color: #6366f1; }
    .asset-tab i { font-size: 12px; }
    .asset-tab-body { display: none; }
    .asset-tab-body.active { display: block; }
    .asset-upload-zone { border: 2px dashed var(--h-card-border); border-radius: 16px; padding: 32px; text-align: center; cursor: pointer; transition: all 0.2s; background: var(--h-input-bg); }
    .asset-upload-zone:hover { border-color: #6366f1; background: rgba(99,102,241,0.04); }
    .asset-upload-zone.dragover { border-color: #6366f1; background: rgba(99,102,241,0.08); }
    .color-swatch { width: 56px; height: 56px; border-radius: 50%; cursor: pointer; position: relative; border: 3px solid var(--h-card-border); transition: all 0.2s; display: flex; flex-direction: column; align-items: center; }
    .color-swatch:hover { transform: scale(1.1); }
    .color-swatch .swatch-delete { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; background: #ef4444; color: #fff; border: none; cursor: pointer; font-size: 10px; display: none; align-items: center; justify-content: center; line-height: 1; }
    .color-swatch:hover .swatch-delete { display: flex; }
    .color-swatch-wrap { text-align: center; }
    .color-swatch-label { font-size: 10px; color: var(--h-sub); margin-top: 4px; max-width: 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .font-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid var(--h-card-border); border-radius: 10px; margin-bottom: 8px; transition: all 0.15s; }
    .font-item:hover { border-color: #818cf8; }
    .font-item .font-name { font-size: 14px; font-weight: 500; color: var(--h-text); flex: 1; }
    .font-item .font-type { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: var(--h-input-bg); color: var(--h-sub); }
    .font-item .font-delete { border: none; background: none; color: var(--h-sub); cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.15s; }
    .font-item .font-delete:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
    .assets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }
    .asset-card { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid var(--h-card-border); transition: all 0.15s; cursor: pointer; background: var(--h-thumb-bg); aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }
    .asset-card:hover { border-color: #6366f1; box-shadow: 0 4px 12px var(--h-card-hover); }
    .asset-card img { max-width: 100%; max-height: 100%; object-fit: contain; padding: 8px; }
    .asset-card .asset-name { position: absolute; bottom: 0; left: 0; right: 0; padding: 4px 8px; font-size: 10px; color: #fff; background: rgba(0,0,0,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0; transition: opacity 0.15s; }
    .asset-card:hover .asset-name { opacity: 1; }
    .asset-card .asset-delete { position: absolute; top: 6px; right: 6px; width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(239,68,68,0.85); color: #fff; cursor: pointer; font-size: 12px; display: none; align-items: center; justify-content: center; }
    .asset-card:hover .asset-delete { display: flex; }
    .asset-card .asset-copy { position: absolute; top: 6px; left: 6px; width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(0,0,0,0.6); color: #fff; cursor: pointer; font-size: 11px; display: none; align-items: center; justify-content: center; }
    .asset-card:hover .asset-copy { display: flex; }

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

    /* Built-in Template Cards */
    .filter-chip { padding: 4px 12px; border-radius: 16px; border: 1px solid var(--h-border); background: transparent; cursor: pointer; font-size: 12px; color: var(--h-sub); transition: all 0.15s; }
    .filter-chip:hover { border-color: #6366f1; color: #6366f1; }
    .filter-chip.active { background: #6366f1; color: #fff; border-color: #6366f1; }
    .bi-tmpl-card { flex-shrink: 0; width: 200px; border: 1px solid var(--h-card-border); border-radius: 8px; overflow: hidden; cursor: pointer; transition: all 0.15s; }
    .bi-tmpl-card:hover { border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 4px 12px var(--h-card-hover); }
    .bi-tmpl-preview { height: 80px; display: flex; align-items: center; justify-content: center; background: var(--h-input-bg); }
    .bi-tmpl-body { padding: 10px; }
    .bi-tmpl-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bi-tmpl-desc { font-size: 11px; color: var(--h-sub); line-height: 1.3; margin-bottom: 6px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .bi-tmpl-tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .bi-tag { font-size: 10px; padding: 1px 6px; border-radius: 3px; background: var(--h-input-bg); color: var(--h-sub); }

    @media (max-width: 768px) { .sidebar { width: 56px; } .sidebar-logo { width: 36px; height: 36px; font-size: 14px; } .nav-item { width: 48px; } .nav-item span { display: none; } .main-content { margin-left: 56px; } .page { padding: 16px; } .top-bar { padding: 8px 16px; } }

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
  <!-- Sidebar -->
  <div class="sidebar">
    <div class="sidebar-logo">SH</div>
    <nav class="sidebar-nav">
      <button class="nav-item active" data-page="home" onclick="switchPage('home')">
        <i class="fa-solid fa-house"></i>
        <span>\u30db\u30fc\u30e0</span>
      </button>
      <button class="nav-item" data-page="projects" onclick="switchPage('projects')">
        <i class="fa-solid fa-folder-open"></i>
        <span>\u30d7\u30ed\u30b8\u30a7\u30af\u30c8</span>
      </button>
      <button class="nav-item" data-page="templates" onclick="switchPage('templates')">
        <i class="fa-solid fa-palette"></i>
        <span>\u30c6\u30f3\u30d7\u30ec</span>
      </button>
      <button class="nav-item" data-page="assets" onclick="switchPage('assets')">
        <i class="fa-solid fa-cloud-arrow-up"></i>
        <span>MY\u7d20\u6750</span>
      </button>
    </nav>
    <div class="sidebar-bottom">
      <button class="sidebar-btn" id="themeToggle" onclick="toggleTheme()" title="\u30c6\u30fc\u30de\u5207\u66ff">
        <i class="fa-solid fa-sun"></i>
      </button>
      <button class="sidebar-btn" onclick="toggleMcpGuide()" title="MCP Guide">
        <i class="fa-solid fa-circle-question"></i>
      </button>
    </div>
  </div>

  <!-- Main Content -->
  <div class="main-content">
    <div class="top-bar">
      <div class="search-bar">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input type="text" placeholder="\u691c\u7d22" id="searchInput" oninput="filterDecks()" />
      </div>
      <div class="status-badge"><div class="dot"></div>MCP\u63a5\u7d9a\u4e2d</div>
    </div>

    <!-- Page: Home -->
    <div id="page-home" class="page active">
      <div class="page-header">
        <h2>\u30db\u30fc\u30e0</h2>
        <span class="version-badge">v2</span>
      </div>
      <div class="category-circles" id="categoryCircles"></div>
      <div class="section-header">
        <h2>\u6700\u8fd1\u306e\u30d7\u30ed\u30b8\u30a7\u30af\u30c8</h2>
        <button class="create-btn" onclick="openDcm()"><i class="fa-solid fa-plus" style="font-size:12px"></i> \u65b0\u898f\u4f5c\u6210</button>
      </div>
      <div class="decks-grid" id="homeDecksGrid"></div>
      <div class="empty-state" id="homeEmptyState" style="display:none">
        <i class="fa-solid fa-paintbrush" style="font-size:48px;display:block;margin-bottom:16px"></i>
        <h3>\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3\u304c\u307e\u3060\u3042\u308a\u307e\u305b\u3093</h3>
        <p>\u300c+ \u65b0\u898f\u4f5c\u6210\u300d\u30dc\u30bf\u30f3\u307e\u305f\u306fClaude Code\u306eMCP\u30c4\u30fc\u30eb\u3067\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3\u3092\u4f5c\u6210\u3057\u307e\u3057\u3087\u3046\u3002</p>
      </div>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--h-border)">
        <div class="section-header">
          <h2>\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u304b\u3089\u59cb\u3081\u308b</h2>
          <button class="create-btn" onclick="switchPage('templates')" style="font-size:13px"><i class="fa-solid fa-grid-2" style="font-size:12px"></i> \u5168\u3066\u898b\u308b</button>
        </div>
        <div class="templates-grid" id="homeTemplatesGrid"></div>
      </div>
    </div>

    <!-- Page: Projects -->
    <div id="page-projects" class="page">
      <div class="page-header">
        <h2>\u30d7\u30ed\u30b8\u30a7\u30af\u30c8</h2>
        <button class="create-btn" onclick="openDcm()"><i class="fa-solid fa-plus" style="font-size:12px"></i> \u65b0\u898f\u4f5c\u6210</button>
      </div>
      <div class="decks-grid" id="projectsDecksGrid"></div>
      <div class="empty-state" id="projectsEmptyState" style="display:none">
        <i class="fa-solid fa-folder-open" style="font-size:48px;display:block;margin-bottom:16px"></i>
        <h3>\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u304c\u3042\u308a\u307e\u305b\u3093</h3>
        <p>\u300c+ \u65b0\u898f\u4f5c\u6210\u300d\u30dc\u30bf\u30f3\u307e\u305f\u306fClaude Code\u306eMCP\u30c4\u30fc\u30eb\u3067\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3\u3092\u4f5c\u6210\u3057\u307e\u3057\u3087\u3046\u3002</p>
      </div>
    </div>

    <!-- Page: Templates -->
    <div id="page-templates" class="page">
      <div class="page-header">
        <h2>\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8</h2>
      </div>
      <!-- Built-in Template Catalog -->
      <div id="builtInTemplatesCatalog" style="margin-bottom:32px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
          <h3 style="font-size:16px;font-weight:600">\u30d3\u30eb\u30c8\u30a4\u30f3\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8</h3>
          <div style="display:flex;gap:6px;flex-wrap:wrap" id="builtInFilterBtns"></div>
        </div>
        <div id="builtInSections"></div>
      </div>
      <div style="border-top:1px solid var(--h-border);padding-top:24px">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:16px">\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u304b\u3089</h3>
        <div class="templates-grid" id="templatesGrid"></div>
      </div>
    </div>

    <!-- Page: My Assets -->
    <div id="page-assets" class="page">
      <div class="page-header">
        <h2>MY\u7d20\u6750</h2>
      </div>

      <!-- Asset Category Tabs -->
      <div class="asset-tabs">
        <button class="asset-tab active" data-cat="logo" onclick="switchAssetTab('logo')"><i class="fa-solid fa-star"></i> \u30ed\u30b4</button>
        <button class="asset-tab" data-cat="photo" onclick="switchAssetTab('photo')"><i class="fa-solid fa-image"></i> \u5199\u771f</button>
        <button class="asset-tab" data-cat="icon" onclick="switchAssetTab('icon')"><i class="fa-solid fa-icons"></i> \u30a2\u30a4\u30b3\u30f3</button>
        <button class="asset-tab" data-cat="font" onclick="switchAssetTab('font')"><i class="fa-solid fa-font"></i> \u30d5\u30a9\u30f3\u30c8</button>
        <button class="asset-tab" data-cat="color" onclick="switchAssetTab('color')"><i class="fa-solid fa-droplet"></i> \u30ab\u30e9\u30fc</button>
      </div>

      <!-- Tab: Logo / Photo / Icon (shared layout) -->
      <div class="asset-tab-body active" id="assetTabImage">
        <div class="asset-upload-zone" id="assetDropZone" onclick="document.getElementById('assetFileInput').click()">
          <i class="fa-solid fa-cloud-arrow-up" style="font-size:32px;color:#6366f1;margin-bottom:8px"></i>
          <div style="font-size:14px;font-weight:500;color:var(--h-text)" id="assetUploadLabel">\u753b\u50cf\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9</div>
          <div style="font-size:12px;color:var(--h-sub);margin-top:4px">PNG, JPG, SVG, WebP, GIF \u306b\u5bfe\u5fdc\u30fb\u30c9\u30e9\u30c3\u30b0&\u30c9\u30ed\u30c3\u30d7\u3082OK</div>
          <input type="file" id="assetFileInput" accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.ico" multiple style="display:none" onchange="handleAssetUpload(this.files)" />
        </div>
        <div style="margin-top:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span id="assetsCount" style="font-size:12px;color:var(--h-sub)"></span>
          </div>
          <div class="assets-grid" id="assetsGrid"></div>
          <div class="empty-state" id="assetsEmptyState" style="display:none;padding:40px 20px">
            <i class="fa-solid fa-images" style="font-size:48px;display:block;margin-bottom:16px"></i>
            <h3>\u307e\u3060\u7d20\u6750\u304c\u3042\u308a\u307e\u305b\u3093</h3>
            <p>\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u3057\u3066\u3001\u3069\u306e\u30c7\u30b6\u30a4\u30f3\u3067\u3082\u4f7f\u3048\u308b\u3088\u3046\u306b\u3057\u307e\u3057\u3087\u3046\u3002</p>
          </div>
        </div>
      </div>

      <!-- Tab: Font -->
      <div class="asset-tab-body" id="assetTabFont">
        <div class="asset-upload-zone" onclick="document.getElementById('fontFileInput').click()">
          <i class="fa-solid fa-font" style="font-size:32px;color:#6366f1;margin-bottom:8px"></i>
          <div style="font-size:14px;font-weight:500;color:var(--h-text)">\u30d5\u30a9\u30f3\u30c8\u30d5\u30a1\u30a4\u30eb\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9</div>
          <div style="font-size:12px;color:var(--h-sub);margin-top:4px">.ttf, .otf, .woff, .woff2 \u306b\u5bfe\u5fdc</div>
          <input type="file" id="fontFileInput" accept=".ttf,.otf,.woff,.woff2" multiple style="display:none" onchange="handleFontUpload(this.files)" />
        </div>
        <div style="margin-top:16px">
          <div style="display:flex;gap:8px;margin-bottom:16px">
            <input type="text" id="googleFontInput" placeholder="Google Fonts \u30d5\u30a1\u30df\u30ea\u30fc\u540d (e.g. Noto Sans JP)" style="flex:1;padding:8px 12px;border-radius:8px;border:1px solid var(--h-border);background:var(--h-input-bg);color:var(--h-text);font-size:13px;outline:none" />
            <button class="create-btn" onclick="addGoogleFont()" style="white-space:nowrap"><i class="fa-solid fa-plus" style="font-size:12px"></i> \u8ffd\u52a0</button>
          </div>
          <div id="fontsGrid"></div>
          <div class="empty-state" id="fontsEmptyState" style="display:none;padding:40px 20px">
            <i class="fa-solid fa-font" style="font-size:48px;display:block;margin-bottom:16px"></i>
            <h3>\u30d5\u30a9\u30f3\u30c8\u304c\u307e\u3060\u3042\u308a\u307e\u305b\u3093</h3>
            <p>\u30d5\u30a9\u30f3\u30c8\u30d5\u30a1\u30a4\u30eb\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u3059\u308b\u304b\u3001Google Fonts\u3092\u8ffd\u52a0\u3057\u307e\u3057\u3087\u3046\u3002</p>
          </div>
        </div>
      </div>

      <!-- Tab: Color -->
      <div class="asset-tab-body" id="assetTabColor">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
          <input type="color" id="colorPickerInput" value="#6366f1" style="width:44px;height:44px;border:none;border-radius:8px;cursor:pointer;padding:0;background:none" />
          <input type="text" id="colorHexInput" value="#6366f1" placeholder="#RRGGBB" maxlength="7" style="width:100px;padding:8px 12px;border-radius:8px;border:1px solid var(--h-border);background:var(--h-input-bg);color:var(--h-text);font-size:13px;font-family:monospace;outline:none" />
          <input type="text" id="colorNameInput" placeholder="\u30e9\u30d9\u30eb (\u4efb\u610f)" style="flex:1;min-width:120px;padding:8px 12px;border-radius:8px;border:1px solid var(--h-border);background:var(--h-input-bg);color:var(--h-text);font-size:13px;outline:none" />
          <button class="create-btn" onclick="addColor()"><i class="fa-solid fa-plus" style="font-size:12px"></i> \u8ffd\u52a0</button>
        </div>
        <div id="colorsGrid" style="display:flex;flex-wrap:wrap;gap:12px"></div>
        <div class="empty-state" id="colorsEmptyState" style="display:none;padding:40px 20px">
          <i class="fa-solid fa-droplet" style="font-size:48px;display:block;margin-bottom:16px"></i>
          <h3>\u30ab\u30e9\u30fc\u304c\u307e\u3060\u3042\u308a\u307e\u305b\u3093</h3>
          <p>\u30d6\u30e9\u30f3\u30c9\u30ab\u30e9\u30fc\u3092\u767b\u9332\u3057\u3066\u3001\u30c7\u30b6\u30a4\u30f3\u3067\u7d71\u4e00\u3057\u305f\u914d\u8272\u3092\u4f7f\u3044\u307e\u3057\u3087\u3046\u3002</p>
          </div>
      </div>

      <!-- Template Import (secondary) -->
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--h-border)">
        <div class="section-header">
          <h2>\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u30a4\u30f3\u30dd\u30fc\u30c8</h2>
        </div>
        <div class="templates-grid">
          <div class="template-card import-card" id="importDrop" onclick="document.getElementById('importFile').click()">
            <div class="t-thumb" style="display:flex;align-items:center;justify-content:center;background:var(--h-input-bg)">
              <div style="text-align:center;color:var(--h-sub)">
                <i class="fa-solid fa-file-import" style="font-size:36px;margin-bottom:8px;display:block"></i>
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
      <div id="myTemplatesSection" style="display:none;margin-top:16px">
        <div class="section-header">
          <h2>\u30de\u30a4\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8</h2>
        </div>
        <div class="templates-grid" id="myTemplatesGrid"></div>
      </div>
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

  <!-- Design Create Modal (Canva-style) -->
  <div class="dcm-overlay" id="dcmOverlay" onclick="if(event.target===this)closeDcm()">
    <div class="dcm-box">
      <button class="dcm-close" onclick="closeDcm()"><i class="fa-solid fa-xmark"></i></button>
      <div class="dcm-sidebar">
        <h2>\u30c7\u30b6\u30a4\u30f3\u3092\u4f5c\u6210</h2>
        <div id="dcmNav"></div>
      </div>
      <div class="dcm-main">
        <div class="dcm-main-header">
          <div class="dcm-search-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input class="dcm-search" type="text" placeholder="\u4f55\u3092\u4f5c\u6210\u3057\u307e\u3059\u304b\uff1f" id="dcmSearch" oninput="filterDcmPresets()" />
          </div>
        </div>
        <div class="dcm-body" id="dcmBody"></div>
      </div>
    </div>
  </div>

  <!-- Fallback simple create modal -->
  <div class="modal-bg" id="createModal">
    <div class="modal">
      <h3>\u65b0\u898f\u4f5c\u6210</h3>
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

    // Page switching
    function switchPage(page) {
      document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
      document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
      var pageEl = document.getElementById('page-' + page);
      if (pageEl) pageEl.classList.add('active');
      var navEl = document.querySelector('.nav-item[data-page="' + page + '"]');
      if (navEl) navEl.classList.add('active');
      history.replaceState(null, '', '#' + page);
      requestAnimationFrame(function() { scaleThumbs(); scaleTemplateThumbs(); });
    }

    function scaleTemplateThumbs() {
      document.querySelectorAll('.template-card .t-thumb').forEach(function(w) {
        var iframe = w.querySelector('iframe');
        if (iframe && w.clientWidth > 0) iframe.style.transform = 'scale(' + (w.clientWidth / 1920) + ')';
      });
    }

    // Canvas presets data
    var CANVAS_PRESETS = ${JSON.stringify(CANVAS_PRESETS)};

    var CATEGORIES = [
      { id: 'presentation', name: '\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3', icon: 'fa-display', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
      { id: 'social', name: 'SNS', icon: 'fa-share-nodes', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
      { id: 'print', name: '\u5370\u5237', icon: 'fa-print', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
      { id: 'custom', name: '\u30ab\u30b9\u30bf\u30e0', icon: 'fa-plus', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' }
    ];

    var dcmActiveCategory = null;

    // Category circle cards for home page — clicking opens the DCM modal
    function renderCategories() {
      var container = document.getElementById('categoryCircles');
      if (!container) return;
      container.innerHTML = CATEGORIES.map(function(c) {
        return '<div class="cat-circle" onclick="openDcm(\\'' + c.id + '\\')">' +
          '<div class="circle-icon" style="background:' + c.gradient + '"><i class="fa-solid ' + c.icon + '"></i></div>' +
          '<span class="cat-label">' + c.name + '</span></div>';
      }).join('');
    }

    // ===== Design Create Modal =====
    function openDcm(catId) {
      document.getElementById('dcmOverlay').classList.add('open');
      buildDcmNav();
      dcmSelectCategory(catId || 'presentation');
    }
    function closeDcm() {
      document.getElementById('dcmOverlay').classList.remove('open');
      document.getElementById('dcmSearch').value = '';
    }

    function buildDcmNav() {
      var nav = document.getElementById('dcmNav');
      nav.innerHTML = CATEGORIES.map(function(c) {
        return '<button class="dcm-nav-item' + (dcmActiveCategory === c.id ? ' active' : '') + '" onclick="dcmSelectCategory(\\'' + c.id + '\\')">' +
          '<span class="nav-dot" style="background:' + c.gradient + '"><i class="fa-solid ' + c.icon + '"></i></span>' +
          '<span>' + c.name + '</span></button>';
      }).join('');
    }

    function dcmSelectCategory(catId) {
      dcmActiveCategory = catId;
      buildDcmNav();
      document.getElementById('dcmSearch').value = '';
      var body = document.getElementById('dcmBody');

      if (catId === 'custom') {
        body.innerHTML = '<h3>\u30ab\u30b9\u30bf\u30e0\u30b5\u30a4\u30ba</h3>' +
          '<p style="font-size:13px;color:var(--h-sub);margin-bottom:16px">\u4efb\u610f\u306e\u30b5\u30a4\u30ba\u3067\u30c7\u30b6\u30a4\u30f3\u3092\u4f5c\u6210\u3067\u304d\u307e\u3059</p>' +
          '<div class="dcm-custom-row">' +
          '<input type="number" id="dcmCustomW" value="1920" min="100" max="10000" />' +
          '<span>x</span>' +
          '<input type="number" id="dcmCustomH" value="1080" min="100" max="10000" />' +
          '<span>px</span>' +
          '<button class="create-btn" onclick="dcmCreateCustom()" style="margin-left:auto"><i class="fa-solid fa-plus" style="font-size:12px"></i> \u4f5c\u6210</button>' +
          '</div>';
        return;
      }

      var presets = CANVAS_PRESETS.filter(function(p) { return p.category === catId; });

      renderDcmPresets(presets);
    }

    function renderDcmPresets(presets) {
      var body = document.getElementById('dcmBody');
      var maxDim = 90;
      var html = '<div class="dcm-preset-grid">';
      presets.forEach(function(p) {
        var ratio = p.width / p.height;
        var pw, ph;
        if (ratio >= 1) { pw = maxDim; ph = Math.round(maxDim / ratio); }
        else { ph = maxDim; pw = Math.round(maxDim * ratio); }
        html += '<div class="dcm-preset" onclick="dcmCreate(\\'' + escHtml(p.label) + '\\',' + p.width + ',' + p.height + ')">' +
          '<div class="dp-thumb"><div class="dp-ratio" style="width:' + pw + 'px;height:' + ph + 'px"><span>' + p.width + 'x' + p.height + '</span></div></div>' +
          '<div class="dp-info"><div class="dp-name">' + escHtml(p.label) + '</div>' +
          '<div class="dp-size">' + p.width + ' x ' + p.height + ' px</div></div></div>';
      });
      html += '</div>';
      body.innerHTML = html;
    }

    function filterDcmPresets() {
      var q = document.getElementById('dcmSearch').value.toLowerCase();
      if (!q) { dcmSelectCategory(dcmActiveCategory); return; }
      var filtered = CANVAS_PRESETS.filter(function(p) {
        return p.label.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.width + 'x' + p.height).includes(q);
      });
      renderDcmPresets(filtered);
    }

    function dcmCreate(label, w, h) {
      fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: label, canvasSize: { width: w, height: h } })
      }).then(function(r) { return r.json(); })
        .then(function(d) { closeDcm(); window.location.href = '/preview/' + d.id; });
    }

    function dcmCreateCustom() {
      var w = parseInt(document.getElementById('dcmCustomW').value) || 1920;
      var h = parseInt(document.getElementById('dcmCustomH').value) || 1080;
      if (w < 100) w = 100; if (w > 10000) w = 10000;
      if (h < 100) h = 100; if (h > 10000) h = 10000;
      dcmCreate(w + 'x' + h + ' \u30c7\u30b6\u30a4\u30f3', w, h);
    }

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

    function deckCardHtml(d) {
      var favClass = d.favorite ? ' favorited' : '';
      var favIcon = d.favorite ? 'fa-solid fa-star' : 'fa-regular fa-star';
      return '<a href="/preview/' + d.id + '" class="deck-card" data-id="' + d.id + '">'
        + '<button class="fav-btn' + favClass + '" onclick="toggleFav(event,\\'' + d.id + '\\')" title="\u304a\u6c17\u306b\u5165\u308a"><i class="' + favIcon + '"></i></button>'
        + '<div class="card-overlay">'
        + '<button class="overlay-btn copy-id-btn" onclick="copyId(event,\\'' + d.id + '\\')" title="ID\u3092\u30b3\u30d4\u30fc"><i class="fa-regular fa-clipboard"></i> ' + d.id + '</button>'
        + '<button class="overlay-btn delete-btn" onclick="deleteDeck(event,\\'' + d.id + '\\')" title="\u524a\u9664"><i class="fa-solid fa-trash-can"></i></button>'
        + '</div>'
        + '<div class="deck-thumb" data-cw="' + (d.cw || 1920) + '" data-ch="' + (d.ch || 1080) + '"><iframe src="/api/decks/' + d.id + '/thumbnail" loading="lazy" scrolling="no" style="width:' + (d.cw || 1920) + 'px;height:' + (d.ch || 1080) + 'px"></iframe></div>'
        + '<div class="deck-info">'
        + '<div class="deck-title-row">'
        + '<span class="deck-title">' + escHtml(d.title) + '</span>'
        + '<button class="edit-title-btn" onclick="startEditTitle(event,\\'' + d.id + '\\')" title="\u540d\u524d\u3092\u5909\u66f4"><i class="fa-solid fa-pen" style="font-size:11px"></i></button>'
        + '</div>'
        + '<div class="deck-meta"><span class="deck-badge">' + d.slides + ' slides</span><span class="deck-date">' + formatDate(d.updatedAt) + '</span></div>'
        + '</div></a>';
    }

    function toggleFav(e, id) {
      e.preventDefault(); e.stopPropagation();
      var deck = allDecks.find(function(d) { return d.id === id; });
      if (!deck) return;
      deck.favorite = !deck.favorite;
      fetch('/api/decks/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: { favorite: deck.favorite } })
      });
      sortDecks();
      renderDecks();
    }

    function sortDecks() {
      allDecks.sort(function(a, b) {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    function renderDecks() {
      var homeGrid = document.getElementById('homeDecksGrid');
      var homeEmpty = document.getElementById('homeEmptyState');
      var projGrid = document.getElementById('projectsDecksGrid');
      var projEmpty = document.getElementById('projectsEmptyState');
      if (allDecks.length === 0) {
        if (homeGrid) homeGrid.style.display = 'none';
        if (homeEmpty) homeEmpty.style.display = '';
        if (projGrid) projGrid.style.display = 'none';
        if (projEmpty) projEmpty.style.display = '';
      } else {
        if (homeEmpty) homeEmpty.style.display = 'none';
        if (projEmpty) projEmpty.style.display = 'none';
        if (homeGrid) { homeGrid.style.display = ''; homeGrid.innerHTML = allDecks.slice(0, 8).map(deckCardHtml).join(''); }
        if (projGrid) { projGrid.style.display = ''; projGrid.innerHTML = allDecks.map(deckCardHtml).join(''); }
      }
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
    var pendingCanvasSize = null;
    function openCreateModal(canvasSize) {
      pendingCanvasSize = canvasSize || null;
      document.getElementById('createModal').classList.add('open');
      const input = document.getElementById('newDeckTitle');
      input.value = ''; input.focus();
    }
    function closeCreateModal() { document.getElementById('createModal').classList.remove('open'); pendingCanvasSize = null; }
    function createNewDeck() {
      const title = document.getElementById('newDeckTitle').value.trim() || 'Untitled';
      var body = { title: title };
      if (pendingCanvasSize) body.canvasSize = pendingCanvasSize;
      fetch('/api/decks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
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

    // Render template cards from seeded decks - click to open preview
    (function renderTemplateCards() {
      var SEED_TEMPLATES = ${templatesJson};
      var grids = [document.getElementById('templatesGrid'), document.getElementById('homeTemplatesGrid')];
      grids.forEach(function(grid) {
        if (!grid) return;
        SEED_TEMPLATES.forEach(function(tpl) {
          var blob = new Blob([tpl.firstHtml], { type: 'text/html' });
          var blobUrl = URL.createObjectURL(blob);
          var card = document.createElement('div');
          card.className = 'template-card';
          card.onclick = function() { window.location.href = '/preview/' + tpl.id; };
          card.innerHTML = '<div class="t-thumb"><iframe src="' + blobUrl + '" scrolling="no" loading="lazy"></iframe></div>' +
            '<div class="t-body"><div class="t-name">' + tpl.title + '</div>' +
            '<div class="t-desc">' + tpl.desc + '</div>' +
            '<div class="t-count"><i class="fa-solid fa-layer-group" style="font-size:10px"></i> ' + tpl.slideCount + '\u30da\u30fc\u30b8</div></div>';
          grid.appendChild(card);
        });
      });
      requestAnimationFrame(function() {
        document.querySelectorAll('.template-card .t-thumb').forEach(function(w) {
          var iframe = w.querySelector('iframe');
          if (iframe && w.clientWidth > 0) iframe.style.transform = 'scale(' + (w.clientWidth / 1280) + ')';
        });
      });
      window.addEventListener('resize', function() {
        document.querySelectorAll('.template-card .t-thumb').forEach(function(w) {
          var iframe = w.querySelector('iframe');
          if (iframe && w.clientWidth > 0) iframe.style.transform = 'scale(' + (w.clientWidth / 1280) + ')';
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

    // ===== Built-in Templates Catalog =====
    var builtInTemplates = [];
    var builtInActiveFormat = null;

    function loadBuiltInTemplates() {
      fetch('/api/built-in-templates').then(function(r) { return r.json(); }).then(function(data) {
        builtInTemplates = data;
        renderBuiltInFilters();
        renderBuiltInSections();
      }).catch(function() {});
    }

    function renderBuiltInFilters() {
      var formats = [];
      var seen = {};
      builtInTemplates.forEach(function(t) {
        if (!seen[t.format]) { seen[t.format] = true; formats.push(t.format); }
      });
      var container = document.getElementById('builtInFilterBtns');
      if (!container) return;
      var html = '<button class="filter-chip' + (!builtInActiveFormat ? ' active' : '') + '" onclick="filterBuiltIn(null)">\u3059\u3079\u3066</button>';
      var formatLabels = { '16:9': '\u30d7\u30ec\u30bc\u30f3', 'instagram-post': 'IG\u6295\u7a3f', 'instagram-story': 'IG\u30b9\u30c8\u30fc\u30ea\u30fc', 'youtube-thumbnail': 'YouTube', 'x-post': 'X', 'pinterest-pin': 'Pinterest', 'linkedin-post': 'LinkedIn', 'a4': 'A4\u5370\u5237' };
      formats.forEach(function(f) {
        html += '<button class="filter-chip' + (builtInActiveFormat === f ? ' active' : '') + '" onclick="filterBuiltIn(\\'' + f + '\\')">' + (formatLabels[f] || f) + '</button>';
      });
      container.innerHTML = html;
    }

    function filterBuiltIn(format) {
      builtInActiveFormat = format;
      renderBuiltInFilters();
      renderBuiltInSections();
    }

    function renderBuiltInSections() {
      var container = document.getElementById('builtInSections');
      if (!container) return;
      var filtered = builtInActiveFormat ? builtInTemplates.filter(function(t) { return t.format === builtInActiveFormat; }) : builtInTemplates;
      // Group by format
      var groups = {};
      var groupOrder = [];
      filtered.forEach(function(t) {
        if (!groups[t.format]) { groups[t.format] = []; groupOrder.push(t.format); }
        groups[t.format].push(t);
      });
      var formatLabels = { '16:9': '\u30d7\u30ec\u30bc\u30f3\u30c6\u30fc\u30b7\u30e7\u30f3 (16:9)', 'instagram-post': 'Instagram \u6295\u7a3f (4:5)', 'instagram-story': 'Instagram \u30b9\u30c8\u30fc\u30ea\u30fc (9:16)', 'youtube-thumbnail': 'YouTube \u30b5\u30e0\u30cd\u30a4\u30eb', 'x-post': 'X \u30dd\u30b9\u30c8', 'pinterest-pin': 'Pinterest \u30d4\u30f3 (2:3)', 'linkedin-post': 'LinkedIn \u6295\u7a3f (1:1)', 'a4': 'A4 \u5370\u5237' };
      var html = '';
      groupOrder.forEach(function(fmt) {
        var templates = groups[fmt];
        html += '<div style="margin-bottom:32px">';
        html += '<h4 style="font-size:14px;font-weight:600;color:var(--h-sub);margin-bottom:12px">' + (formatLabels[fmt] || fmt) + ' <span style="font-size:12px;font-weight:400;opacity:0.7">(' + templates.length + ')</span></h4>';
        html += '<div style="display:flex;gap:14px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory">';
        templates.forEach(function(t) {
          var presetColors = { 'bold-signal': '#dc2626', 'electric-studio': '#6366f1', 'creative-voltage': '#e11d48', 'dark-botanical': '#3f6212', 'notebook-tabs': '#92400e', 'pastel-geometry': '#c084fc', 'split-pastel': '#f472b6', 'vintage-editorial': '#b45309', 'neon-cyber': '#06b6d4', 'terminal-green': '#22c55e', 'swiss-modern': '#2563eb', 'kyoto-classic': '#4338ca' };
          var color = presetColors[t.suggestedStylePreset] || '#6366f1';
          html += '<div class="bi-tmpl-card" onclick="showBuiltInDetail(\\'' + t.id + '\\')" style="scroll-snap-align:start">';
          html += '<div class="bi-tmpl-preview" style="border-top:3px solid ' + color + '"><i class="' + t.icon + '" style="color:' + color + ';font-size:24px"></i></div>';
          html += '<div class="bi-tmpl-body">';
          html += '<div class="bi-tmpl-name">' + escHtml(t.nameJa) + '</div>';
          html += '<div class="bi-tmpl-desc">' + escHtml(t.descriptionJa).substring(0, 40) + '...</div>';
          html += '<div class="bi-tmpl-tags">';
          t.tags.slice(0, 3).forEach(function(tag) { html += '<span class="bi-tag">' + escHtml(tag) + '</span>'; });
          html += '</div>';
          html += '</div></div>';
        });
        html += '</div></div>';
      });
      container.innerHTML = html;
    }

    function showBuiltInDetail(id) {
      fetch('/api/built-in-templates/' + id).then(function(r) { return r.json(); }).then(function(t) {
        var presetColors = { 'bold-signal': '#dc2626', 'electric-studio': '#6366f1', 'creative-voltage': '#e11d48', 'dark-botanical': '#3f6212', 'notebook-tabs': '#92400e', 'pastel-geometry': '#c084fc', 'split-pastel': '#f472b6', 'vintage-editorial': '#b45309', 'neon-cyber': '#06b6d4', 'terminal-green': '#22c55e', 'swiss-modern': '#2563eb', 'kyoto-classic': '#4338ca' };
        var color = presetColors[t.suggestedStylePreset] || '#6366f1';
        var slidesHtml = t.slides.map(function(s, i) {
          return '<div style="padding:8px 12px;border-left:2px solid ' + color + ';margin-bottom:8px;background:var(--h-input-bg);border-radius:0 4px 4px 0">' +
            '<div style="font-size:12px;font-weight:600">' + (i+1) + '. ' + escHtml(s.title) + '</div>' +
            '<div style="font-size:11px;color:var(--h-sub);margin-top:2px">' + escHtml(s.layout) + '</div></div>';
        }).join('');
        var modal = document.getElementById('templatePreviewModal');
        document.getElementById('previewTemplateName').textContent = t.nameJa;
        var container = modal.querySelector('.preview-slide-area');
        container.innerHTML = '<div style="padding:24px;max-height:60vh;overflow-y:auto">' +
          '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px"><i class="' + t.icon + '" style="font-size:28px;color:' + color + '"></i><div><div style="font-weight:600;font-size:16px">' + escHtml(t.nameJa) + '</div><div style="font-size:13px;color:var(--h-sub)">' + escHtml(t.name) + '</div></div></div>' +
          '<p style="font-size:13px;color:var(--h-sub);margin-bottom:16px">' + escHtml(t.descriptionJa) + '</p>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">' +
          '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:' + color + ';color:#fff">' + t.format + '</span>' +
          '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:var(--h-input-bg);color:var(--h-sub)">' + t.slideCount + '\u30da\u30fc\u30b8</span>' +
          '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:var(--h-input-bg);color:var(--h-sub)">' + t.suggestedStylePreset + '</span>' +
          '</div>' +
          '<h4 style="font-size:13px;font-weight:600;margin-bottom:8px">\u30b9\u30e9\u30a4\u30c9\u69cb\u6210</h4>' +
          slidesHtml +
          '<div style="margin-top:16px;padding:12px;background:var(--h-input-bg);border-radius:8px">' +
          '<div style="font-size:12px;font-weight:600;margin-bottom:4px">MCP\u3067\u4f5c\u6210</div>' +
          '<code style="font-size:11px;color:' + color + '">create_from_template templateId="' + t.id + '"</code>' +
          '</div></div>';
        modal.querySelector('.preview-nav').style.display = 'none';
        modal.querySelector('.preview-footer').innerHTML = '<button class="pf-copy" onclick="closeTemplatePreview()">\u9589\u3058\u308b</button><button class="pf-copy" onclick="navigator.clipboard.writeText(\\'' + t.id + '\\');this.textContent=\\'\\u2713 \\u30b3\\u30d4\\u30fc\\u6e08\\u307f\\'">\u2328 ID\u3092\u30b3\u30d4\u30fc</button>';
        modal.classList.add('open');
      });
    }

    loadBuiltInTemplates();

    // ===== Asset Tabs =====
    var currentAssetTab = 'logo';
    var uploadLabels = { logo: '\u30ed\u30b4\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9', photo: '\u5199\u771f\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9', icon: '\u30a2\u30a4\u30b3\u30f3\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9' };

    function switchAssetTab(tab) {
      currentAssetTab = tab;
      document.querySelectorAll('.asset-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.cat === tab); });
      document.querySelectorAll('.asset-tab-body').forEach(function(b) { b.classList.remove('active'); });
      if (tab === 'font') { document.getElementById('assetTabFont').classList.add('active'); loadFonts(); }
      else if (tab === 'color') { document.getElementById('assetTabColor').classList.add('active'); loadColors(); }
      else {
        document.getElementById('assetTabImage').classList.add('active');
        var label = document.getElementById('assetUploadLabel');
        if (label) label.textContent = uploadLabels[tab] || '\u753b\u50cf\u3092\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9';
        loadAssets();
      }
    }

    // ===== Global Assets =====
    function handleAssetUpload(files) {
      if (!files || !files.length) return;
      Array.from(files).forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          fetch('/api/assets', {
            method: 'POST',
            headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name), 'X-Category': currentAssetTab },
            body: e.target.result,
          })
          .then(function(r) { return r.ok ? r.json() : r.json().then(function(err) { throw new Error(err.error); }); })
          .then(function() { loadAssets(); })
          .catch(function(err) { alert('\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u5931\u6557: ' + err.message); });
        };
        reader.readAsArrayBuffer(file);
      });
    }

    function loadAssets() {
      var cat = currentAssetTab;
      if (cat === 'font' || cat === 'color') return;
      fetch('/api/assets?category=' + cat).then(function(r) { return r.json(); }).then(function(assets) {
        var grid = document.getElementById('assetsGrid');
        var empty = document.getElementById('assetsEmptyState');
        var count = document.getElementById('assetsCount');
        if (!assets || assets.length === 0) {
          grid.style.display = 'none';
          empty.style.display = '';
          count.textContent = '';
          return;
        }
        grid.style.display = '';
        empty.style.display = 'none';
        count.textContent = assets.length + '\u4ef6';
        grid.innerHTML = assets.map(function(a) {
          return '<div class="asset-card">'
            + '<button class="asset-copy" onclick="event.stopPropagation();copyAssetUrl(\\'' + a.id + '\\', \\'' + escHtml(a.url) + '\\')" title="URL\u3092\u30b3\u30d4\u30fc"><i class="fa-regular fa-clipboard"></i></button>'
            + '<button class="asset-delete" onclick="event.stopPropagation();deleteAsset(\\'' + a.id + '\\')" title="\u524a\u9664"><i class="fa-solid fa-xmark"></i></button>'
            + '<img src="' + escHtml(a.url) + '" alt="' + escHtml(a.originalName) + '" loading="lazy" />'
            + '<div class="asset-name">' + escHtml(a.originalName) + '</div>'
            + '</div>';
        }).join('');
      }).catch(function() {});
    }

    function copyAssetUrl(id, url) {
      var fullUrl = location.origin + url;
      navigator.clipboard.writeText(fullUrl).then(function() {
        var btn = document.querySelector('.asset-card .asset-copy');
        if (btn) { btn.innerHTML = '<i class="fa-solid fa-check"></i>'; setTimeout(function() { btn.innerHTML = '<i class="fa-regular fa-clipboard"></i>'; }, 1500); }
      });
    }

    function deleteAsset(id) {
      if (!confirm('\u3053\u306e\u7d20\u6750\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f')) return;
      fetch('/api/assets/' + id, { method: 'DELETE' }).then(function() { loadAssets(); });
    }

    // Asset drag & drop zone
    var assetZone = document.getElementById('assetDropZone');
    if (assetZone) {
      assetZone.addEventListener('dragover', function(e) { e.preventDefault(); assetZone.classList.add('dragover'); });
      assetZone.addEventListener('dragleave', function() { assetZone.classList.remove('dragover'); });
      assetZone.addEventListener('drop', function(e) { e.preventDefault(); assetZone.classList.remove('dragover'); if (e.dataTransfer.files.length) handleAssetUpload(e.dataTransfer.files); });
    }

    // ===== Colors =====
    var colorPicker = document.getElementById('colorPickerInput');
    var colorHex = document.getElementById('colorHexInput');
    if (colorPicker && colorHex) {
      colorPicker.addEventListener('input', function() { colorHex.value = colorPicker.value; });
      colorHex.addEventListener('input', function() { if (/^#[0-9a-fA-F]{6}$/.test(colorHex.value)) colorPicker.value = colorHex.value; });
    }

    function addColor() {
      var hex = document.getElementById('colorHexInput').value.trim();
      var name = document.getElementById('colorNameInput').value.trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) { alert('HEX\u30ab\u30e9\u30fc\u3092 #RRGGBB \u5f62\u5f0f\u3067\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044'); return; }
      fetch('/api/colors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hex: hex, name: name || undefined }) })
        .then(function(r) { return r.ok ? r.json() : r.json().then(function(err) { throw new Error(err.error); }); })
        .then(function() { document.getElementById('colorNameInput').value = ''; loadColors(); })
        .catch(function(err) { alert(err.message); });
    }

    function loadColors() {
      fetch('/api/colors').then(function(r) { return r.json(); }).then(function(colors) {
        var grid = document.getElementById('colorsGrid');
        var empty = document.getElementById('colorsEmptyState');
        if (!colors || colors.length === 0) { grid.innerHTML = ''; empty.style.display = ''; return; }
        empty.style.display = 'none';
        grid.innerHTML = colors.map(function(c) {
          return '<div class="color-swatch-wrap">'
            + '<div class="color-swatch" style="background:' + escHtml(c.hex) + '" onclick="copyColorHex(\\'' + escHtml(c.hex) + '\\')" title="\u30af\u30ea\u30c3\u30af\u3067\u30b3\u30d4\u30fc: ' + escHtml(c.hex) + '">'
            + '<button class="swatch-delete" onclick="event.stopPropagation();deleteColor(\\'' + c.id + '\\')" title="\u524a\u9664"><i class="fa-solid fa-xmark"></i></button>'
            + '</div>'
            + '<div class="color-swatch-label">' + escHtml(c.name || c.hex) + '</div>'
            + '</div>';
        }).join('');
      }).catch(function() {});
    }

    function copyColorHex(hex) {
      navigator.clipboard.writeText(hex).then(function() {
        showToast(hex + ' \u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f');
      });
    }

    function deleteColor(id) {
      if (!confirm('\u3053\u306e\u30ab\u30e9\u30fc\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f')) return;
      fetch('/api/colors/' + id, { method: 'DELETE' }).then(function() { loadColors(); });
    }

    // ===== Fonts =====
    function handleFontUpload(files) {
      if (!files || !files.length) return;
      Array.from(files).forEach(function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
          fetch('/api/fonts', {
            method: 'POST',
            headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) },
            body: e.target.result,
          })
          .then(function(r) { return r.ok ? r.json() : r.json().then(function(err) { throw new Error(err.error); }); })
          .then(function() { loadFonts(); })
          .catch(function(err) { alert('\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u5931\u6557: ' + err.message); });
        };
        reader.readAsArrayBuffer(file);
      });
    }

    function addGoogleFont() {
      var family = document.getElementById('googleFontInput').value.trim();
      if (!family) { alert('Google Fonts\u306e\u30d5\u30a1\u30df\u30ea\u30fc\u540d\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044'); return; }
      fetch('/api/fonts/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ family: family }) })
        .then(function(r) { return r.ok ? r.json() : r.json().then(function(err) { throw new Error(err.error); }); })
        .then(function() { document.getElementById('googleFontInput').value = ''; loadFonts(); })
        .catch(function(err) { alert(err.message); });
    }

    function loadFonts() {
      fetch('/api/fonts').then(function(r) { return r.json(); }).then(function(fonts) {
        var grid = document.getElementById('fontsGrid');
        var empty = document.getElementById('fontsEmptyState');
        if (!fonts || fonts.length === 0) { grid.innerHTML = ''; empty.style.display = ''; return; }
        empty.style.display = 'none';
        grid.innerHTML = fonts.map(function(f) {
          var typeLabel = f.type === 'google' ? 'Google' : 'Upload';
          var preview = f.type === 'google'
            ? '<span style="font-family:\\'' + escHtml(f.googleFamily) + '\\',sans-serif">Aa\u3042\u3044\u3046</span>'
            : '<span>' + escHtml(f.name) + '</span>';
          return '<div class="font-item">'
            + '<div class="font-name">' + escHtml(f.name) + '</div>'
            + '<span class="font-type">' + typeLabel + '</span>'
            + '<button class="font-delete" onclick="deleteFont(\\'' + f.id + '\\')" title="\u524a\u9664"><i class="fa-solid fa-trash"></i></button>'
            + '</div>';
        }).join('');
        // Load Google Fonts CSS for previews
        var googleFonts = fonts.filter(function(f) { return f.type === 'google'; });
        if (googleFonts.length > 0) {
          var families = googleFonts.map(function(f) { return f.googleFamily.replace(/ /g, '+'); }).join('&family=');
          var link = document.getElementById('googleFontsLink');
          if (!link) { link = document.createElement('link'); link.id = 'googleFontsLink'; link.rel = 'stylesheet'; document.head.appendChild(link); }
          link.href = 'https://fonts.googleapis.com/css2?family=' + families + '&display=swap';
        }
      }).catch(function() {});
    }

    function deleteFont(id) {
      if (!confirm('\u3053\u306e\u30d5\u30a9\u30f3\u30c8\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f')) return;
      fetch('/api/fonts/' + id, { method: 'DELETE' }).then(function() { loadFonts(); });
    }

    loadAssets();

    // Copy deck ID
    function copyId(e, id) {
      e.preventDefault(); e.stopPropagation();
      navigator.clipboard.writeText(id).then(() => {
        const btn = e.currentTarget;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> \u30b3\u30d4\u30fc\u6e08\u307f';
        setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-clipboard"></i> ' + id; }, 1500);
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
        const cw = parseInt(thumb.dataset.cw) || 1920;
        const ch = parseInt(thumb.dataset.ch) || 1080;
        var tw = thumb.clientWidth;
        var th = thumb.clientHeight;
        if (tw <= 0 || th <= 0) return;
        var scale = Math.min(tw / cw, th / ch);
        iframe.style.transform = 'scale(' + scale + ')';
        iframe.style.left = ((tw - cw * scale) / 2) + 'px';
        iframe.style.top = ((th - ch * scale) / 2) + 'px';
      });
    }
    window.addEventListener('resize', function() { scaleThumbs(); scaleTemplateThumbs(); });

    // Theme
    function toggleTheme() {
      const html = document.documentElement;
      const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.dataset.theme = next;
      document.getElementById('themeToggle').innerHTML = next === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
      localStorage.setItem('slideharness-theme', next);
    }
    (function initTheme() {
      const saved = localStorage.getItem('slideharness-theme');
      if (saved) {
        document.documentElement.dataset.theme = saved;
        document.getElementById('themeToggle').innerHTML = saved === 'dark' ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
      }
    })();

    renderCategories();
    sortDecks();
    renderDecks();
    // Hash navigation restore
    (function initPage() {
      var hash = location.hash.replace('#', '');
      if (['home', 'projects', 'templates', 'assets'].indexOf(hash) >= 0) {
        switchPage(hash);
      }
    })();
    window.addEventListener('load', function() { scaleThumbs(); scaleTemplateThumbs(); });
    window.addEventListener('hashchange', function() {
      var hash = location.hash.replace('#', '');
      if (['home', 'projects', 'templates', 'assets'].indexOf(hash) >= 0) {
        switchPage(hash);
      }
    });
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
