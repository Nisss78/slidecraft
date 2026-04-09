import type { BuiltInTemplate } from '../template-catalog.js';

export const EC_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'instagram-post-new-arrival',
    name: 'New Arrival Product',
    nameJa: '新着商品',
    descriptionJa: 'ECショップ・小売店の新着商品を告知するInstagram投稿。商品特徴・価格・購入方法を魅力的にプレゼン。',
    format: 'instagram-post',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['electric-studio', 'creative-voltage'],
    slideCount: 1,
    tags: ['新着商品', 'EC', '新商品', '小売', 'Instagram'],
    icon: 'fa-solid fa-box-open',
    category: 'marketing',
    generationContext: 'Online fashion brand "Kaze Apparel" launching new summer collection. New item: "Cloud Linen Shirt" - 100% Belgian linen, 4 colors (white, sage green, navy, sand), sizes XS-XXL. Price: 8,800 yen. Pre-order bonus: free linen tote bag. Shipping: 3-5 business days.',
    slides: [
      {
        title: '新着商品',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram new arrival post for fashion brand "Kaze Apparel". "NEW ARRIVAL" hero banner with opening box icon. Product spotlight: "クラウドリネンシャツ" - 100%ベルギーリネン. Color chips showing 4 options: ホワイト / セージグリーン / ネイビー / サンド. Size range: XS-XXL. Price: ¥8,800. Pre-order bonus badge: "予約特典: リネントートバッグ プレゼント". Shipping note: "発送まで3〜5営業日". CTA: "プロフィールURLよりご注文". Bold signal style with clean product-first layout and strong typographic hierarchy.',
      },
    ],
  },

  {
    id: 'instagram-story-flash-sale',
    name: 'Flash Sale',
    nameJa: 'タイムセール',
    descriptionJa: '期間限定タイムセールを告知するインパクトあるInstagramストーリー。カウントダウン要素と商品情報で緊急性を演出。',
    format: 'instagram-story',
    suggestedStylePreset: 'neon-cyber',
    alternativeStylePresets: ['creative-voltage', 'bold-signal'],
    slideCount: 1,
    tags: ['タイムセール', 'セール', 'EC', '限定', 'Instagram'],
    icon: 'fa-solid fa-bolt',
    category: 'marketing',
    generationContext: 'Online electronics store "TechDirect Japan" running a 24-hour flash sale. Featured items: Wireless earbuds 40% off (normally 12,800 yen → 7,680 yen), Smart watch 35% off (normally 24,800 yen → 16,120 yen), Portable charger 50% off (normally 4,800 yen → 2,400 yen). Sale ends midnight tonight.',
    slides: [
      {
        title: 'タイムセール',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story flash sale for "TechDirect Japan". High-energy "FLASH SALE / タイムセール" hero with lightning bolt icon. Urgency countdown element: "本日深夜0時まで！" with clock icon. Product deal cards: ワイヤレスイヤホン 40%OFF ¥7,680 (通常¥12,800), スマートウォッチ 35%OFF ¥16,120 (通常¥24,800), ポータブル充電器 50%OFF ¥2,400 (通常¥4,800). Each with clear before/after pricing. "SALE" badges in electric accent. CTA: "今すぐ購入 → プロフィールURL". Neon-cyber style with electric blue on dark background creating urgency and excitement.',
      },
    ],
  },

  {
    id: 'instagram-post-customer-review',
    name: 'Customer Review',
    nameJa: 'お客様レビュー',
    descriptionJa: 'お客様の声・レビューをビジュアル化して共有するInstagram投稿。信頼性向上と社会的証明による購入促進。',
    format: 'instagram-post',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['swiss-modern', 'split-pastel'],
    slideCount: 1,
    tags: ['お客様の声', 'レビュー', 'EC', '信頼性', 'Instagram'],
    icon: 'fa-solid fa-star-half-stroke',
    category: 'marketing',
    generationContext: 'Skincare brand "Pura Botanics" sharing customer review. Customer: Yuki M., 32, Tokyo. Product: "Hyaluronic Serum". Rating: 5 stars. Review: "乾燥が気になり始めた頃に試したら、1週間で肌のもちもち感が全然違う！朝晩の日課になりました。香りも優しくてリラックスできます。" Used for 3 months. Repurchase rate 89%.',
    slides: [
      {
        title: 'お客様レビュー',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram customer review post for skincare brand "Pura Botanics". Clean testimonial card layout. Product name: "ヒアルロン酸セラム". Review: large quote marks with customer comment "乾燥が気になり始めた頃に試したら、1週間で肌のもちもち感が全然違う！朝晩の日課になりました。香りも優しくてリラックスできます。" Customer info: Yuki M. (32歳・東京) / 使用期間 3ヶ月. Rating: ★★★★★ 5.0. Stat badge: "リピート率 89%". Brand note: "Pura Botanics — 植物由来成分 100%". Pastel geometry design with soft botanical color palette conveying natural, trustworthy skincare.',
      },
    ],
  },

  {
    id: 'instagram-story-restock',
    name: 'Restock Notice',
    nameJa: '再入荷のお知らせ',
    descriptionJa: '人気商品の再入荷をいち早く告知するInstagramストーリー。商品情報・在庫状況・購入方法を即座に伝える。',
    format: 'instagram-story',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['bold-signal', 'creative-voltage'],
    slideCount: 1,
    tags: ['再入荷', 'EC', '在庫', 'Instagram'],
    icon: 'fa-solid fa-rotate',
    category: 'marketing',
    generationContext: 'Outdoor equipment brand "Summit Gear Japan" restocking popular item. Product: "All-Weather Down Jacket" - previously sold out in 48 hours. Restock: 50 units only, 3 colors (black, forest green, burnt orange), sizes S-XL. Price: 38,000 yen. Goes live at noon today. Notify via app for early access.',
    slides: [
      {
        title: '再入荷のお知らせ',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story restock announcement for "Summit Gear Japan". Exciting "RESTOCK / 再入荷！" header with rotation/refresh icon. Product: "オールウェザーダウンジャケット" - 前回は48時間で完売した人気商品. Stock info: 今回の入荷数 50着のみ. Color options: ブラック / フォレストグリーン / バーントオレンジ with color dots. Size range: S〜XL. Price: ¥38,000. Time highlight: "本日 正午12:00 販売開始！" with clock icon. Early access note: "アプリ通知ONで優先案内". Urgency CTA: "売り切れ前にゲット！ → プロフィールURL". Electric studio with vibrant outdoor energy.',
      },
    ],
  },

  {
    id: 'pinterest-ec-lookbook',
    name: 'Product Lookbook',
    nameJa: '商品ルックブック',
    descriptionJa: 'EC・ファッションブランドの商品を使ったスタイリング提案をするPinterest投稿。ビジュアルマーチャンダイジング。',
    format: 'pinterest-pin',
    suggestedStylePreset: 'vintage-editorial',
    alternativeStylePresets: ['split-pastel', 'kyoto-classic'],
    slideCount: 1,
    tags: ['ルックブック', 'スタイリング', 'EC', 'Pinterest', 'ファッション'],
    icon: 'fa-solid fa-images',
    category: 'creative',
    generationContext: 'Lifestyle brand "Mori Living" showcasing summer home collection lookbook. Featured items: natural rattan basket tray 3,200 yen, linen table runner 2,800 yen, ceramic plant pot set 4,500 yen, beeswax candle 1,800 yen. Styled in Scandinavian-Japanese wabi-sabi aesthetic. Scene: sunlit morning kitchen.',
    slides: [
      {
        title: '商品ルックブック',
        layout: 'single-design',
        prompt: 'Design a tall Pinterest pin (1000x1500) lookbook for lifestyle brand "Mori Living" summer collection. Editorial lifestyle layout with Scandi-Japanese wabi-sabi aesthetic. Title: "Summer Morning Collection 2026 / 夏の朝の暮らし". Products styled together: ラタンバスケットトレー ¥3,200, リネンテーブルランナー ¥2,800, 陶器プランターセット ¥4,500, みつろうキャンドル ¥1,800. Scene description: "陽差しが差し込む、穏やかな朝のキッチン". Editorial-style product placement description with natural materials callout: 天然素材 / 職人手作り / 日本国内配送. Brand tag: "Mori Living — 自然と暮らす". Vintage editorial feel with warm natural tones.',
      },
    ],
  },

  {
    id: 'x-post-ec-launch',
    name: 'New Product Launch',
    nameJa: '新商品ローンチ告知',
    descriptionJa: '待望の新商品ローンチをXで告知するポスト。プロダクト写真・主要特徴・購入リンクを簡潔に伝える。',
    format: 'x-post',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['electric-studio', 'creative-voltage'],
    slideCount: 1,
    tags: ['新商品', 'ローンチ', 'EC', 'X', 'Twitter'],
    icon: 'fa-solid fa-rocket',
    category: 'marketing',
    generationContext: 'D2C coffee brand "Horizon Coffee" launching subscription service. Product: Single-origin specialty coffee monthly box. 3 roasts per month, freshly roasted within 72 hours, 150g each bag. Price plans: 3-month plan 4,500 yen/month, 6-month plan 4,000 yen/month (save 3,000 yen). Launch date: May 1. First 100 subscribers get free brewing guide.',
    slides: [
      {
        title: '新商品ローンチ告知',
        layout: 'single-design',
        prompt: 'Design an X post image (1200x675) for specialty coffee brand "Horizon Coffee" subscription launch. Clean, impactful product announcement card. Hero text: "Horizon Coffee Subscription / ついにサブスク開始！" with rocket icon. Product: シングルオリジン スペシャルティコーヒー 月3種 (各150g / 焙煎後72時間以内発送). Plan pricing: 3ヶ月プラン ¥4,500/月 / 6ヶ月プラン ¥4,000/月 (¥3,000お得). Launch badge: "5月1日 スタート". First-mover bonus: "先着100名 ブリューイングガイド プレゼント". CTA arrow: "詳細はリンクから". Bold signal style with coffee-inspired warm dark tones.',
      },
    ],
  },
];
