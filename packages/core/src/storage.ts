import { readFile, writeFile, mkdir, readdir, unlink, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import type { Deck } from './schema.js';
import { DeckSchema } from './schema.js';

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
}

/**
 * v2 Directory-based storage:
 *   .slidecraft/decks/{deckId}/
 *     deck.json
 *     slides/
 *       {slideId}.html
 */
export class JsonFileStorage implements StorageAdapter {
  private basePath: string;
  private cache = new Map<string, Deck>();
  private writeLocks = new Map<string, Promise<void>>();

  constructor(basePath?: string) {
    this.basePath = basePath || join(process.cwd(), '.slidecraft', 'decks');
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
}
