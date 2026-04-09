import { z } from 'zod';
import { readFile, mkdir } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';
import { exportToHtml, exportToPdf, exportToPng, exportToPptx } from '@slideharness/export';
import { CANVAS_PRESETS, resolveCanvasSize, getCanvasDimensions, BUILT_IN_TEMPLATES, getTemplateById, getTemplatesByFormat, getTemplatesByCategory, searchTemplates } from '@slideharness/renderer';
import type { CanvasSize, BuiltInTemplate } from '@slideharness/renderer';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { JsonFileStorage } from '@slideharness/core';
import {
  createDeck,
  createSlide,
  addSlideToDeck,
  updateSlideInDeck,
  deleteSlideFromDeck,
  reorderSlides,
  duplicateSlide,
} from '@slideharness/core';
import type { PluginRegistry } from '@slideharness/plugin-api';
import type { PreviewServer } from './preview-server.js';
import { generateBlankSlideHtml } from '@slideharness/renderer';
import type { SlideThemeOptions } from '@slideharness/renderer';
import { parsePptxBuffer } from '@slideharness/export';

export function registerTools(
  server: McpServer,
  storage: JsonFileStorage,
  registry: PluginRegistry,
  previewServer: PreviewServer | null,
) {
  // ===== DECK OPERATIONS =====

  server.tool(
    'create_deck',
    'Create a new slide deck. Use canvasSize to set a preset (e.g. "instagram-post", "a4") or custom {width, height}.',
    {
      title: z.string().describe('Deck title'),
      author: z.string().optional().describe('Author name'),
      canvasSize: z.union([
        z.string().describe('Preset ID (e.g. "16:9", "instagram-post", "a4"). Use list_canvas_presets to see options.'),
        z.object({ width: z.number(), height: z.number() }).describe('Custom canvas size in pixels'),
      ]).optional().describe('Canvas size preset or custom dimensions (default: 16:9 = 1920x1080)'),
    },
    async (params) => {
      const { canvasSize: canvasSizeInput, ...deckParams } = params;
      const resolved = canvasSizeInput ? getCanvasDimensions(canvasSizeInput as string | CanvasSize) : undefined;
      const metadata = resolved ? { canvasSize: canvasSizeInput } : undefined;
      const deck = createDeck({ ...deckParams, metadata });
      await storage.saveDeck(deck);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            deckId: deck.id,
            title: deck.title,
            ...(resolved ? { canvasSize: resolved } : {}),
          }, null, 2),
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
    `Add a new slide with full standalone HTML. The HTML should be a complete document with Tailwind CSS CDN, Font Awesome, Google Fonts.
DESIGN RULES: (1) Do NOT use Inter/Roboto/Arial - use theme Google Fonts. (2) Do NOT use generic indigo #6366f1 - use theme CSS variables. (3) Do NOT center-align everything - use asymmetric layouts. (4) Use Font Awesome instead of emoji. (5) Use clamp() for font sizes and spacing (e.g. font-size:clamp(2rem,3.5vw,3.5rem)). (6) Always include word-break:keep-all;overflow-wrap:break-word in body style.`,
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
      previewServer?.notifyDeckUpdate(deckId);

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
    `Update a slide's HTML content and/or metadata.
DESIGN RULES: (1) Do NOT use Inter/Roboto/Arial - use theme Google Fonts. (2) Do NOT use generic indigo #6366f1 - use theme CSS variables. (3) Do NOT center-align everything - use asymmetric layouts. (4) Use Font Awesome instead of emoji. (5) Use clamp() for font sizes and spacing. (6) Always include word-break:keep-all;overflow-wrap:break-word in body style.`,
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

      previewServer?.notifyDeckUpdate(deckId);
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
      previewServer?.notifyDeckUpdate(deckId);
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
      previewServer?.notifyDeckUpdate(deckId);
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

      previewServer?.notifyDeckUpdate(deckId);
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
    'List available slide layout templates with HTML examples',
    {},
    async () => {
      const templates = [
        {
          id: 'title',
          name: 'Title Slide',
          description: 'Large centered title with subtitle — use for opening/closing',
          html: '<body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;padding:64px;position:relative;overflow:hidden;"><div class="sh-accent-circle"></div><h1 style="font-size:3.5rem;z-index:1;">Title Here</h1><p style="color:var(--color-text-secondary);font-size:1.5rem;z-index:1;">Subtitle here</p></body>',
        },
        {
          id: 'content',
          name: 'Content',
          description: 'Header → Main → Footer 3-layer structure',
          html: '<body style="display:flex;flex-direction:column;padding:48px 64px;height:100%;"><div class="sh-header"><span class="sh-badge">SECTION</span><h2>Section Title</h2></div><div style="flex:1;">Content here</div><div class="sh-footer"><span>Footer left</span><span>Footer right</span></div></body>',
        },
        {
          id: 'two-column',
          name: 'Two Column',
          description: 'Side by side layout for comparisons',
          html: '<body style="display:flex;flex-direction:column;padding:48px 64px;height:100%;"><h2>Title</h2><div class="sh-grid-2" style="flex:1;margin-top:24px;"><div class="sh-card">Left column</div><div class="sh-card">Right column</div></div></body>',
        },
        {
          id: 'three-column',
          name: 'Three Column',
          description: 'Three column grid for feature comparisons or steps',
          html: '<body style="display:flex;flex-direction:column;padding:48px 64px;height:100%;"><h2>Title</h2><div class="sh-grid-3" style="flex:1;margin-top:24px;"><div class="sh-card">Col 1</div><div class="sh-card">Col 2</div><div class="sh-card">Col 3</div></div></body>',
        },
        {
          id: 'split-half',
          name: 'Split Half',
          description: '50/50 split with colored background',
          html: '<body style="height:100%;"><div class="sh-split-half"><div style="background:var(--color-surface);padding:64px;display:flex;flex-direction:column;justify-content:center;">Left content</div><div style="padding:64px;display:flex;flex-direction:column;justify-content:center;">Right content</div></div></body>',
        },
        {
          id: 'split-60-40',
          name: 'Split 60/40',
          description: '60/40 split — main content + chart or sidebar',
          html: '<body style="height:100%;"><div class="sh-split-60-40"><div style="padding:48px 64px;display:flex;flex-direction:column;justify-content:center;">Main content + text</div><div style="background:var(--color-surface);padding:48px;display:flex;align-items:center;justify-content:center;"><canvas id="chart1"></canvas></div></div></body>',
        },
        {
          id: 'data-chart',
          name: 'Data + Chart',
          description: 'Content slide with Chart.js visualization',
          html: '<body style="display:flex;flex-direction:column;padding:48px 64px;height:100%;"><h2>Data Title</h2><div style="flex:1;display:flex;gap:32px;margin-top:24px;"><div style="flex:1;"><ul class="sh-list"><li>Point 1</li><li>Point 2</li></ul></div><div style="flex:1;display:flex;align-items:center;"><canvas id="chart1"></canvas></div></div></body>',
        },
        {
          id: 'blank',
          name: 'Blank',
          description: 'Empty slide with Tailwind CDN and all CSS variables',
        },
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
      if (!previewServer) {
        return { content: [{ type: 'text', text: 'Error: Preview server is disabled (SLIDEHARNESS_NO_PREVIEW=1)' }], isError: true };
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
    'Generate a complete slide deck structure with detailed per-slide layout hints. Creates the deck with themed blank slides that AI should populate with HTML using update_slide. Uses the genspark theme by default for high-quality output.',
    {
      topic: z.string().describe('Topic or prompt for the presentation'),
      slideCount: z.number().min(1).max(30).default(8).describe('Number of slides to generate'),
      themeId: z.string().optional().describe('Theme ID (default: genspark). Use list_themes to see options.'),
      stylePreset: z.string().optional().describe('Style preset ID (overrides themeId). Options: bold-signal, electric-studio, creative-voltage, dark-botanical, notebook-tabs, pastel-geometry, split-pastel, vintage-editorial, neon-cyber, terminal-green, swiss-modern, kyoto-classic'),
      audience: z.enum(['executive', 'engineer', 'designer', 'student', 'general']).optional().describe('Target audience — executives: C-suite CEO, engineers: technical depth, designers: visual focus, students: learning context, general: broad audience'),
      tone: z.enum(['formal', 'casual', 'technical', 'persuasive']).optional().describe('Presentation tone — formal: corporate, casual: friendly, technical: deep, persuasive: convincing'),
      templateId: z.string().optional().describe('Optional PPTX template ID to base style on'),
      canvasSize: z.union([
        z.string().describe('Preset ID (e.g. "instagram-post", "a4")'),
        z.object({ width: z.number(), height: z.number() }).describe('Custom canvas size in pixels'),
      ]).optional().describe('Canvas size preset or custom dimensions (default: 16:9 = 1920x1080)'),
      format: z.string().optional().describe('Output format: presentation, instagram-post, instagram-story, youtube-thumbnail, x-post, pinterest-pin, linkedin-post, a4. Auto-resolves canvasSize and slideCount for single-design formats.'),
    },
    async ({ topic, slideCount, themeId, stylePreset, audience, tone, templateId, canvasSize: canvasSizeInput, format }) => {
      // Format-based auto-resolution
      const SINGLE_DESIGN_FORMATS = ['instagram-post', 'instagram-story', 'youtube-thumbnail', 'x-post', 'pinterest-pin', 'a4'];
      const isSingleDesign = format != null && SINGLE_DESIGN_FORMATS.includes(format);
      const effectiveSlideCount = isSingleDesign ? 1 : slideCount;
      const effectiveCanvasSize = canvasSizeInput ?? format ?? '16:9';
      // Resolve theme (stylePreset overrides themeId)
      const resolvedThemeId = stylePreset ?? themeId ?? 'genspark';
      const theme = registry.getTheme(resolvedThemeId) ?? registry.getTheme('genspark')!;
      const themeOptions: SlideThemeOptions = {
        colors: theme.colors,
        typography: theme.typography,
      };

      const resolvedDims = effectiveCanvasSize !== '16:9' || canvasSizeInput
        ? getCanvasDimensions(effectiveCanvasSize as string | CanvasSize)
        : { width: 1920, height: 1080 };

      const deck = createDeck({
        title: topic,
        description: isSingleDesign ? `${format} design: ${topic}` : `Generated presentation about: ${topic}`,
        metadata: { canvasSize: effectiveCanvasSize, ...(format ? { format } : {}) },
      });

      // Build per-slide structure with layout hints
      const slideStructure: Array<{ title: string; layout: string; hint: string }> = [];

      if (isSingleDesign) {
        // Single-design formats: one canvas, no slide deck structure
        slideStructure.push({
          title: topic,
          layout: 'single-design',
          hint: `Single ${format} design. Full visual composition — NOT a slide deck page. No headers/footers/bullet lists.`,
        });
      } else {
        // Presentation / multi-slide formats
        // Always start with title
        slideStructure.push({
          title: 'タイトル',
          layout: 'title',
          hint: 'Title slide: centered h1 + subtitle. Use .sh-accent-circle for decorative background. Badge with category.',
        });

        // Always second: overview
        if (effectiveSlideCount >= 2) {
          slideStructure.push({
            title: '概要',
            layout: 'content',
            hint: 'Overview/agenda: use .sh-header with .sh-badge, then .sh-list for agenda items. 3-layer structure: header→main→footer.',
          });
        }

        // Middle content slides
        const contentLayouts = [
          { title: 'コンテンツ', layout: 'two-column', hint: 'Two-column layout: use .sh-grid-2 with .sh-card elements. Highlight keywords with var(--color-primary).' },
          { title: '詳細データ', layout: 'split-60-40', hint: '60/40 split: text content on left, Chart.js canvas on right. Use <canvas id="chartN"> + <script> for chart.' },
          { title: '比較・特徴', layout: 'three-column', hint: 'Three-column grid: use .sh-grid-3 with .sh-card. Each card has icon (Font Awesome) + title + description.' },
          { title: '分析', layout: 'split-half', hint: '50/50 split: left side with var(--color-surface) background, right side with main content or chart.' },
          { title: 'ポイント', layout: 'content', hint: 'Content with .sh-list. Use .sh-section-heading for sub-sections. Density: 3-4 content blocks per slide.' },
          { title: 'データ可視化', layout: 'data-chart', hint: 'Data visualization: text points on left, Chart.js (bar/doughnut/line) on right. Use theme colors for chart datasets.' },
        ];

        const middleCount = Math.max(0, effectiveSlideCount - 2);
        for (let i = 0; i < middleCount; i++) {
          const tpl = contentLayouts[i % contentLayouts.length];
          slideStructure.push(tpl);
        }

        // Always end with summary (replace last middle if needed)
        if (effectiveSlideCount >= 3) {
          slideStructure[slideStructure.length - 1] = {
            title: 'まとめ',
            layout: 'content',
            hint: 'Summary: key takeaways with .sh-card. Call-to-action with .sh-badge. Footer with contact info.',
          };
        }
      }

      // Create slides
      for (let i = 0; i < effectiveSlideCount; i++) {
        const structure = slideStructure[Math.min(i, slideStructure.length - 1)];
        const slide = createSlide(structure.title);
        deck.slides.push(slide);

        const html = generateBlankSlideHtml({
          title: `${topic} - ${structure.title}`,
          width: resolvedDims.width,
          height: resolvedDims.height,
          theme: themeOptions,
          format,
        });
        await storage.saveSlideHtml(deck.id, slide.id, html);
      }

      deck.updatedAt = new Date().toISOString();
      await storage.saveDeck(deck);

      // Analyze PPTX template if specified
      let templateStyle: Record<string, unknown> | undefined;
      if (templateId) {
        const pptxBuffer = await storage.loadTemplateFile(templateId).then(r => r?.buffer ?? null);
        if (pptxBuffer) {
          try {
            const analysis = await parsePptxBuffer(pptxBuffer);
            templateStyle = {
              templateId,
              aspectRatio: analysis.aspectRatio,
              theme: analysis.theme,
              templateSlides: analysis.slides,
            };
          } catch {
            // Template analysis failed, continue without it
          }
        }
      }

      // Build format-specific instruction additions
      const formatInstructions: Record<string, string> = {
        'instagram-post': `\n=== FORMAT: INSTAGRAM POST (1080x1350) ===
THIS IS NOT A PRESENTATION. Do NOT use slide deck patterns.
- Visual-first single design. Max 15-20 words total.
- Safe zone: center 1080x1080 square. Avoid top 250px and bottom 340px (UI overlays).
- Typography: h1 60-80px bold (weight 700+), body 24-32px min.
- Max 2-3 font families. No bullet lists, no headers/footers.
- search_images orientation: portrait`,
        'instagram-story': `\n=== FORMAT: INSTAGRAM STORY (1080x1920) ===
THIS IS NOT A PRESENTATION. Full-screen immersive single design.
- Safe zone: center 1080x1420px. Top 250px and bottom 350px reserved for platform UI.
- Max 20 words. Structure: Hook headline -> Value -> CTA (above bottom 350px).
- Full-bleed backgrounds preferred. No slide deck patterns.
- search_images orientation: portrait`,
        'youtube-thumbnail': `\n=== FORMAT: YOUTUBE THUMBNAIL (1280x720) ===
THIS IS NOT A PRESENTATION. Single eye-catching thumbnail.
- Text: 150-200px ULTRA BOLD (weight 900). MAX 3-5 WORDS (ideal 1-2).
- REQUIRED text effects: text-shadow with black stroke (10-20px) + white glow + drop shadow.
  Example: text-shadow: -4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000, 4px 4px 0 #000, 0 0 20px rgba(255,255,255,0.5);
- Face/subject: 30-50% of canvas. Max 3 visual elements total.
- Complementary color pairs (yellow/purple, red/cyan). High saturation.
- Must pass 168x94px shrink test. NO thin fonts, NO complex backgrounds.
- NO bullet lists, NO paragraphs, NO cards, NO headers/footers.
- search_images orientation: landscape`,
        'x-post': `\n=== FORMAT: X/TWITTER POST (1200x675) ===
THIS IS NOT A PRESENTATION. Single visual for timeline.
- Min text 24px. Max 30 words. Key message must be readable at timeline size.
- High contrast, consistent brand palette. Clean layout.
- search_images orientation: landscape`,
        'pinterest-pin': `\n=== FORMAT: PINTEREST PIN (1000x1500) ===
THIS IS NOT A PRESENTATION. Single vertical pin design.
- 2:3 ratio mandatory (algorithm penalizes others).
- Bold text min 24pt. Script/hairline fonts BANNED.
- Warm colors (red, orange, pink) have higher save rates.
- Clear text hierarchy. Must pass 70% shrink test.
- Listicle/step-by-step format works well.
- search_images orientation: portrait`,
        'linkedin-post': `\n=== FORMAT: LINKEDIN POST (1080x1080) ===
- Professional sans-serif design. Data visualization emphasis.
- Max 30 words per slide. Include source attributions for data.
- For single post: one powerful visual. For carousel: 1 topic per slide.
- search_images orientation: squarish`,
        'a4': `\n=== FORMAT: A4 PRINT (2480x3508 @ 300DPI) ===
THIS IS NOT A PRESENTATION. Single-page print design.
- Bleed: 3mm all sides. Safe zone: 3-12mm from edge.
- Text/logos must stay within safe zone.
- Higher text density acceptable for print.
- CMYK-safe colors preferred.
- search_images orientation: portrait`,
      };

      const formatInstruction = format && formatInstructions[format] ? formatInstructions[format] : '';

      const instruction = isSingleDesign
        ? `=== WORKFLOW ===
STEP 1 — DESIGN PLANNING:
For the topic "${topic}", plan a single ${format} design (${resolvedDims.width}x${resolvedDims.height}px).
Decide: key message, visual hierarchy, color usage, image placement.

STEP 2 — HTML GENERATION (use update_slide):
Write the full <body> HTML as a single visual composition.

=== STYLE GUIDE ===
1. CANVAS: ${resolvedDims.width}x${resolvedDims.height}px. This is a SINGLE DESIGN, not a slide deck.
2. CSS VARIABLES: Use var(--color-*) and var(--font-*). No hardcoded colors.
3. BANNED: slide deck patterns (sh-header, sh-footer, sh-list, sh-grid-*), bullet lists, Inter/Roboto/Arial, emoji, hardcoded #6366f1.
4. REQUIRED: word-break:keep-all, clamp() for font-size/padding, Font Awesome icons only.
5. Each slide <head> is pre-generated — only replace <body> content via update_slide.${formatInstruction}${audience ? `\nAUDIENCE: ${audience}.` : ''}${tone ? `\nTONE: ${tone}.` : ''}`
        : `=== WORKFLOW ===
STEP 1 — CONTENT PLANNING (do this BEFORE writing any HTML):
For the topic "${topic}", create a detailed content plan for all ${effectiveSlideCount} slides.
For each slide, decide:
  - Specific title (not generic — e.g., "出会いの場を増やす5つの方法" instead of "コンテンツ")
  - 3-5 key talking points or data to include
  - Which layout pattern fits best (title / content / two-column / three-column / split-half / split-60-40 / data-chart)
  - Whether to include a chart, and if so what data it visualizes
Think about the narrative arc: hook → context → core content → evidence/data → actionable takeaway.

STEP 2 — HTML GENERATION (use update_slide for each slide):
Write the full <body> HTML for each slide based on your plan.

=== STYLE GUIDE ===
1. STRUCTURE: body = flex flex-col, padding var(--spacing-slide, 48px 64px), ${resolvedDims.width}×${resolvedDims.height}px. Three layers: header (.sh-header) → main (flex:1) → footer (.sh-footer).
2. CSS VARIABLES (in <head>): --color-primary/secondary/accent/bg/surface/text/text-secondary/border, --font-heading/body, --heading-weight, --font-size-h1/h2/h3, --spacing-slide. USE THESE — no hardcoded colors.
3. COMPONENTS: .sh-card, .sh-badge, .sh-badge-outline, .sh-accent-circle, .sh-header, .sh-footer, .sh-section-heading, .sh-list, .sh-grid-2, .sh-grid-3, .sh-split-half, .sh-split-60-40.
4. CHARTS: Chart.js <canvas id="chartN"> + <script>. Use theme hex colors for datasets.
5. DENSITY — STRICTLY ENFORCED:
   - MINIMUM 3 content blocks per slide (heading + body + visual like icon/chart/badge)
   - MAX 4 bullet points per list. MAX 50 words per text block
   - Every slide must feel COMPLETE — never half-finished
   - SPECIFIC data > generic phrases. Include concrete numbers and details about the topic
   - NEVER have a slide that is just a question ("What is X?") — always make statements
   - QUALITY DOES NOT DEGRADE: slide 10 must be as rich as slide 2. If running low on ideas, go deeper on the topic rather than going thin
6. TYPOGRAPHY: Use clamp() for responsive sizing — h1: var(--font-size-h1, clamp(2rem,3.5vw,3.5rem)), h2: var(--font-size-h2, clamp(1.25rem,2vw,2rem)), h3: var(--font-size-h3, clamp(1rem,1.4vw,1.4rem)). Headings use var(--font-heading).
7. Each slide <head> is pre-generated — only replace <body> content via update_slide.
8. BANNED: Do NOT use Inter/Roboto/Arial fonts. Do NOT use hardcoded #6366f1. Do NOT center-align everything. Do NOT use emoji — use Font Awesome <i class="fas fa-xxx">.
9. REQUIRED: Always include word-break:keep-all in body. Use var(--color-*) CSS variables. Use clamp() for all font-size and padding values.${templateStyle ? '\n10. TEMPLATE: Match the PPTX template colors and layout patterns from templateStyle.' : ''}${audience ? `\n11. AUDIENCE: ${audience}. ${audience === 'executive' ? 'Use high-level summaries, focus on business impact and ROI. Avoid jargon.' : audience === 'engineer' ? 'Include technical depth, code examples, architecture details welcome.' : audience === 'designer' ? 'Increase visual variety. Use asymmetric layouts and bold color choices.' : audience === 'student' ? 'Explain concepts clearly with simple, relatable examples.' : 'Balance accessibility and depth. Use clear headings and engaging visuals.'}` : ''}${tone ? `\n12. TONE: ${tone}. ${tone === 'formal' ? 'Professional language, structured arguments, data-driven.' : tone === 'casual' ? 'Friendly conversational style, approachable language.' : tone === 'technical' ? 'Precise terminology, include specs and implementation details.' : tone === 'persuasive' ? 'Strong verbs, clear calls-to-action, compelling narrative.' : ''}` : ''}${formatInstruction}`;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            deckId: deck.id,
            slideCount: deck.slides.length,
            theme: { id: theme.id, name: theme.name, colors: theme.colors, typography: theme.typography },
            slides: slideStructure.slice(0, effectiveSlideCount).map((s, i) => ({
              index: i,
              slideId: deck.slides[i].id,
              suggestedTitle: s.title,
              layout: s.layout,
              layoutHint: s.hint,
            })),
            canvasSize: resolvedDims,
            ...(format ? { format } : {}),
            ...(isSingleDesign ? { singleDesign: true } : {}),
            ...(templateStyle ? { templateStyle } : {}),
            instruction,
          }, null, 2),
        }],
      };
    },
  );

  // ===== TEMPLATE MANAGEMENT =====

  server.tool(
    'save_template',
    'Save a PPTX file as a reusable template. Analyzes the file and stores it for future use with generate_deck.',
    {
      filePath: z.string().describe('Absolute path to the .pptx file'),
      name: z.string().optional().describe('Template name (defaults to filename)'),
    },
    async ({ filePath, name }) => {
      try {
        const buffer = await readFile(filePath);
        const filename = basename(filePath);
        const templateName = name || filename.replace(/\.pptx$/i, '');
        const templateId = randomBytes(8).toString('hex');

        // Parse for basic metadata
        const analysis = await parsePptxBuffer(buffer);

        const meta = {
          id: templateId,
          name: templateName,
          filename,
          createdAt: new Date().toISOString(),
          slideCount: analysis.slideCount,
          colors: Object.values(analysis.theme.colors),
          fonts: [analysis.theme.majorFont, analysis.theme.minorFont].filter(Boolean),
        };

        await storage.saveTemplate(templateId, meta, buffer);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              templateId,
              name: templateName,
              slideCount: analysis.slideCount,
              colors: analysis.theme.colors,
              fonts: { major: analysis.theme.majorFont, minor: analysis.theme.minorFont },
            }, null, 2),
          }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error saving template: ${err.message}` }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    'list_user_templates',
    'List all saved PPTX templates',
    {},
    async () => {
      const templates = await storage.listTemplates();
      const summary = templates.map((t) => ({
        id: t.id,
        name: t.name,
        filename: t.filename,
        slideCount: t.slideCount,
        createdAt: t.createdAt,
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
      };
    },
  );

  server.tool(
    'analyze_template',
    'Analyze a saved PPTX template in detail. Returns theme colors, fonts, slide layouts, and text content for AI reference.',
    {
      templateId: z.string().describe('Template ID'),
    },
    async ({ templateId }) => {
      const pptxBuffer = await storage.loadTemplateFile(templateId).then(r => r?.buffer ?? null);
      if (!pptxBuffer) {
        return { content: [{ type: 'text', text: 'Error: Template not found' }], isError: true };
      }
      try {
        const analysis = await parsePptxBuffer(pptxBuffer);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(analysis, null, 2),
          }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error analyzing template: ${err.message}` }],
          isError: true,
        };
      }
    },
  );

  // ===== STYLE GUIDE REFERENCE =====

  server.tool(
    'get_style_guide',
    'Get the complete Slide Harness style guide: CSS variables, reusable components, layout HTML examples, and Chart.js patterns. Call this before writing slide HTML.',
    {
      themeId: z.string().optional().describe('Theme ID to get variables for (default: genspark)'),
    },
    async ({ themeId }) => {
      const theme = registry.getTheme(themeId ?? 'genspark') ?? registry.getTheme('genspark')!;

      const guide = {
        theme: {
          id: theme.id,
          name: theme.name,
          colors: theme.colors,
          typography: theme.typography,
        },
        cssVariables: {
          '--color-primary': theme.colors.primary,
          '--color-secondary': theme.colors.secondary,
          '--color-accent': theme.colors.accent,
          '--color-bg': theme.colors.background,
          '--color-surface': theme.colors.surface,
          '--color-text': theme.colors.text,
          '--color-text-secondary': theme.colors.textSecondary,
          '--color-border': theme.colors.border,
          '--font-heading': `'${theme.typography.headingFont}', sans-serif`,
          '--font-body': `'${theme.typography.bodyFont}', sans-serif`,
          '--heading-weight': String(theme.typography.headingWeight ?? 900),
        },
        components: {
          '.sh-card': 'Card with left border accent. Usage: <div class="sh-card">content</div>',
          '.sh-badge': 'Filled badge/label. Usage: <span class="sh-badge">LABEL</span>',
          '.sh-badge-outline': 'Outlined badge. Usage: <span class="sh-badge-outline">LABEL</span>',
          '.sh-accent-circle': 'Decorative background circle. Place as first child: <div class="sh-accent-circle"></div>',
          '.sh-header': 'Flex header row. Usage: <div class="sh-header"><span class="sh-badge">SEC</span><h2>Title</h2></div>',
          '.sh-footer': 'Flex footer. Usage: <div class="sh-footer"><span>Left</span><span>Right</span></div>',
          '.sh-section-heading': 'Sub-section heading with bottom border.',
          '.sh-list': 'Styled bullet list with primary-colored dots.',
          '.sh-grid-2': 'Two-column CSS grid with 24px gap.',
          '.sh-grid-3': 'Three-column CSS grid with 24px gap.',
          '.sh-split-half': '50/50 split (full height).',
          '.sh-split-60-40': '60/40 split (full height).',
        },
        layoutExamples: {
          title: `<body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;padding:64px;position:relative;overflow:hidden;">
  <div class="sh-accent-circle"></div>
  <span class="sh-badge" style="z-index:1;margin-bottom:24px;">CATEGORY</span>
  <h1 style="font-size:3.5rem;z-index:1;text-align:center;">Presentation Title</h1>
  <p style="color:var(--color-text-secondary);font-size:1.5rem;z-index:1;margin-top:16px;">Subtitle or author</p>
</body>`,
          content: `<body style="display:flex;flex-direction:column;padding:48px 64px;height:100%;">
  <div class="sh-header">
    <span class="sh-badge">01</span>
    <h2 style="font-size:2rem;">Section Title</h2>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;gap:16px;">
    <ul class="sh-list">
      <li>Key point with <span style="color:var(--color-primary);font-weight:700;">highlighted keyword</span></li>
      <li>Another important point</li>
    </ul>
  </div>
  <div class="sh-footer">
    <span style="color:var(--color-text-secondary);font-size:0.9rem;">Company Name</span>
    <span style="color:var(--color-text-secondary);font-size:0.9rem;">3 / 10</span>
  </div>
</body>`,
          twoColumn: `<body style="display:flex;flex-direction:column;padding:48px 64px;height:100%;">
  <div class="sh-header"><span class="sh-badge">02</span><h2>Comparison</h2></div>
  <div class="sh-grid-2" style="flex:1;margin-top:24px;">
    <div class="sh-card">
      <h3 class="sh-section-heading">Option A</h3>
      <ul class="sh-list"><li>Feature 1</li><li>Feature 2</li></ul>
    </div>
    <div class="sh-card">
      <h3 class="sh-section-heading">Option B</h3>
      <ul class="sh-list"><li>Feature 1</li><li>Feature 2</li></ul>
    </div>
  </div>
</body>`,
          threeColumn: `<body style="display:flex;flex-direction:column;padding:48px 64px;height:100%;">
  <h2>Three Features</h2>
  <div class="sh-grid-3" style="flex:1;margin-top:24px;">
    <div class="sh-card" style="text-align:center;padding:32px;">
      <i class="fas fa-rocket" style="font-size:2.5rem;color:var(--color-primary);"></i>
      <h3 style="margin-top:16px;">Speed</h3>
      <p style="color:var(--color-text-secondary);">Description here</p>
    </div>
    <div class="sh-card" style="text-align:center;padding:32px;">
      <i class="fas fa-shield-alt" style="font-size:2.5rem;color:var(--color-primary);"></i>
      <h3 style="margin-top:16px;">Security</h3>
      <p style="color:var(--color-text-secondary);">Description here</p>
    </div>
    <div class="sh-card" style="text-align:center;padding:32px;">
      <i class="fas fa-chart-line" style="font-size:2.5rem;color:var(--color-primary);"></i>
      <h3 style="margin-top:16px;">Growth</h3>
      <p style="color:var(--color-text-secondary);">Description here</p>
    </div>
  </div>
</body>`,
          chartExample: `<!-- Chart.js example: place canvas + script inside body -->
<div style="width:100%;max-width:600px;">
  <canvas id="chart1"></canvas>
</div>
<script>
new Chart(document.getElementById('chart1'), {
  type: 'bar',
  data: {
    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
    datasets: [{
      label: 'Revenue',
      data: [120, 190, 170, 250],
      backgroundColor: '${theme.colors.primary}',
      borderRadius: 4
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  }
});
</script>`,
        },
        rules: [
          'Each slide is a full HTML document — only modify <body> content when using update_slide',
          'Always use CSS variables (var(--color-primary) etc.) instead of hardcoded colors',
          'Structure each slide body as: header → main → footer (flex column)',
          'Aim for 3-4 content blocks per slide — avoid sparse or overcrowded slides',
          'Highlight keywords with color:var(--color-primary) and font-weight:700',
          'Use Font Awesome icons (<i class="fas fa-xxx">) for visual variety — NEVER use emoji',
          'For charts: use <canvas id="chartN"> + <script> with Chart.js, using theme colors',
          'Use clamp() for responsive sizing: h1=var(--font-size-h1, clamp(2rem,3.5vw,3.5rem)), h2=var(--font-size-h2, clamp(1.25rem,2vw,2rem)), h3=var(--font-size-h3, clamp(1rem,1.4vw,1.4rem))',
          'Use var(--spacing-slide, clamp(24px,3.3vw,64px)) for slide padding',
          'BANNED: Inter/Roboto/Arial fonts, hardcoded #6366f1, center-aligning everything, emoji characters',
          'REQUIRED: word-break:keep-all in body, theme CSS variables for all colors, clamp() for font-size and padding',
        ],
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(guide, null, 2),
        }],
      };
    },
  );

  // ===== STYLE PREVIEW =====

  const moodPresets: Record<string, [string, string, string]> = {
    impressed: ['bold-signal', 'neon-cyber', 'creative-voltage'],
    excited: ['electric-studio', 'creative-voltage', 'split-pastel'],
    calm: ['dark-botanical', 'notebook-tabs', 'kyoto-classic'],
    inspired: ['vintage-editorial', 'pastel-geometry', 'swiss-modern'],
    professional: ['bold-signal', 'swiss-modern', 'electric-studio'],
    creative: ['neon-cyber', 'terminal-green', 'creative-voltage'],
  };

  server.tool(
    'preview_styles',
    'Show 3 style preset previews in the browser for the user to choose from. Opens a style picker with A/B/C options. Use this before generate_deck to help the user pick a visual style.',
    {
      topic: z.string().describe('Presentation topic (used for preview title slide)'),
      mood: z.enum(['impressed', 'excited', 'calm', 'inspired', 'professional', 'creative']).optional().describe('Mood/tone to filter preset suggestions'),
      language: z.enum(['ja', 'en']).optional().describe('Language for preview text (default: ja)'),
    },
    async ({ topic, mood, language }) => {
      const lang = language ?? 'ja';
      const selectedMood = mood ?? 'professional';
      const presetIds = moodPresets[selectedMood];
      const labels = ['A', 'B', 'C'] as const;

      // Create a temporary deck for preview
      const deck = createDeck({ title: `Style Preview: ${topic}` });

      for (let i = 0; i < 3; i++) {
        const presetId = presetIds[i];
        const theme = registry.getTheme(presetId);
        if (!theme) continue;

        const slide = createSlide(`${labels[i]}: ${theme.name}`);
        deck.slides.push(slide);

        const typo = theme.typography;
        const colors = theme.colors;
        const fontFamilies = new Set([typo.headingFont, typo.bodyFont]);
        const fontQuery = Array.from(fontFamilies)
          .map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700;900`)
          .join('&');

        const subtitle = lang === 'ja' ? 'プレゼンテーション' : 'Presentation';
        const tagline = lang === 'ja' ? 'スタイルプレビュー' : 'Style Preview';

        const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?${fontQuery}&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-primary: ${colors.primary};
      --color-secondary: ${colors.secondary};
      --color-accent: ${colors.accent};
      --color-bg: ${colors.background};
      --color-surface: ${colors.surface};
      --color-text: ${colors.text};
      --color-text-secondary: ${colors.textSecondary};
      --color-border: ${colors.border};
      --font-heading: '${typo.headingFont}', sans-serif;
      --font-body: '${typo.bodyFont}', sans-serif;
      --heading-weight: ${typo.headingWeight ?? 900};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1920px; height: 1080px; overflow: hidden;
      font-family: var(--font-body); color: var(--color-text); background: var(--color-bg);
      word-break: keep-all; overflow-wrap: break-word;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      padding: clamp(24px, 3.3vw, 64px); position: relative;
    }
    h1, h2, h3, h4 { font-family: var(--font-heading); font-weight: var(--heading-weight); }
    .accent-circle {
      position: absolute; top: -200px; right: -200px; width: 800px; height: 800px;
      border-radius: 50%; background: color-mix(in srgb, var(--color-primary) 8%, transparent);
      z-index: 0; pointer-events: none;
    }
    .badge {
      display: inline-block; background: var(--color-primary); color: white;
      padding: clamp(4px, 0.6vw, 8px) clamp(12px, 1.6vw, 24px);
      border-radius: 4px; font-weight: 700; font-size: clamp(0.7rem, 1vw, 1rem);
    }
    .bottom-bar {
      position: absolute; bottom: 0; left: 0; right: 0; height: 6px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
    }
  </style>
</head>
<body>
  <div class="accent-circle"></div>
  <span class="badge" style="z-index:1;margin-bottom:clamp(16px,2vw,32px);">${tagline}</span>
  <h1 style="font-size:clamp(2rem,3.5vw,3.5rem);z-index:1;text-align:center;line-height:1.3;">${topic}</h1>
  <p style="color:var(--color-text-secondary);font-size:clamp(1rem,1.5vw,1.5rem);z-index:1;margin-top:clamp(8px,1vw,16px);">${subtitle}</p>
  <div style="z-index:1;margin-top:clamp(24px,2.5vw,48px);display:flex;gap:16px;align-items:center;">
    <span style="font-size:0.9rem;color:var(--color-text-secondary);"><i class="fas fa-palette" style="color:var(--color-primary);margin-right:6px;"></i>${theme.name}</span>
    <span style="font-size:0.9rem;color:var(--color-text-secondary);"><i class="fas fa-font" style="color:var(--color-secondary);margin-right:6px;"></i>${typo.headingFont}</span>
  </div>
  <div class="bottom-bar"></div>
</body>
</html>`;

        await storage.saveSlideHtml(deck.id, slide.id, html);
      }

      deck.updatedAt = new Date().toISOString();
      await storage.saveDeck(deck);

      // Open in style picker mode
      if (!previewServer) {
        return { content: [{ type: 'text', text: 'Error: Preview server is disabled (SLIDEHARNESS_NO_PREVIEW=1)' }], isError: true };
      }
      const port = await previewServer.start();
      const url = `http://localhost:${port}/preview/${deck.id}?mode=style-picker`;

      try {
        const { default: open } = await import('open');
        await open(url);
      } catch {
        // open might not work in all environments
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            previewUrl: url,
            options: presetIds.map((id, i) => ({
              label: labels[i],
              presetId: id,
              name: registry.getTheme(id)?.name ?? id,
              description: registry.getTheme(id)?.description ?? '',
            })),
            instruction: `3 style previews opened in browser. Ask the user to choose A, B, or C, then use generate_deck with stylePreset set to the chosen preset ID.`,
          }, null, 2),
        }],
      };
    },
  );

  // ===== IMAGE SEARCH & DOWNLOAD =====

  server.tool(
    'search_images',
    'Search for free stock photos by keyword. Uses Pexels or Unsplash API if keys are set, otherwise returns fallback instructions for the agent to use WebSearch.',
    {
      query: z.string().describe('Search keyword (English recommended)'),
      count: z.number().min(1).max(10).default(5).describe('Number of results'),
      orientation: z.enum(['landscape', 'portrait', 'square']).default('landscape').describe('Image orientation'),
    },
    async ({ query, count, orientation }) => {
      const pexelsKey = process.env.PEXELS_API_KEY;
      const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

      // Tier 1: Pexels API
      if (pexelsKey) {
        try {
          const params = new URLSearchParams({
            query,
            per_page: String(count),
            orientation,
          });
          const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
            headers: { Authorization: pexelsKey },
          });
          if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);
          const data = await res.json() as {
            photos: Array<{
              src: { original: string; large: string; medium: string };
              alt: string;
              photographer: string;
              url: string;
            }>;
          };
          const images = data.photos.map((p) => ({
            url: p.src.large,
            thumbnailUrl: p.src.medium,
            alt: p.alt || query,
            photographer: p.photographer,
            source: 'pexels' as const,
            sourceUrl: p.url,
          }));
          return {
            content: [{ type: 'text', text: JSON.stringify({ images }, null, 2) }],
          };
        } catch (err: any) {
          return {
            content: [{ type: 'text', text: `Pexels API error: ${err.message}` }],
            isError: true,
          };
        }
      }

      // Tier 2: Unsplash API
      if (unsplashKey) {
        try {
          const params = new URLSearchParams({
            query,
            per_page: String(count),
            orientation,
          });
          const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
            headers: { Authorization: `Client-ID ${unsplashKey}` },
          });
          if (!res.ok) throw new Error(`Unsplash API error: ${res.status}`);
          const data = await res.json() as {
            results: Array<{
              urls: { regular: string; small: string };
              alt_description: string | null;
              user: { name: string };
              links: { html: string };
            }>;
          };
          const images = data.results.map((p) => ({
            url: p.urls.regular,
            thumbnailUrl: p.urls.small,
            alt: p.alt_description || query,
            photographer: p.user.name,
            source: 'unsplash' as const,
            sourceUrl: p.links.html,
          }));
          return {
            content: [{ type: 'text', text: JSON.stringify({ images }, null, 2) }],
          };
        } catch (err: any) {
          return {
            content: [{ type: 'text', text: `Unsplash API error: ${err.message}` }],
            isError: true,
          };
        }
      }

      // Tier 0: Fallback — instruct the agent to use WebSearch
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            fallback: true,
            instruction: `No image API key configured. Use WebSearch to find free stock photos:\n1. Search for 'site:unsplash.com ${query} photo' or 'site:pexels.com ${query} photo'\n2. Extract image URLs from results (Unsplash: https://images.unsplash.com/photo-xxx, Pexels: https://images.pexels.com/photos/xxx)\n3. Use URLs directly in slide HTML with background-image or <img> tags\n4. Include photographer credit in alt text when available`,
            suggestedSearches: [
              `site:unsplash.com ${query} photo`,
              `site:pexels.com ${query} photo`,
            ],
          }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'save_deck_image',
    'Download an external image URL and save it locally for a deck. Returns a local URL for use in slide HTML. Use this before export to ensure images are available offline.',
    {
      deckId: z.string().describe('Deck ID'),
      imageUrl: z.string().url().describe('External image URL to download'),
      filename: z.string().optional().describe('Save filename (auto-generated if omitted)'),
    },
    async ({ deckId, imageUrl, filename }) => {
      const deck = await storage.loadDeck(deckId);
      if (!deck) {
        return { content: [{ type: 'text', text: 'Error: Deck not found' }], isError: true };
      }

      try {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error(`Failed to download: ${res.status}`);

        const buffer = Buffer.from(await res.arrayBuffer());

        // Determine filename
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        const ext = contentType.includes('png') ? '.png'
          : contentType.includes('webp') ? '.webp'
          : contentType.includes('gif') ? '.gif'
          : '.jpg';
        const saveName = filename || `img-${randomBytes(6).toString('hex')}${ext}`;

        await storage.saveImage(deckId, saveName, buffer);
        previewServer?.notifyDeckUpdate(deckId);

        const localUrl = `/api/decks/${deckId}/images/${saveName}`;
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              filename: saveName,
              localUrl,
              size: buffer.length,
              contentType,
            }, null, 2),
          }],
        };
      } catch (err: any) {
        return {
          content: [{ type: 'text', text: `Error downloading image: ${err.message}` }],
          isError: true,
        };
      }
    },
  );

  // ===== CANVAS PRESETS =====

  server.tool(
    'list_canvas_presets',
    'List all available canvas size presets grouped by category (presentation, social, print). Use preset IDs with create_deck, generate_deck, or export_deck.',
    {},
    async () => {
      const grouped: Record<string, Array<{ id: string; label: string; width: number; height: number }>> = {};
      for (const p of CANVAS_PRESETS) {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push({ id: p.id, label: p.label, width: p.width, height: p.height });
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(grouped, null, 2),
        }],
      };
    },
  );

  // ===== BUILT-IN TEMPLATES =====

  server.tool(
    'list_built_in_templates',
    'List built-in design templates with optional filtering by format, category, or search query. Returns template metadata for use with create_from_template.',
    {
      format: z.string().optional().describe('Filter by canvas format (e.g. "16:9", "instagram-post", "a4")'),
      category: z.string().optional().describe('Filter by category: business, marketing, creative, data, education, personal'),
      search: z.string().optional().describe('Search query to match against template names, descriptions, and tags'),
    },
    async ({ format, category, search }) => {
      let results: BuiltInTemplate[] = BUILT_IN_TEMPLATES;

      if (format) {
        results = results.filter((t) => t.format === format);
      }
      if (category) {
        results = results.filter((t) => t.category === category);
      }
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(
          (t) =>
            t.id.toLowerCase().includes(q) ||
            t.name.toLowerCase().includes(q) ||
            t.nameJa.includes(q) ||
            t.descriptionJa.includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q)),
        );
      }

      const summary = results.map((t) => ({
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
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ count: summary.length, templates: summary }, null, 2),
        }],
      };
    },
  );

  server.tool(
    'create_from_template',
    'Create a new deck from a built-in template. Returns deck with blank themed slides and detailed per-slide AI generation instructions. Use update_slide to populate each slide based on the returned instructions.',
    {
      templateId: z.string().describe('Built-in template ID (e.g. "presentation-business-plan", "instagram-post-sale-promotion")'),
      stylePreset: z.string().optional().describe('Override the suggested style preset'),
      topic: z.string().optional().describe('Custom topic to adapt the template to (omit for sample content)'),
      language: z.enum(['ja', 'en']).default('ja').describe('Language for generated content'),
    },
    async ({ templateId, stylePreset, topic, language }) => {
      const template = getTemplateById(templateId);
      if (!template) {
        return {
          content: [{ type: 'text', text: `Error: Template "${templateId}" not found. Use list_built_in_templates to see available templates.` }],
          isError: true,
        };
      }

      // Resolve theme
      const resolvedPresetId = stylePreset ?? template.suggestedStylePreset;
      const theme = registry.getTheme(resolvedPresetId) ?? registry.getTheme('genspark')!;
      const themeOptions: SlideThemeOptions = {
        colors: theme.colors,
        typography: theme.typography,
      };

      // Resolve canvas size from template format
      const effectiveCanvasSize = template.format;
      const resolvedDims = getCanvasDimensions(effectiveCanvasSize as string | CanvasSize);

      // Determine if single-design format
      const SINGLE_DESIGN_FORMATS = ['instagram-post', 'instagram-story', 'youtube-thumbnail', 'x-post', 'pinterest-pin', 'a4'];
      const isSingleDesign = SINGLE_DESIGN_FORMATS.includes(template.format);
      const format = isSingleDesign ? template.format : undefined;

      // Create deck
      const deckTitle = topic ?? template.nameJa;
      const deck = createDeck({
        title: deckTitle,
        description: template.descriptionJa,
        metadata: {
          canvasSize: effectiveCanvasSize,
          ...(format ? { format } : {}),
          templateId: template.id,
        },
      });

      // Create slides
      for (let i = 0; i < template.slideCount; i++) {
        const slideInstruction = template.slides[Math.min(i, template.slides.length - 1)];
        const slide = createSlide(slideInstruction.title);
        deck.slides.push(slide);

        const html = generateBlankSlideHtml({
          title: `${deckTitle} - ${slideInstruction.title}`,
          width: resolvedDims.width,
          height: resolvedDims.height,
          theme: themeOptions,
          format,
        });
        await storage.saveSlideHtml(deck.id, slide.id, html);
      }

      deck.updatedAt = new Date().toISOString();
      await storage.saveDeck(deck);

      // Build per-slide instruction
      const slideStructure = template.slides.slice(0, template.slideCount).map((s, i) => ({
        index: i,
        slideId: deck.slides[i].id,
        suggestedTitle: s.title,
        layout: s.layout,
        prompt: s.prompt,
      }));

      // Build generation context instruction
      const topicAdaptation = topic
        ? `\n\nIMPORTANT: Adapt ALL content to the custom topic: "${topic}". Replace sample company names, data, and examples with relevant content for this topic. Maintain the same structure and layout but make the content specific to "${topic}".`
        : '';

      const langInstruction = language === 'en'
        ? '\n\nLANGUAGE: Generate all visible text content in English.'
        : '\n\nLANGUAGE: Generate all visible text content in Japanese (日本語).';

      const instruction = `=== BUILT-IN TEMPLATE: ${template.name} ===
${template.generationContext}${topicAdaptation}${langInstruction}

=== WORKFLOW ===
STEP 1 — Review the per-slide prompts below and plan content for ALL slides.
STEP 2 — For each slide, call update_slide with full <body> HTML based on the prompt.

=== STYLE GUIDE ===
1. CANVAS: ${resolvedDims.width}x${resolvedDims.height}px. Style preset: ${resolvedPresetId}.
2. CSS VARIABLES: Use var(--color-*) and var(--font-*). No hardcoded colors.
3. BANNED: Inter/Roboto/Arial fonts, hardcoded #6366f1, emoji. Use Font Awesome icons only.
4. REQUIRED: word-break:keep-all, clamp() for font-size/padding.
5. Each slide <head> is pre-generated — only replace <body> content via update_slide.`;

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            deckId: deck.id,
            templateId: template.id,
            templateName: template.nameJa,
            slideCount: deck.slides.length,
            theme: { id: theme.id, name: theme.name, colors: theme.colors, typography: theme.typography },
            slides: slideStructure,
            canvasSize: resolvedDims,
            ...(format ? { format } : {}),
            ...(isSingleDesign ? { singleDesign: true } : {}),
            instruction,
          }, null, 2),
        }],
      };
    },
  );

  // ===== EXPORT =====

  server.tool(
    'export_deck',
    'Export a deck to a file (PDF, PPTX, HTML, or PNG). Returns the output file path for use by other tools or MCP servers.',
    {
      deckId: z.string().describe('Deck ID to export'),
      format: z.enum(['pdf', 'pptx', 'html', 'png']).describe('Export format'),
      aspectRatio: z.enum(['16:9', '4:3', '16:10', '1:1']).optional().describe('Aspect ratio (default: 16:9). Ignored if canvasSize is set.'),
      canvasSize: z.union([
        z.string().describe('Preset ID (e.g. "instagram-post", "a4")'),
        z.object({ width: z.number(), height: z.number() }).describe('Custom canvas size in pixels'),
      ]).optional().describe('Canvas size override. Priority: canvasSize arg > deck metadata canvasSize > aspectRatio > 16:9'),
      filename: z.string().optional().describe('Output filename (without extension). Defaults to deck title.'),
    },
    async ({ deckId, format, aspectRatio, canvasSize: canvasSizeInput, filename }) => {
      const deck = await storage.loadDeck(deckId);
      if (!deck) {
        return { content: [{ type: 'text', text: 'Error: Deck not found' }], isError: true };
      }

      // Load all slide HTMLs
      const slideHtmls: string[] = [];
      for (const slide of deck.slides) {
        const html = await storage.loadSlideHtml(deckId, slide.id);
        if (html) slideHtmls.push(html);
      }
      if (slideHtmls.length === 0) {
        return { content: [{ type: 'text', text: 'Error: No slides with HTML content found' }], isError: true };
      }

      // Build output path: ~/.slideharness/exports/{deckId}/{filename}.{ext}
      const safeTitle = (filename ?? deck.title).replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF_-]/g, '_').slice(0, 100);
      const exportDir = join(homedir(), '.slideharness', 'exports', deckId);
      await mkdir(exportDir, { recursive: true });

      // Resolve canvas size: canvasSize arg > deck metadata > aspectRatio > default 16:9
      const resolvedCanvas: CanvasSize | undefined = canvasSizeInput
        ? getCanvasDimensions(canvasSizeInput as string | CanvasSize)
        : deck.metadata?.canvasSize
          ? resolveCanvasSize(deck.metadata as Record<string, unknown>)
          : undefined;

      const ratio = aspectRatio ?? '16:9';
      let result;

      switch (format) {
        case 'pdf': {
          const outputPath = join(exportDir, `${safeTitle}.pdf`);
          result = await exportToPdf(deck, slideHtmls, outputPath, ratio, resolvedCanvas);
          break;
        }
        case 'pptx': {
          const outputPath = join(exportDir, `${safeTitle}.pptx`);
          result = await exportToPptx(deck, slideHtmls, outputPath, ratio, resolvedCanvas);
          break;
        }
        case 'html': {
          const outputPath = join(exportDir, `${safeTitle}.html`);
          result = await exportToHtml(deck, slideHtmls, outputPath, resolvedCanvas);
          break;
        }
        case 'png': {
          const outputDir2 = join(exportDir, safeTitle);
          result = await exportToPng(deck, slideHtmls, outputDir2, ratio, resolvedCanvas);
          break;
        }
      }

      if (!result.success) {
        return { content: [{ type: 'text', text: `Export failed: ${result.error}` }], isError: true };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            format,
            outputPath: result.outputPath,
            slideCount: slideHtmls.length,
            ...(resolvedCanvas ? { canvasSize: resolvedCanvas } : {}),
          }, null, 2),
        }],
      };
    },
  );
}
