import type { Theme } from '@slideharness/plugin-api';

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

export const gensparkTheme: Theme = {
  id: 'genspark',
  name: 'Genspark',
  description: 'High-quality presentation theme with strict design tokens, reusable components, and Chart.js support',
  colors: {
    primary: '#007BFF',
    secondary: '#6C757D',
    accent: '#28A745',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    text: '#333333',
    textSecondary: '#6C757D',
    border: '#DEE2E6',
  },
  typography: {
    headingFont: 'BIZ UDGothic',
    bodyFont: 'Noto Sans JP',
    codeFont: 'JetBrains Mono',
    baseFontSize: 24,
    headingWeight: 900,
  },
  accentShape: { type: 'circle', opacity: 0.05 },
};

export const boldSignalTheme: Theme = {
  id: 'bold-signal',
  name: 'Bold Signal',
  description: 'Powerful impact-driven design',
  colors: {
    primary: '#FF3B30',
    secondary: '#FF9500',
    accent: '#34C759',
    background: '#0D1117',
    surface: '#161B22',
    text: '#F0F6FC',
    textSecondary: '#8B949E',
    border: '#30363D',
  },
  typography: {
    headingFont: 'Archivo Black',
    bodyFont: 'Space Grotesk',
    codeFont: 'JetBrains Mono',
    baseFontSize: 24,
    headingWeight: 900,
  },
};

export const electricStudioTheme: Theme = {
  id: 'electric-studio',
  name: 'Electric Studio',
  description: 'Clean professional design',
  colors: {
    primary: '#0066FF',
    secondary: '#6E42CA',
    accent: '#00C2FF',
    background: '#FFFFFF',
    surface: '#F5F7FA',
    text: '#1A1A2E',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  typography: {
    headingFont: 'Manrope',
    bodyFont: 'Manrope',
    codeFont: 'JetBrains Mono',
    baseFontSize: 24,
    headingWeight: 800,
  },
};

export const creativeVoltageTheme: Theme = {
  id: 'creative-voltage',
  name: 'Creative Voltage',
  description: 'Energetic creative design',
  colors: {
    primary: '#F43F5E',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
  },
  typography: {
    headingFont: 'Syne',
    bodyFont: 'Space Mono',
    codeFont: 'Fira Code',
    baseFontSize: 22,
    headingWeight: 800,
  },
};

export const darkBotanicalTheme: Theme = {
  id: 'dark-botanical',
  name: 'Dark Botanical',
  description: 'Elegant dark aesthetic',
  colors: {
    primary: '#D4A574',
    secondary: '#8B9D83',
    accent: '#C9B1FF',
    background: '#1A1A2E',
    surface: '#252540',
    text: '#EDEEF0',
    textSecondary: '#9CA3AF',
    border: '#3D3D5C',
  },
  typography: {
    headingFont: 'Cormorant',
    bodyFont: 'IBM Plex Sans',
    codeFont: 'IBM Plex Mono',
    baseFontSize: 24,
    headingWeight: 700,
  },
};

export const notebookTabsTheme: Theme = {
  id: 'notebook-tabs',
  name: 'Notebook Tabs',
  description: 'Editorial notebook style',
  colors: {
    primary: '#D97706',
    secondary: '#059669',
    accent: '#DC2626',
    background: '#FFFBF0',
    surface: '#FFF8E7',
    text: '#292524',
    textSecondary: '#78716C',
    border: '#E7E5E4',
  },
  typography: {
    headingFont: 'Bodoni Moda',
    bodyFont: 'DM Sans',
    codeFont: 'DM Mono',
    baseFontSize: 24,
    headingWeight: 700,
  },
};

export const pastelGeometryTheme: Theme = {
  id: 'pastel-geometry',
  name: 'Pastel Geometry',
  description: 'Friendly pastel design',
  colors: {
    primary: '#7C3AED',
    secondary: '#EC4899',
    accent: '#14B8A6',
    background: '#F7F7FF',
    surface: '#FFFFFF',
    text: '#1E1B4B',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  typography: {
    headingFont: 'Plus Jakarta Sans',
    bodyFont: 'Plus Jakarta Sans',
    codeFont: 'JetBrains Mono',
    baseFontSize: 24,
    headingWeight: 700,
  },
};

export const splitPastelTheme: Theme = {
  id: 'split-pastel',
  name: 'Split Pastel',
  description: 'Playful pastel split layouts',
  colors: {
    primary: '#F472B6',
    secondary: '#A78BFA',
    accent: '#34D399',
    background: '#FFF1F2',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    border: '#FECDD3',
  },
  typography: {
    headingFont: 'Outfit',
    bodyFont: 'Outfit',
    codeFont: 'JetBrains Mono',
    baseFontSize: 24,
    headingWeight: 700,
  },
};

export const vintageEditorialTheme: Theme = {
  id: 'vintage-editorial',
  name: 'Vintage Editorial',
  description: 'Witty vintage editorial style',
  colors: {
    primary: '#B45309',
    secondary: '#0F766E',
    accent: '#BE185D',
    background: '#FFFDF7',
    surface: '#FEF9EF',
    text: '#1C1917',
    textSecondary: '#78716C',
    border: '#D6D3D1',
  },
  typography: {
    headingFont: 'Fraunces',
    bodyFont: 'Work Sans',
    codeFont: 'JetBrains Mono',
    baseFontSize: 24,
    headingWeight: 700,
  },
};

export const neonCyberTheme: Theme = {
  id: 'neon-cyber',
  name: 'Neon Cyber',
  description: 'Cyberpunk neon aesthetic',
  colors: {
    primary: '#00F0FF',
    secondary: '#FF00E5',
    accent: '#BFFF00',
    background: '#0A0A0F',
    surface: '#14141F',
    text: '#EEEEF0',
    textSecondary: '#8888A0',
    border: '#2A2A3F',
  },
  typography: {
    headingFont: 'Orbitron',
    bodyFont: 'Poppins',
    codeFont: 'Fira Code',
    baseFontSize: 22,
    headingWeight: 900,
  },
};

export const terminalGreenTheme: Theme = {
  id: 'terminal-green',
  name: 'Terminal Green',
  description: 'Hacker terminal style',
  colors: {
    primary: '#00FF41',
    secondary: '#00D4AA',
    accent: '#FFB000',
    background: '#0D0208',
    surface: '#1A1A1A',
    text: '#00FF41',
    textSecondary: '#00AA2A',
    border: '#003B00',
  },
  typography: {
    headingFont: 'JetBrains Mono',
    bodyFont: 'JetBrains Mono',
    codeFont: 'JetBrains Mono',
    baseFontSize: 22,
    headingWeight: 700,
  },
};

export const swissModernTheme: Theme = {
  id: 'swiss-modern',
  name: 'Swiss Modern',
  description: 'Bauhaus-inspired Swiss design',
  colors: {
    primary: '#E63946',
    secondary: '#457B9D',
    accent: '#2A9D8F',
    background: '#F1FAEE',
    surface: '#FFFFFF',
    text: '#1D3557',
    textSecondary: '#6B7280',
    border: '#A8DADC',
  },
  typography: {
    headingFont: 'Archivo',
    bodyFont: 'Nunito',
    codeFont: 'JetBrains Mono',
    baseFontSize: 24,
    headingWeight: 800,
  },
};

export const kyotoClassicTheme: Theme = {
  id: 'kyoto-classic',
  name: 'Kyoto Classic',
  description: 'Japanese aesthetic design',
  colors: {
    primary: '#8B4513',
    secondary: '#2E7D32',
    accent: '#BF360C',
    background: '#FAF6F0',
    surface: '#F5EFE6',
    text: '#2C2C2C',
    textSecondary: '#666666',
    border: '#D4C5B0',
  },
  typography: {
    headingFont: 'Noto Serif JP',
    bodyFont: 'Noto Sans JP',
    codeFont: 'JetBrains Mono',
    baseFontSize: 24,
    headingWeight: 700,
  },
};

export const defaultThemes: Theme[] = [minimalTheme, corporateTheme, darkTheme, gensparkTheme, boldSignalTheme, electricStudioTheme, creativeVoltageTheme, darkBotanicalTheme, notebookTabsTheme, pastelGeometryTheme, splitPastelTheme, vintageEditorialTheme, neonCyberTheme, terminalGreenTheme, swissModernTheme, kyotoClassicTheme];
