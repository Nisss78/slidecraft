# Slide Harness

AI-powered design platform — **CanvaのOSSクローン**を目指す、MCP (Model Context Protocol) 経由でAIクライアントと連携するデザインプラットフォーム。プレゼンテーションだけでなく、SNS投稿、YouTubeサムネイル、チラシ、名刺など、あらゆるキャンバスサイズのデザインを作成できます。

## Features

- **HTML-first design** -- 各ページは Tailwind CSS CDN + Google Fonts + Font Awesome + Chart.js を使ったスタンドアロンHTML。自由度の高いプロフェッショナルなデザイン
- **MCP integration** -- Claude Code 等の MCP クライアントからデザインを操作。20+のMCPツールを提供
- **Real-time preview** -- WebSocket 経由で変更を即座にブラウザに反映 (port 4983)
- **40種類のビルトインテンプレート** -- プレゼン、Instagram、YouTube、X、Pinterest、LinkedIn、A4印刷に対応。業界別テンプレート (美容、不動産、医療、教育等) も搭載
- **14種類のビジネスドキュメントシード** -- 初回起動時に自動生成。提案書、契約書、ヒアリングシート等
- **16種類のスタイルプリセット** -- bold-signal、neon-cyber、kyoto-classic 等。A/B/C比較プレビューで選択可能
- **Multi-format export** -- PDF、PPTX、HTML、PNG エクスポート
- **21種類のキャンバスプリセット** -- プレゼン、SNS、印刷 (A3-A5、B3-B5) をカバー
- **Template import** -- PPTX ファイルをテンプレートとしてインポートし、AIがそのスタイルを再現
- **画像検索** -- Pexels / Unsplash API 経由でフリー写真を検索・保存

## Architecture

```
slidecraft/
├── packages/
│   ├── core/           # Zodスキーマ + JsonFileStorage
│   ├── mcp-server/     # MCPサーバー + Express + WebSocket + 全ツール定義
│   ├── renderer/       # HTMLレンダリング + キャンバスプリセット + テンプレートカタログ
│   ├── export/         # PDF/PNG/PPTX/HTML エクスポーター + PPTXパーサー
│   ├── editor/         # Vite ブラウザエディタ (WebSocket連携)
│   └── plugin-api/     # テーマ・レイアウトプラグインレジストリ
├── plugins/
│   ├── exporter-reveal/
│   ├── theme-corporate/
│   ├── theme-dark/
│   ├── theme-minimal/
│   └── layout-standard/
```

### Data Storage

```
~/.slideharness/
├── decks/              # デザイン (deck.json + slides/*.html)
├── templates/          # PPTX テンプレート
├── assets/             # グローバル素材 (画像・フォント・カラー)
└── exports/            # エクスポート成果物
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+

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

ブラウザで `http://localhost:4983` を開くと、Canva風UIのホーム画面が表示されます。

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

#### Deck / Slide 操作

| ツール | 説明 |
|--------|------|
| `create_deck` | 新しいデッキを作成 (キャンバスサイズ指定可) |
| `list_decks` | デッキ一覧を取得 |
| `get_deck` | デッキ詳細 (全スライドHTML含む) を取得 |
| `delete_deck` | デッキを削除 |
| `add_slide` | スライドを追加 (完全なHTMLを渡す) |
| `update_slide` | スライドのHTML・メタデータを更新 |
| `get_slide_html` | スライドのHTMLソースを取得 |
| `delete_slide` | スライドを削除 |
| `reorder_slides` | スライドの順序を変更 |
| `duplicate_slide` | スライドを複製 |

#### AI 生成

| ツール | 説明 |
|--------|------|
| `generate_deck` | トピックから構造化スライド付きデッキを生成 |
| `create_from_template` | ビルトインテンプレートからデッキを生成 |

#### テーマ / スタイル

| ツール | 説明 |
|--------|------|
| `list_themes` | 利用可能な16テーマ一覧 |
| `list_templates` | レイアウトテンプレート (title, content, two-column等) |
| `get_style_guide` | CSS変数・コンポーネント例・デザインルールを取得 |
| `preview_styles` | 3つのスタイルをA/B/C比較プレビュー |

#### テンプレート

| ツール | 説明 |
|--------|------|
| `list_built_in_templates` | 40種類のビルトインテンプレート一覧 (フィルタ・検索可) |
| `save_template` | PPTXをテンプレートとして保存 |
| `list_user_templates` | 保存済みPPTXテンプレート一覧 |
| `analyze_template` | テンプレートのテーマ・レイアウトを詳細分析 |

#### 画像・エクスポート・その他

| ツール | 説明 |
|--------|------|
| `search_images` | フリー写真検索 (Pexels / Unsplash) |
| `save_deck_image` | 外部画像をダウンロードしてデッキに保存 |
| `list_canvas_presets` | キャンバスサイズプリセット一覧 |
| `preview` | ブラウザでプレビューを開く |
| `export_deck` | PDF / PPTX / HTML / PNG にエクスポート |

## ビルトインテンプレート (40種類)

### Presentation (5)

| テンプレート | ページ数 |
|---|---|
| ビジネスプラン | 8 |
| プロダクトローンチ | 7 |
| 四半期レポート | 7 |
| ワークショップ | 6 |
| 投資家ピッチ | 8 |

### Instagram 投稿 (5) / ストーリー (5)

| テンプレート | ページ数 |
|---|---|
| 商品告知 / 商品リリース | 1 |
| セール告知 / カウントダウン | 1 |
| クォート / アンケート | 1 |
| イベント告知 / アナウンス | 1 |
| ビフォーアフター / チュートリアル | 1 |

### YouTube サムネイル (5) / X ポスト (5)

| テンプレート | ページ数 |
|---|---|
| ハウツー / データ統計 | 1 |
| レビュー / ティップス | 1 |
| ランキング / クォート | 1 |
| 速報 / アナウンス | 1 |
| ブログ / インフォグラフィック | 1 |

### Pinterest ピン (5) / LinkedIn 投稿 (5)

| テンプレート | ページ数 |
|---|---|
| レシピ / 業界データ | 1 |
| チェックリスト / 採用 | 1 |
| ファッション / ケーススタディ | 1 |
| DIY / イベント | 1 |
| インスピレーション / プロティップス | 1 |

### A4 印刷 (5)

| テンプレート | ページ数 |
|---|---|
| 企業ブロシュア | 1 |
| イベントフライヤー | 1 |
| メニュー | 1 |
| 履歴書 | 1 |
| ニュースレター | 1 |

### ビジネスドキュメント (14種類 - 初回起動時にシード)

AI導入提案書、Webサイトリニューアル企画書、会社・サービス紹介、ヒアリングシート、RFP対応提案書、見積書、秘密保持契約書 (NDA)、業務委託契約書、保守運用契約書、プロジェクト計画書、要件定義書、進捗報告書、ROI試算書、経営ダッシュボード

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
| A3 縦 | 3508x4961 | `a3` |
| A3 横 | 4961x3508 | `a3-landscape` |
| A4 縦 | 2480x3508 | `a4` |
| A4 横 | 3508x2480 | `a4-landscape` |
| A5 縦 | 1748x2480 | `a5` |
| A5 横 | 2480x1748 | `a5-landscape` |
| B3 縦 | 4304x6074 | `b3` |
| B3 横 | 6074x4304 | `b3-landscape` |
| B4 縦 | 3035x4304 | `b4` |
| B4 横 | 4304x3035 | `b4-landscape` |
| B5 縦 | 2146x3035 | `b5` |
| B5 横 | 3035x2146 | `b5-landscape` |

## Development

```bash
# 開発モード (ウォッチ)
pnpm --filter editor dev

# ビルド
pnpm build

# テスト
pnpm test

# リント
pnpm lint

# フォーマット
pnpm format
```

## Tech Stack

- **Runtime**: Node.js 20+, pnpm 9+, Turborepo
- **Language**: TypeScript 5.7+
- **Schema**: Zod (validation)
- **MCP Server**: @modelcontextprotocol/sdk, Express, WebSocket (ws)
- **Renderer**: Tailwind CSS CDN, Google Fonts, Font Awesome 6.5, Chart.js
- **Export**: Playwright (PDF/PNG), PptxGenJS (PPTX), JSZip (PPTX parse)
- **Editor**: Vite, Zustand
- **Plugin**: Theme & Layout registry system

## License

MIT
