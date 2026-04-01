/**
 * v2: HTML-first renderer
 * Generates blank/template slide HTML with Tailwind CSS CDN, Font Awesome, Google Fonts.
 * No more JSON→HTML element rendering.
 */

export function generateBlankSlideHtml(options?: {
  title?: string;
  width?: number;
  height?: number;
}): string {
  const { title = 'Untitled Slide', width = 1920, height = 1080 } = options ?? {};

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${width}, height=${height}, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      font-family: 'Noto Sans JP', 'Inter', sans-serif;
    }
  </style>
</head>
<body class="bg-white flex items-center justify-center">
  <h1 class="text-6xl font-bold text-gray-800">${escapeHtml(title)}</h1>
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
