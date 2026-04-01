import type { Slide, Deck } from '@slidecraft/core';

// === Plugin Types ===
export type PluginType = 'theme' | 'layout' | 'exporter' | 'transformer';

export interface SlideCraftPlugin {
  name: string;
  version: string;
  type: PluginType;
  register(context: PluginContext): void | Promise<void>;
}

// === Theme ===
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  codeFont: string;
  baseFontSize: number;
}

export interface Theme {
  id: string;
  name: string;
  description?: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  styles?: Record<string, string>;
}

// === Layout ===
export interface LayoutSlot {
  name: string;
  type: 'text' | 'image' | 'any';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: Record<string, unknown>;
}

export interface Layout {
  id: string;
  name: string;
  description?: string;
  slots: LayoutSlot[];
  background?: Record<string, unknown>;
}

// === Exporter ===
export interface ExportOptions {
  outputPath: string;
  quality?: number;
  width?: number;
  height?: number;
}

export interface Exporter {
  format: string;
  extension: string;
  export(deck: Deck, theme: Theme, options: ExportOptions): Promise<string>;
}

// === Transformer ===
export interface Transformer {
  name: string;
  inputFormat: string;
  transform(input: string): Promise<Slide[]>;
}

// === Plugin Context ===
export interface PluginContext {
  registerTheme(theme: Theme): void;
  registerLayout(layout: Layout): void;
  registerExporter(format: string, exporter: Exporter): void;
  registerTransformer(name: string, transformer: Transformer): void;
}

// === Plugin Registry ===
export class PluginRegistry implements PluginContext {
  private themes = new Map<string, Theme>();
  private layouts = new Map<string, Layout>();
  private exporters = new Map<string, Exporter>();
  private transformers = new Map<string, Transformer>();
  private plugins: SlideCraftPlugin[] = [];

  async loadPlugin(plugin: SlideCraftPlugin): Promise<void> {
    await plugin.register(this);
    this.plugins.push(plugin);
  }

  registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme);
  }

  registerLayout(layout: Layout): void {
    this.layouts.set(layout.id, layout);
  }

  registerExporter(format: string, exporter: Exporter): void {
    this.exporters.set(format, exporter);
  }

  registerTransformer(name: string, transformer: Transformer): void {
    this.transformers.set(name, transformer);
  }

  getTheme(id: string): Theme | undefined {
    return this.themes.get(id);
  }

  getLayout(id: string): Layout | undefined {
    return this.layouts.get(id);
  }

  getExporter(format: string): Exporter | undefined {
    return this.exporters.get(format);
  }

  getTransformer(name: string): Transformer | undefined {
    return this.transformers.get(name);
  }

  getAllThemes(): Theme[] {
    return Array.from(this.themes.values());
  }

  getAllLayouts(): Layout[] {
    return Array.from(this.layouts.values());
  }

  getAllExporters(): Exporter[] {
    return Array.from(this.exporters.values());
  }

  getPlugins(): SlideCraftPlugin[] {
    return [...this.plugins];
  }
}
