/**
 * Slide Harness HTML Generator Helper
 * Generates themed HTML for industry templates without requiring AI.
 */

// ── Style Preset Definitions ──────────────────────────────────────────────────
export const PRESETS = {
  'dark-botanical': {
    bg: '#1A1A2E', text: '#EDEEF0', accent: '#D4A574', accent2: '#6B8F71',
    surface: '#252540', border: '#3a3a5c',
    font: 'Cormorant', fontUrl: 'https://fonts.googleapis.com/css2?family=Cormorant:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'kyoto-classic': {
    bg: '#FAF6F0', text: '#2C2C2C', accent: '#8B4513', accent2: '#C8860A',
    surface: '#F0E8DC', border: '#D4C4A8',
    font: 'Noto Serif JP', fontUrl: 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'neon-cyber': {
    bg: '#0A0A0F', text: '#EEEEF0', accent: '#00F0FF', accent2: '#FF00FF',
    surface: '#16161F', border: '#00F0FF44',
    font: 'Orbitron', fontUrl: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'pastel-geometry': {
    bg: '#F7F7FF', text: '#1E1B4B', accent: '#7C3AED', accent2: '#EC4899',
    surface: '#EDE9FE', border: '#C4B5FD',
    font: 'Plus Jakarta Sans', fontUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'vintage-editorial': {
    bg: '#FFFDF7', text: '#1C1917', accent: '#B45309', accent2: '#78350F',
    surface: '#FEF3C7', border: '#D97706',
    font: 'Fraunces', fontUrl: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'swiss-modern': {
    bg: '#F1FAEE', text: '#1D3557', accent: '#E63946', accent2: '#457B9D',
    surface: '#FFFFFF', border: '#A8DADC',
    font: 'Archivo', fontUrl: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;900&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'notebook-tabs': {
    bg: '#FFFBF0', text: '#292524', accent: '#D97706', accent2: '#059669',
    surface: '#FEF9EE', border: '#E5D5B0',
    font: 'Bodoni Moda', fontUrl: 'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,wght@0,400;0,600;0,700;1,400&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'split-pastel': {
    bg: '#FFF1F2', text: '#1F2937', accent: '#F472B6', accent2: '#60B8C4',
    surface: '#FCE7F3', border: '#FBCFE8',
    font: 'Outfit', fontUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'creative-voltage': {
    bg: '#0F172A', text: '#F8FAFC', accent: '#F43F5E', accent2: '#FBBF24',
    surface: '#1E293B', border: '#334155',
    font: 'Syne', fontUrl: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'bold-signal': {
    bg: '#0D1117', text: '#F0F6FC', accent: '#FF3B30', accent2: '#FF9500',
    surface: '#161B22', border: '#30363D',
    font: 'Archivo Black', fontUrl: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;600;700&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'electric-studio': {
    bg: '#FFFFFF', text: '#1A1A2E', accent: '#0066FF', accent2: '#00C6FF',
    surface: '#F0F4FF', border: '#BFDBFE',
    font: 'Manrope', fontUrl: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap',
  },
  'terminal-green': {
    bg: '#0D0208', text: '#00FF41', accent: '#00FF41', accent2: '#39FF14',
    surface: '#0a1a0a', border: '#00FF4133',
    font: 'JetBrains Mono', fontUrl: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap',
  },
};

// ── Canvas Sizes ──────────────────────────────────────────────────────────────
export const CANVAS = {
  'instagram-post': { w: 1080, h: 1080 },
  'instagram-story': { w: 1080, h: 1920 },
  'a4': { w: 2480, h: 3508 },
  'a4-landscape': { w: 3508, h: 2480 },
  'a5': { w: 1748, h: 2480 },
  'a5-landscape': { w: 2480, h: 1748 },
  '16:9': { w: 1920, h: 1080 },
  '4:3': { w: 1024, h: 768 },
  'linkedin-post': { w: 1200, h: 627 },
  'x-post': { w: 1200, h: 675 },
  'pinterest-pin': { w: 1000, h: 1500 },
};

// ── HTML Head Builder ─────────────────────────────────────────────────────────
export function head(preset, format, extraCss = '') {
  const p = PRESETS[preset];
  const { w, h } = CANVAS[format];
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${w},height=${h}">
<script src="https://cdn.tailwindcss.com"></script>
<link href="${p.fontUrl}" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<style>
*,*::before,*::after{border:0 solid transparent;box-sizing:border-box}
body{margin:0;width:${w}px;height:${h}px;overflow:hidden;font-family:'Noto Sans JP',sans-serif;background:${p.bg};color:${p.text};word-break:keep-all;overflow-wrap:break-word}
h1,h2,h3,.heading{font-family:'${p.font}',serif}
${extraCss}
</style>
</head>
<body>`;
}

export function tail() { return '</body></html>'; }

// ── Layout Generators ─────────────────────────────────────────────────────────

/**
 * Instagram Post (1080x1080) - bold card layout
 */
export function igPost(preset, {
  badge = '', title = '', subtitle = '', items = [], footer = '', accent2Items = [],
  priceMain = '', priceSub = '', cta = '', rating = '', ratingLabel = '',
  icon = 'fa-solid fa-star', bgOverlay = false
}) {
  const p = PRESETS[preset];
  return `${head(preset, 'instagram-post')}
<div style="width:1080px;height:1080px;position:relative;display:flex;flex-direction:column;padding:clamp(32px,5%,56px)">
  ${bgOverlay ? `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${p.accent}22 0%,transparent 60%);pointer-events:none"></div>` : ''}
  ${badge ? `<div style="display:inline-flex;align-items:center;gap:8px;background:${p.accent};color:${p.bg};font-size:clamp(14px,1.8vw,20px);font-weight:700;letter-spacing:.1em;padding:8px 20px;border-radius:4px;align-self:flex-start;margin-bottom:24px;font-family:'${p.font}',sans-serif;text-transform:uppercase">${badge}</div>` : ''}
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:clamp(16px,2.5%,28px)">
    ${icon && title ? `<div style="display:flex;align-items:center;gap:16px">
      <i class="${icon}" style="font-size:clamp(28px,4vw,48px);color:${p.accent}"></i>
      <div>
        ${title ? `<h1 style="font-size:clamp(32px,5vw,64px);font-weight:700;line-height:1.15;margin:0;color:${p.text}">${title}</h1>` : ''}
        ${subtitle ? `<p style="font-size:clamp(16px,2vw,26px);margin:6px 0 0;opacity:.75">${subtitle}</p>` : ''}
      </div>
    </div>` : `
      ${title ? `<h1 style="font-size:clamp(36px,5.5vw,72px);font-weight:700;line-height:1.15;margin:0;color:${p.text}">${title}</h1>` : ''}
      ${subtitle ? `<p style="font-size:clamp(16px,2vw,26px);margin:8px 0 0;opacity:.75">${subtitle}</p>` : ''}
    `}
    ${rating ? `<div style="display:flex;align-items:center;gap:12px">
      <span style="font-size:clamp(28px,4vw,52px);font-weight:900;color:${p.accent}">${rating}</span>
      <div>
        <div style="color:${p.accent};font-size:20px">★★★★★</div>
        ${ratingLabel ? `<div style="font-size:14px;opacity:.6">${ratingLabel}</div>` : ''}
      </div>
    </div>` : ''}
    ${items.length ? `<div style="display:flex;flex-direction:column;gap:12px">
      ${items.map((item, i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:${p.surface};border-radius:8px;border-left:4px solid ${accent2Items.includes(i) ? p.accent2 : p.accent}">
        <span style="font-size:clamp(14px,1.8vw,22px);font-weight:500">${item.label}</span>
        ${item.price ? `<span style="font-size:clamp(14px,1.8vw,22px);font-weight:700;color:${p.accent}">${item.price}</span>` : ''}
        ${item.badge ? `<span style="font-size:12px;padding:4px 10px;background:${p.accent};color:${p.bg};border-radius:4px;font-weight:700">${item.badge}</span>` : ''}
      </div>`).join('')}
    </div>` : ''}
    ${priceMain ? `<div style="display:flex;align-items:baseline;gap:8px">
      <span style="font-size:clamp(36px,5vw,64px);font-weight:900;color:${p.accent}">${priceMain}</span>
      ${priceSub ? `<span style="font-size:clamp(14px,2vw,22px);opacity:.6">${priceSub}</span>` : ''}
    </div>` : ''}
    ${cta ? `<div style="padding:16px 24px;background:${p.accent};color:${p.bg};font-size:clamp(14px,1.8vw,22px);font-weight:700;border-radius:6px;text-align:center;align-self:flex-start">${cta}</div>` : ''}
  </div>
  ${footer ? `<div style="border-top:1px solid ${p.border};padding-top:16px;font-size:clamp(12px,1.4vw,18px);opacity:.65;font-weight:500">${footer}</div>` : ''}
</div>
${tail()}`;
}

/**
 * Instagram Story (1080x1920) - vertical layout
 */
export function igStory(preset, {
  topLabel = '', mainTitle = '', subtitle = '', items = [], note = '',
  cta = '', ctaSmall = '', priceMain = '', priceSub = '',
  urgency = '', handle = '', icon = '',
  highlightBox = null // { label, value }
}) {
  const p = PRESETS[preset];
  return `${head(preset, 'instagram-story')}
<div style="width:1080px;height:1920px;display:flex;flex-direction:column;padding:clamp(48px,6%,80px) clamp(40px,5%,64px)">
  ${topLabel ? `<div style="font-size:clamp(14px,1.8vw,22px);letter-spacing:.15em;text-transform:uppercase;color:${p.accent};font-weight:700;margin-bottom:32px">${icon ? `<i class="${icon}" style="margin-right:10px"></i>` : ''}${topLabel}</div>` : ''}
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:clamp(20px,3%,40px)">
    ${mainTitle ? `<h1 style="font-size:clamp(48px,6vw,88px);font-weight:900;line-height:1.1;margin:0;color:${p.text}">${mainTitle}</h1>` : ''}
    ${subtitle ? `<p style="font-size:clamp(20px,2.5vw,34px);margin:0;opacity:.8;line-height:1.5">${subtitle}</p>` : ''}
    ${highlightBox ? `<div style="padding:28px 32px;background:${p.accent};color:${p.bg};border-radius:12px;text-align:center">
      <div style="font-size:clamp(14px,1.8vw,22px);font-weight:700;letter-spacing:.1em;margin-bottom:8px">${highlightBox.label}</div>
      <div style="font-size:clamp(36px,5vw,72px);font-weight:900">${highlightBox.value}</div>
    </div>` : ''}
    ${items.length ? `<div style="display:flex;flex-direction:column;gap:14px">
      ${items.map((item, i) => `<div style="display:flex;align-items:flex-start;gap:16px;padding:16px 20px;background:${p.surface};border-radius:10px">
        <div style="min-width:32px;height:32px;background:${p.accent};color:${p.bg};border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:16px;flex-shrink:0">${i + 1}</div>
        <div>
          <div style="font-size:clamp(16px,2vw,26px);font-weight:600">${item.label}</div>
          ${item.sub ? `<div style="font-size:clamp(13px,1.5vw,20px);opacity:.65;margin-top:4px">${item.sub}</div>` : ''}
        </div>
        ${item.price ? `<div style="margin-left:auto;font-size:clamp(14px,1.8vw,24px);font-weight:700;color:${p.accent}">${item.price}</div>` : ''}
      </div>`).join('')}
    </div>` : ''}
    ${priceMain ? `<div style="display:flex;align-items:baseline;gap:10px;padding:24px 28px;background:${p.surface};border-radius:10px">
      <span style="font-size:clamp(40px,5.5vw,72px);font-weight:900;color:${p.accent}">${priceMain}</span>
      ${priceSub ? `<span style="font-size:clamp(16px,2vw,24px);opacity:.65">${priceSub}</span>` : ''}
    </div>` : ''}
    ${urgency ? `<div style="padding:20px 24px;border:2px solid ${p.accent};border-radius:8px;font-size:clamp(16px,2vw,26px);font-weight:700;text-align:center;color:${p.accent}">${urgency}</div>` : ''}
    ${note ? `<p style="font-size:clamp(14px,1.6vw,22px);opacity:.6;margin:0">${note}</p>` : ''}
  </div>
  ${cta ? `<div style="margin-top:40px">
    <div style="padding:22px 32px;background:${p.accent};color:${p.bg};font-size:clamp(18px,2.2vw,30px);font-weight:700;border-radius:10px;text-align:center">${cta}</div>
    ${ctaSmall ? `<p style="font-size:clamp(13px,1.5vw,20px);opacity:.6;text-align:center;margin-top:12px">${ctaSmall}</p>` : ''}
  </div>` : ''}
  ${handle ? `<div style="margin-top:24px;font-size:clamp(14px,1.6vw,22px);opacity:.5;text-align:center">${handle}</div>` : ''}
</div>
${tail()}`;
}

/**
 * Wide card (LinkedIn/X-post/Pinterest)
 */
export function wideCard(preset, format, {
  eyebrow = '', title = '', items = [], stats = [], footer = '',
  accent2label = '', icon = ''
}) {
  const p = PRESETS[preset];
  const { w, h } = CANVAS[format];
  return `${head(preset, format)}
<div style="width:${w}px;height:${h}px;display:flex;flex-direction:column;padding:clamp(32px,4%,56px);position:relative">
  <div style="position:absolute;top:0;right:0;width:${Math.round(w*0.3)}px;height:${h}px;background:linear-gradient(180deg,${p.accent}18 0%,transparent 100%);pointer-events:none"></div>
  ${eyebrow ? `<div style="font-size:clamp(12px,1.5vw,18px);letter-spacing:.12em;text-transform:uppercase;color:${p.accent};font-weight:700;margin-bottom:20px">${icon ? `<i class="${icon}" style="margin-right:8px"></i>` : ''}${eyebrow}</div>` : ''}
  <h1 style="font-size:clamp(24px,3.5vw,52px);font-weight:700;line-height:1.2;margin:0 0 20px;font-family:'${p.font}',sans-serif">${title}</h1>
  ${items.length ? `<div style="display:flex;flex-direction:column;gap:10px;flex:1">
    ${items.map(item => `<div style="display:flex;align-items:center;gap:12px;font-size:clamp(13px,1.5vw,20px)">
      <i class="fa-solid fa-check" style="color:${p.accent};font-size:14px;flex-shrink:0"></i>
      <span>${item}</span>
    </div>`).join('')}
  </div>` : ''}
  ${stats.length ? `<div style="display:flex;gap:clamp(16px,2%,32px);flex-wrap:wrap;flex:1;align-items:center">
    ${stats.map(s => `<div style="text-align:center;padding:16px 20px;background:${p.surface};border-radius:8px;flex:1;min-width:120px">
      <div style="font-size:clamp(20px,2.8vw,40px);font-weight:900;color:${p.accent}">${s.value}</div>
      <div style="font-size:clamp(11px,1.2vw,16px);opacity:.65;margin-top:4px">${s.label}</div>
    </div>`).join('')}
  </div>` : ''}
  ${footer ? `<div style="border-top:1px solid ${p.border};padding-top:16px;margin-top:20px;font-size:clamp(12px,1.3vw,18px);opacity:.6">${footer}</div>` : ''}
</div>
${tail()}`;
}

/**
 * Document page (A4/A5 style)
 */
export function docPage(preset, format, {
  logo = '', title = '', subtitle = '', sections = [], table = null, footer = ''
}) {
  const p = PRESETS[preset];
  const { w, h } = CANVAS[format];
  return `${head(preset, format)}
<div style="width:${w}px;height:${h}px;display:flex;flex-direction:column;padding:clamp(60px,5%,100px) clamp(60px,6%,120px)">
  <header style="margin-bottom:40px;border-bottom:3px solid ${p.accent};padding-bottom:28px">
    ${logo ? `<div style="font-size:clamp(22px,2.5vw,36px);font-weight:700;color:${p.accent};font-family:'${p.font}',serif;margin-bottom:8px">${logo}</div>` : ''}
    <h1 style="font-size:clamp(28px,3.5vw,56px);font-weight:700;margin:0;color:${p.text};font-family:'${p.font}',serif">${title}</h1>
    ${subtitle ? `<p style="font-size:clamp(14px,1.6vw,24px);margin:8px 0 0;opacity:.65">${subtitle}</p>` : ''}
  </header>
  <div style="flex:1;display:flex;flex-direction:column;gap:clamp(24px,3%,44px)">
    ${sections.map(s => `<section>
      ${s.heading ? `<h2 style="font-size:clamp(18px,2vw,30px);font-weight:700;color:${p.accent};margin:0 0 14px;font-family:'${p.font}',serif">${s.heading}</h2>` : ''}
      ${s.body ? `<p style="font-size:clamp(13px,1.5vw,22px);line-height:1.7;margin:0;opacity:.85">${s.body}</p>` : ''}
      ${s.items ? `<div style="display:flex;flex-direction:column;gap:8px">
        ${s.items.map(item => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:${p.surface};border-radius:6px;font-size:clamp(12px,1.4vw,20px)">
          <span>${item.label}</span>
          ${item.value ? `<span style="font-weight:700;color:${p.accent}">${item.value}</span>` : ''}
          ${item.note ? `<span style="opacity:.6;font-size:.85em">${item.note}</span>` : ''}
        </div>`).join('')}
      </div>` : ''}
    </section>`).join('')}
    ${table ? `<table style="width:100%;border-collapse:collapse;font-size:clamp(12px,1.4vw,20px)">
      ${table.header ? `<thead><tr>${table.header.map(h => `<th style="text-align:left;padding:10px 14px;background:${p.accent};color:${p.bg};font-weight:700">${h}</th>`).join('')}</tr></thead>` : ''}
      <tbody>${table.rows.map((row, i) => `<tr style="background:${i%2===0?p.surface:'transparent'}">${row.map(cell => `<td style="padding:10px 14px;border-bottom:1px solid ${p.border}">${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>` : ''}
  </div>
  ${footer ? `<footer style="border-top:1px solid ${p.border};padding-top:16px;margin-top:32px;font-size:clamp(11px,1.2vw,18px);opacity:.5">${footer}</footer>` : ''}
</div>
${tail()}`;
}

/**
 * Presentation slide (16:9 or 4:3)
 */
export function presSlide(preset, format, {
  type = 'content', // 'title' | 'content' | 'two-col' | 'three-col'
  topLabel = '', title = '', subtitle = '', body = '', items = [], cols = [],
  metaLine = '', bgAccent = false
}) {
  const p = PRESETS[preset];
  const { w, h } = CANVAS[format];
  const fontSize = format === '4:3' ? { h1: 40, h2: 28, body: 18, sm: 14 } : { h1: 52, h2: 34, body: 22, sm: 16 };

  if (type === 'title') {
    return `${head(preset, format)}
<div style="width:${w}px;height:${h}px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:clamp(60px,8%,120px);position:relative">
  ${bgAccent ? `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${p.accent}15 0%,transparent 70%)"></div>` : ''}
  <div style="position:absolute;bottom:0;right:0;width:40%;height:4px;background:${p.accent}"></div>
  ${topLabel ? `<div style="font-size:${fontSize.sm}px;letter-spacing:.15em;text-transform:uppercase;color:${p.accent};font-weight:700;margin-bottom:24px">${topLabel}</div>` : ''}
  <h1 style="font-size:${fontSize.h1}px;font-weight:900;line-height:1.1;margin:0;font-family:'${p.font}',sans-serif;max-width:80%">${title}</h1>
  ${subtitle ? `<p style="font-size:${fontSize.h2}px;margin:20px 0 0;opacity:.75;max-width:70%">${subtitle}</p>` : ''}
  ${metaLine ? `<div style="font-size:${fontSize.sm}px;opacity:.5;margin-top:40px">${metaLine}</div>` : ''}
</div>
${tail()}`;
  }

  if (type === 'three-col') {
    return `${head(preset, format)}
<div style="width:${w}px;height:${h}px;display:flex;flex-direction:column;padding:clamp(40px,5%,70px)">
  ${topLabel ? `<div style="font-size:${fontSize.sm}px;letter-spacing:.12em;text-transform:uppercase;color:${p.accent};font-weight:700;margin-bottom:12px">${topLabel}</div>` : ''}
  <h1 style="font-size:${fontSize.h2}px;font-weight:700;margin:0 0 32px;font-family:'${p.font}',sans-serif">${title}</h1>
  <div style="display:flex;gap:24px;flex:1">
    ${cols.map(col => `<div style="flex:1;padding:24px;background:${p.surface};border-radius:10px;display:flex;flex-direction:column;gap:12px">
      ${col.icon ? `<i class="${col.icon}" style="font-size:28px;color:${p.accent}"></i>` : ''}
      <h3 style="font-size:${fontSize.body}px;font-weight:700;margin:0;font-family:'${p.font}',sans-serif">${col.title}</h3>
      ${col.stat ? `<div style="font-size:${fontSize.h1}px;font-weight:900;color:${p.accent};line-height:1">${col.stat}</div>` : ''}
      ${col.items ? `<ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px">${col.items.map(i => `<li style="font-size:${fontSize.sm}px;display:flex;align-items:flex-start;gap:8px"><span style="color:${p.accent}">•</span>${i}</li>`).join('')}</ul>` : ''}
      ${col.body ? `<p style="font-size:${fontSize.sm}px;margin:0;opacity:.75;line-height:1.5">${col.body}</p>` : ''}
    </div>`).join('')}
  </div>
</div>
${tail()}`;
  }

  // Default: content
  return `${head(preset, format)}
<div style="width:${w}px;height:${h}px;display:flex;flex-direction:column;padding:clamp(40px,5%,70px)">
  ${topLabel ? `<div style="font-size:${fontSize.sm}px;letter-spacing:.12em;text-transform:uppercase;color:${p.accent};font-weight:700;margin-bottom:12px">${topLabel}</div>` : ''}
  <h1 style="font-size:${fontSize.h2}px;font-weight:700;margin:0 0 28px;font-family:'${p.font}',sans-serif">${title}</h1>
  ${body ? `<p style="font-size:${fontSize.body}px;line-height:1.65;margin:0 0 24px;opacity:.85;max-width:80%">${body}</p>` : ''}
  ${items.length ? `<div style="display:flex;flex-direction:column;gap:12px;flex:1">
    ${items.map((item, i) => `<div style="display:flex;align-items:flex-start;gap:16px;padding:14px 18px;background:${p.surface};border-radius:8px">
      <div style="min-width:28px;height:28px;background:${p.accent};color:${p.bg};border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0">${i+1}</div>
      <div>
        <div style="font-size:${fontSize.body}px;font-weight:600">${item.label}</div>
        ${item.sub ? `<div style="font-size:${fontSize.sm}px;opacity:.65;margin-top:4px">${item.sub}</div>` : ''}
      </div>
      ${item.badge ? `<div style="margin-left:auto;padding:4px 12px;background:${p.accent};color:${p.bg};font-size:${fontSize.sm}px;font-weight:700;border-radius:4px">${item.badge}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}
  ${subtitle ? `<p style="font-size:${fontSize.body}px;margin:0;opacity:.75">${subtitle}</p>` : ''}
</div>
${tail()}`;
}
