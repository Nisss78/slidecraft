import { readFile, writeFile, mkdir, readdir, unlink, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import type { Deck } from './schema.js';
import { DeckSchema } from './schema.js';

export interface TemplateMeta {
  id: string;
  name: string;
  filename: string;
  createdAt: string;
  slideCount?: number;
  colors?: string[];
  fonts?: string[];
}

export interface StorageAdapter {
  saveDeck(deck: Deck): Promise<void>;
  loadDeck(id: string): Promise<Deck | null>;
  listDecks(): Promise<Deck[]>;
  deleteDeck(id: string): Promise<boolean>;
  saveSlideHtml(deckId: string, slideId: string, html: string): Promise<void>;
  loadSlideHtml(deckId: string, slideId: string): Promise<string | null>;
  deleteSlideHtml(deckId: string, slideId: string): Promise<boolean>;
  listSlideIds(deckId: string): Promise<string[]>;
  getStoragePath(): string;
  saveTemplate(id: string, meta: TemplateMeta, fileBuffer: Buffer): Promise<void>;
  loadTemplateMeta(id: string): Promise<TemplateMeta | null>;
  loadTemplateFile(id: string): Promise<{ buffer: Buffer; filename: string } | null>;
  listTemplates(): Promise<TemplateMeta[]>;
  deleteTemplate(id: string): Promise<boolean>;
  saveImage(deckId: string, filename: string, buffer: Buffer): Promise<void>;
  getImagePath(deckId: string, filename: string): string;
  listImages(deckId: string): Promise<Array<{ filename: string; size: number; createdAt: string }>>;
  deleteImage(deckId: string, filename: string): Promise<boolean>;
}

/**
 * v2 Directory-based storage:
 *   .slideharness/decks/{deckId}/
 *     deck.json
 *     slides/
 *       {slideId}.html
 */
export class JsonFileStorage implements StorageAdapter {
  private basePath: string;
  private templatesPath: string;
  private cache = new Map<string, Deck>();
  private writeLocks = new Map<string, Promise<void>>();

  constructor(basePath?: string) {
    this.basePath = basePath || join(homedir(), '.slideharness', 'decks');
    this.templatesPath = join(this.basePath, '..', 'templates');
  }

  getStoragePath(): string {
    return this.basePath;
  }

  private deckDir(id: string): string {
    return join(this.basePath, id);
  }

  private deckJsonPath(id: string): string {
    return join(this.deckDir(id), 'deck.json');
  }

  private slidesDir(deckId: string): string {
    return join(this.deckDir(deckId), 'slides');
  }

  private slideHtmlPath(deckId: string, slideId: string): string {
    return join(this.slidesDir(deckId), `${slideId}.html`);
  }

  private imagesDir(deckId: string): string {
    return join(this.deckDir(deckId), 'images');
  }

  private async ensureDeckDir(deckId: string): Promise<void> {
    const slidesPath = this.slidesDir(deckId);
    if (!existsSync(slidesPath)) {
      await mkdir(slidesPath, { recursive: true });
    }
  }

  private async serializedWrite(id: string, fn: () => Promise<void>): Promise<void> {
    const prev = this.writeLocks.get(id) ?? Promise.resolve();
    const next = prev.then(fn, fn);
    this.writeLocks.set(id, next);
    await next;
  }

  async saveDeck(deck: Deck): Promise<void> {
    await this.serializedWrite(deck.id, async () => {
      await this.ensureDeckDir(deck.id);
      const data = JSON.stringify(deck, null, 2);
      const jsonPath = this.deckJsonPath(deck.id);
      const tmpPath = jsonPath + '.tmp.' + randomBytes(4).toString('hex');
      await writeFile(tmpPath, data, 'utf-8');
      await rename(tmpPath, jsonPath);
      this.cache.set(deck.id, deck);
    });
  }

  async loadDeck(id: string): Promise<Deck | null> {
    const cached = this.cache.get(id);
    if (cached) return cached;

    const jsonPath = this.deckJsonPath(id);
    if (!existsSync(jsonPath)) return null;
    const data = await readFile(jsonPath, 'utf-8');
    const parsed = JSON.parse(data);
    const deck = DeckSchema.parse(parsed);
    this.cache.set(id, deck);
    return deck;
  }

  async listDecks(): Promise<Deck[]> {
    if (!existsSync(this.basePath)) {
      await mkdir(this.basePath, { recursive: true });
      return [];
    }
    const entries = await readdir(this.basePath, { withFileTypes: true });
    const decks: Deck[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const jsonPath = join(this.basePath, entry.name, 'deck.json');
      if (!existsSync(jsonPath)) continue;
      try {
        const data = await readFile(jsonPath, 'utf-8');
        const deck = DeckSchema.parse(JSON.parse(data));
        this.cache.set(deck.id, deck);
        decks.push(deck);
      } catch {
        // Skip invalid decks
      }
    }
    return decks;
  }

  async deleteDeck(id: string): Promise<boolean> {
    const dir = this.deckDir(id);
    if (!existsSync(dir)) return false;
    await rm(dir, { recursive: true, force: true });
    this.cache.delete(id);
    return true;
  }

  async saveSlideHtml(deckId: string, slideId: string, html: string): Promise<void> {
    await this.ensureDeckDir(deckId);
    const htmlPath = this.slideHtmlPath(deckId, slideId);
    const tmpPath = htmlPath + '.tmp.' + randomBytes(4).toString('hex');
    await writeFile(tmpPath, html, 'utf-8');
    await rename(tmpPath, htmlPath);
  }

  async loadSlideHtml(deckId: string, slideId: string): Promise<string | null> {
    const htmlPath = this.slideHtmlPath(deckId, slideId);
    if (!existsSync(htmlPath)) return null;
    return readFile(htmlPath, 'utf-8');
  }

  async deleteSlideHtml(deckId: string, slideId: string): Promise<boolean> {
    const htmlPath = this.slideHtmlPath(deckId, slideId);
    if (!existsSync(htmlPath)) return false;
    await unlink(htmlPath);
    return true;
  }

  async listSlideIds(deckId: string): Promise<string[]> {
    const dir = this.slidesDir(deckId);
    if (!existsSync(dir)) return [];
    const files = await readdir(dir);
    return files
      .filter((f) => f.endsWith('.html'))
      .map((f) => f.replace('.html', ''))
      .sort();
  }

  // ===== TEMPLATE OPERATIONS =====

  private templateDir(id: string): string {
    return join(this.templatesPath, id);
  }

  private templateMetaPath(id: string): string {
    return join(this.templateDir(id), 'meta.json');
  }

  private templateFilePath(id: string, filename: string): string {
    return join(this.templateDir(id), filename);
  }

  async saveTemplate(id: string, meta: TemplateMeta, fileBuffer: Buffer): Promise<void> {
    const dir = this.templateDir(id);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    const metaPath = this.templateMetaPath(id);
    const tmpMeta = metaPath + '.tmp.' + randomBytes(4).toString('hex');
    await writeFile(tmpMeta, JSON.stringify(meta, null, 2), 'utf-8');
    await rename(tmpMeta, metaPath);

    const filePath = this.templateFilePath(id, meta.filename);
    const tmpFile = filePath + '.tmp.' + randomBytes(4).toString('hex');
    await writeFile(tmpFile, fileBuffer);
    await rename(tmpFile, filePath);
  }

  async loadTemplateMeta(id: string): Promise<TemplateMeta | null> {
    const metaPath = this.templateMetaPath(id);
    if (!existsSync(metaPath)) return null;
    const data = await readFile(metaPath, 'utf-8');
    return JSON.parse(data) as TemplateMeta;
  }

  async loadTemplateFile(id: string): Promise<{ buffer: Buffer; filename: string } | null> {
    const meta = await this.loadTemplateMeta(id);
    if (!meta) return null;
    const filePath = this.templateFilePath(id, meta.filename);
    if (!existsSync(filePath)) return null;
    const buffer = await readFile(filePath);
    return { buffer, filename: meta.filename };
  }

  async listTemplates(): Promise<TemplateMeta[]> {
    if (!existsSync(this.templatesPath)) {
      await mkdir(this.templatesPath, { recursive: true });
      return [];
    }
    const entries = await readdir(this.templatesPath, { withFileTypes: true });
    const templates: TemplateMeta[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const metaPath = join(this.templatesPath, entry.name, 'meta.json');
      if (!existsSync(metaPath)) continue;
      try {
        const data = await readFile(metaPath, 'utf-8');
        templates.push(JSON.parse(data) as TemplateMeta);
      } catch {
        // Skip invalid templates
      }
    }
    return templates;
  }

  async saveTemplateThumbnail(id: string, data: Buffer): Promise<void> {
    const thumbPath = join(this.templateDir(id), 'thumbnail.jpg');
    await writeFile(thumbPath, data);
  }

  async loadTemplateThumbnail(id: string): Promise<Buffer | null> {
    const thumbPath = join(this.templateDir(id), 'thumbnail.jpg');
    if (!existsSync(thumbPath)) return null;
    return readFile(thumbPath);
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const dir = this.templateDir(id);
    if (!existsSync(dir)) return false;
    await rm(dir, { recursive: true, force: true });
    return true;
  }

  // ===== IMAGE OPERATIONS =====

  async saveImage(deckId: string, filename: string, buffer: Buffer): Promise<void> {
    const dir = this.imagesDir(deckId);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
    await writeFile(join(dir, filename), buffer);
  }

  getImagePath(deckId: string, filename: string): string {
    return join(this.imagesDir(deckId), filename);
  }

  async listImages(deckId: string): Promise<Array<{ filename: string; size: number; createdAt: string }>> {
    const dir = this.imagesDir(deckId);
    if (!existsSync(dir)) return [];
    const allowedExts = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);
    const files = await readdir(dir);
    const results: Array<{ filename: string; size: number; createdAt: string }> = [];
    for (const f of files) {
      const ext = f.split('.').pop()?.toLowerCase() || '';
      if (!allowedExts.has(ext)) continue;
      try {
        const s = await stat(join(dir, f));
        results.push({ filename: f, size: s.size, createdAt: s.birthtime.toISOString() });
      } catch {
        // skip files that can't be stat'd
      }
    }
    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return results;
  }

  async deleteImage(deckId: string, filename: string): Promise<boolean> {
    const filePath = join(this.imagesDir(deckId), filename);
    if (!existsSync(filePath)) return false;
    await unlink(filePath);
    return true;
  }
}
