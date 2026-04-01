import type { SlideCraftPlugin, PluginContext } from '@slidecraft/plugin-api';

const plugin: SlideCraftPlugin = {
  name: 'slidecraft-theme-minimal',
  version: '0.1.0',
  type: 'theme',
  register(ctx: PluginContext) {
    ctx.registerTheme({
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean, minimal design with plenty of whitespace',
      colors: {
        primary: '#2563eb',
        secondary: '#7c3aed',
        accent: '#f59e0b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'JetBrains Mono',
        baseFontSize: 24,
      },
    });
  },
};

export default plugin;
