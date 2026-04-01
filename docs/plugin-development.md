# Plugin Development Guide

## Plugin Types

| Type | Description | Naming Convention |
|------|-------------|-------------------|
| `theme` | Colors, fonts, styles | `slidecraft-theme-*` |
| `layout` | Slide layout definitions | `slidecraft-layout-*` |
| `element` | Custom element renderers | `slidecraft-element-*` |
| `exporter` | Output format plugins | `slidecraft-exporter-*` |
| `transformer` | Input format converters | `slidecraft-transformer-*` |

## Creating a Theme Plugin

```typescript
import type { SlideCraftPlugin, PluginContext } from '@slidecraft/plugin-api';

const plugin: SlideCraftPlugin = {
  name: 'slidecraft-theme-neon',
  version: '1.0.0',
  type: 'theme',
  register(ctx: PluginContext) {
    ctx.registerTheme({
      id: 'neon',
      name: 'Neon',
      description: 'Vibrant neon theme',
      colors: {
        primary: '#00ff88',
        secondary: '#ff0088',
        accent: '#ffff00',
        background: '#0a0a0a',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#aaaaaa',
        border: '#333333',
      },
      typography: {
        headingFont: 'Orbitron',
        bodyFont: 'Roboto',
        codeFont: 'Fira Code',
        baseFontSize: 24,
      },
    });
  },
};

export default plugin;
```

## Creating a Layout Plugin

```typescript
ctx.registerLayout({
  id: 'three-column',
  name: 'Three Column',
  description: 'Three equal columns with title',
  slots: [
    { name: 'title', type: 'text', position: { x: 5, y: 5, width: 90, height: 12 } },
    { name: 'col1', type: 'any', position: { x: 3, y: 20, width: 30, height: 75 } },
    { name: 'col2', type: 'any', position: { x: 35, y: 20, width: 30, height: 75 } },
    { name: 'col3', type: 'any', position: { x: 67, y: 20, width: 30, height: 75 } },
  ],
});
```

## Plugin API Reference

### PluginContext Methods

- `registerTheme(theme: Theme)` - Register a theme
- `registerLayout(layout: Layout)` - Register a layout
- `registerElementRenderer(type, renderer)` - Custom element renderer
- `registerExporter(format, exporter)` - Export format
- `registerTransformer(name, transformer)` - Input transformer

## Publishing

1. Create a package with `slidecraft-` prefix
2. Export a default `SlideCraftPlugin` object
3. Publish to npm
4. Users install and configure in their SlideCraft setup
