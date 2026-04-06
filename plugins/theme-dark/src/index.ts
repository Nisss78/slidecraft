import type { SlideHarnessPlugin, PluginContext } from '@slideharness/plugin-api';

const plugin: SlideHarnessPlugin = {
  name: 'slideharness-theme-dark',
  version: '0.1.0',
  type: 'theme',
  register(ctx: PluginContext) {
    ctx.registerTheme({
      id: 'dark',
      name: 'Dark',
      description: 'Modern dark theme for tech presentations',
      colors: {
        primary: '#818cf8',
        secondary: '#a78bfa',
        accent: '#34d399',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        border: '#334155',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        codeFont: 'Fira Code',
        baseFontSize: 24,
      },
    });
  },
};

export default plugin;
