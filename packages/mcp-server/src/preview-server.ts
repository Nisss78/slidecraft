import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';
import type { Deck, JsonFileStorage } from '@slidecraft/core';
import { createDeck, deleteSlideFromDeck, reorderSlides, updateDeckMeta } from '@slidecraft/core';
import { exportToPdf, exportToPptx } from '@slidecraft/export';

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
      res.type('html').send(html);
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
      res.type('html').send(html);
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
      let editableHtml = html.replace(/<body/i, '<body contenteditable="true"');
      editableHtml = editableHtml.replace(/<\/body>/i, '<script src="/editor-inject.js"></script>\n</body>');
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
      const outPath = join(tmpdir(), `slidecraft-${deck.id}-${Date.now()}.pdf`);
      const result = await exportToPdf(deck, slideHtmls, outPath);
      if (!result.success) { res.status(500).json({ error: result.error }); return; }
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
      const outPath = join(tmpdir(), `slidecraft-${deck.id}-${Date.now()}.pptx`);
      const result = await exportToPptx(deck, slideHtmls, outPath);
      if (!result.success) { res.status(500).json({ error: result.error }); return; }
      res.download(outPath, `${deck.title}.pptx`, () => { unlink(outPath).catch(() => {}); });
    });

    // Preview page with code view
    this.app.get('/preview/:deckId', async (req, res) => {
      const deck = await this.storage.loadDeck(req.params.deckId);
      if (!deck) { res.status(404).send('Deck not found'); return; }

      const slidesMetaJson = JSON.stringify(
        deck.slides.map((s, i) => ({ index: i, id: s.id, title: s.title || `Slide ${i + 1}` })),
      );

      res.type('html').send(`<!DOCTYPE html>
<html lang="ja" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(deck.title)} - SlideCraft</title>
  <style>
    :root {
      --bg: #ffffff; --text: #202124; --header-bg: rgba(255,255,255,0.95); --header-border: #e0e0e0;
      --sidebar-bg: #f8f9fa; --sidebar-border: #e0e0e0; --thumb-bg: #f1f3f4;
      --accent: #818cf8; --accent-hover: #6366f1; --meta-text: #5f6368; --link: #6366f1;
      --code-bg: #f8f9fa; --code-text: #334155; --panel-bg: #f1f3f4; --panel-border: #e0e0e0;
      --overlay-bg: rgba(0,0,0,0.05); --badge-bg: rgba(99,102,241,0.1); --badge-text: #6366f1;
      --btn-border: rgba(0,0,0,0.15); --btn-text: #5f6368; --slide-shadow: rgba(0,0,0,0.15);
      --export-menu-bg: #ffffff; --export-hover: rgba(99,102,241,0.08); --export-text: #202124;
    }
    [data-theme="dark"] {
      --bg: #0f0f23; --text: #e0e0e0; --header-bg: rgba(15,15,35,0.95); --header-border: rgba(255,255,255,0.1);
      --sidebar-bg: #13132b; --sidebar-border: rgba(255,255,255,0.08); --thumb-bg: #1e1e2e;
      --meta-text: #888; --link: #818cf8;
      --code-bg: transparent; --code-text: #cbd5e1; --panel-bg: #1a1b2e; --panel-border: rgba(255,255,255,0.08);
      --overlay-bg: rgba(255,255,255,0.08); --badge-bg: rgba(129,140,248,0.15); --badge-text: #818cf8;
      --btn-border: rgba(255,255,255,0.15); --btn-text: #94a3b8; --slide-shadow: rgba(0,0,0,0.5);
      --export-menu-bg: #1a1b2e; --export-hover: rgba(129,140,248,0.15); --export-text: #e2e8f0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Sans', sans-serif; overflow: hidden; height: 100vh; display: flex; flex-direction: column; }

    .header { flex-shrink: 0; z-index: 100; background: var(--header-bg); backdrop-filter: blur(10px); border-bottom: 1px solid var(--header-border); padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-left a { color: var(--link); text-decoration: none; font-size: 14px; }
    .header-left a:hover { text-decoration: underline; }
    .header h1 { font-size: 17px; font-weight: 600; cursor: pointer; }
    .header h1:hover { color: var(--accent); }
    .header .meta { font-size: 12px; color: var(--meta-text); display: flex; align-items: center; gap: 8px; }
    .deck-id-code { font-family: 'SF Mono', monospace; font-size: 11px; background: var(--overlay-bg); padding: 1px 6px; border-radius: 3px; cursor: pointer; }
    .deck-id-code:hover { background: rgba(129,140,248,0.3); }
    .title-edit-input { font-size: 17px; font-weight: 600; color: var(--text); background: var(--overlay-bg); border: 1px solid var(--accent); border-radius: 4px; padding: 2px 8px; outline: none; width: 300px; }
    .header-right { display: flex; align-items: center; gap: 12px; }
    .status { display: flex; align-items: center; gap: 6px; font-size: 12px; }
    .status-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; animation: pulse 2s infinite; }
    .status-dot.disconnected { background: #ef4444; animation: none; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }

    .tab-group { display: flex; gap: 2px; background: rgba(255,255,255,0.08); border-radius: 8px; padding: 3px; }
    .tab-btn { padding: 6px 14px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; color: #94a3b8; background: transparent; transition: all 0.15s; }
    .tab-btn:hover { color: var(--text); }
    .tab-btn.active { background: var(--accent); color: #fff; }

    .main { flex: 1; display: flex; overflow: hidden; }

    .sidebar { width: 200px; flex-shrink: 0; overflow-y: auto; background: var(--sidebar-bg); border-right: 1px solid var(--sidebar-border); padding: 12px; display: flex; flex-direction: column; gap: 8px; }
    .thumb-item { cursor: pointer; border-radius: 6px; overflow: hidden; border: 2px solid transparent; transition: border-color 0.15s, opacity 0.15s; position: relative; }
    .thumb-item:hover { border-color: rgba(129,140,248,0.3); }
    .thumb-item.selected { border-color: var(--accent); }
    .thumb-item.dragging { opacity: 0.4; }
    .thumb-item.drag-over { border-top: 3px solid var(--accent); }
    .thumb-label { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); padding: 4px 8px; font-size: 11px; color: #e2e8f0; }
    .thumb-iframe-wrap { width: 100%; aspect-ratio: 16/9; overflow: hidden; position: relative; background: var(--thumb-bg); }
    .thumb-iframe-wrap iframe { width: 1920px; height: 1080px; border: none; pointer-events: none; transform-origin: top left; position: absolute; top: 0; left: 0; }

    .slide-area { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px; overflow: hidden; }
    .slide-frame { width: 100%; max-width: 960px; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; box-shadow: 0 8px 32px var(--slide-shadow); background: #fff; position: relative; }
    .slide-frame iframe { width: 1920px; height: 1080px; border: none; transform-origin: top left; position: absolute; top: 0; left: 0; }

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
    .copy-btn.copied { border-color: #34d399; color: #34d399; }

    .export-wrap { position: relative; }
    .export-btn { padding: 6px 14px; border: 1px solid var(--btn-border); border-radius: 6px; background: transparent; color: var(--btn-text); cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.15s; }
    .export-btn:hover { border-color: var(--accent); color: var(--accent); }
    .export-menu { display: none; position: absolute; top: 100%; right: 0; margin-top: 4px; background: var(--export-menu-bg); border: 1px solid var(--btn-border); border-radius: 8px; overflow: hidden; min-width: 160px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 200; }
    .export-menu.open { display: block; }
    .export-menu a { display: block; padding: 10px 16px; color: var(--export-text); text-decoration: none; font-size: 13px; transition: background 0.1s; }
    .export-menu a:hover { background: var(--export-hover); }

    .theme-toggle { padding: 6px 10px; border: 1px solid var(--btn-border); border-radius: 6px; background: transparent; color: var(--btn-text); cursor: pointer; font-size: 16px; transition: all 0.15s; line-height: 1; }
    .theme-toggle:hover { border-color: var(--accent); }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <a href="/">\\u2190 \\u30db\\u30fc\\u30e0</a>
      <div>
        <h1 id="deckTitle" onclick="startEditDeckTitle()">${escHtml(deck.title)}</h1>
        <div class="meta">
          ${deck.slides.length} slides \\u00b7 v2 HTML-first \\u00b7
          <code class="deck-id-code" onclick="copyDeckId()" title="\\u30af\\u30ea\\u30c3\\u30af\\u3067\\u30b3\\u30d4\\u30fc">${deck.id}</code>
        </div>
      </div>
    </div>
    <div class="header-right">
      <div class="tab-group">
        <button class="tab-btn active" onclick="setView('preview')">\\u30d7\\u30ec\\u30d3\\u30e5\\u30fc</button>
        <button class="tab-btn" onclick="setView('code')">\\ud83d\\udcbb HTML\\u30bd\\u30fc\\u30b9</button>
      </div>
      <div class="export-wrap">
        <button class="export-btn" onclick="toggleExportMenu()">\\u2b07 \\u30a8\\u30af\\u30b9\\u30dd\\u30fc\\u30c8</button>
        <div class="export-menu" id="exportMenu">
          <a href="/api/decks/${deck.id}/export/pdf" download>\\ud83d\\udcc4 PDF</a>
          <a href="/api/decks/${deck.id}/export/pptx" download>\\ud83d\\udcca PPTX</a>
        </div>
      </div>
      <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="\\u30c6\\u30fc\\u30de\\u5207\\u66ff">\\ud83c\\udf19</button>
      <div class="status"><div class="status-dot" id="statusDot"></div><span id="statusText">Live</span></div>
    </div>
  </div>

  <div class="main">
    <div class="sidebar" id="sidebar"></div>
    <div class="slide-area">
      <div class="slide-frame">
        <iframe id="mainSlide" src="about:blank"></iframe>
      </div>
    </div>
    <div class="code-panel" id="codePanel">
      <div class="code-header">
        <h3>HTML \\u30bd\\u30fc\\u30b9</h3>
        <button class="copy-btn" onclick="copyCode()" id="copyBtn">\\u30b3\\u30d4\\u30fc</button>
      </div>
      <div class="slide-info" id="slideInfo">
        <span class="badge" id="slideInfoBadge">Slide 1</span>
        <span id="slideInfoTitle"></span>
      </div>
      <div class="code-body">
        <pre class="code-block" id="codeContent"></pre>
      </div>
    </div>
  </div>

  <script>
    const deckId = '${deck.id}';
    let deckTitle = '${escHtml(deck.title).replace(/'/g, "\\\\'")}';
    const slidesMeta = ${slidesMetaJson};
    let selectedIdx = 0;
    let codeOpen = false;
    let dragSrcIdx = null;

    function buildSidebar() {
      const sidebar = document.getElementById('sidebar');
      sidebar.innerHTML = slidesMeta.map((s, i) => {
        const url = '/api/decks/' + deckId + '/slides/' + s.id + '/html';
        return '<div class="thumb-item' + (i === selectedIdx ? ' selected' : '') + '" data-idx="' + i + '" draggable="true" onclick="selectSlide(' + i + ')">' +
          '<div class="thumb-iframe-wrap"><iframe src="' + url + '" loading="lazy" scrolling="no"></iframe></div>' +
          '<div class="thumb-label">' + (i + 1) + '. ' + (s.title || 'Slide') + '</div>' +
        '</div>';
      }).join('');
      // Attach drag events
      sidebar.querySelectorAll('.thumb-item').forEach(el => {
        el.addEventListener('dragstart', onDragStart);
        el.addEventListener('dragover', onDragOver);
        el.addEventListener('dragleave', onDragLeave);
        el.addEventListener('drop', onDrop);
        el.addEventListener('dragend', onDragEnd);
      });
      scaleThumbIframes();
    }

    // Drag & Drop
    function onDragStart(e) {
      dragSrcIdx = parseInt(e.currentTarget.dataset.idx);
      e.currentTarget.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    }
    function onDragOver(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      e.currentTarget.classList.add('drag-over');
    }
    function onDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
    function onDragEnd(e) {
      e.currentTarget.classList.remove('dragging');
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    }
    function onDrop(e) {
      e.preventDefault();
      e.currentTarget.classList.remove('drag-over');
      const targetIdx = parseInt(e.currentTarget.dataset.idx);
      if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
      const moved = slidesMeta.splice(dragSrcIdx, 1)[0];
      slidesMeta.splice(targetIdx, 0, moved);
      // Update indices
      slidesMeta.forEach((s, i) => s.index = i);
      selectedIdx = targetIdx;
      buildSidebar();
      selectSlide(selectedIdx);
      // Save to server
      fetch('/api/decks/' + deckId + '/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideIds: slidesMeta.map(s => s.id) })
      });
      dragSrcIdx = null;
    }

    function selectSlide(idx) {
      selectedIdx = idx;
      const slide = slidesMeta[idx];
      document.getElementById('mainSlide').src = '/api/decks/' + deckId + '/slides/' + slide.id + '/html';
      document.querySelectorAll('.thumb-item').forEach((el, i) => {
        el.classList.toggle('selected', i === idx);
      });
      if (codeOpen) loadCode();
    }

    // Inline deck title edit
    function startEditDeckTitle() {
      const h1 = document.getElementById('deckTitle');
      const input = document.createElement('input');
      input.className = 'title-edit-input';
      input.value = deckTitle;
      h1.replaceWith(input);
      input.focus(); input.select();
      function save() {
        const newTitle = input.value.trim() || deckTitle;
        deckTitle = newTitle;
        const newH1 = document.createElement('h1');
        newH1.id = 'deckTitle';
        newH1.textContent = newTitle;
        newH1.onclick = startEditDeckTitle;
        input.replaceWith(newH1);
        document.title = newTitle + ' - SlideCraft';
        if (newTitle !== deckTitle) {
          fetch('/api/decks/' + deckId, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }) });
        }
      }
      input.addEventListener('blur', save);
      input.addEventListener('keydown', ev => {
        if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
        if (ev.key === 'Escape') { input.value = deckTitle; input.blur(); }
      });
    }

    // Copy deck ID
    function copyDeckId() {
      navigator.clipboard.writeText(deckId).then(() => {
        const el = document.querySelector('.deck-id-code');
        const orig = el.textContent;
        el.textContent = '\\u2713 \\u30b3\\u30d4\\u30fc\\u6e08\\u307f';
        setTimeout(() => { el.textContent = orig; }, 1500);
      });
    }

    function setView(mode) {
      const btns = document.querySelectorAll('.tab-btn');
      const panel = document.getElementById('codePanel');
      if (mode === 'code') {
        codeOpen = true;
        panel.classList.add('open');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
        loadCode();
      } else {
        codeOpen = false;
        panel.classList.remove('open');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
      }
      setTimeout(scaleMainSlide, 350);
    }

    function loadCode() {
      const slide = slidesMeta[selectedIdx];
      document.getElementById('slideInfoBadge').textContent = 'Slide ' + (selectedIdx + 1);
      document.getElementById('slideInfoTitle').textContent = slide.title || '';
      fetch('/api/decks/' + deckId + '/slides/' + slide.id + '/html')
        .then(r => r.text())
        .then(html => { document.getElementById('codeContent').textContent = html; });
    }

    function copyCode() {
      const text = document.getElementById('codeContent').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.textContent = '\\u2713 \\u30b3\\u30d4\\u30fc\\u6e08\\u307f';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = '\\u30b3\\u30d4\\u30fc'; btn.classList.remove('copied'); }, 2000);
      });
    }

    // Export menu
    function toggleExportMenu() {
      document.getElementById('exportMenu').classList.toggle('open');
    }
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.export-wrap')) document.getElementById('exportMenu').classList.remove('open');
    });

    let ws;
    function connectWs() {
      ws = new WebSocket('ws://' + location.host);
      ws.onopen = () => {
        document.getElementById('statusDot').className = 'status-dot';
        document.getElementById('statusText').textContent = 'Live';
        ws.send(JSON.stringify({ type: 'subscribe', deckId }));
      };
      ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.type === 'deck-updated' && m.deckId === deckId) {
          document.getElementById('mainSlide').src = document.getElementById('mainSlide').src;
          buildSidebar();
          setTimeout(() => selectSlide(selectedIdx), 100);
          if (codeOpen) loadCode();
        }
      };
      ws.onclose = () => {
        document.getElementById('statusDot').className = 'status-dot disconnected';
        document.getElementById('statusText').textContent = 'Disconnected';
        setTimeout(connectWs, 2000);
      };
    }

    function scaleMainSlide() {
      const frame = document.querySelector('.slide-frame');
      const iframe = document.getElementById('mainSlide');
      if (!frame || !iframe) return;
      const scale = frame.clientWidth / 1920;
      iframe.style.transform = 'scale(' + scale + ')';
    }

    function scaleThumbIframes() {
      document.querySelectorAll('.thumb-iframe-wrap').forEach(wrap => {
        const iframe = wrap.querySelector('iframe');
        if (!iframe) return;
        const scale = wrap.clientWidth / 1920;
        iframe.style.transform = 'scale(' + scale + ')';
      });
    }

    // Theme
    function toggleTheme() {
      const html = document.documentElement;
      const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
      html.dataset.theme = next;
      document.getElementById('themeToggle').textContent = next === 'dark' ? '\\ud83c\\udf19' : '\\u2600\\ufe0f';
      localStorage.setItem('slidecraft-theme', next);
    }
    (function initTheme() {
      const saved = localStorage.getItem('slidecraft-theme');
      if (saved) {
        document.documentElement.dataset.theme = saved;
        document.getElementById('themeToggle').textContent = saved === 'dark' ? '\\ud83c\\udf19' : '\\u2600\\ufe0f';
      }
    })();

    buildSidebar();
    if (slidesMeta.length > 0) selectSlide(0);
    connectWs();
    requestAnimationFrame(() => { scaleMainSlide(); scaleThumbIframes(); });
    window.addEventListener('resize', () => { scaleMainSlide(); scaleThumbIframes(); });
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
  <title>SlideCraft</title>
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
    .search-bar::before { content: '\\ud83d\\udd0d'; position: absolute; left: 16px; top: 50%; transform: translateY(-50%); font-size: 18px; opacity: 0.5; }
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

    @media (max-width: 768px) { .section-recent { padding-left: 20px; padding-right: 20px; } .search-bar { margin: 0 16px; } }
  </style>
</head>
<body>
  <div class="top-header">
    <div class="logo">
      <div class="logo-icon">SC</div>
      <div class="logo-text"><span>SlideCraft</span> <span class="version-badge">v2</span></div>
    </div>
    <div class="search-bar">
      <input type="text" placeholder="\\u691c\\u7d22" id="searchInput" oninput="filterDecks()" />
    </div>
    <div class="header-actions">
      <button class="theme-toggle" id="themeToggle" onclick="toggleTheme()" title="\\u30c6\\u30fc\\u30de\\u5207\\u66ff">\\u2600\\ufe0f</button>
      <div class="status-badge"><div class="dot"></div>MCP\\u63a5\\u7d9a\\u4e2d</div>
    </div>
  </div>

  <div class="section-recent">
    <div class="section-header">
      <h2>\\u6700\\u8fd1\\u4f7f\\u7528\\u3057\\u305f\\u30d7\\u30ec\\u30bc\\u30f3\\u30c6\\u30fc\\u30b7\\u30e7\\u30f3</h2>
      <button class="create-btn" onclick="openCreateModal()">+ \\u65b0\\u898f\\u4f5c\\u6210</button>
    </div>
    <div class="decks-grid" id="decksGrid"></div>
    <div class="empty-state" id="emptyState" style="display:none">
      <div class="icon">\\ud83c\\udfa8</div>
      <h3>\\u30d7\\u30ec\\u30bc\\u30f3\\u30c6\\u30fc\\u30b7\\u30e7\\u30f3\\u304c\\u307e\\u3060\\u3042\\u308a\\u307e\\u305b\\u3093</h3>
      <p>\\u300c+ \\u65b0\\u898f\\u4f5c\\u6210\\u300d\\u30dc\\u30bf\\u30f3\\u307e\\u305f\\u306fClaude Code\\u306eMCP\\u30c4\\u30fc\\u30eb\\u3067\\u30d7\\u30ec\\u30bc\\u30f3\\u30c6\\u30fc\\u30b7\\u30e7\\u30f3\\u3092\\u4f5c\\u6210\\u3057\\u307e\\u3057\\u3087\\u3046\\u3002</p>
    </div>
  </div>

  <div class="modal-bg" id="createModal">
    <div class="modal">
      <h3>\\u65b0\\u898f\\u30d7\\u30ec\\u30bc\\u30f3\\u30c6\\u30fc\\u30b7\\u30e7\\u30f3</h3>
      <input type="text" id="newDeckTitle" placeholder="\\u30bf\\u30a4\\u30c8\\u30eb\\u3092\\u5165\\u529b" autofocus />
      <div class="modal-actions">
        <button class="btn-cancel" onclick="closeCreateModal()">\\u30ad\\u30e3\\u30f3\\u30bb\\u30eb</button>
        <button class="btn-primary" onclick="createNewDeck()">\\u4f5c\\u6210</button>
      </div>
    </div>
  </div>

  <script>
    const allDecks = ${decksJson};

    function formatDate(iso) {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return '\\u305f\\u3063\\u305f\\u4eca';
      if (diffMins < 60) return diffMins + '\\u5206\\u524d';
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return diffHours + '\\u6642\\u9593\\u524d';
      return d.getFullYear() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0');
    }

    function renderDecks() {
      const grid = document.getElementById('decksGrid');
      const empty = document.getElementById('emptyState');
      if (allDecks.length === 0) { grid.style.display = 'none'; empty.style.display = ''; return; }
      empty.style.display = 'none'; grid.style.display = '';
      grid.innerHTML = allDecks.map(d => '<a href="/preview/' + d.id + '" class="deck-card" data-id="' + d.id + '">'
        + '<div class="card-overlay">'
        + '<button class="overlay-btn copy-id-btn" onclick="copyId(event,\\'' + d.id + '\\')" title="ID\\u3092\\u30b3\\u30d4\\u30fc">\\ud83d\\udccb ' + d.id + '</button>'
        + '<button class="overlay-btn delete-btn" onclick="deleteDeck(event,\\'' + d.id + '\\')" title="\\u524a\\u9664">\\ud83d\\uddd1</button>'
        + '</div>'
        + '<div class="deck-thumb"><iframe src="/api/decks/' + d.id + '/thumbnail" loading="lazy" scrolling="no"></iframe></div>'
        + '<div class="deck-info">'
        + '<div class="deck-title-row">'
        + '<span class="deck-title">' + escHtml(d.title) + '</span>'
        + '<button class="edit-title-btn" onclick="startEditTitle(event,\\'' + d.id + '\\')" title="\\u540d\\u524d\\u3092\\u5909\\u66f4">\\u270f\\ufe0f</button>'
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

    // Copy deck ID
    function copyId(e, id) {
      e.preventDefault(); e.stopPropagation();
      navigator.clipboard.writeText(id).then(() => {
        const btn = e.currentTarget;
        btn.textContent = '\\u2713 \\u30b3\\u30d4\\u30fc\\u6e08\\u307f';
        setTimeout(() => { btn.textContent = '\\ud83d\\udccb ' + id; }, 1500);
      });
    }

    // Delete deck
    function deleteDeck(e, id) {
      e.preventDefault(); e.stopPropagation();
      if (!confirm('\\u3053\\u306e\\u30d7\\u30ec\\u30bc\\u30f3\\u30c6\\u30fc\\u30b7\\u30e7\\u30f3\\u3092\\u524a\\u9664\\u3057\\u307e\\u3059\\u304b\\uff1f')) return;
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
      document.getElementById('themeToggle').textContent = next === 'dark' ? '\\ud83c\\udf19' : '\\u2600\\ufe0f';
      localStorage.setItem('slidecraft-theme', next);
    }
    (function initTheme() {
      const saved = localStorage.getItem('slidecraft-theme');
      if (saved) {
        document.documentElement.dataset.theme = saved;
        document.getElementById('themeToggle').textContent = saved === 'dark' ? '\\ud83c\\udf19' : '\\u2600\\ufe0f';
      }
    })();

    renderDecks();
    window.addEventListener('load', scaleThumbs);
  </script>
</body>
</html>`);
    });
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
