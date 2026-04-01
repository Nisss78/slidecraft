import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const proc = spawn('node', [join(root, 'packages/mcp-server/dist/index.js')], { stdio: ['pipe', 'pipe', 'pipe'] });
let output = '';
proc.stdout.on('data', d => { output += d.toString(); });
proc.stderr.on('data', d => { process.stderr.write(d); });
const send = m => proc.stdin.write(JSON.stringify(m) + '\n');
const sleep = ms => new Promise(r => setTimeout(r, ms));
function waitFor(id, t = 8000) {
  return new Promise((res, rej) => {
    const s = Date.now();
    const c = () => {
      for (const l of output.split('\n').filter(Boolean)) {
        try { const m = JSON.parse(l); if (m.id === id && m.result) { res(m.result.content[0].text); return; } } catch {}
      }
      if (Date.now() - s > t) { rej(new Error('timeout')); return; }
      setTimeout(c, 100);
    };
    c();
  });
}
let nid = 100;
async function call(name, args) {
  const id = nid++;
  send({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
  const r = await waitFor(id);
  try { return JSON.parse(r); } catch { return { text: r }; }
}

send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'x', version: '1.0.0' } } });
await sleep(500);
send({ jsonrpc: '2.0', method: 'notifications/initialized' });
await sleep(300);

// Deck 1: Momotaro
console.error('\n--- \u6843\u592a\u90ce ---');
const d1 = await call('create_deck', { title: '\u6843\u592a\u90ce \u301c\u65e5\u672c\u306e\u6614\u8a71\u301c', theme: 'corporate' });
await call('add_slide', { deckId: d1.deckId, elements: [
  { type: 'text', content: '\u6843\u592a\u90ce', position: { x: 10, y: 20, width: 80, height: 22 }, style: { fontSize: 96, fontWeight: 'bold', textAlign: 'center', color: '#7c2d12', fontFamily: 'serif' } },
  { type: 'text', content: '\u65e5\u672c\u306e\u6614\u8a71 \u301c\u52c7\u6c17\u3068\u53cb\u60c5\u306e\u7269\u8a9e\u301c', position: { x: 15, y: 48, width: 70, height: 10 }, style: { fontSize: 32, textAlign: 'center', color: '#92400e' } },
  { type: 'shape', shape: 'circle', position: { x: 40, y: 2, width: 20, height: 35 }, fill: 'radial-gradient(circle, #fda4af, #e11d48)', opacity: 0.85 },
], background: { gradient: { type: 'linear', colors: ['#fef3c7', '#fde68a', '#fbbf24'], angle: 180 } } });
await call('add_slide', { deckId: d1.deckId, elements: [
  { type: 'text', content: '\u7269\u8a9e\u306e\u3042\u3089\u3059\u3058', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#78350f', fontFamily: 'serif' } },
  { type: 'text', content: '\u2460 \u304a\u3070\u3042\u3055\u3093\u304c\u5ddd\u3067\u5927\u304d\u306a\u6843\u3092\u62fe\u3046\n\u2461 \u6843\u304b\u3089\u5143\u6c17\u306a\u7537\u306e\u5b50\u304c\u8a95\u751f\uff01\n\u2462 \u6210\u9577\u3057\u305f\u6843\u592a\u90ce\u3001\u9b3c\u9000\u6cbb\u306e\u65c5\u3078\n\u2463 \u72ac\u30fb\u7334\u30fb\u96c9\u3092\u4ef2\u9593\u306b\u3059\u308b\n\u2464 \u9b3c\u3092\u9000\u6cbb\u3057\u3001\u5b9d\u7269\u3092\u6301\u3061\u5e30\u308b', position: { x: 5, y: 22, width: 90, height: 65 }, style: { fontSize: 30, color: '#451a03', lineHeight: 2.2 } },
], background: { color: '#fffbeb' } });
await call('add_slide', { deckId: d1.deckId, elements: [
  { type: 'text', content: '\u767b\u5834\u4eba\u7269', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#78350f', fontFamily: 'serif' } },
  { type: 'table', headers: ['\u30ad\u30e3\u30e9', '\u540d\u524d', '\u5f79\u5272'], rows: [
    ['\ud83c\udf51', '\u6843\u592a\u90ce', '\u4e3b\u4eba\u516c\u3002\u52c7\u6562\u306a\u30ea\u30fc\u30c0\u30fc'], ['\ud83d\udc36', '\u72ac', '\u5fe0\u8aa0\u306e\u8c61\u5fb4'], ['\ud83d\udc35', '\u7334', '\u77e5\u6075\u306e\u8c61\u5fb4'], ['\ud83d\udc26', '\u96c9', '\u52c7\u6c17\u306e\u8c61\u5fb4'], ['\ud83d\udc79', '\u9b3c', '\u60aa\u306e\u8c61\u5fb4'],
  ], striped: true, position: { x: 5, y: 22, width: 90, height: 65 } },
], background: { color: '#fefce8' } });
await call('add_slide', { deckId: d1.deckId, elements: [
  { type: 'text', content: '\u6559\u8a13\uff1a\u52c7\u6c17\u30fb\u4ef2\u9593\u30fb\u6b63\u7fa9', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 44, fontWeight: 'bold', color: '#78350f' } },
  { type: 'shape', shape: 'rectangle', position: { x: 3, y: 22, width: 30, height: 35 }, fill: '#fff', borderRadius: 16 },
  { type: 'text', content: '\ud83d\udcaa\n\u52c7\u6c17', position: { x: 3, y: 26, width: 30, height: 20 }, style: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', color: '#991b1b' } },
  { type: 'shape', shape: 'rectangle', position: { x: 35, y: 22, width: 30, height: 35 }, fill: '#fff', borderRadius: 16 },
  { type: 'text', content: '\ud83e\udd1d\n\u4ef2\u9593', position: { x: 35, y: 26, width: 30, height: 20 }, style: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', color: '#991b1b' } },
  { type: 'shape', shape: 'rectangle', position: { x: 67, y: 22, width: 30, height: 35 }, fill: '#fff', borderRadius: 16 },
  { type: 'text', content: '\u2696\ufe0f\n\u6b63\u7fa9', position: { x: 67, y: 26, width: 30, height: 20 }, style: { fontSize: 30, fontWeight: 'bold', textAlign: 'center', color: '#991b1b' } },
], background: { color: '#fef2f2' } });
await call('add_slide', { deckId: d1.deckId, elements: [
  { type: 'text', content: '\u3081\u3067\u305f\u3057\u3001\u3081\u3067\u305f\u3057', position: { x: 10, y: 38, width: 80, height: 18 }, style: { fontSize: 56, fontWeight: 'bold', textAlign: 'center', color: '#78350f', fontFamily: 'serif' } },
  { type: 'shape', shape: 'circle', position: { x: 38, y: 3, width: 24, height: 42 }, fill: 'radial-gradient(circle, #fda4af, #be123c)', opacity: 0.7 },
], background: { gradient: { type: 'radial', colors: ['#fef3c7', '#fde68a', '#f59e0b'] } } });
console.error('  5 slides');

// Deck 2: SlideCraft
console.error('--- SlideCraft ---');
const d2 = await call('create_deck', { title: 'SlideCraft Demo', theme: 'dark' });
await call('add_slide', { deckId: d2.deckId, elements: [
  { type: 'text', content: 'SlideCraft', position: { x: 10, y: 22, width: 80, height: 25 }, style: { fontSize: 72, fontWeight: 'bold', textAlign: 'center', color: '#818cf8' } },
  { type: 'text', content: 'AI-Powered Slide Generation', position: { x: 15, y: 50, width: 70, height: 10 }, style: { fontSize: 32, textAlign: 'center', color: '#94a3b8' } },
] });
await call('add_slide', { deckId: d2.deckId, elements: [
  { type: 'text', content: 'Features', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#f1f5f9' } },
  { type: 'text', content: 'MCP Server\nReal-time Preview\nPlugin System\nPDF Export\nJSON Storage', position: { x: 5, y: 24, width: 55, height: 65 }, style: { fontSize: 28, color: '#cbd5e1', lineHeight: 2 }, listType: 'bullet' },
] });
console.error('  2 slides');

// Deck 3
console.error('--- \u30d6\u30fc\u30c8\u30ad\u30e3\u30f3\u30d7 ---');
const d3 = await call('create_deck', { title: '0\u21921\u30d6\u30fc\u30c8\u30ad\u30e3\u30f3\u30d7\uff08\u7b2c1\u56de\uff09', theme: 'minimal' });
await call('add_slide', { deckId: d3.deckId, elements: [
  { type: 'text', content: '0\u21921\u30d6\u30fc\u30c8\u30ad\u30e3\u30f3\u30d7', position: { x: 10, y: 20, width: 80, height: 20 }, style: { fontSize: 52, fontWeight: 'bold', textAlign: 'center', color: '#1e293b' } },
  { type: 'text', content: '\u7b2c1\u56de\uff1a\u30a2\u30a4\u30c7\u30a2\u51fa\u3057\u3068\u691c\u8a3c', position: { x: 15, y: 44, width: 70, height: 10 }, style: { fontSize: 26, textAlign: 'center', color: '#64748b' } },
] });
console.error('  1 slide');

// Deck 4
console.error('--- \u751f\u6210AI ---');
const d4 = await call('create_deck', { title: '\u751f\u6210AI\u6d3b\u7528\u30bb\u30df\u30ca\u30fc', theme: 'corporate' });
await call('add_slide', { deckId: d4.deckId, elements: [
  { type: 'text', content: '\u751f\u6210AI\u6d3b\u7528\u30bb\u30df\u30ca\u30fc', position: { x: 10, y: 22, width: 80, height: 20 }, style: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: '#0f172a' } },
  { type: 'text', content: '\u4f01\u696d\u306b\u304a\u3051\u308b\u5b9f\u8df5\u7684\u306a\u5c0e\u5165\u65b9\u6cd5', position: { x: 15, y: 45, width: 70, height: 10 }, style: { fontSize: 24, textAlign: 'center', color: '#475569' } },
  { type: 'shape', shape: 'rectangle', position: { x: 0, y: 0, width: 100, height: 3 }, fill: 'linear-gradient(90deg, #1e40af, #0f766e)' },
], background: { color: '#f1f5f9' } });
console.error('  1 slide\n');

console.log('\n\u2705 Home: http://localhost:4983/');
console.log('Press Ctrl+C to stop.\n');
process.on('SIGINT', () => { proc.kill(); process.exit(0); });
