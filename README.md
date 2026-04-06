# Slide Harness

MCP-powered presentation builder with HTML-first architecture.  
AI（MCPクライアント）と協調して、HTMLスライドをリアルタイムに作成・プレビューできるプレゼンテーションツールです。

## Features

- **HTML-first slides** — 各スライドは生のHTMLで記述。自由度の高いデザインが可能
- **MCP integration** — Claude Code等のMCPクライアントからスライドを操作
- **Real-time preview** — WebSocket経由でスライドの変更をリアルタイムにプレビュー
- **Multi-slide support** — 複数スライドの追加・削除・並び替え
- **Export** — スライドをスタンドアロンHTMLファイルとしてエクスポート

## Architecture

```
slideharness/
├── packages/
│   ├── editor/          # React + Vite フロントエンド（スライドエディタ）
│   └── mcp-server/      # MCPサーバー（AIからのスライド操作API）
└── scripts/             # デモデータ・シードスクリプト
```

- **editor**: React (Vite) 製のスライドエディタ。WebSocketでMCPサーバーと通信
- **mcp-server**: Model Context Protocolサーバー。スライドのCRUD操作を提供

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm

### Install

```bash
git clone https://github.com/Nisss78/slidecraft.git
cd slidecraft
pnpm install
```

### Build & Run

```bash
pnpm build

# MCPサーバーを起動（プレビューサーバーも同時起動）
pnpm --filter mcp-server start

# エディタを開発モードで起動
pnpm --filter editor dev
```

エディタは `http://localhost:5173` で起動します。

## MCP接続方法

Slide HarnessのMCPサーバーをClaude Code等のMCPクライアントに接続する方法を説明します。

### Claude Code

`~/.claude/settings.json` またはプロジェクトの `.claude/settings.json` に以下を追加します：

```json
{
  "mcpServers": {
    "slideharness": {
      "command": "node",
      "args": ["/path/to/slideharness/packages/mcp-server/dist/index.js"],
      "env": {
        "PORT": "3100"
      }
    }
  }
}
```

### MCP Tools

Slide HarnessのMCPサーバーは以下のツールを提供します：

| ツール | 説明 |
|--------|------|
| `create_presentation` | 新しいプレゼンテーションを作成 |
| `add_slide` | スライドを追加 |
| `update_slide` | スライドの内容を更新 |
| `delete_slide` | スライドを削除 |
| `list_slides` | スライド一覧を取得 |
| `reorder_slides` | スライドの順序を変更 |
| `export_presentation` | HTMLファイルとしてエクスポート |

### 使用例

Claude Codeに接続後、以下のようにスライドを作成できます：

```
プレゼンテーションを作成して
タイトル: スタートアップ pitch deck
スライド構成:
1. タイトルスライド
2. 課題
3. ソリューション
4. ビジネスモデル
5. チーム
```

MCPクライアントが自動的にツールを呼び出し、エディタにリアルタイムで反映されます。

## Development

### Project Structure

```
packages/editor/
├── src/
│   ├── components/
│   │   ├── Header.tsx          # ヘッダー（タイトル・ツールバー）
│   │   ├── SlidePanel.tsx      # スライド一覧パネル
│   │   ├── SlideEditor.tsx     # スライドHTMLエディタ
│   │   └── EditorToolbar.tsx   # エディタツールバー
│   ├── hooks/
│   │   └── useWebSocket.ts     # WebSocket通信フック
│   ├── store.ts                # Zustandステート管理
│   ├── types/
│   │   └── index.ts            # 型定義
│   └── App.tsx                 # アプリケーションルート
└── index.html

packages/mcp-server/
├── src/
│   ├── index.ts                # MCPサーバーエントリーポイント
│   └── preview-server.ts       # プレビューHTTP+WSサーバー
└── package.json
```

### Commands

```bash
# 開発モード（ウォッチ）
pnpm --filter editor dev
pnpm --filter mcp-server dev

# ビルド
pnpm build

# デモデータの投入
node scripts/seed-demo.mjs
```

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Zustand
- **MCP Server**: TypeScript, @modelcontextprotocol/sdk
- **Communication**: WebSocket (リアルタイム同期)
- **Styling**: CSS（カスタムプロパティ使用）

## License

MIT
