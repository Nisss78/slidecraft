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

function waitForResponse(id, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      for (const line of output.split('\n').filter(Boolean)) {
        try {
          const msg = JSON.parse(line);
          if (msg.id === id && msg.result) {
            resolve(msg.result.content[0].text);
            return;
          }
        } catch {}
      }
      if (Date.now() - start > timeout) {
        reject(new Error(`Timeout waiting for response id=${id}`));
        return;
      }
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
  try {
    return JSON.parse(result);
  } catch {
    return { text: result };
  }
}

// Initialize
send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'demo', version: '1.0.0' } } });
await sleep(1000);
send({ jsonrpc: '2.0', method: 'notifications/initialized' });
await sleep(500);

// Create deck
const deckResult = await callTool('create_deck', { title: 'AI時代のプロダクト開発', theme: 'minimal' });
const deckId = deckResult.deckId;
console.error(`\nCreated deck: ${deckId}\n`);

// Slide 1: Title
await callTool('add_slide', { deckId, title: 'タイトル', layout: 'title', elements: [
  { type: 'text', content: 'AI時代の\nプロダクト開発', position: { x: 10, y: 20, width: 80, height: 35 }, style: { fontSize: 72, fontWeight: 'bold', textAlign: 'center', color: '#1e293b' } },
  { type: 'shape', shape: 'rectangle', position: { x: 25, y: 58, width: 50, height: 1 }, fill: 'linear-gradient(90deg, #6366f1, #06b6d4)' },
  { type: 'text', content: '生成AIを武器に、開発速度10倍を実現する戦略', position: { x: 15, y: 65, width: 70, height: 8 }, style: { fontSize: 24, textAlign: 'center', color: '#64748b' } },
  { type: 'text', content: 'ProtoductAI · 2026.04', position: { x: 15, y: 78, width: 70, height: 6 }, style: { fontSize: 18, textAlign: 'center', color: '#94a3b8' } },
] });
console.error('  Slide 1: Title');

// Slide 2: 課題
await callTool('add_slide', { deckId, title: '課題', layout: 'content', elements: [
  { type: 'text', content: '従来の開発が抱える課題', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 42, fontWeight: 'bold', color: '#1e293b' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 15, height: 1 }, fill: '#6366f1' },
  { type: 'text', content: '開発スピードの限界\nドキュメント作成の負担\n属人化する知識\n品質と速度のトレードオフ', position: { x: 5, y: 22, width: 55, height: 65 }, style: { fontSize: 28, color: '#334155', lineHeight: 2.5 }, listType: 'bullet' },
] });
console.error('  Slide 2: 課題');

// Slide 3: 3つの戦略
await callTool('add_slide', { deckId, title: '3つの戦略', layout: 'content', elements: [
  { type: 'text', content: 'AI活用の3つの戦略', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 42, fontWeight: 'bold', color: '#1e293b' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 15, height: 1 }, fill: '#06b6d4' },
  { type: 'text', content: '1. AI Pair Programming\n2. Spec-Driven Development\n3. Continuous AI Review', position: { x: 5, y: 22, width: 90, height: 60 }, style: { fontSize: 32, color: '#334155', lineHeight: 2.5 } },
] });
console.error('  Slide 3: 3つの戦略');

// Slide 4: ロードマップ
await callTool('add_slide', { deckId, title: 'ロードマップ', layout: 'content', elements: [
  { type: 'text', content: '実行ロードマップ', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 42, fontWeight: 'bold', color: '#1e293b' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 15, height: 1 }, fill: '#8b5cf6' },
  { type: 'table', headers: ['フェーズ', '期間', '目標'], rows: [
    ['Foundation', 'Q2 2026', 'AIツール導入・研修'],
    ['Scale', 'Q3 2026', '全プロジェクト展開'],
    ['Optimize', 'Q4 2026', '品質メトリクス確立'],
    ['Transform', 'Q1 2027', '開発速度10x達成'],
  ], striped: true, position: { x: 5, y: 22, width: 90, height: 60 } },
] });
console.error('  Slide 4: ロードマップ');

// Slide 5: まとめ
await callTool('add_slide', { deckId, title: 'まとめ', layout: 'title', elements: [
  { type: 'text', content: 'AIはツールではなく\nチームメイトである', position: { x: 10, y: 25, width: 80, height: 30 }, style: { fontSize: 48, fontWeight: 'bold', textAlign: 'center', color: '#1e293b' } },
  { type: 'shape', shape: 'rectangle', position: { x: 25, y: 58, width: 50, height: 1 }, fill: 'linear-gradient(90deg, #6366f1, #06b6d4)' },
  { type: 'text', content: 'ご清聴ありがとうございました', position: { x: 15, y: 68, width: 70, height: 8 }, style: { fontSize: 24, textAlign: 'center', color: '#64748b' } },
] });
console.error('  Slide 5: まとめ\n');

console.log(deckId);

// Done, kill process
proc.kill();
process.exit(0);
