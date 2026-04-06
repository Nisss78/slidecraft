import type { SlideHarnessPlugin, PluginContext } from '@slideharness/plugin-api';

const plugin: SlideHarnessPlugin = {
  name: 'slideharness-theme-corporate',
  version: '0.1.0',
  type: 'theme',
  register(ctx: PluginContext) {
    ctx.registerTheme({
      id: 'corporate',
      name: 'Corporate',
      description: 'Professional business presentation theme',
      colors: {
        primary: '#1e40af',
        secondary: '#0f766e',
        accent: '#dc2626',
        background: '#f1f5f9',
        surface: '#ffffff',
        text: '#0f172a',
        textSecondary: '#475569',
        border: '#cbd5e1',
      },
      typography: {
        headingFont: 'Georgia',
        bodyFont: 'Arial',
        codeFont: 'Courier New',
        baseFontSize: 22,
      },
    });
  },
};

export default plugin;
