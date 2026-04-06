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
      if (Date.now() - start > timeout) reject(new Error(`Timeout id=${id}`));
      else setTimeout(check, 100);
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

function slideHtml(bodyContent) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1920, height=1080, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1920px; height: 1080px; overflow: hidden; font-family: 'Noto Sans JP', 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
${bodyContent}
</body>
</html>`;
}

// Initialize MCP
send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'seed', version: '1.0.0' } } });
await sleep(1000);
send({ jsonrpc: '2.0', method: 'notifications/initialized' });
await sleep(500);

// Create deck
const deckResult = await callTool('create_deck', { title: 'AI時代のプロダクト開発', theme: 'dark' });
const deckId = deckResult.deckId;
console.error(`Created deck: ${deckId}`);

// Slide 1: Title
await callTool('add_slide', { deckId, title: 'タイトル', html: slideHtml(`
  <div class="text-center max-w-4xl">
    <div class="inline-block px-6 py-2 bg-indigo-500/20 rounded-full border border-indigo-400/30 mb-8">
      <span class="text-indigo-300 text-xl tracking-wider">💎 2026 STRATEGY</span>
    </div>
    <h1 class="text-8xl font-black text-white mb-4 leading-tight">AI時代の</h1>
    <h1 class="text-8xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-8">プロダクト開発</h1>
    <p class="text-2xl text-slate-300">生成AIを武器に、開発速度 <span class="text-amber-400 font-bold">10倍</span> を実現する戦略</p>
    <div class="mt-16 flex items-center justify-center gap-8 text-slate-400">
      <span>👤 ProtoductAI</span>
      <span>📅 2026.04</span>
    </div>
  </div>
`) });
console.error('  Slide 1: タイトル');

// Slide 2: 課題
await callTool('add_slide', { deckId, title: '課題', html: slideHtml(`
  <div class="w-full max-w-6xl px-20">
    <h2 class="text-5xl font-bold text-white mb-2">従来の開発が抱える課題</h2>
    <div class="h-1 w-24 bg-gradient-to-r from-red-500 to-orange-500 mb-12 rounded-full"></div>
    <div class="grid grid-cols-3 gap-8">
      <div class="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
        <div class="text-5xl mb-4">🐌</div>
        <h3 class="text-2xl font-bold text-white mb-3">開発速度の限界</h3>
        <p class="text-slate-400 text-lg">手作業によるボイラープレートと繰り返しタスクが開発者の生産性を圧迫</p>
        <div class="mt-6 text-red-400 font-bold text-3xl">67%</div>
        <div class="text-slate-500 text-sm">の時間がルーティン作業</div>
      </div>
      <div class="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
        <div class="text-5xl mb-4">📚</div>
        <h3 class="text-2xl font-bold text-white mb-3">ドキュメントの負債</h3>
        <p class="text-slate-400 text-lg">コードとドキュメントの乖離が進み、知識の断絶が発生</p>
        <div class="mt-6 text-amber-400 font-bold text-3xl">3.2x</div>
        <div class="text-slate-500 text-sm">オンボーディング時間の増加</div>
      </div>
      <div class="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
        <div class="text-5xl mb-4">⚠️</div>
        <h3 class="text-2xl font-bold text-white mb-3">人材不足</h3>
        <p class="text-slate-400 text-lg">優秀なエンジニアの確保が年々困難に。既存チームの負荷は限界</p>
        <div class="mt-6 text-orange-400 font-bold text-3xl">54万人</div>
        <div class="text-slate-500 text-sm">2026年のIT人材不足予測</div>
      </div>
    </div>
  </div>
`) });
console.error('  Slide 2: 課題');

// Slide 3: 3つの戦略
await callTool('add_slide', { deckId, title: '3つの戦略', html: slideHtml(`
  <div class="w-full max-w-6xl px-20">
    <h2 class="text-5xl font-bold text-white mb-2">AI活用の3つの戦略</h2>
    <div class="h-1 w-24 bg-gradient-to-r from-cyan-500 to-blue-500 mb-12 rounded-full"></div>
    <div class="grid grid-cols-3 gap-8">
      <div class="bg-gradient-to-b from-violet-500/20 to-transparent border border-violet-400/20 rounded-2xl p-8">
        <div class="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center text-2xl mb-6">🤖</div>
        <h3 class="text-2xl font-bold text-white mb-3">AI Pair Programming</h3>
        <p class="text-slate-300 text-lg leading-relaxed">Claude Codeとのペアプログラミングで、コーディング速度を3倍に向上</p>
      </div>
      <div class="bg-gradient-to-b from-cyan-500/20 to-transparent border border-cyan-400/20 rounded-2xl p-8">
        <div class="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center text-2xl mb-6">📋</div>
        <h3 class="text-2xl font-bold text-white mb-3">Spec-Driven Dev</h3>
        <p class="text-slate-300 text-lg leading-relaxed">仕様駆動開発で、要件定義からコードまでAIが一貫サポート</p>
      </div>
      <div class="bg-gradient-to-b from-emerald-500/20 to-transparent border border-emerald-400/20 rounded-2xl p-8">
        <div class="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-2xl mb-6">🔍</div>
        <h3 class="text-2xl font-bold text-white mb-3">Continuous AI Review</h3>
        <p class="text-slate-300 text-lg leading-relaxed">AIによる継続的レビューで、品質を維持しながら速度を確保</p>
      </div>
    </div>
  </div>
`) });
console.error('  Slide 3: 3つの戦略');

// Slide 4: ロードマップ
await callTool('add_slide', { deckId, title: 'ロードマップ', html: slideHtml(`
  <div class="w-full max-w-6xl px-20">
    <h2 class="text-5xl font-bold text-white mb-2">実行ロードマップ</h2>
    <div class="h-1 w-24 bg-gradient-to-r from-purple-500 to-pink-500 mb-12 rounded-full"></div>
    <div class="grid grid-cols-4 gap-6">
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
        <div class="absolute -top-3 left-6 bg-violet-500 text-white text-sm px-3 py-1 rounded-full">Q2 2026</div>
        <h4 class="text-xl font-bold text-white mt-4 mb-3">Foundation</h4>
        <ul class="text-slate-400 space-y-2">
          <li>✅ AI開発ツール導入</li>
          <li>✅ チーム研修 (2週間)</li>
          <li>✅ パイロットプロジェクト</li>
        </ul>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
        <div class="absolute -top-3 left-6 bg-cyan-500 text-white text-sm px-3 py-1 rounded-full">Q3 2026</div>
        <h4 class="text-xl font-bold text-white mt-4 mb-3">Scale</h4>
        <ul class="text-slate-400 space-y-2">
          <li>📋 Spec-Driven導入</li>
          <li>🔄 CI/CDパイプライン刷新</li>
          <li>🚀 全プロジェクト展開</li>
        </ul>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
        <div class="absolute -top-3 left-6 bg-emerald-500 text-white text-sm px-3 py-1 rounded-full">Q4 2026</div>
        <h4 class="text-xl font-bold text-white mt-4 mb-3">Optimize</h4>
        <ul class="text-slate-400 space-y-2">
          <li>📊 AI Ops自動化</li>
          <li>🎯 品質メトリクス確立</li>
          <li>💰 コスト効果検証</li>
        </ul>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-2xl p-6 relative">
        <div class="absolute -top-3 left-6 bg-amber-500 text-white text-sm px-3 py-1 rounded-full">Q1 2027</div>
        <h4 class="text-xl font-bold text-white mt-4 mb-3">Transform</h4>
        <ul class="text-slate-400 space-y-2">
          <li>🏆 開発速度 10x達成</li>
          <li>🤝 AI-Nativeチーム完成</li>
          <li>🎉 次世代プロダクト発表</li>
        </ul>
      </div>
    </div>
  </div>
`) });
console.error('  Slide 4: ロードマップ');

// Slide 5: まとめ
await callTool('add_slide', { deckId, title: 'まとめ', html: slideHtml(`
  <div class="text-center max-w-4xl">
    <div class="text-6xl mb-8">🚀</div>
    <h2 class="text-6xl font-black text-white mb-4">AIは <span class="text-amber-400">ツール</span> ではなく</h2>
    <h2 class="text-6xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-12">チームメイト である</h2>
    <div class="flex items-center justify-center gap-6 mt-8">
      <div class="bg-violet-500/20 border border-violet-400/30 rounded-xl px-6 py-3 text-violet-300">10x 開発速度</div>
      <div class="bg-cyan-500/20 border border-cyan-400/30 rounded-xl px-6 py-3 text-cyan-300">40% コスト削減</div>
      <div class="bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-6 py-3 text-emerald-300">35% 品質向上</div>
    </div>
    <p class="mt-12 text-slate-400 text-xl">ご清聴ありがとうございました</p>
  </div>
`) });
console.error('  Slide 5: まとめ');

console.log(deckId);
proc.kill();
process.exit(0);
