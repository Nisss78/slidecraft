import { useState, useRef, useCallback } from 'react';

const TEMPLATES = [
  {
    id: 'blank',
    name: '空白',
    description: '空のプレゼンテーション',
    icon: '📄',
    color: '#6366f1',
    slides: [
      { title: 'タイトル', html: blankTitleHtml },
    ],
  },
];

// --- Template HTML generators ---

function wrapHtml(body: string, opts?: { fonts?: string; extraStyle?: string }): string {
  const fontUrl = opts?.fonts || 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Inter:wght@400;500;600;700;900&display=swap';
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1920,height=1080">
<script src="https://cdn.tailwindcss.com"><\/script>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
<link href="${fontUrl}" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans JP','Inter',sans-serif;word-break:keep-all;overflow-wrap:break-word}
${opts?.extraStyle || ''}
</style>
</head>
<body class="w-[1920px] h-[1080px] overflow-hidden">
${body}
</body>
</html>`;
}

function blankTitleHtml(title: string = 'プレゼンテーションタイトル') {
  return wrapHtml(`<div class="w-full h-full bg-white flex flex-col items-center justify-center">
  <h1 class="text-7xl font-black text-gray-900 tracking-tight">${title}</h1>
  <p class="text-2xl text-gray-400 mt-6">サブタイトルをここに入力</p>
</div>`);
}



export function HomeScreen() {
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createFromTemplate = useCallback(async (template: typeof TEMPLATES[number]) => {
    if (creating) return;
    setCreating(true);
    try {
      // Create deck
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: template.name + 'プレゼン' }),
      });
      const deck = await res.json();

      // Add slides from template
      for (const slide of template.slides) {
        const html = typeof slide.html === 'function' ? slide.html() : slide.html;
        await fetch(`/api/decks/${deck.id}/slides`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html, title: slide.title }),
        });
      }

      window.location.search = `?deck=${deck.id}`;
    } catch (err) {
      console.error('Failed to create deck:', err);
      setCreating(false);
    }
  }, [creating]);

  const handleFileImport = useCallback(async (file: File) => {
    if (importing) return;
    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-Filename': file.name },
        body: arrayBuffer,
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'インポートに失敗しました');
        setImporting(false);
        return;
      }
      const deck = await res.json();
      window.location.search = `?deck=${deck.id}`;
    } catch (err) {
      console.error('Failed to import:', err);
      alert('インポートに失敗しました');
      setImporting(false);
    }
  }, [importing]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileImport(file);
  }, [handleFileImport]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f1a',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '40px 48px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#6366f1', margin: 0 }}>
          Slide Harness
        </h1>
        <span style={{ fontSize: 14, color: '#64748b', border: '1px solid #334155', borderRadius: 20, padding: '2px 12px' }}>
          AI-powered
        </span>
      </div>

      <div style={{ padding: '0 48px', flex: 1 }}>
        {/* Create from blank */}
        <section style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: 0 }}>
              新規作成
            </h2>
            <button
              onClick={() => createFromTemplate(TEMPLATES[0])}
              disabled={creating}
              style={{
                padding: '8px 20px',
                background: '#6366f1',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                cursor: creating ? 'wait' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? '作成中...' : '+ 空白から作成'}
            </button>
          </div>

        </section>

        {/* File Import */}
        <section style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: '0 0 20px' }}>
            ファイルからインポート
          </h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#6366f1' : '#334155'}`,
              borderRadius: 16,
              padding: '48px 24px',
              textAlign: 'center',
              cursor: importing ? 'wait' : 'pointer',
              background: dragOver ? '#6366f110' : '#1a1a2e',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {importing ? '⏳' : '📁'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {importing ? 'インポート中...' : 'ファイルをドラッグ＆ドロップ'}
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8' }}>
              .pptx, .pdf ファイルに対応
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              またはクリックしてファイルを選択
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileImport(file);
              }}
            />
          </div>
        </section>

        {/* MCP Connection Guide */}
        <McpGuideSection />
      </div>
    </div>
  );
}

// --- MCP Client tabs ---
const MCP_CLIENTS = [
  { id: 'claude', label: 'Claude Code', args: 'dist/bundle.js' },
  { id: 'cursor', label: 'Cursor', args: 'dist/bundle.js", "--no-preview' },
  { id: 'codex', label: 'Codex', args: 'dist/bundle.js", "--no-preview' },
  { id: 'openclaw', label: 'OpenClaw', args: 'dist/bundle.js", "--no-preview' },
  { id: 'npx', label: 'npx (publish後)', args: null },
] as const;

const TOOLS = [
  { name: 'create_deck', desc: 'デッキ作成' },
  { name: 'generate_deck', desc: 'AI構成生成' },
  { name: 'add_slide', desc: 'スライド追加' },
  { name: 'update_slide', desc: 'スライド更新' },
  { name: 'delete_slide', desc: 'スライド削除' },
  { name: 'preview', desc: 'ブラウザプレビュー' },
  { name: 'export_deck', desc: 'PDF/PPTX/HTML/PNG出力' },
  { name: 'search_images', desc: '画像検索' },
];

function McpGuideSection() {
  const [activeTab, setActiveTab] = useState('claude');
  const [copied, setCopied] = useState(false);

  const getConfig = (id: string) => {
    if (id === 'npx') {
      return `{
  "mcpServers": {
    "slideharness": {
      "command": "npx",
      "args": ["slideharness@latest", "--no-preview"]
    }
  }
}`;
    }
    const client = MCP_CLIENTS.find(c => c.id === id)!;
    const argsStr = client.args!.split('", "').map(a => `"${a}"`).join(', ');
    return `{
  "mcpServers": {
    "slideharness": {
      "command": "node",
      "args": [${argsStr}]
    }
  }
}`;
  };

  const copyConfig = () => {
    navigator.clipboard.writeText(getConfig(activeTab));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeStyle: React.CSSProperties = {
    background: '#0d0d1a',
    border: '1px solid #2d2d44',
    borderRadius: 8,
    padding: 16,
    fontSize: 12,
    overflow: 'auto',
    lineHeight: 1.6,
    whiteSpace: 'pre',
    fontFamily: 'monospace',
    color: '#e2e8f0',
    position: 'relative',
  };

  return (
    <section style={{ marginTop: 48, marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', margin: '0 0 20px' }}>
        MCP Connection Guide
      </h2>
      <div style={{
        background: '#1a1a2e',
        border: '1px solid #2d2d44',
        borderRadius: 12,
        padding: 24,
      }}>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20, margin: '0 0 20px' }}>
          Slide HarnessをAIコーディングツールから操作するためのMCP設定
        </p>

        {/* Step 1: Config with tabs */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 12, margin: '0 0 12px' }}>
          1. MCP設定を追加
        </h3>
        <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
          {MCP_CLIENTS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              style={{
                padding: '6px 14px',
                background: activeTab === c.id ? '#2d2d44' : 'transparent',
                border: '1px solid #2d2d44',
                borderBottom: activeTab === c.id ? '1px solid #2d2d44' : '1px solid #2d2d44',
                borderRadius: '6px 6px 0 0',
                color: activeTab === c.id ? '#e2e8f0' : '#64748b',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: activeTab === c.id ? 600 : 400,
                marginRight: -1,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ ...codeStyle, borderTopLeftRadius: 0, marginBottom: 20 }}>
          {getConfig(activeTab)}
          <button
            onClick={copyConfig}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: '#2d2d44',
              border: '1px solid #3d3d5c',
              borderRadius: 4,
              color: copied ? '#4ade80' : '#94a3b8',
              cursor: 'pointer',
              padding: '3px 10px',
              fontSize: 11,
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {activeTab !== 'npx' && (
          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 20, margin: '0 0 20px' }}>
            ※ args内のパスはSlide Harnessの実際のインストールパスに置き換えてください
          </p>
        )}

        {/* Step 2: Tools */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 12, margin: '0 0 12px' }}>
          2. 利用可能なツール
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 8,
          marginBottom: 20,
        }}>
          {TOOLS.map(t => (
            <div key={t.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#cbd5e1',
            }}>
              <code style={{ color: '#6366f1', fontSize: 12 }}>{t.name}</code>
              <span style={{ color: '#64748b' }}>-</span>
              <span>{t.desc}</span>
            </div>
          ))}
        </div>

        {/* Step 3: Usage */}
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 8, margin: '0 0 8px' }}>
          3. 使い方
        </h3>
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8, margin: 0 }}>
          MCP接続後、AIに「プレゼンを作成して」と伝えるだけ。ツールが自動的に呼び出され、スライドが生成されます。
          {activeTab === 'claude' && ' プレビューサーバーが有効なので、ブラウザでリアルタイムに確認できます。'}
          {activeTab !== 'claude' && activeTab !== 'npx' && ' --no-previewモードのため、export_deckでファイル出力して確認してください。'}
        </p>
      </div>
    </section>
  );
}
