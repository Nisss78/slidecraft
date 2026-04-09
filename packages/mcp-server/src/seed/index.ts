import type { JsonFileStorage } from '@slideharness/core';
import { createDeck, createSlide } from '@slideharness/core';
import { generateBlankSlideHtml } from '@slideharness/renderer';
import { allDocuments } from './templates.js';
import { docHead, TAIL } from './html-utils.js';

export async function seedIfEmpty(storage: JsonFileStorage): Promise<void> {
  const decks = await storage.listDecks();
  if (decks.length > 0) return;

  for (const doc of allDocuments) {
    const deck = createDeck({
      title: doc.title,
      description: doc.description,
    });

    for (const section of doc.sections) {
      const slide = createSlide(section.title);
      deck.slides.push(slide);

      const html = `${docHead()}${section.html}${TAIL}`;
      await storage.saveSlideHtml(deck.id, slide.id, html);
    }

    deck.updatedAt = new Date().toISOString();
    await storage.saveDeck(deck);
  }
}
