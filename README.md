# DocForge

AI-powered document design platform. MCP (Model Context Protocol) 経由で AI クライアントと連携し、プレゼンテーション・提案書・契約書などのビジネスドキュメントをリアルタイムに作成・プレビューできるプラットフォームです。

## Features

- **HTML-first design** -- 各ページは Tailwind CSS + Google Fonts を使ったスタンドアロンHTML。自由度の高いプロフェッショナルなデザイン
- **MCP integration** -- Claude Code 等の MCP クライアントからドキュメントを操作
- **Real-time preview** -- WebSocket 経由で変更を即座にブラウザに反映
- **14種類のビジネスドキュメントテンプレート** -- 初回起動時に自動シード。提案書、契約書、ヒアリングシート等をすぐに利用可能
- **Multi-format export** -- PDF、PPTX、HTML、PNG エクスポート
- **Multi-canvas support** -- プレゼンテーション (16:9) 以外に Instagram 投稿、YouTube サムネイル、A4 印刷等多様なキャンバスサイズ
- **Template import** -- PPTX ファイルをテンプレートとしてインポートし、AI がそのスタイルを再現

## Architecture

```
slidecraft/
├── packages/
│   ├── core/           # スキーマ・ストレージ・ユーティリティ
│   ├── mcp-server/     # MCP サーバー + Express + WebSocket
│   ├── renderer/       # HTML レンダリング・キャンバスプリセット
│   ├── export/         # PDF/PPTX/HTML/PNG エクスポーター
│   ├── editor/         # React + Vite エディタUI
│   └── plugin-api/     # テーマ・レイアウトプラグインシステム
├── plugins/
│   ├── theme-corporate/
│   ├── theme-dark/
│   ├── theme-minimal/
│   └── layout-standard/
```

### Data Storage

```
~/.slideharness/
├── decks/              # ドキュメント (deck.json + slides/*.html)
├── templates/          # PPTX テンプレート
├── assets/             # グローバル素材 (画像・フォント・カラー)
└── exports/            # エクスポート成果物
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm

### Install

```bash
git clone https://github.com/Nisss78/slidecraft.git
cd slidecraft
pnpm install
pnpm build
```

### 起動

```bash
# MCPサーバー + プレビューサーバー起動
node packages/mcp-server/dist/index.js
```

ブラウザで `http://localhost:4983` を開くと、14種類のサンプルドキュメントがテンプレートとして表示されます。

## MCP 接続方法

### Claude Code

`~/.claude/settings.json` に追加:

```json
{
  "mcpServers": {
    "slideharness": {
      "command": "node",
      "args": ["/path/to/slidecraft/packages/mcp-server/dist/index.js"]
    }
  }
}
```

環境変数 `SLIDEHARNESS_NO_PREVIEW=1` または `--no-preview` フラグでプレビューサーバーを無効化できます。

### MCP Tools

| ツール | 説明 |
|--------|------|
| `create_deck` | 新しいドキュメントを作成（キャンバスサイズ指定可） |
| `list_decks` | ドキュメント一覧を取得 |
| `get_deck` | ドキュメント詳細（全スライドHTML含む）を取得 |
| `delete_deck` | ドキュメントを削除 |
| `add_slide` | スライドを追加（完全なHTMLを渡す） |
| `update_slide` | スライドのHTML・メタデータを更新 |
| `get_slide_html` | スライドのHTMLソースを取得 |
| `delete_slide` | スライドを削除 |
| `reorder_slides` | スライドの順序を変更 |
| `duplicate_slide` | スライドを複製 |
| `generate_deck` | AI向けにスライド構造付き空デッキを生成 |
| `preview` | ブラウザでプレビューを開く |
| `export_deck` | PDF/PPTX/HTML/PNG にエクスポート |
| `get_style_guide` | デザインガイド（CSS変数・コンポーネント例）を取得 |
| `preview_styles` | 3つのスタイルプリセットをブラウザでプレビュー |
| `list_themes` | 利用可能なテーマ一覧 |
| `list_canvas_presets` | キャンバスサイズプリセット一覧 |
| `search_images` | フリー写真検索 (Pexels/Unsplash) |
| `save_template` | PPTXをテンプレートとして保存 |
| `analyze_template` | テンプレートのテーマ・レイアウトを分析 |

## 同梱テンプレート (14種類)

初回起動時に自動的にシードされます:

| # | テンプレート | ページ数 | カテゴリ |
|---|---|---|---|
| 1 | AI導入提案書 | 6 | 提案 |
| 2 | Webサイトリニューアル企画書 | 5 | 提案 |
| 3 | 会社・サービス紹介 | 5 | 営業 |
| 4 | ヒアリングシート | 5 | 営業 |
| 5 | RFP対応提案書 | 4 | 提案 |
| 6 | 見積書 | 3 | 営業 |
| 7 | 秘密保持契約書 (NDA) | 4 | 契約 |
| 8 | 業務委託契約書 | 4 | 契約 |
| 9 | 保守運用契約書 | 3 | 契約 |
| 10 | プロジェクト計画書 | 4 | PM |
| 11 | 要件定義書 | 4 | 開発 |
| 12 | 進捗報告書 | 4 | PM |
| 13 | ROI試算書 | 4 | 分析 |
| 14 | 経営ダッシュボード | 4 | ファイナンス |

## キャンバスサイズプリセット

| カテゴリ | サイズ | ID |
|---|---|---|
| Presentation | 1920x1080 (16:9) | `16:9` |
| Presentation | 1920x1440 (4:3) | `4:3` |
| Instagram 投稿 | 1080x1350 | `instagram-post` |
| Instagram ストーリー | 1080x1920 | `instagram-story` |
| YouTube サムネイル | 1280x720 | `youtube-thumbnail` |
| X ポスト | 1200x675 | `x-post` |
| Pinterest ピン | 1000x1500 | `pinterest-pin` |
| LinkedIn 投稿 | 1080x1080 | `linkedin-post` |
| A4 縦 | 2480x3508 | `a4` |
| A4 横 | 3508x2480 | `a4-landscape` |

## Development

```bash
# 開発モード（ウォッチ）
pnpm --filter editor dev

# ビルド
pnpm build

# テスト
pnpm test
```

## Tech Stack

- **Core**: TypeScript, Zod (schema validation)
- **MCP Server**: @modelcontextprotocol/sdk, Express, WebSocket (ws)
- **Renderer**: Tailwind CSS CDN, Google Fonts, Chart.js
- **Export**: Puppeteer (PDF/PNG), PptxGenJS (PPTX)
- **Editor**: React 19, Vite, Zustand
- **Plugin**: Theme & Layout registry system

## License

MIT
