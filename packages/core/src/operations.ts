import { nanoid } from 'nanoid';
import type { Deck, Slide, CreateDeckInput } from './schema.js';

export function createDeck(input: CreateDeckInput): Deck {
  const now = new Date().toISOString();
  return {
    id: nanoid(12),
    title: input.title,
    description: input.description,
    author: input.author,
    createdAt: now,
    updatedAt: now,
    slides: [],
    metadata: input.metadata,
    version: '2.0',
  };
}

export function createSlide(title?: string, notes?: string): Slide {
  return {
    id: nanoid(12),
    title,
    notes,
  };
}

export function addSlideToDeck(deck: Deck, slide: Slide, position?: number): Deck {
  const slides = [...deck.slides];
  if (position !== undefined && position >= 0 && position <= slides.length) {
    slides.splice(position, 0, slide);
  } else {
    slides.push(slide);
  }
  return {
    ...deck,
    slides,
    updatedAt: new Date().toISOString(),
  };
}

export function updateSlideInDeck(
  deck: Deck,
  slideId: string,
  updates: Partial<Omit<Slide, 'id'>>,
): Deck {
  return {
    ...deck,
    slides: deck.slides.map((s) => (s.id === slideId ? { ...s, ...updates } : s)),
    updatedAt: new Date().toISOString(),
  };
}

export function deleteSlideFromDeck(deck: Deck, slideId: string): Deck {
  return {
    ...deck,
    slides: deck.slides.filter((s) => s.id !== slideId),
    updatedAt: new Date().toISOString(),
  };
}

export function reorderSlides(deck: Deck, slideIds: string[]): Deck {
  const slideMap = new Map(deck.slides.map((s) => [s.id, s]));
  const reordered = slideIds
    .map((id) => slideMap.get(id))
    .filter((s): s is Slide => s !== undefined);
  return {
    ...deck,
    slides: reordered,
    updatedAt: new Date().toISOString(),
  };
}

export function updateDeckMeta(
  deck: Deck,
  updates: { title?: string; description?: string; author?: string },
): Deck {
  return {
    ...deck,
    ...Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined)),
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateSlide(deck: Deck, slideId: string): { deck: Deck; newSlideId: string | null } {
  const slideIndex = deck.slides.findIndex((s) => s.id === slideId);
  if (slideIndex === -1) return { deck, newSlideId: null };
  const original = deck.slides[slideIndex];
  const duplicate: Slide = {
    ...JSON.parse(JSON.stringify(original)),
    id: nanoid(12),
  };
  const slides = [...deck.slides];
  slides.splice(slideIndex + 1, 0, duplicate);
  return {
    deck: { ...deck, slides, updatedAt: new Date().toISOString() },
    newSlideId: duplicate.id,
  };
}
