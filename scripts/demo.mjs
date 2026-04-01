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
await sleep(500);
send({ jsonrpc: '2.0', method: 'notifications/initialized' });
await sleep(300);

// Create deck
const deckResult = await callTool('create_deck', { title: 'SlideCraft Demo', theme: 'dark' });
const deckId = deckResult.deckId;
console.error(`\nCreated deck: ${deckId}\n`);

// Slide 1: Title
await callTool('add_slide', { deckId, layout: 'title', elements: [
  { type: 'text', content: 'SlideCraft', position: { x: 10, y: 20, width: 80, height: 25 }, style: { fontSize: 72, fontWeight: 'bold', textAlign: 'center', color: '#818cf8' } },
  { type: 'text', content: 'AI-Powered Slide Generation', position: { x: 15, y: 48, width: 70, height: 10 }, style: { fontSize: 32, textAlign: 'center', color: '#94a3b8' } },
  { type: 'shape', shape: 'rectangle', position: { x: 25, y: 65, width: 50, height: 1 }, fill: 'linear-gradient(90deg, #818cf8, #34d399)' },
  { type: 'text', content: 'Open Source \u00b7 MCP Integration \u00b7 Real-time Preview', position: { x: 15, y: 72, width: 70, height: 8 }, style: { fontSize: 20, textAlign: 'center', color: '#64748b' } },
] });
console.error('  Slide 1: Title');

// Slide 2: Features
await callTool('add_slide', { deckId, layout: 'content', elements: [
  { type: 'text', content: 'Key Features', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#f1f5f9' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 20, height: 1 }, fill: '#818cf8' },
  { type: 'text', content: 'MCP Server Integration\nReal-time Browser Preview\nPlugin Architecture\nMultiple Export Formats\nGit-friendly JSON Storage\nCustom Themes & Layouts', position: { x: 5, y: 22, width: 55, height: 70 }, style: { fontSize: 26, color: '#cbd5e1', lineHeight: 2.2 }, listType: 'bullet' },
  { type: 'shape', shape: 'rectangle', position: { x: 65, y: 22, width: 30, height: 70 }, fill: '#1e293b', borderRadius: 16 },
] });
console.error('  Slide 2: Features');

// Slide 3: Architecture
await callTool('add_slide', { deckId, layout: 'content', elements: [
  { type: 'text', content: 'Architecture', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#f1f5f9' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 20, height: 1 }, fill: '#34d399' },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 25, width: 25, height: 18 }, fill: '#312e81', borderRadius: 12 },
  { type: 'text', content: 'Claude Code', position: { x: 5, y: 28, width: 25, height: 12 }, style: { fontSize: 20, textAlign: 'center', color: '#c7d2fe', fontWeight: 'bold' } },
  { type: 'shape', shape: 'arrow', position: { x: 32, y: 30, width: 8, height: 8 }, fill: '#818cf8' },
  { type: 'shape', shape: 'rectangle', position: { x: 42, y: 20, width: 25, height: 28 }, fill: '#1e3a5f', borderRadius: 12 },
  { type: 'text', content: 'MCP Server\n+ HTTP/WS', position: { x: 42, y: 25, width: 25, height: 18 }, style: { fontSize: 18, textAlign: 'center', color: '#93c5fd', fontWeight: 'bold' } },
  { type: 'shape', shape: 'arrow', position: { x: 69, y: 30, width: 8, height: 8 }, fill: '#818cf8' },
  { type: 'shape', shape: 'rectangle', position: { x: 79, y: 25, width: 18, height: 18 }, fill: '#14532d', borderRadius: 12 },
  { type: 'text', content: 'Browser\nEditor', position: { x: 79, y: 28, width: 18, height: 12 }, style: { fontSize: 18, textAlign: 'center', color: '#86efac', fontWeight: 'bold' } },
  { type: 'shape', shape: 'rectangle', position: { x: 42, y: 55, width: 25, height: 15 }, fill: '#3f3f46', borderRadius: 12 },
  { type: 'text', content: 'Plugin System', position: { x: 42, y: 58, width: 25, height: 10 }, style: { fontSize: 18, textAlign: 'center', color: '#a1a1aa', fontWeight: 'bold' } },
  { type: 'shape', shape: 'rectangle', position: { x: 42, y: 75, width: 25, height: 15 }, fill: '#3f3f46', borderRadius: 12 },
  { type: 'text', content: 'JSON Storage', position: { x: 42, y: 78, width: 25, height: 10 }, style: { fontSize: 18, textAlign: 'center', color: '#a1a1aa', fontWeight: 'bold' } },
] });
console.error('  Slide 3: Architecture');

// Slide 4: Packages table
await callTool('add_slide', { deckId, layout: 'content', elements: [
  { type: 'text', content: 'Packages', position: { x: 5, y: 5, width: 90, height: 12 }, style: { fontSize: 48, fontWeight: 'bold', color: '#f1f5f9' } },
  { type: 'shape', shape: 'rectangle', position: { x: 5, y: 16, width: 20, height: 1 }, fill: '#a78bfa' },
  { type: 'table', headers: ['Package', 'Description', 'Status'], rows: [
    ['@slidecraft/core', 'Data models & storage', '\u2705 Ready'],
    ['@slidecraft/mcp-server', 'MCP + HTTP/WS server', '\u2705 Ready'],
    ['@slidecraft/renderer', 'HTML/CSS engine', '\u2705 Ready'],
    ['@slidecraft/editor', 'React browser UI', '\u2705 Ready'],
    ['@slidecraft/export', 'PDF/PNG/HTML export', '\u2705 Ready'],
    ['@slidecraft/plugin-api', 'Plugin interfaces', '\u2705 Ready'],
  ], striped: true, position: { x: 5, y: 22, width: 90, height: 65 } },
] });
console.error('  Slide 4: Packages');

// Slide 5: Closing
await callTool('add_slide', { deckId, layout: 'title', elements: [
  { type: 'shape', shape: 'circle', position: { x: 42, y: 15, width: 16, height: 28 }, fill: 'rgba(129,140,248,0.15)' },
  { type: 'text', content: 'Get Started', position: { x: 10, y: 30, width: 80, height: 20 }, style: { fontSize: 56, fontWeight: 'bold', textAlign: 'center', color: '#f1f5f9' } },
  { type: 'text', content: 'github.com/slidecraft/slidecraft', position: { x: 15, y: 55, width: 70, height: 10 }, style: { fontSize: 24, textAlign: 'center', color: '#818cf8' } },
  { type: 'text', content: 'MIT License \u00b7 Open Source \u00b7 Contributions Welcome', position: { x: 15, y: 70, width: 70, height: 8 }, style: { fontSize: 18, textAlign: 'center', color: '#64748b' } },
] });
console.error('  Slide 5: Closing\n');

// Open preview
const previewResult = await callTool('preview', { deckId });
// previewResult is a string, not JSON
console.log(`\n\u2705 Preview: http://localhost:4983/preview/${deckId}`);
console.log('\nServer running. Press Ctrl+C to stop.\n');

// Keep alive
process.on('SIGINT', () => {
  proc.kill();
  process.exit(0);
});
