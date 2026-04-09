import type { BuiltInTemplate } from '../template-catalog.js';

export const FREELANCE_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'a4-freelance-invoice',
    name: 'Freelance Invoice',
    nameJa: 'フリーランス請求書',
    descriptionJa: 'フリーランス・個人事業主向けの請求書テンプレート。取引先・品目・合計・振込先を整理したA4縦の印刷・PDF用。',
    format: 'a4',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['notebook-tabs', 'terminal-green'],
    slideCount: 1,
    tags: ['請求書', 'フリーランス', '個人事業主', '印刷', 'A4'],
    icon: 'fa-solid fa-file-invoice-dollar',
    category: 'business',
    generationContext: 'Invoice from freelance web designer "Keiko Fujimoto Design" to client "株式会社クリエイトプラス". Invoice number: INV-2026-042. Issue date: April 9, 2026. Payment due: April 30, 2026. Items: Website design (top page + 5 subpages) 280,000 yen, Responsive implementation 80,000 yen, SEO basic setup 30,000 yen. Subtotal 390,000 yen, Consumption tax 39,000 yen, Total 429,000 yen. Bank: SMBC Savings, Account: Savings 1234567.',
    slides: [
      {
        title: 'フリーランス請求書',
        layout: 'single-design',
        prompt: 'Design an A4 portrait (2480x3508) freelance invoice for "Keiko Fujimoto Design". Professional Japanese invoice format: Title "請求書" in large header. Two-column top: Left: Client info "株式会社クリエイトプラス 御中 / 担当: 山田様". Right: Issuer info "Keiko Fujimoto Design / 藤本 恵子 / 〒XXX-XXXX 東京都渋谷区XXX / MAIL: keiko@fujimoto-design.jp". Document meta: 請求書番号: INV-2026-042 / 発行日: 2026年4月9日 / お支払期限: 2026年4月30日. Itemized table: Webサイトデザイン (TOPページ+5ページ) ¥280,000 / レスポンシブ対応実装 ¥80,000 / SEO基本設定 ¥30,000. Subtotal ¥390,000 / 消費税 10% ¥39,000 / 合計 ¥429,000 bold. Bank transfer info: 三井住友銀行 普通口座 1234567 / フジモトケイコ. Clean, professional Swiss-modern document layout.',
      },
    ],
  },

  {
    id: 'instagram-post-portfolio',
    name: 'Portfolio Showcase',
    nameJa: 'ポートフォリオ紹介',
    descriptionJa: 'フリーランスクリエイターのポートフォリオ作品をInstagramでアピールするポスト。スキル・実績・お問い合わせ先も掲載。',
    format: 'instagram-post',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['electric-studio', 'split-pastel'],
    slideCount: 1,
    tags: ['ポートフォリオ', 'フリーランス', 'クリエイター', 'Instagram'],
    icon: 'fa-solid fa-palette',
    category: 'creative',
    generationContext: 'Freelance illustrator Nana Goto showcasing her portfolio. Style: whimsical character illustration, editorial, brand identity. Recent clients: food company packaging, children\'s book, startup app icon. Skills: Procreate, Adobe Illustrator, concept to final delivery. Available for new commissions, DM open.',
    slides: [
      {
        title: 'ポートフォリオ紹介',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram portfolio post for freelance illustrator "Nana Goto". Artist portfolio card with creative, whimsical yet professional aesthetic. Header: "PORTFOLIO / ポートフォリオ" with palette icon. Artist name and title: "後藤 奈々 / イラストレーター". Style description: "キャラクターイラスト / エディトリアル / ブランドアイデンティティ". Recent works grid (4 squares placeholder with labels): 食品パッケージイラスト / 絵本イラスト / アプリアイコン / キャラクターデザイン. Skills badges: Procreate / Adobe Illustrator / コンセプト〜納品まで. Available notice: "新規お仕事受付中 ★". CTA: "お仕事依頼はDMまたはプロフィールURLから". Creative voltage with painterly energetic feel.',
      },
    ],
  },

  {
    id: 'a5-landscape-business-card',
    name: 'Digital Business Card',
    nameJa: 'デジタル名刺',
    descriptionJa: 'フリーランス・クリエイター向けのデジタル名刺。SNSシェアやメール添付に使えるA5横のデザイン名刺。',
    format: 'a5-landscape',
    suggestedStylePreset: 'kyoto-classic',
    alternativeStylePresets: ['swiss-modern', 'electric-studio'],
    slideCount: 1,
    tags: ['名刺', 'デジタル名刺', 'フリーランス', 'A5横'],
    icon: 'fa-solid fa-id-card',
    category: 'personal',
    generationContext: 'Digital business card for freelance UX designer Ryota Mori. Title: UX/UI Designer + Product Consultant. Skills: User Research, Figma, Prototyping, Design Systems. Available for: SaaS products, mobile apps, product strategy. Social: LinkedIn, Behance, X. Contact: ryota@mori-design.jp. Based in Tokyo, remote available.',
    slides: [
      {
        title: 'デジタル名刺',
        layout: 'single-design',
        prompt: 'Design a horizontal A5 (2480x1748) digital business card for freelance UX designer "Ryota Mori". Elegant two-sided-style single card layout. Left section (35%): Name "森 涼太" in large clean typography, title "UX/UI Designer + Product Consultant". Japanese and English. Circular initial monogram "RM" as logo mark. Right section (65%): Skills tags: User Research / Figma / Prototyping / Design Systems. Availability: SaaSプロダクト / モバイルアプリ / プロダクト戦略. Social links row with icons: LinkedIn / Behance / X (@ryota_ux). Contact: ryota@mori-design.jp. Location: 東京 / リモート対応可. Kyoto-classic palette: refined ink blue and warm ivory for sophisticated professional.',
      },
    ],
  },

  {
    id: 'instagram-story-available',
    name: 'Available for Work Notice',
    nameJa: '受注可能のお知らせ',
    descriptionJa: 'フリーランサーが新規案件受付開始・空き枠をアピールするInstagramストーリー。スキル・希望条件・問い合わせ先を明示。',
    format: 'instagram-story',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['creative-voltage', 'bold-signal'],
    slideCount: 1,
    tags: ['受注', 'フリーランス', '案件募集', 'Instagram'],
    icon: 'fa-solid fa-circle-check',
    category: 'marketing',
    generationContext: 'Freelance copywriter Mika Tanaka announcing availability for new projects. Specialties: web copy, SNS content, PR articles, product descriptions. Available from May. Budget: starting from 30,000 yen per project. Languages: Japanese. Industries preferred: food, beauty, lifestyle, tech. Contact via Instagram DM or email.',
    slides: [
      {
        title: '受注可能のお知らせ',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story announcing freelance availability for copywriter "田中 美花". Green check circle icon prominently at top: "新規案件受付中！" in bold headline. Photo/avatar placeholder area (professional headshot). Services: Web コピーライティング / SNSコンテンツ / PRライティング / 商品説明文. Available from: 5月〜受付開始. Budget: ¥30,000〜/件. Preferred industries: 食 / 美容 / ライフスタイル / IT. Language: 日本語. Contact CTA: "Instagram DM またはメールにてお気軽に" with mail icon. Handle @tanaka.copywriter. Electric studio clean professional announcement style.',
      },
    ],
  },

  {
    id: 'linkedin-post-freelance-case',
    name: 'Freelance Case Study',
    nameJa: 'フリーランス実績紹介',
    descriptionJa: 'フリーランサーがLinkedInで実績・クライアント成功事例を発信するポスト。専門性と信頼性を高めるコンテンツ。',
    format: 'linkedin-post',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['electric-studio', 'bold-signal'],
    slideCount: 1,
    tags: ['実績', 'ケーススタディ', 'フリーランス', 'LinkedIn'],
    icon: 'fa-solid fa-diagram-project',
    category: 'business',
    generationContext: 'Freelance data analyst Shu Yamamoto sharing a case study on LinkedIn. Project: e-commerce client, analyzed 2 years of sales data, identified top 3 revenue leaks (abandoned cart optimization, cross-sell timing, seasonal inventory). Results: implemented recommendations led to 23% revenue increase in 6 months. Project duration: 3 months.',
    slides: [
      {
        title: 'フリーランス実績紹介',
        layout: 'single-design',
        prompt: 'Design a LinkedIn post image (1200x627) case study card for freelance data analyst "山本 周". Title: "EC企業 データ分析 実績 / Case Study". Project summary: "2年分の売上データから3つの収益機会を特定。提案実施後6ヶ月で売上23%増を達成". Key findings in 3 labeled boxes: カート離脱最適化 / クロスセルタイミング改善 / 季節在庫最適化. Results metrics: 売上 +23% (6ヶ月) / ROI 580% / プロジェクト期間 3ヶ月. Skills used: Python / SQL / Tableau / Statistical Analysis. Available for: データ分析・BI可視化プロジェクト. Contact: プロフィールよりDMまたはメール. Swiss-modern clean business card style for professional LinkedIn presence.',
      },
    ],
  },
];
