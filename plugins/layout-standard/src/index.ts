import type { SlideCraftPlugin, PluginContext } from '@slidecraft/plugin-api';

const plugin: SlideCraftPlugin = {
  name: 'slidecraft-layout-standard',
  version: '0.1.0',
  type: 'layout',
  register(ctx: PluginContext) {
    ctx.registerLayout({
      id: 'title',
      name: 'Title Slide',
      description: 'Large centered title with subtitle',
      slots: [
        { name: 'title', type: 'text', position: { x: 10, y: 25, width: 80, height: 25 } },
        { name: 'subtitle', type: 'text', position: { x: 15, y: 55, width: 70, height: 15 } },
      ],
    });

    ctx.registerLayout({
      id: 'content',
      name: 'Content',
      description: 'Title with body text',
      slots: [
        { name: 'title', type: 'text', position: { x: 5, y: 5, width: 90, height: 15 } },
        { name: 'body', type: 'text', position: { x: 5, y: 22, width: 90, height: 70 } },
      ],
    });

    ctx.registerLayout({
      id: 'two-column',
      name: 'Two Column',
      description: 'Title with two columns',
      slots: [
        { name: 'title', type: 'text', position: { x: 5, y: 5, width: 90, height: 15 } },
        { name: 'left', type: 'any', position: { x: 5, y: 22, width: 43, height: 70 } },
        { name: 'right', type: 'any', position: { x: 52, y: 22, width: 43, height: 70 } },
      ],
    });

    ctx.registerLayout({
      id: 'image-left',
      name: 'Image Left',
      description: 'Image on left, text on right',
      slots: [
        { name: 'image', type: 'image', position: { x: 0, y: 0, width: 45, height: 100 } },
        { name: 'title', type: 'text', position: { x: 50, y: 10, width: 45, height: 15 } },
        { name: 'body', type: 'text', position: { x: 50, y: 28, width: 45, height: 60 } },
      ],
    });

    ctx.registerLayout({
      id: 'section',
      name: 'Section Divider',
      description: 'Bold section title centered on slide',
      slots: [
        { name: 'title', type: 'text', position: { x: 10, y: 35, width: 80, height: 20 } },
        { name: 'subtitle', type: 'text', position: { x: 20, y: 58, width: 60, height: 10 } },
      ],
    });

    ctx.registerLayout({
      id: 'blank',
      name: 'Blank',
      description: 'Empty slide',
      slots: [],
    });
  },
};

export default plugin;
