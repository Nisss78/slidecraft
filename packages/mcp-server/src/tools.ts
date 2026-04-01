import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { JsonFileStorage } from '@slidecraft/core';
import {
  createDeck,
  createSlide,
  addSlideToDeck,
  updateSlideInDeck,
  deleteSlideFromDeck,
  reorderSlides,
  duplicateSlide,
} from '@slidecraft/core';
import type { PluginRegistry } from '@slidecraft/plugin-api';
import type { PreviewServer } from './preview-server.js';
import { generateBlankSlideHtml } from '@slidecraft/renderer';

export function registerTools(
  server: McpServer,
  storage: JsonFileStorage,
  registry: PluginRegistry,
  previewServer: PreviewServer,
) {
  // ===== DECK OPERATIONS =====

  server.tool(
    'create_deck',
    'Create a new slide deck',
    {
      title: z.string().describe('Deck title'),
      author: z.string().optional().describe('Author name'),
    },
    async (params) => {
      const deck = createDeck(params);
      await storage.saveDeck(deck);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ success: true, deckId: deck.id, title: deck.title }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'list_decks',
    'List all saved decks',
    {},
    async () => {
      const decks = await storage.listDecks();
      const summary = decks.map((d) => ({
        id: d.id,
        title: d.title,
        slides: d.slides.length,
        updatedAt: d.updatedAt,
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
      };
    },
  );

  server.tool(
    'get_deck',
    'Get full deck details including all slide HTML content',
    { deckId: z.string().describe('Deck ID') },
    async ({ deckId }) => {
      const deck = await storage.loadDeck(deckId);
      if (!deck) {
        return { content: [{ type: 'text', text: 'Error: Deck not found' }], isError: true };
      }
      // Load HTML for each slide
      const slidesWithHtml = await Promise.all(
        deck.slides.map(async (slide) => {
          const html = await storage.loadSlideHtml(deckId, slide.id);
          return { ...slide, html: html ?? '' };
        }),
      );
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ ...deck, slides: slidesWithHtml }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'delete_deck',
    'Delete a deck and all its slides',
    { deckId: z.string().describe('Deck ID') },
    async ({ deckId }) => {
      const deleted = await storage.deleteDeck(deckId);
      return {
        content: [{
          type: 'text',
          text: deleted ? 'Deck deleted successfully' : 'Error: Deck not found',
        }],
        isError: !deleted,
      };
    },
  );

  // ===== SLIDE OPERATIONS (HTML-first) =====

  server.tool(
    'add_slide',
    'Add a new slide with full standalone HTML. The HTML should be a complete document with Tailwind CSS CDN, Font Awesome, Google Fonts.',
    {
      deckId: z.string().describe('Deck ID'),
      html: z.string().describe('Complete standalone HTML for the slide (including <!DOCTYPE html>, <head> with Tailwind CDN, etc.)'),
      title: z.string().optional().describe('Slide title (for metadata/navigation)'),
      notes: z.string().optional().describe('Speaker notes'),
      position: z.number().optional().describe('Insert position (0-based index)'),
    },
    async ({ deckId, html, title, notes, position }) => {
      let deck = await storage.loadDeck(deckId);
      if (!deck) {
        return { content: [{ type: 'text', text: 'Error: Deck not found' }], isError: true };
      }

      const slide = createSlide(title, notes);
      deck = addSlideToDeck(deck, slide, position);
      await storage.saveDeck(deck);
      await storage.saveSlideHtml(deckId, slide.id, html);
      previewServer.notifyDeckUpdate(deckId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            slideId: slide.id,
            totalSlides: deck.slides.length,
          }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'update_slide',
    'Update a slide\'s HTML content and/or metadata',
    {
      deckId: z.string().describe('Deck ID'),
      slideId: z.string().describe('Slide ID'),
      html: z.string().optional().describe('New HTML content (complete standalone HTML)'),
      title: z.string().optional().describe('New slide title'),
      notes: z.string().optional().describe('New speaker notes'),
    },
    async ({ deckId, slideId, html, title, notes }) => {
      let deck = await storage.loadDeck(deckId);
      if (!deck) {
        return { content: [{ type: 'text', text: 'Error: Deck not found' }], isError: true };
      }
      if (!deck.slides.some((s) => s.id === slideId)) {
        return { content: [{ type: 'text', text: 'Error: Slide not found' }], isError: true };
      }

      // Update metadata if provided
      const metaUpdates: Record<string, string> = {};
      if (title !== undefined) metaUpdates.title = title;
      if (notes !== undefined) metaUpdates.notes = notes;
      if (Object.keys(metaUpdates).length > 0) {
        deck = updateSlideInDeck(deck, slideId, metaUpdates);
        await storage.saveDeck(deck);
      }

      // Update HTML if provided
      if (html !== undefined) {
        await storage.saveSlideHtml(deckId, slideId, html);
      }

      previewServer.notifyDeckUpdate(deckId);
      return { content: [{ type: 'text', text: 'Slide updated successfully' }] };
    },
  );

  server.tool(
    'get_slide_html',
    'Get the raw HTML source of a slide (for AI editing)',
    {
      deckId: z.string().describe('Deck ID'),
      slideId: z.string().describe('Slide ID'),
    },
    async ({ deckId, slideId }) => {
      const deck = await storage.loadDeck(deckId);
      if (!deck) {
        return { content: [{ type: 'text', text: 'Error: Deck not found' }], isError: true };
      }
      const slideMeta = deck.slides.find((s) => s.id === slideId);
      if (!slideMeta) {
        return { content: [{ type: 'text', text: 'Error: Slide not found' }], isError: true };
      }
      const html = await storage.loadSlideHtml(deckId, slideId);
      if (!html) {
        return { content: [{ type: 'text', text: 'Error: Slide HTML not found' }], isError: true };
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ slideId, title: slideMeta.title, html }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'delete_slide',
    'Delete a slide from a deck',
    {
      deckId: z.string().describe('Deck ID'),
      slideId: z.string().describe('Slide ID'),
    },
    async ({ deckId, slideId }) => {
      let deck = await storage.loadDeck(deckId);
      if (!deck) {
        return { content: [{ type: 'text', text: 'Error: Deck not found' }], isError: true };
      }
      deck = deleteSlideFromDeck(deck, slideId);
      await storage.saveDeck(deck);
      await storage.deleteSlideHtml(deckId, slideId);
      previewServer.notifyDeckUpdate(deckId);
      return { content: [{ type: 'text', text: 'Slide deleted successfully' }] };
    },
  );

  server.tool(
    'reorder_slides',
    'Reorder slides in a deck',
    {
      deckId: z.string().describe('Deck ID'),
      slideIds: z.array(z.string()).describe('Ordered array of slide IDs'),
    },
    async ({ deckId, slideIds }) => {
      let deck = await storage.loadDeck(deckId);
      if (!deck) {
        return { content: [{ type: 'text', text: 'Error: Deck not found' }], isError: true };
      }
      deck = reorderSlides(deck, slideIds);
      await storage.saveDeck(deck);
      previewServer.notifyDeckUpdate(deckId);
      return { content: [{ type: 'text', text: 'Slides reordered successfully' }] };
    },
  );

  server.tool(
    'duplicate_slide',
    'Duplicate a slide (copies both metadata and HTML)',
    {
      deckId: z.string().describe('Deck ID'),
      slideId: z.string().describe('Slide ID to duplicate'),
    },
    async ({ deckId, slideId }) => {
      let deck = await storage.loadDeck(deckId);
      if (!deck) {
        return { content: [{ type: 'text', text: 'Error: Deck not found' }], isError: true };
      }
      const result = duplicateSlide(deck, slideId);
      if (!result.newSlideId) {
        return { content: [{ type: 'text', text: 'Error: Slide not found' }], isError: true };
      }
      deck = result.deck;
      await storage.saveDeck(deck);

      // Copy HTML file
      const originalHtml = await storage.loadSlideHtml(deckId, slideId);
      if (originalHtml) {
        await storage.saveSlideHtml(deckId, result.newSlideId, originalHtml);
      }

      previewServer.notifyDeckUpdate(deckId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            newSlideId: result.newSlideId,
            totalSlides: deck.slides.length,
          }, null, 2),
        }],
      };
    },
  );

  // ===== THEME / TEMPLATE =====

  server.tool(
    'list_themes',
    'List available themes (for reference when creating slide HTML)',
    {},
    async () => {
      const themes = registry.getAllThemes().map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        colors: t.colors,
        typography: t.typography,
      }));
      return { content: [{ type: 'text', text: JSON.stringify(themes, null, 2) }] };
    },
  );

  server.tool(
    'list_templates',
    'List available slide templates',
    {},
    async () => {
      const templates = [
        { id: 'blank', name: 'Blank', description: 'Empty slide with Tailwind CDN' },
        { id: 'title', name: 'Title Slide', description: 'Large centered title with subtitle' },
        { id: 'content', name: 'Content', description: 'Title with body text' },
        { id: 'two-column', name: 'Two Column', description: 'Side by side layout' },
        { id: 'image-text', name: 'Image + Text', description: 'Image on one side, text on other' },
      ];
      return { content: [{ type: 'text', text: JSON.stringify(templates, null, 2) }] };
    },
  );

  // ===== PREVIEW =====

  server.tool(
    'preview',
    'Open deck preview in browser',
    {
      deckId: z.string().describe('Deck ID to preview'),
    },
    async ({ deckId }) => {
      const deck = await storage.loadDeck(deckId);
      if (!deck) {
        return { content: [{ type: 'text', text: 'Error: Deck not found' }], isError: true };
      }
      const port = await previewServer.start();
      const url = `http://localhost:${port}/preview/${deckId}`;

      try {
        const { default: open } = await import('open');
        await open(url);
      } catch {
        // open might not work in all environments
      }

      return {
        content: [{
          type: 'text',
          text: `Preview available at: ${url}\nWebSocket updates enabled - changes will reflect in real-time.`,
        }],
      };
    },
  );

  // ===== AI GENERATE =====

  server.tool(
    'generate_deck',
    'Generate a complete slide deck structure. Creates the deck with blank slides that AI should populate with HTML using update_slide.',
    {
      topic: z.string().describe('Topic or prompt for the presentation'),
      slideCount: z.number().min(1).max(30).default(8).describe('Number of slides to generate'),
    },
    async ({ topic, slideCount }) => {
      const deck = createDeck({
        title: topic,
        description: `Generated presentation about: ${topic}`,
      });

      const slideStructure = [
        { title: 'タイトル', hint: 'Title slide with main topic and subtitle' },
        { title: '概要', hint: 'Overview/agenda of the presentation' },
        { title: 'コンテンツ', hint: 'Main content slide' },
        { title: '詳細', hint: 'Detailed content or data' },
        { title: 'まとめ', hint: 'Summary and key takeaways' },
      ];

      for (let i = 0; i < slideCount; i++) {
        const template = slideStructure[Math.min(i, slideStructure.length - 1)];
        const slideTitle = i === 0 ? 'タイトル' : i === slideCount - 1 ? 'まとめ' : template.title;
        const slide = createSlide(slideTitle);
        deck.slides.push(slide);

        // Generate blank HTML with title
        const html = generateBlankSlideHtml({ title: `${topic} - ${slideTitle}` });
        await storage.saveSlideHtml(deck.id, slide.id, html);
      }

      deck.updatedAt = new Date().toISOString();
      await storage.saveDeck(deck);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            deckId: deck.id,
            slideCount: deck.slides.length,
            slides: deck.slides.map((s, i) => ({
              index: i,
              slideId: s.id,
              title: s.title,
              hint: i === 0
                ? 'Title slide - use update_slide with full HTML'
                : `Content slide - use update_slide with full HTML`,
            })),
            instruction: 'Use update_slide(deckId, slideId, html) to set each slide\'s HTML. Each slide should be a complete standalone HTML document with Tailwind CSS CDN, Font Awesome, and Google Fonts.',
          }, null, 2),
        }],
      };
    },
  );
}
