import { z } from 'zod';

// === Slide (v2: HTML-first, metadata only) ===
export const SlideSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

export type Slide = z.infer<typeof SlideSchema>;

// === Deck (v2: lightweight metadata) ===
export const AspectRatioSchema = z.enum(['16:9', '4:3', '16:10', '1:1']);
export type AspectRatio = z.infer<typeof AspectRatioSchema>;

export const DeckSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  slides: z.array(SlideSchema),
  metadata: z.record(z.unknown()).optional(),
  version: z.literal('2.0').default('2.0'),
});

export type Deck = z.infer<typeof DeckSchema>;

// === Input schemas ===
export const CreateDeckInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateDeckInput = z.infer<typeof CreateDeckInputSchema>;
