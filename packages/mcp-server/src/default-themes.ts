import type { Theme } from '@slidecraft/plugin-api';

export const minimalTheme: Theme = {
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
};

export const corporateTheme: Theme = {
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
};

export const darkTheme: Theme = {
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
};

export const defaultThemes: Theme[] = [minimalTheme, corporateTheme, darkTheme];
