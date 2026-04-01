import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const proc = spawn('node', [join(root, 'packages/mcp-server/dist/index.js')], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let output = '';
proc.stdout.on('data', (d) => { output += d.toString(); });
proc.stderr.on('data', (d) => { process.stderr.write(d); });

const send = (msg) => proc.stdin.write(JSON.stringify(msg) + '\n');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForResponse(id, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      for (const line of output.split('\n').filter(Boolean)) {
        try {
          const msg = JSON.parse(line);
          if (msg.id === id && msg.result) { resolve(msg.result.content[0].text); return; }
        } catch {}
      }
      if (Date.now() - start > timeout) { reject(new Error(`Timeout id=${id}`)); return; }
      setTimeout(check, 100);
    };
    check();
  });
}

let nextId = 100;
async function callTool(name, args) {
  const id = nextId++;
  send({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
  const result = await waitForResponse(id);
  try { return JSON.parse(result); } catch { return { text: result }; }
}

// Initialize MCP
send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'demo', version: '1.0.0' } } });
await sleep(500);
send({ jsonrpc: '2.0', method: 'notifications/initialized' });
await sleep(300);

// ===== 桃太郎デッキ作成 =====
const deck = await callTool('create_deck', {
  title: '\u6843\u592a\u90ce \u301c\u65e5\u672c\u306e\u6614\u8a71\u301c',
  theme: 'corporate',
  aspectRatio: '16:9',
});
const deckId = deck.deckId;
console.error(`\nCreated: ${deckId}\n`);

// ---------- Slide 1: タイトル ----------
await callTool('add_slide', { deckId, layout: 'title', background: { gradient: { type: 'linear', colors: ['#fef3c7', '#fde68a', '#fbbf24'], angle: 180 } }, elements: [
  // 桃のシンボル（円）
  { type: 'shape', shape: 'circle', position: { x: 40, y: 5, width: 20, height: 35 }, fill: 'radial-gradient(circle, #fda4af, #e11d48)', opacity: 0.9 },
  // メインタイトル
  { type: 'text', content: '\u6843\u592a\u90ce', position: { x: 10, y: 38, width: 80, height: 22 }, style: { fontSize: 96, fontWeight: 'bold', textAlign: 'center', color: '#7c2d12', fontFamily: 'serif' } },
  // サブタイトル
  { type: 'text', content: '\u65e5\u672c\u306e\u6614\u8a71 \u301c\u52c7\u6c17\u3068\u53cb\u60c5\u306e\u7269\u8a9e\u301c', position: { x: 15, y: 60, width: 70, height: 10 }, style: { fontSize: 32, textAlign: 'center', color: '#92400e' } },
  // 装飾ライン
  { type: 'shape', shape: 'rectangle', position: { x: 30, y: 75, width: 40, height: 1 }, fill: '#b45309' },
  // クレジット
  { type: 'text', content: '\u65e5\u672c\u4e94\u5927\u6614\u8a71\u306e\u3072\u3068\u3064', position: { x: 20, y: 80, width: 60, height: 8 }, style: { fontSize: 20, textAlign: 'center', color: '#a16207' } },
] });
console.error('  1/8: \u30bf\u30a4\u30c8\u30eb');

// ---------- Slide 2: あらすじ概要 ----------
await callTool('add_slide', { deckId, layout: 'content', background: { color: '#fffbeb' }, elements: [
  { type: 'text', content: '\u7269\u8a9e\u306e\u3042\u3089\u3059\u3058', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#78350f', fontFamily: 'serif' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 15, height: 1.5 }, fill: '#d97706' },
  // タイムライン風の説明
  { type: 'shape', shape: 'circle', position: { x: 5, y: 24, width: 4, height: 7 }, fill: '#fbbf24' },
  { type: 'text', content: '\u304a\u3070\u3042\u3055\u3093\u304c\u5ddd\u3067\u5927\u304d\u306a\u6843\u3092\u62fe\u3046', position: { x: 12, y: 24, width: 80, height: 7 }, style: { fontSize: 26, color: '#451a03' } },
  { type: 'shape', shape: 'circle', position: { x: 5, y: 34, width: 4, height: 7 }, fill: '#fb923c' },
  { type: 'text', content: '\u6843\u304b\u3089\u5143\u6c17\u306a\u7537\u306e\u5b50\u304c\u8a95\u751f\uff01\u300c\u6843\u592a\u90ce\u300d\u3068\u547d\u540d', position: { x: 12, y: 34, width: 80, height: 7 }, style: { fontSize: 26, color: '#451a03' } },
  { type: 'shape', shape: 'circle', position: { x: 5, y: 44, width: 4, height: 7 }, fill: '#f97316' },
  { type: 'text', content: '\u6210\u9577\u3057\u305f\u6843\u592a\u90ce\u3001\u9b3c\u30f6\u5cf6\u3078\u9b3c\u9000\u6cbb\u306e\u65c5\u3078', position: { x: 12, y: 44, width: 80, height: 7 }, style: { fontSize: 26, color: '#451a03' } },
  { type: 'shape', shape: 'circle', position: { x: 5, y: 54, width: 4, height: 7 }, fill: '#ea580c' },
  { type: 'text', content: '\u72ac\u30fb\u7334\u30fb\u96c9\u3092\u4ef2\u9593\u306b\u3057\u3001\u304d\u3073\u56e3\u5b50\u3067\u7d46\u3092\u7d50\u3076', position: { x: 12, y: 54, width: 80, height: 7 }, style: { fontSize: 26, color: '#451a03' } },
  { type: 'shape', shape: 'circle', position: { x: 5, y: 64, width: 4, height: 7 }, fill: '#dc2626' },
  { type: 'text', content: '\u9b3c\u3092\u9000\u6cbb\u3057\u3001\u5b9d\u7269\u3092\u6301\u3061\u5e30\u308a\u5e78\u305b\u306b\u66ae\u3089\u3059', position: { x: 12, y: 64, width: 80, height: 7 }, style: { fontSize: 26, color: '#451a03' } },
] });
console.error('  2/8: \u3042\u3089\u3059\u3058');

// ---------- Slide 3: 登場人物 ----------
await callTool('add_slide', { deckId, layout: 'content', background: { color: '#fefce8' }, elements: [
  { type: 'text', content: '\u767b\u5834\u4eba\u7269', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#78350f', fontFamily: 'serif' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 15, height: 1.5 }, fill: '#dc2626' },
  // 桃太郎
  { type: 'shape', shape: 'circle', position: { x: 5, y: 22, width: 8, height: 14 }, fill: '#fda4af' },
  { type: 'text', content: '\ud83c\udf51 \u6843\u592a\u90ce', position: { x: 15, y: 22, width: 30, height: 7 }, style: { fontSize: 28, fontWeight: 'bold', color: '#991b1b' } },
  { type: 'text', content: '\u4e3b\u4eba\u516c\u3002\u6843\u304b\u3089\u751f\u307e\u308c\u305f\u52c7\u6562\u306a\u82e5\u8005', position: { x: 15, y: 29, width: 35, height: 7 }, style: { fontSize: 18, color: '#78350f' } },
  // おじいさん・おばあさん
  { type: 'shape', shape: 'circle', position: { x: 55, y: 22, width: 8, height: 14 }, fill: '#d9f99d' },
  { type: 'text', content: '\ud83d\udc74\ud83d\udc75 \u304a\u3058\u3044\u3055\u3093\u30fb\u304a\u3070\u3042\u3055\u3093', position: { x: 65, y: 22, width: 35, height: 7 }, style: { fontSize: 24, fontWeight: 'bold', color: '#365314' } },
  { type: 'text', content: '\u6843\u592a\u90ce\u3092\u80b2\u3066\u305f\u5fc3\u512a\u3057\u3044\u8001\u592b\u5a66', position: { x: 65, y: 29, width: 35, height: 7 }, style: { fontSize: 18, color: '#78350f' } },
  // 犬
  { type: 'shape', shape: 'circle', position: { x: 5, y: 44, width: 8, height: 14 }, fill: '#bfdbfe' },
  { type: 'text', content: '\ud83d\udc36 \u72ac', position: { x: 15, y: 44, width: 30, height: 7 }, style: { fontSize: 28, fontWeight: 'bold', color: '#1e3a8a' } },
  { type: 'text', content: '\u5fe0\u8aa0\u306e\u8c61\u5fb4\u3002\u6700\u521d\u306e\u4ef2\u9593', position: { x: 15, y: 51, width: 35, height: 7 }, style: { fontSize: 18, color: '#78350f' } },
  // 猿
  { type: 'shape', shape: 'circle', position: { x: 35, y: 44, width: 8, height: 14 }, fill: '#fed7aa' },
  { type: 'text', content: '\ud83d\udc35 \u7334', position: { x: 45, y: 44, width: 20, height: 7 }, style: { fontSize: 28, fontWeight: 'bold', color: '#9a3412' } },
  { type: 'text', content: '\u77e5\u6075\u306e\u8c61\u5fb4\u30022\u756a\u76ee\u306e\u4ef2\u9593', position: { x: 45, y: 51, width: 35, height: 7 }, style: { fontSize: 18, color: '#78350f' } },
  // 雉
  { type: 'shape', shape: 'circle', position: { x: 65, y: 44, width: 8, height: 14 }, fill: '#bbf7d0' },
  { type: 'text', content: '\ud83d\udc26 \u96c9\uff08\u304d\u3058\uff09', position: { x: 75, y: 44, width: 25, height: 7 }, style: { fontSize: 28, fontWeight: 'bold', color: '#14532d' } },
  { type: 'text', content: '\u52c7\u6c17\u306e\u8c61\u5fb4\u3002\u7a7a\u304b\u3089\u653b\u6483', position: { x: 75, y: 51, width: 25, height: 7 }, style: { fontSize: 18, color: '#78350f' } },
  // 鬼
  { type: 'shape', shape: 'circle', position: { x: 30, y: 66, width: 8, height: 14 }, fill: '#fca5a5' },
  { type: 'text', content: '\ud83d\udc79 \u9b3c\uff08\u304a\u306b\uff09', position: { x: 40, y: 66, width: 25, height: 7 }, style: { fontSize: 28, fontWeight: 'bold', color: '#7f1d1d' } },
  { type: 'text', content: '\u60aa\u306e\u8c61\u5fb4\u3002\u9b3c\u30f6\u5cf6\u306b\u68f2\u307f\u3001\u4eba\u3005\u3092\u82e6\u3057\u3081\u308b', position: { x: 40, y: 73, width: 55, height: 7 }, style: { fontSize: 18, color: '#78350f' } },
] });
console.error('  3/8: \u767b\u5834\u4eba\u7269');

// ---------- Slide 4: きびだんごの意味 ----------
await callTool('add_slide', { deckId, layout: 'content', background: { gradient: { type: 'linear', colors: ['#fff7ed', '#fed7aa'], angle: 180 } }, elements: [
  { type: 'text', content: '\u304d\u3073\u3060\u3093\u3054\u306e\u610f\u5473', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#78350f', fontFamily: 'serif' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 15, height: 1.5 }, fill: '#ea580c' },
  // だんごイラスト（3つの丸）
  { type: 'shape', shape: 'circle', position: { x: 70, y: 25, width: 10, height: 17 }, fill: '#fda4af' },
  { type: 'shape', shape: 'circle', position: { x: 70, y: 40, width: 10, height: 17 }, fill: '#fef9c3' },
  { type: 'shape', shape: 'circle', position: { x: 70, y: 55, width: 10, height: 17 }, fill: '#bbf7d0' },
  { type: 'shape', shape: 'line', position: { x: 74, y: 25, width: 1, height: 50 }, stroke: '#78350f', strokeWidth: 3 },
  // 説明テキスト
  { type: 'text', content: '\u300c\u304d\u3073\u56e3\u5b50\u300d\u306f\u5358\u306a\u308b\u98df\u3079\u7269\u3067\u306f\u306a\u304f\u3001\n\u4eba\u3068\u4eba\u3092\u3064\u306a\u3050\u300c\u7d46\u300d\u306e\u8c61\u5fb4\u3067\u3059\u3002', position: { x: 5, y: 22, width: 60, height: 15 }, style: { fontSize: 26, color: '#451a03', lineHeight: 1.8 } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 42, width: 58, height: 50 }, fill: 'rgba(120,53,15,0.08)', borderRadius: 16 },
  { type: 'text', content: '\ud83c\udf59  \u5206\u3051\u5408\u3046 = \u4fe1\u983c\u306e\u8a3c', position: { x: 8, y: 45, width: 52, height: 8 }, style: { fontSize: 24, fontWeight: 'bold', color: '#92400e' } },
  { type: 'text', content: '\ud83e\udd1d  \u98df\u3079\u308b\u3053\u3068\u3067\u4ef2\u9593\u306b\u306a\u308b = \u5951\u7d04', position: { x: 8, y: 55, width: 52, height: 8 }, style: { fontSize: 24, fontWeight: 'bold', color: '#92400e' } },
  { type: 'text', content: '\ud83c\udfaf  \u5c90\u961c\u770c\u306e\u540d\u7269\u300c\u5409\u5099\u56e3\u5b50\u300d\u304c\u7531\u6765', position: { x: 8, y: 65, width: 52, height: 8 }, style: { fontSize: 24, fontWeight: 'bold', color: '#92400e' } },
  { type: 'text', content: '\u203b \u5c90\u961c\u770c\u306f\u6843\u592a\u90ce\u4f1d\u8aac\u306e\u767a\u7965\u5730\u306e\u3072\u3068\u3064', position: { x: 8, y: 78, width: 52, height: 7 }, style: { fontSize: 16, color: '#a16207' } },
] });
console.error('  4/8: \u304d\u3073\u3060\u3093\u3054');

// ---------- Slide 5: 鬼ヶ島の戦い ----------
await callTool('add_slide', { deckId, layout: 'content', background: { gradient: { type: 'linear', colors: ['#1e1b4b', '#312e81', '#4338ca'], angle: 180 } }, elements: [
  { type: 'text', content: '\u9b3c\u30f6\u5cf6\u306e\u6226\u3044', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#e0e7ff', fontFamily: 'serif' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 15, height: 1.5 }, fill: '#f97316' },
  // 戦闘シーンの図解
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 22, width: 42, height: 35 }, fill: 'rgba(255,255,255,0.08)', borderRadius: 16 },
  { type: 'text', content: '\u2694\ufe0f \u4f5c\u6226', position: { x: 8, y: 24, width: 36, height: 6 }, style: { fontSize: 24, fontWeight: 'bold', color: '#fbbf24' } },
  { type: 'text', content: '\ud83d\udc26 \u96c9\u304c\u7a7a\u304b\u3089\u5075\u5bdf\u30fb\u653b\u6483\n\ud83d\udc35 \u7334\u304c\u77e5\u6075\u3067\u9580\u3092\u958b\u3051\u308b\n\ud83d\udc36 \u72ac\u304c\u679c\u6562\u306b\u6226\u3046\n\ud83c\udf51 \u6843\u592a\u90ce\u304c\u9b3c\u306e\u89aa\u5206\u3092\u5012\u3059', position: { x: 8, y: 32, width: 36, height: 22 }, style: { fontSize: 20, color: '#c7d2fe', lineHeight: 1.8 } },
  // 右側：結果
  { type: 'shape', shape: 'rectangle', position: { x: 53, y: 22, width: 42, height: 35 }, fill: 'rgba(255,255,255,0.08)', borderRadius: 16 },
  { type: 'text', content: '\ud83c\udfc6 \u52dd\u5229', position: { x: 56, y: 24, width: 36, height: 6 }, style: { fontSize: 24, fontWeight: 'bold', color: '#4ade80' } },
  { type: 'text', content: '\u9b3c\u304c\u964d\u4f0f\u3057\u3001\u5b9d\u7269\u3092\u8fd4\u3059\n\u91d1\u9280\u8ca1\u5b9d\u3092\u6301\u3061\u5e30\u308b\n\u6751\u306b\u5e73\u548c\u304c\u623b\u308b', position: { x: 56, y: 32, width: 36, height: 18 }, style: { fontSize: 20, color: '#c7d2fe', lineHeight: 1.8 } },
  // ポイント
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 62, width: 90, height: 30 }, fill: 'rgba(251,191,36,0.1)', borderRadius: 16 },
  { type: 'text', content: '\ud83d\udca1 \u30dd\u30a4\u30f3\u30c8', position: { x: 8, y: 64, width: 84, height: 6 }, style: { fontSize: 22, fontWeight: 'bold', color: '#fbbf24' } },
  { type: 'text', content: '\u4e00\u4eba\u3067\u306f\u52dd\u3066\u306a\u304b\u3063\u305f\u3002\u305d\u308c\u305e\u308c\u306e\u5f97\u610f\u3092\u6d3b\u304b\u3057\u305f\u300c\u30c1\u30fc\u30e0\u30ef\u30fc\u30af\u300d\u304c\u52dd\u5229\u306e\u9375\u3002\n\u3053\u308c\u306f\u73fe\u4ee3\u306e\u7d44\u7e54\u8ad6\u3084\u30ea\u30fc\u30c0\u30fc\u30b7\u30c3\u30d7\u306b\u3082\u901a\u3058\u308b\u6559\u8a13\u3067\u3059\u3002', position: { x: 8, y: 72, width: 84, height: 16 }, style: { fontSize: 20, color: '#e0e7ff', lineHeight: 1.6 } },
] });
console.error('  5/8: \u9b3c\u30f6\u5cf6');

// ---------- Slide 6: 教訓 ----------
await callTool('add_slide', { deckId, layout: 'content', background: { color: '#fef2f2' }, elements: [
  { type: 'text', content: '\u6843\u592a\u90ce\u306e\u6559\u8a13', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#78350f', fontFamily: 'serif' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 15, height: 1.5 }, fill: '#e11d48' },
  // 3つの教訓カード
  { type: 'shape', shape: 'rectangle', position: { x: 3, y: 22, width: 30, height: 40 }, fill: '#ffffff', borderRadius: 16 },
  { type: 'text', content: '\ud83d\udcaa', position: { x: 3, y: 24, width: 30, height: 10 }, style: { fontSize: 40, textAlign: 'center' } },
  { type: 'text', content: '\u52c7\u6c17', position: { x: 3, y: 35, width: 30, height: 8 }, style: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#991b1b' } },
  { type: 'text', content: '\u56f0\u96e3\u306b\u7acb\u3061\u5411\u304b\u3046\n\u52c7\u6c17\u304c\u5927\u5207', position: { x: 6, y: 44, width: 24, height: 15 }, style: { fontSize: 18, textAlign: 'center', color: '#78350f', lineHeight: 1.6 } },

  { type: 'shape', shape: 'rectangle', position: { x: 35, y: 22, width: 30, height: 40 }, fill: '#ffffff', borderRadius: 16 },
  { type: 'text', content: '\ud83e\udd1d', position: { x: 35, y: 24, width: 30, height: 10 }, style: { fontSize: 40, textAlign: 'center' } },
  { type: 'text', content: '\u4ef2\u9593', position: { x: 35, y: 35, width: 30, height: 8 }, style: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#991b1b' } },
  { type: 'text', content: '\u4e00\u4eba\u3067\u6226\u308f\u305a\n\u4ef2\u9593\u3092\u5927\u5207\u306b', position: { x: 38, y: 44, width: 24, height: 15 }, style: { fontSize: 18, textAlign: 'center', color: '#78350f', lineHeight: 1.6 } },

  { type: 'shape', shape: 'rectangle', position: { x: 67, y: 22, width: 30, height: 40 }, fill: '#ffffff', borderRadius: 16 },
  { type: 'text', content: '\u2696\ufe0f', position: { x: 67, y: 24, width: 30, height: 10 }, style: { fontSize: 40, textAlign: 'center' } },
  { type: 'text', content: '\u6b63\u7fa9', position: { x: 67, y: 35, width: 30, height: 8 }, style: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#991b1b' } },
  { type: 'text', content: '\u60aa\u306b\u5c48\u3057\u306a\u3044\n\u6b63\u3057\u3044\u3053\u3068\u3092\u3059\u308b', position: { x: 70, y: 44, width: 24, height: 15 }, style: { fontSize: 18, textAlign: 'center', color: '#78350f', lineHeight: 1.6 } },

  // 補足
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 68, width: 90, height: 25 }, fill: 'rgba(120,53,15,0.06)', borderRadius: 12 },
  { type: 'text', content: '\u6843\u592a\u90ce\u306f\u300c\u512a\u308c\u305f\u30ea\u30fc\u30c0\u30fc\u300d\u306e\u7269\u8a9e\u3067\u3082\u3042\u308a\u307e\u3059\u3002\n\u304d\u3073\u56e3\u5b50\u3092\u5206\u3051\u308b\uff08=\u5831\u916c\u3092\u5171\u6709\uff09\u3053\u3068\u3067\u3001\u7570\u306a\u308b\u80fd\u529b\u3092\u6301\u3064\u4ef2\u9593\u3092\u96c6\u3081\u3001\n\u5171\u901a\u306e\u76ee\u6a19\u306b\u5411\u304b\u3063\u3066\u30c1\u30fc\u30e0\u3092\u7387\u3044\u307e\u3057\u305f\u3002', position: { x: 8, y: 71, width: 84, height: 18 }, style: { fontSize: 20, color: '#78350f', lineHeight: 1.7 } },
] });
console.error('  6/8: \u6559\u8a13');

// ---------- Slide 7: 日本文化での桃太郎 ----------
await callTool('add_slide', { deckId, layout: 'content', background: { color: '#f0fdf4' }, elements: [
  { type: 'text', content: '\u65e5\u672c\u6587\u5316\u306e\u4e2d\u306e\u6843\u592a\u90ce', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 44, fontWeight: 'bold', color: '#14532d', fontFamily: 'serif' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 15, height: 1.5 }, fill: '#16a34a' },
  // テーブル
  { type: 'table', headers: ['\u5206\u91ce', '\u5f71\u97ff'], rows: [
    ['\ud83c\udfad \u30a2\u30cb\u30e1\u30fb\u6f2b\u753b', '\u591a\u304f\u306e\u4f5c\u54c1\u3067\u30aa\u30de\u30fc\u30b8\u30e5\u3084\u30d1\u30ed\u30c7\u30a3\u3042\u308a'],
    ['\ud83c\udfac CM', 'au\u4e09\u592a\u90ce\u30b7\u30ea\u30fc\u30ba\u306a\u3069\u3001\u4eba\u6c17CM\u306e\u984c\u6750'],
    ['\ud83c\udfae \u30b2\u30fc\u30e0', '\u6843\u592a\u90ce\u96fb\u9244\u306a\u3069\u306e\u30b2\u30fc\u30e0\u4f5c\u54c1'],
    ['\ud83c\udf8e \u304a\u796d\u308a', '\u5ca1\u5c71\u770c\u306e\u6843\u592a\u90ce\u307e\u3064\u308a'],
    ['\ud83d\uddff \u9285\u50cf\u30fb\u89b3\u5149', '\u5ca1\u5c71\u99c5\u524d\u306e\u6843\u592a\u90ce\u50cf\u304c\u6709\u540d'],
    ['\ud83c\udf70 \u304a\u83d3\u5b50', '\u304d\u3073\u3060\u3093\u3054\u306f\u5ca1\u5c71\u306e\u540d\u7523\u54c1'],
  ], striped: true, position: { x: 5, y: 22, width: 90, height: 65 } },
] });
console.error('  7/8: \u65e5\u672c\u6587\u5316');

// ---------- Slide 8: まとめ ----------
await callTool('add_slide', { deckId, layout: 'title', background: { gradient: { type: 'radial', colors: ['#fef3c7', '#fde68a', '#f59e0b'] } }, elements: [
  { type: 'shape', shape: 'circle', position: { x: 38, y: 3, width: 24, height: 42 }, fill: 'radial-gradient(circle, #fda4af, #be123c)', opacity: 0.8 },
  { type: 'text', content: '\u3081\u3067\u305f\u3057\u3001\u3081\u3067\u305f\u3057', position: { x: 10, y: 42, width: 80, height: 15 }, style: { fontSize: 56, fontWeight: 'bold', textAlign: 'center', color: '#78350f', fontFamily: 'serif' } },
  { type: 'shape', shape: 'rectangle', position: { x: 30, y: 60, width: 40, height: 1 }, fill: '#92400e' },
  { type: 'text', content: '\u6843\u592a\u90ce\u306f\u65e5\u672c\u4eba\u306e\u5fc3\u306b\u751f\u304d\u7d9a\u3051\u308b\n\u52c7\u6c17\u3068\u53cb\u60c5\u306e\u7269\u8a9e\u3067\u3059', position: { x: 15, y: 65, width: 70, height: 15 }, style: { fontSize: 28, textAlign: 'center', color: '#92400e', lineHeight: 1.8 } },
  { type: 'text', content: '\u304a\u3057\u307e\u3044', position: { x: 20, y: 85, width: 60, height: 8 }, style: { fontSize: 24, textAlign: 'center', color: '#b45309' } },
] });
console.error('  8/8: \u307e\u3068\u3081\n');

console.log(`\n\u2705 Preview: http://localhost:4983/preview/${deckId}`);
console.log('Server running. Press Ctrl+C to stop.\n');

process.on('SIGINT', () => { proc.kill(); process.exit(0); });
