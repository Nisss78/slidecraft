import type { BuiltInTemplate } from '../template-catalog.js';

export const IT_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'instagram-post-release-notes',
    name: 'Release Notes',
    nameJa: 'リリースノート',
    descriptionJa: 'SaaSプロダクトのアップデート・新機能リリースをInstagramで告知するポスト。エンジニアリングブランドの発信に。',
    format: 'instagram-post',
    suggestedStylePreset: 'terminal-green',
    alternativeStylePresets: ['electric-studio', 'swiss-modern'],
    slideCount: 1,
    tags: ['リリースノート', 'SaaS', 'アップデート', 'IT', 'Instagram'],
    icon: 'fa-solid fa-code-branch',
    category: 'business',
    generationContext: 'Project management SaaS "Taskflow v2.4.0" release. New features: AI-powered task prioritization, Slack integration 2.0 with bi-directional sync, Custom dashboard widgets (6 new types), Mobile offline mode, Performance: 40% faster load times. Bug fixes: 12 issues resolved.',
    slides: [
      {
        title: 'リリースノート',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram release notes post for project management SaaS "Taskflow". Header: "v2.4.0 リリース！" with git branch icon. New features list in terminal/code aesthetic: ✦ AI優先度自動振り分け, ✦ Slack連携 2.0 (双方向同期), ✦ カスタムダッシュボード ウィジェット6種追加, ✦ モバイルオフラインモード, ✦ 読み込み速度 40%向上. Bug fixes badge: "不具合 12件修正". Release metadata: 2026-04-09 / v2.4.0. Terminal-green style: dark background with green monospace code font aesthetic for developer brand appeal.',
      },
    ],
  },

  {
    id: 'instagram-story-incident-report',
    name: 'Incident Report',
    nameJa: '障害報告',
    descriptionJa: 'サービス障害の発生・対応・復旧を透明性をもって報告するInstagramストーリー。ユーザーへの誠実なコミュニケーション。',
    format: 'instagram-story',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['terminal-green', 'bold-signal'],
    slideCount: 1,
    tags: ['障害報告', 'インシデント', 'SaaS', 'IT', 'Instagram'],
    icon: 'fa-solid fa-triangle-exclamation',
    category: 'business',
    generationContext: 'Cloud storage service "VaultSync" had an incident: API outage from 14:32 to 16:45 JST on April 8. Root cause: database connection pool exhaustion due to unexpected traffic spike. Impact: file upload/download unavailable for 2h13m. Fix: increased connection pool capacity, added auto-scaling. Compensation: 2 weeks free subscription for affected users.',
    slides: [
      {
        title: '障害報告',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story incident post-mortem report for "VaultSync". Professional, transparent incident communication. Status header: "障害報告 / INCIDENT REPORT" with triangle-warning icon. Incident timeline: 発生 4月8日 14:32 JST → 復旧 16:45 JST (所要時間 2時間13分). Root cause section: "原因: 予期しないトラフィック急増によるDB接続プール枯渇". Impact: ファイルアップロード/ダウンロード 機能停止. Resolution: 接続プール容量拡張 + オートスケーリング実装. Compensation box: "影響を受けたユーザー様に2週間分の無料延長を提供". Sincere apology text. Swiss-modern clean style for trustworthy corporate communication.',
      },
    ],
  },

  {
    id: 'x-post-feature-announcement',
    name: 'Feature Announcement',
    nameJa: '新機能告知',
    descriptionJa: '待望の新機能リリースをXで告知するビジュアルポスト。機能のビフォーアフターや主要ポイントを簡潔に伝える。',
    format: 'x-post',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['creative-voltage', 'terminal-green'],
    slideCount: 1,
    tags: ['新機能', 'SaaS', 'IT', 'X', 'Twitter'],
    icon: 'fa-solid fa-wand-magic-sparkles',
    category: 'marketing',
    generationContext: 'Design tool "Artboard Studio" launching AI background removal feature. Feature: One-click AI background removal with edge detection accuracy 99.2%. Works on: photos, product images, logos. Processing time: under 2 seconds. Available to: all plans including free. API access for Pro+ plans.',
    slides: [
      {
        title: '新機能告知',
        layout: 'single-design',
        prompt: 'Design an X post image (1200x675) announcing new AI feature for design tool "Artboard Studio". "NEW FEATURE / 新機能リリース" header with magic wand sparkles icon. Feature spotlight: "AI背景削除" - ワンクリックで背景を瞬時に削除. Key stats in bold: 精度 99.2% / 処理時間 2秒以内. Use cases badges: 写真 / 商品画像 / ロゴ. Availability: 全プラン (無料プランも対応！). API note: "Pro+プランはAPI連携可能". CTA: "今すぐ試す →". Electric studio style with vivid product demo feel and AI/tech aesthetic.',
      },
    ],
  },

  {
    id: 'linkedin-post-saas-metrics',
    name: 'SaaS Metrics Dashboard',
    nameJa: 'SaaS指標ダッシュボード',
    descriptionJa: 'SaaSビジネスの主要指標（MRR・Churn・NPS等）をLinkedIn向けにビジュアル化した投稿。投資家・業界向け情報発信。',
    format: 'linkedin-post',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['electric-studio', 'terminal-green'],
    slideCount: 1,
    tags: ['SaaS', 'MRR', 'メトリクス', 'LinkedIn', 'IT', 'データ'],
    icon: 'fa-solid fa-chart-column',
    category: 'data',
    generationContext: '"DataSync Pro" B2B SaaS Q1 2026 metrics sharing on LinkedIn. MRR: 42M yen (+18% QoQ), ARR run rate: 504M yen, Customers: 1,240 (added 180 new this quarter), Churn rate: 1.8% (down from 2.4%), NPS: 67, Average contract value: 342K yen/year.',
    slides: [
      {
        title: 'SaaS指標ダッシュボード',
        layout: 'single-design',
        prompt: 'Design a LinkedIn post image (1200x627) as a SaaS metrics dashboard for "DataSync Pro". Title: "Q1 2026 Key Metrics". Clean data visualization card with 6 metric boxes in grid: MRR ¥42M (+18% QoQ) with up-trend indicator, ARR ¥504M run rate, 顧客数 1,240社 (今期+180), Churn Rate 1.8% (前期比-0.6%) with down-arrow (good), NPS 67, ACV ¥342K/年. Brief insight line: "3四半期連続でMRR成長率15%超を達成". Swiss-modern data dashboard aesthetic with clean grid, precision typography, and subtle chart elements.',
      },
    ],
  },

  {
    id: '16:9-product-demo',
    name: 'Product Demo Deck (6 pages)',
    nameJa: '製品デモ資料(6P)',
    descriptionJa: 'SaaSプロダクトのデモ・商談で使う製品紹介スライド。課題提起・解決策・機能紹介・導入事例・料金・CTAを6枚構成で。',
    format: '16:9',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['swiss-modern', 'bold-signal'],
    slideCount: 6,
    tags: ['製品デモ', 'SaaS', 'プレゼン', 'IT', '16:9'],
    icon: 'fa-solid fa-desktop',
    category: 'business',
    generationContext: 'HR Tech SaaS "TalentOS" demo deck for enterprise sales. Product: AI-powered talent management platform. Target: HR departments of 500+ employee companies. Key features: AI resume screening (90% time saved), employee performance analytics, learning path recommendation, DEI reporting. Case study: major retailer reduced hiring time 65%. Pricing: from 500K yen/month.',
    slides: [
      {
        title: 'タイトル・課題提起',
        layout: 'title',
        prompt: 'Create a 16:9 title slide for HR Tech "TalentOS" demo deck. Company name "TalentOS" in bold with tagline "AIで採用・育成・定着を革新する". Subtitle: "製品デモンストレーション 2026". Visual: subtle data/people network motif suggesting talent analytics. Bottom: sales rep contact placeholder.',
      },
      {
        title: 'HRが直面する課題',
        layout: 'three-column',
        prompt: 'Create a 16:9 problem statement slide for TalentOS. Title: "人事部門が直面する3つの課題". Three columns: 1. 採用の長期化 (平均42日 → コスト増大, 優秀人材の機会損失), 2. パフォーマンス管理の属人化 (主観的評価, データ不足, 定着率低下), 3. 育成投資対効果の不透明さ (研修ROI測定困難, スキルギャップ未把握). Each column with impact metric and warning icon. Question prompt at bottom: "御社でも同じ課題を感じていませんか？".',
      },
      {
        title: 'TalentOS ソリューション',
        layout: 'content',
        prompt: 'Create a 16:9 solution overview slide for TalentOS. Title: "TalentOS が解決する方法". Feature list with icons and brief explanations: 1. AI書類選考 (精度92% / 選考時間90%削減), 2. パフォーマンス分析ダッシュボード (全社員リアルタイム可視化), 3. 学習パスAI推薦 (個人スキルギャップに最適化), 4. DEIレポーティング (多様性指標の自動集計). Center or side visual: product screenshot placeholder framed cleanly.',
      },
      {
        title: '導入事例',
        layout: 'split-60-40',
        prompt: 'Create a 16:9 case study slide for TalentOS. Title: "導入事例: 大手小売業A社 (従業員8,000名)". Left 60%: Challenge and results story. Before: 採用リードタイム平均55日, 書類選考工数 月480時間. After: 採用リードタイム19日 (-65%), 書類選考工数 月48時間 (-90%), 社員定着率 +12%. Implementation period: 3ヶ月. Quote from HR Director: "TalentOSの導入で採用と育成の全体像が初めてデータで見えるようになりました。" Right 40%: Key metrics in large bold numbers with colored highlight boxes.',
      },
      {
        title: '料金プラン',
        layout: 'three-column',
        prompt: 'Create a 16:9 pricing slide for TalentOS. Title: "料金プラン". Three columns for 3 tiers: Starter (〜100名 / ¥150,000/月): 採用管理, 基本分析, メールサポート. Business (〜500名 / ¥350,000/月): Starterの全機能 + AI書類選考, パフォーマンス分析, 専任CS. Enterprise (500名〜 / ¥500,000/月〜): 全機能 + カスタム開発, API連携, SLA99.9%, 専任コンサル. Most popular badge on Business plan. Note: 30日間無料トライアル / 初期費用0円.',
      },
      {
        title: 'ネクストステップ',
        layout: 'content',
        prompt: 'Create a 16:9 call-to-action / next steps slide for TalentOS demo. Title: "さっそく始めましょう". Steps list: Step 1: 30日間無料トライアル開始 (今日から, クレカ不要), Step 2: 専任オンボーディングサポート (セットアップ完了まで伝), Step 3: 3ヶ月後の効果測定レビュー (KPIを一緒に確認). Contact info placeholder for sales rep. Calendar link suggestion: "担当者とのオンライン相談 → カレンダー予約". Confidence statement: "平均導入期間 3ヶ月 / 解約率 1.8%の信頼実績".',
      },
    ],
  },

  {
    id: 'a4-landscape-changelog',
    name: 'Changelog Document (2 pages)',
    nameJa: '変更履歴ドキュメント(2P)',
    descriptionJa: 'ソフトウェアの変更履歴・リリースノートを整理したA4横ドキュメント。社内共有・顧客配布両方に対応したプロ仕様。',
    format: 'a4-landscape',
    suggestedStylePreset: 'terminal-green',
    alternativeStylePresets: ['swiss-modern', 'notebook-tabs'],
    slideCount: 2,
    tags: ['変更履歴', 'changelog', 'SaaS', 'IT', 'A4横', 'ドキュメント'],
    icon: 'fa-solid fa-file-lines',
    category: 'business',
    generationContext: 'API platform "Nexus API" changelog document covering v3.0 to v3.2. v3.0 (Feb 2026): Major release with new GraphQL support, rate limiting improvements, breaking changes in auth endpoints. v3.1 (Mar 2026): Bug fixes, performance improvements, new webhook retry logic. v3.2 (Apr 2026): New streaming API, improved error codes, SDK updates.',
    slides: [
      {
        title: 'v3.0〜v3.1 変更履歴',
        layout: 'single-design',
        prompt: 'Design a horizontal A4 (3508x2480) changelog document page 1 for "Nexus API". Header: "Nexus API — Changelog / 変更履歴" with version range "v3.0〜v3.2 (2026年2〜4月)". Two-column layout for v3.0 and v3.1: v3.0 (2026-02-01 / Major Release): ✦ GraphQLサポート追加, ✦ レート制限アルゴリズム改善 (スループット2倍), ✦ 認証エンドポイント変更 [BREAKING], migration guide link. v3.1 (2026-03-15): ✦ 不具合修正 8件, ✦ Webhook再試行ロジック改善, ✦ レスポンス速度 平均23%向上. Breaking changes section highlighted in warning orange. Terminal-green code-doc aesthetic.',
      },
      {
        title: 'v3.2 変更履歴・移行ガイド',
        layout: 'single-design',
        prompt: 'Design a horizontal A4 (3508x2480) changelog document page 2 for "Nexus API". v3.2 section (2026-04-09 / Current): ✦ ストリーミングAPI (Server-Sent Events), ✦ エラーコード体系刷新 (RFC 9457準拠), ✦ Python / Node.js SDK v3.2対応, ✦ ダッシュボード UX改善 (レスポンスログビュー). Migration guide section: Breaking changes from v3.0: old endpoint /auth/token → new /api/v3/auth/token. Code snippet placeholder showing before/after. Deprecation notice: v2.x は2026-12-31にEOL. Support: docs.nexusapi.io / support@nexusapi.io. Clean code documentation aesthetic with monospace font elements.',
      },
    ],
  },
];
