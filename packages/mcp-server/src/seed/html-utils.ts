export function docHead(extra = ''): string {
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=1920,height=1080"><script src="https://cdn.tailwindcss.com"><\\/script><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet"><style>body{margin:0;font-family:'Noto Sans JP',sans-serif;word-break:keep-all;overflow-wrap:break-word}*,*::before,*::after{border:0 solid transparent}</style>\${extra}</head><body>`;
}
export const TAIL = '</body></html>';
