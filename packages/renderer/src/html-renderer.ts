/**
 * v2: HTML-first renderer
 * Generates blank/template slide HTML with Tailwind CSS CDN, Font Awesome, Google Fonts,
 * Chart.js, and reusable Slide Harness component classes.
 */

export interface SlideThemeOptions {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    surface?: string;
    text?: string;
    textSecondary?: string;
    border?: string;
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    baseFontSize?: number;
    headingWeight?: number;
  };
}

export function generateBlankSlideHtml(options?: {
  title?: string;
  width?: number;
  height?: number;
  theme?: SlideThemeOptions;
}): string {
  const { title = 'Untitled Slide', width = 1920, height = 1080, theme } = options ?? {};

  const colors = {
    primary: theme?.colors?.primary ?? '#007BFF',
    secondary: theme?.colors?.secondary ?? '#6C757D',
    accent: theme?.colors?.accent ?? '#28A745',
    background: theme?.colors?.background ?? '#FFFFFF',
    surface: theme?.colors?.surface ?? '#F8F9FA',
    text: theme?.colors?.text ?? '#333333',
    textSecondary: theme?.colors?.textSecondary ?? '#6C757D',
    border: theme?.colors?.border ?? '#DEE2E6',
  };

  const typo = {
    headingFont: theme?.typography?.headingFont ?? 'BIZ UDGothic',
    bodyFont: theme?.typography?.bodyFont ?? 'Noto Sans JP',
    baseFontSize: theme?.typography?.baseFontSize ?? 24,
    headingWeight: theme?.typography?.headingWeight ?? 900,
  };

  // Build Google Fonts URL with all needed fonts (no Inter default)
  const fontFamilies = new Set([typo.headingFont, typo.bodyFont]);
  const fontQuery = Array.from(fontFamilies)
    .map(f => `family=${f.replace(/ /g, '+')}:wght@300;400;500;600;700;900`)
    .join('&');

  // Check if any font needs Fontshare CDN (Clash Display, Satoshi)
  const fontshareFonts = ['Clash Display', 'Satoshi', 'General Sans', 'Cabinet Grotesk'];
  const needsFontshare = fontshareFonts.some(f =>
    typo.headingFont.includes(f) || typo.bodyFont.includes(f)
  );
  const fontshareLink = needsFontshare
    ? '\n  <link href="https://api.fontshare.com/v2/css?f[]=clash-display@200,300,400,500,600,700&f[]=satoshi@300,400,500,700&display=swap" rel="stylesheet">'
    : '';

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${width}, height=${height}, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?${fontQuery}&display=swap" rel="stylesheet">${fontshareLink}
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
      --font-size-base: ${typo.baseFontSize}px;
      --heading-weight: ${typo.headingWeight};
      --font-size-h1: clamp(2rem, 3.5vw, 3.5rem);
      --font-size-h2: clamp(1.25rem, 2vw, 2rem);
      --font-size-h3: clamp(1rem, 1.4vw, 1.4rem);
      --spacing-slide: clamp(24px, 3.3vw, 64px);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      font-family: var(--font-body);
      font-size: var(--font-size-base);
      color: var(--color-text);
      background: var(--color-bg);
      word-break: keep-all;
      overflow-wrap: break-word;
    }
    h1, h2, h3, h4 {
      font-family: var(--font-heading);
      font-weight: var(--heading-weight);
    }

    /* === Slide Harness Reusable Components === */
    .sh-card {
      background: var(--color-surface);
      border-left: 4px solid var(--color-primary);
      padding: clamp(12px, 1.6vw, 24px);
      border-radius: 0 8px 8px 0;
    }
    .sh-badge {
      display: inline-block;
      background: var(--color-primary);
      color: white;
      padding: clamp(4px, 0.6vw, 8px) clamp(12px, 1.6vw, 24px);
      border-radius: 4px;
      font-weight: 700;
    }
    .sh-badge-outline {
      display: inline-block;
      border: 2px solid var(--color-primary);
      color: var(--color-primary);
      padding: clamp(4px, 0.6vw, 8px) clamp(12px, 1.6vw, 24px);
      border-radius: 8px;
    }
    .sh-accent-circle {
      position: absolute;
      top: -200px;
      right: -200px;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      background: color-mix(in oklch, var(--color-primary) 5%, transparent);
      z-index: 0;
      pointer-events: none;
    }
    .sh-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .sh-footer {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .sh-section-heading {
      font-size: 1.4rem;
      font-weight: 700;
      border-bottom: 2px solid var(--color-border);
      padding-bottom: 4px;
    }
    .sh-list {
      list-style: none;
      padding-left: 0;
    }
    .sh-list li {
      padding-left: 1.2em;
      margin-bottom: 0.5em;
      position: relative;
    }
    .sh-list li::before {
      content: "\\2022";
      color: var(--color-primary);
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    .sh-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(12px, 1.6vw, 24px); }
    .sh-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: clamp(12px, 1.6vw, 24px); }
    .sh-grid-2 > *, .sh-grid-3 > * { display: grid; grid-template-rows: subgrid; grid-row: span 2; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
    }
    .sh-split-half { display: grid; grid-template-columns: 1fr 1fr; height: 100%; }
    .sh-split-60-40 { display: grid; grid-template-columns: 3fr 2fr; height: 100%; }
  </style>
</head>
<body class="flex items-center justify-center">
  <h1 style="font-size: 3rem; font-weight: var(--heading-weight); color: var(--color-text);">${escapeHtml(title)}</h1>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
