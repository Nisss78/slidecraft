import { useState } from 'react';

export default function Header() {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <header style={{
        height: 48,
        background: '#1a1a2e',
        borderBottom: '1px solid #2d2d44',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#e2e8f0',
            margin: 0,
            letterSpacing: '0.5px',
          }}>
            SlideCraft
          </h1>
          <span style={{
            fontSize: 11,
            color: '#6366f1',
            background: 'rgba(99, 102, 241, 0.15)',
            padding: '2px 8px',
            borderRadius: 4,
            fontWeight: 600,
          }}>
            MCP
          </span>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          title="MCP connection guide"
          style={{
            background: 'none',
            border: '1px solid #3d3d5c',
            borderRadius: 6,
            color: '#94a3b8',
            cursor: 'pointer',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.color = '#e2e8f0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#3d3d5c';
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          ?
        </button>
      </header>

      {showHelp && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            style={{
              background: '#1a1a2e',
              border: '1px solid #2d2d44',
              borderRadius: 12,
              padding: 32,
              maxWidth: 600,
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              color: '#e2e8f0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                MCP Connection Guide
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, padding: 4 }}
              >
                ×
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
              SlideCraftをAI（Claude Code等）から操作するためのMCP設定方法
            </p>

            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 8 }}>
              1. settings.jsonに追加
            </h3>
            <pre style={{ background: '#0d0d1a', border: '1px solid #2d2d44', borderRadius: 8, padding: 16, fontSize: 12, overflow: 'auto', lineHeight: 1.6, marginBottom: 16 }}>
{`{
  "mcpServers": {
    "slidecraft": {
      "command": "node",
      "args": ["path/to/slidecraft/packages/mcp-server/dist/index.js"],
      "env": { "PORT": "3100" }
    }
  }
}`}
            </pre>

            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 8 }}>
              2. 利用可能なツール
            </h3>
            <ul style={{ fontSize: 13, lineHeight: 2, color: '#cbd5e1', paddingLeft: 20, marginBottom: 16 }}>
              <li><code style={{ color: '#6366f1' }}>create_presentation</code> — プレゼン作成</li>
              <li><code style={{ color: '#6366f1' }}>add_slide</code> — スライド追加</li>
              <li><code style={{ color: '#6366f1' }}>update_slide</code> — スライド更新</li>
              <li><code style={{ color: '#6366f1' }}>delete_slide</code> — スライド削除</li>
              <li><code style={{ color: '#6366f1' }}>list_slides</code> — スライド一覧</li>
              <li><code style={{ color: '#6366f1' }}>reorder_slides</code> — 順序変更</li>
              <li><code style={{ color: '#6366f1' }}>export_presentation</code> — HTML export</li>
            </ul>

            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#6366f1', marginBottom: 8 }}>
              3. 使い方
            </h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.8 }}>
              MCP接続後、Claude Codeに「プレゼンを作成して」と伝えるだけ。  
              AIがツールを呼び出し、このエディタにリアルタイムで反映されます。
            </p>

            <a href="https://github.com/Nisss78/slidecraft#readme" target="blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: 16, color: '#6366f1', fontSize: 13, textDecoration: 'none', borderBottom: '1px solid #6366f1' }}>
              GitHubで詳しく見る →
            </a>
          </div>
        </div>
      )}
    </>
  );
}
