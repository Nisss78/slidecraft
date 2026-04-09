import type { BuiltInTemplate } from '../template-catalog.js';

export const FB_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'instagram-post-cafe-menu',
    name: 'Cafe Daily Menu',
    nameJa: 'カフェ本日のメニュー',
    descriptionJa: 'カフェの本日のおすすめメニューをおしゃれに紹介するInstagram投稿。ドリンク・フードを写真映えするレイアウトで。',
    format: 'instagram-post',
    suggestedStylePreset: 'dark-botanical',
    alternativeStylePresets: ['vintage-editorial', 'pastel-geometry'],
    slideCount: 1,
    tags: ['カフェ', 'メニュー', '飲食', 'コーヒー', 'Instagram'],
    icon: 'fa-solid fa-mug-hot',
    category: 'marketing',
    generationContext: 'Fictional cafe "Amber & Leaf" in Shibuya. Today\'s menu: Morning Blend Coffee 550 yen, Avocado Toast 980 yen, Seasonal Smoothie (Mango + Passion Fruit) 750 yen, Almond Croissant 420 yen. Cozy botanical atmosphere.',
    slides: [
      {
        title: 'カフェ本日のメニュー',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram post for cafe "Amber & Leaf" (アンバー&リーフ). Header: "Today\'s Menu / 本日のメニュー" in elegant script. List 4 items in a clean card layout: Morning Blend Coffee ¥550, Avocado Toast ¥980, Seasonal Smoothie (Mango & Passion Fruit) ¥750, Almond Croissant ¥420. Use dark forest green and warm amber palette with organic botanical leaf motifs in corners. Noto Sans JP for Japanese, elegant serif for English. Soft textured background suggesting kraft paper. Bottom: "@amber.and.leaf | Shibuya, Tokyo".',
      },
    ],
  },

  {
    id: 'instagram-story-restaurant-daily',
    name: 'Restaurant Daily Lunch',
    nameJa: 'レストラン日替わりランチ',
    descriptionJa: 'レストランの日替わりランチを告知するInstagramストーリー。本日のメイン・副菜・スープを魅力的に提示。',
    format: 'instagram-story',
    suggestedStylePreset: 'kyoto-classic',
    alternativeStylePresets: ['vintage-editorial', 'swiss-modern'],
    slideCount: 1,
    tags: ['レストラン', 'ランチ', '日替わり', '飲食', 'Instagram'],
    icon: 'fa-solid fa-utensils',
    category: 'marketing',
    generationContext: 'Italian restaurant "Trattoria Sole" in Osaka. Today\'s lunch: Main - Grilled Salmon with Lemon Butter Sauce, Side - Seasonal Vegetable Salad, Soup - Minestrone, Bread included. Set price 1,200 yen. Lunch hours 11:30-14:00.',
    slides: [
      {
        title: 'レストラン日替わりランチ',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story for "Trattoria Sole" Italian restaurant. Top section: restaurant logo area with name in elegant italic. Large center hero area: "Today\'s Lunch / 本日のランチ" bold header. Content card listing: Main - グリルサーモン レモンバターソース, Side - 季節野菜サラダ, Soup - ミネストローネ, Bread included. Price badge "¥1,200" in prominent warm tone circle. Time strip at bottom "LUNCH 11:30〜14:00 / 大阪 心斎橋". Warm terracotta and cream Italian palette. Decorative olive branch dividers.',
      },
    ],
  },

  {
    id: 'instagram-post-izakaya-event',
    name: 'Izakaya Event Notice',
    nameJa: '居酒屋イベント告知',
    descriptionJa: '居酒屋の特別イベント（飲み放題・貸切・ライブなど）を告知するインパクトのあるInstagram投稿。',
    format: 'instagram-post',
    suggestedStylePreset: 'neon-cyber',
    alternativeStylePresets: ['bold-signal', 'electric-studio'],
    slideCount: 1,
    tags: ['居酒屋', 'イベント', '飲み放題', '飲食', 'Instagram'],
    icon: 'fa-solid fa-beer-mug-empty',
    category: 'marketing',
    generationContext: 'Izakaya "Yoru no Hoshi" (夜の星) in Shinjuku. Special event: "Summer Endless Night" - all-you-can-drink for 2 hours at 2,980 yen. Date: Every Friday and Saturday in August. Starts 18:00. Reservation required via LINE.',
    slides: [
      {
        title: '居酒屋イベント告知',
        layout: 'single-design',
        prompt: 'Design a bold square (1080x1080) Instagram post for izakaya "夜の星 (Yoru no Hoshi)" in Shinjuku. Event: "SUMMER ENDLESS NIGHT" - 飲み放題2時間 ¥2,980. Use high-energy neon style: dark navy/black background with glowing neon text accents in electric blue and hot pink. Large event name in impactful display font. Key details: 毎週金・土曜日 8月中 / 18:00〜 / 要予約 (LINE予約). Beer mug icon as visual accent. Strip at bottom with address area and @yorunohoshi_shinjuku handle. Energy and excitement through bold typography contrast.',
      },
    ],
  },

  {
    id: 'instagram-story-bakery-newitem',
    name: 'Bakery New Item',
    nameJa: 'ベーカリー新作パン',
    descriptionJa: 'ベーカリーの新作パンを美しく紹介するInstagramストーリー。パンの特徴・素材・価格を魅力的に伝える。',
    format: 'instagram-story',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['vintage-editorial', 'dark-botanical'],
    slideCount: 1,
    tags: ['ベーカリー', 'パン', '新商品', '飲食', 'Instagram'],
    icon: 'fa-solid fa-bread-slice',
    category: 'marketing',
    generationContext: 'Artisan bakery "Farine & Blé" in Kyoto. New item: "Matcha Cream Brioche" - organic matcha from Uji, double cream filling, topped with white chocolate pearls. Price 480 yen. Available from Friday. Limited to 30 per day.',
    slides: [
      {
        title: 'ベーカリー新作パン',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story for artisan bakery "Farine & Blé" in Kyoto. Announce new product: "Matcha Cream Brioche / 抹茶クリームブリオッシュ". Pastel green and warm cream color palette. Large "NEW" badge in top corner. Hero area with product name in elegant typography. Feature bullets with small icons: 宇治産有機抹茶使用 / ダブルクリーム仕立て / ホワイトチョコパール仕上げ. Price "¥480" in clean badge. Limited notice: "1日限定30個 / 毎週金曜より販売". Bottom: "Farine & Blé — 京都 岡崎". Soft pastel geometry shapes as background accent.',
      },
    ],
  },

  {
    id: 'a5-restaurant-menu',
    name: 'Table Menu (3 pages)',
    nameJa: '卓上メニュー(3P)',
    descriptionJa: 'レストランの卓上メニュー3ページ構成。表紙・前菜＆メイン・ドリンクページをA5サイズで印刷用に。',
    format: 'a5',
    suggestedStylePreset: 'vintage-editorial',
    alternativeStylePresets: ['kyoto-classic', 'swiss-modern'],
    slideCount: 3,
    tags: ['メニュー', '印刷', 'レストラン', 'A5', '飲食'],
    icon: 'fa-solid fa-book-open',
    category: 'marketing',
    generationContext: 'French bistro "Maison Hirondelle" in Nagoya. Menu includes: Amuse-bouche, 5 starters (1,200-1,800 yen), 4 main courses (2,400-3,800 yen), 2 desserts (800 yen). Wine list: House red/white 700 yen per glass, 3 bottle options. Soft drinks 500 yen.',
    slides: [
      {
        title: '表紙',
        layout: 'single-design',
        prompt: 'Design an A5 portrait (1748x2480) menu cover for French bistro "Maison Hirondelle" (メゾン・イロンデル) in Nagoya. Elegant cover: restaurant name in refined French script typography. Subtitle "MENU" centered. Small hirondelle (swallow) bird illustration as logo. Warm ivory background with subtle fleur-de-lis border pattern in muted gold. Bottom: address area "名古屋市中区 錦3丁目". Timeless French bistro aesthetics.',
      },
      {
        title: '前菜・メイン',
        layout: 'single-design',
        prompt: 'Design an A5 portrait (1748x2480) menu page listing starters and mains for Maison Hirondelle. Section "STARTERS / 前菜": Soupe à l\'Oignon (オニオングラタンスープ) ¥1,200, Salade Niçoise (ニソワーズサラダ) ¥1,400, Escargot de Bourgogne (エスカルゴ) ¥1,800, Terrine de Campagne (テリーヌ・ド・カンパーニュ) ¥1,500, Foie Gras Poêlé (フォアグラのソテー) ¥1,800. Section "MAINS / メイン": Bœuf Bourguignon ¥3,200, Poulet Rôti aux Herbes ¥2,400, Sole Meunière ¥3,800, Risotto aux Champignons ¥2,600. Clean two-column layout with decorative section dividers.',
      },
      {
        title: 'ドリンク',
        layout: 'single-design',
        prompt: 'Design an A5 portrait (1748x2480) drinks menu page for Maison Hirondelle. Section "WINE / ワイン": House Red (Côtes du Rhône) ¥700/glass, House White (Chablis) ¥700/glass, Bordeaux Château Margaux 2018 ¥12,000/bottle, Burgundy Gevrey-Chambertin ¥9,500/bottle. Section "DRINKS": Café ¥500, Thé ¥500, Eau minérale ¥400, Jus d\'orange ¥500, Chocolat chaud ¥600. Section "DESSERT": Crème Brûlée ¥800, Moelleux au Chocolat ¥800. Elegant typography with wine glass icon accents.',
      },
    ],
  },

  {
    id: 'instagram-post-food-review',
    name: 'Food Review Card',
    nameJa: 'グルメレビューカード',
    descriptionJa: 'お気に入りのお店・料理をスタイリッシュなカード形式でシェアするInstagram投稿。評価・コメント・基本情報を掲載。',
    format: 'instagram-post',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['vintage-editorial', 'notebook-tabs'],
    slideCount: 1,
    tags: ['グルメ', 'レビュー', '飲食', 'おすすめ', 'Instagram'],
    icon: 'fa-solid fa-star',
    category: 'personal',
    generationContext: 'Review of ramen restaurant "Shio Ramen Homare" in Sapporo. Rating 4.8/5. Specialty: Shio (salt) ramen with rich chicken broth, thin noodles, chashu pork, nori, menma. Price 950 yen. Recommended visiting time: 11:00-13:00 to avoid queue.',
    slides: [
      {
        title: 'グルメレビューカード',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram post as a food review card for "塩ラーメン誉" in Sapporo. Clean editorial card layout: Top section with restaurant name "塩ラーメン 誉" and location "札幌 すすきの" in structured typography. Rating display: 4.8 ★★★★★ (5段階) prominently shown. Comment block: "鶏白湯ベースの澄んだ塩スープが絶品。チャーシューは箸でほぐれる柔らかさ。並んでも食べる価値あり！" in clean quote format. Details row: ¥950 / 11:00〜14:30, 18:00〜21:00 / 水曜定休. Small badge: "おすすめ時間帯: 11時台". Swiss-modern clean style with precise grid layout.',
      },
    ],
  },

  {
    id: 'a4-landscape-cafe-pricelist',
    name: 'Cafe Price List',
    nameJa: 'カフェ価格表',
    descriptionJa: 'カフェの全メニュー価格表。コーヒー・ドリンク・フードを横型A4でわかりやすく整理したPOP・掲示用。',
    format: 'a4-landscape',
    suggestedStylePreset: 'notebook-tabs',
    alternativeStylePresets: ['dark-botanical', 'vintage-editorial'],
    slideCount: 1,
    tags: ['カフェ', '価格表', '印刷', 'A4横', '飲食', 'POP'],
    icon: 'fa-solid fa-list',
    category: 'marketing',
    generationContext: 'Specialty coffee shop "Blue Bottle-inspired cafe Kessho" in Fukuoka. Menu: Espresso 420 yen, Americano 480 yen, Cappuccino 550 yen, Cafe Latte 580 yen, Matcha Latte 620 yen, Cold Brew 650 yen. Food: Blueberry Scone 380 yen, Banana Bread 420 yen, Cheese Cake 500 yen. Iced version +50 yen.',
    slides: [
      {
        title: 'カフェ価格表',
        layout: 'single-design',
        prompt: 'Design a horizontal A4 (3508x2480) price list poster for specialty coffee cafe "珈琲 結晶 (Kessho)" in Fukuoka. Three-column layout: Column 1 "COFFEE / コーヒー" - Espresso ¥420, Americano ¥480, Cappuccino ¥550, Cafe Latte ¥580, Cold Brew ¥650. Column 2 "SPECIALTY / スペシャルティ" - Matcha Latte ¥620, Hojicha Latte ¥600, Oat Milk Latte ¥630, Seasonal Special ¥680. Column 3 "FOOD / フード" - Blueberry Scone ¥380, Banana Bread ¥420, Cheese Cake ¥500, Cookie Set ¥350. Note: "アイスは+50円". Header with cafe name and tagline "Single Origin Specialty Coffee". Clean tabular design with ruled lines, warm cream background.',
      },
    ],
  },
];
