import type { BuiltInTemplate } from '../template-catalog.js';

export const BEAUTY_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'instagram-post-salon-style',
    name: 'Hair Salon Style Showcase',
    nameJa: '美容室スタイル紹介',
    descriptionJa: '美容室の得意スタイル・カラーを魅力的に紹介するInstagram投稿。スタイリスト名・施術メニューと一緒に。',
    format: 'instagram-post',
    suggestedStylePreset: 'split-pastel',
    alternativeStylePresets: ['pastel-geometry', 'kyoto-classic'],
    slideCount: 1,
    tags: ['美容室', 'ヘアスタイル', 'カラー', 'サロン', 'Instagram'],
    icon: 'fa-solid fa-scissors',
    category: 'marketing',
    generationContext: 'Hair salon "Lucent Hair" in Omotesando. Featured style: Warm Honey Balayage with face framing. Stylist: Mio Nakamura (7 years experience). Service: Cut + Color + Treatment 18,000 yen. Duration: 3 hours. Reservation via Instagram DM or Hot Pepper.',
    slides: [
      {
        title: '美容室スタイル紹介',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram post for hair salon "Lucent Hair" in Omotesando. Style showcase layout: Split composition — upper 60% reserved for style name and visual description area. Lower 40%: style details in clean card. Style name "Warm Honey Balayage" / "ウォームハニーバレイヤージュ" in elegant typography. Stylist badge: "担当: Mio Nakamura / 7年のキャリア". Service info: Cut+Color+Tr ¥18,000 / 約3時間. Subtle split-tone background (warm peach + soft white). CTA: "Instagram DM または HOT PEPPER より予約". Clean, editorial beauty aesthetic.',
      },
    ],
  },

  {
    id: 'instagram-story-nail-design',
    name: 'Nail Salon New Design',
    nameJa: 'ネイルサロン新デザイン',
    descriptionJa: 'ネイルサロンの新作デザインを紹介するInstagramストーリー。デザイン名・カラー・料金をビジュアルに訴求。',
    format: 'instagram-story',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['split-pastel', 'creative-voltage'],
    slideCount: 1,
    tags: ['ネイル', 'ネイルサロン', '新作', '美容', 'Instagram'],
    icon: 'fa-solid fa-hand-sparkles',
    category: 'marketing',
    generationContext: 'Nail salon "Petal Nails" in Harajuku. New design: "Spring Cherry Blossom Gel Nails" - pastel pink base with 3D cherry blossom accents, gold foil details. Price: Regular design 7,800 yen, with 3D art +1,500 yen. Limited spring season design.',
    slides: [
      {
        title: 'ネイルサロン新デザイン',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story for nail salon "Petal Nails" in Harajuku. Announce new spring design: "Spring Cherry Blossom / 春の桜ネイル". Soft pastel pink and white color scheme with geometric petal shapes. Large "NEW DESIGN" tag at top. Center: design name in elegant typography, design description "ペールピンクベース × 3D桜アート × ゴールドホイル". Pricing table: 通常デザイン ¥7,800 / 3Dアート追加 +¥1,500. Small badge: "春季限定". Booking CTA at bottom: "ご予約はプロフィールURLから". Delicate geometry shapes in pink and lavender.',
      },
    ],
  },

  {
    id: 'instagram-story-salon-coupon',
    name: 'Salon Limited Coupon',
    nameJa: 'サロン限定クーポン',
    descriptionJa: 'サロンのSNS限定クーポンをインパクトある形で告知するInstagramストーリー。有効期限・使用条件を明記。',
    format: 'instagram-story',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['bold-signal', 'electric-studio'],
    slideCount: 1,
    tags: ['クーポン', 'サロン', '割引', '美容', 'Instagram', 'キャンペーン'],
    icon: 'fa-solid fa-ticket',
    category: 'marketing',
    generationContext: 'Multi-service beauty salon "LANA Beauty" in Shibuya. Instagram follower coupon: 20% off any single treatment. Valid until end of month. Minimum spend 5,000 yen. Cannot be combined with other offers. Show this story at reception.',
    slides: [
      {
        title: 'サロン限定クーポン',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story coupon for "LANA Beauty" salon in Shibuya. Bold, energetic design with creative voltage style. Large "COUPON" header with electric accent. Central coupon card with dashed border: "Instagram限定クーポン" / "全メニュー20% OFF". Conditions listed clearly: 最低施術金額 ¥5,000 / 他のクーポンとの併用不可 / 受付時にこのストーリーを提示. Validity: "今月末まで有効". Urgent CTA: "今すぐ予約してこの特典を使おう！". Energetic typography with high contrast. Salon handle "@lana.beauty.shibuya" at bottom.',
      },
    ],
  },

  {
    id: 'instagram-post-esthetic-menu',
    name: 'Esthetics Menu',
    nameJa: 'エステメニュー紹介',
    descriptionJa: 'エステサロンのフェイシャル・ボディケアメニューを上品に紹介するInstagram投稿。コース内容・効果・料金を整理。',
    format: 'instagram-post',
    suggestedStylePreset: 'dark-botanical',
    alternativeStylePresets: ['kyoto-classic', 'split-pastel'],
    slideCount: 1,
    tags: ['エステ', 'フェイシャル', 'ボディケア', '美容', 'Instagram'],
    icon: 'fa-solid fa-spa',
    category: 'marketing',
    generationContext: 'Luxury esthetic salon "Serenité" in Ginza. Featured menu: "Signature Facial Course" - 90 min, cleansing + steam + extraction + massage + mask + moisturizer. Price 15,000 yen (first visit 8,000 yen). Suitable for dry/sensitive skin. Used Sothys Paris products.',
    slides: [
      {
        title: 'エステメニュー紹介',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram post for luxury esthetic salon "Serenité" in Ginza. Elegant, botanical luxury aesthetic. Menu card layout: Salon name in refined script at top. Featured menu: "Signature Facial Course / シグネチャーフェイシャルコース". Duration "90 min" badge. Treatment steps listed with small icons: クレンジング → スチーム → 毛穴ケア → マッサージ → パック → 保湿. Skin type: 乾燥肌・敏感肌向け. Price: 通常 ¥15,000 / 初回限定 ¥8,000. Brand note: "Sothys Paris 使用". Dark forest green with gold accents and botanical leaf motifs.',
      },
    ],
  },

  {
    id: 'a5-landscape-salon-card',
    name: 'Salon Next Visit Card',
    nameJa: 'サロン次回予約カード',
    descriptionJa: '施術後にお渡しする次回予約カード。担当者名・次回推奨メニュー・予約方法をA5横で印刷用に。',
    format: 'a5-landscape',
    suggestedStylePreset: 'kyoto-classic',
    alternativeStylePresets: ['swiss-modern', 'split-pastel'],
    slideCount: 1,
    tags: ['予約カード', '次回予約', 'サロン', '印刷', 'A5横', '美容'],
    icon: 'fa-solid fa-calendar-check',
    category: 'marketing',
    generationContext: 'Hair and beauty salon "Atelier Aoi" in Yokohama. Card for customer Tanaka-sama. Stylist: Rena Fujii. Today\'s service: Cut + Highlight. Next recommended: Touch-up color in 6-8 weeks, treatment once a month. Reservation: phone 045-XXX-XXXX or LINE. Salon hours: 10:00-20:00 closed Tuesday.',
    slides: [
      {
        title: 'サロン次回予約カード',
        layout: 'single-design',
        prompt: 'Design a horizontal A5 (2480x1748) next visit card for hair salon "Atelier Aoi" in Yokohama. Elegant Japanese-inspired card design. Two sections side by side: Left section (40%): Salon logo area "Atelier Aoi" with subtle kamon-inspired mark. Right section (60%): Customer details - "田中 様 / Tanaka-sama", 担当: Rena Fujii. Today: Cut + Highlight. Next recommended: "カラータッチアップ (6〜8週間後)" and "トリートメント (月1回推奨)". Next appointment area with blank lines for date/time to be hand-written. Reservation info: TEL 045-XXX-XXXX / LINE @atelieraoi. Hours: 10:00-20:00 / 火曜定休. Refined cream and deep navy palette.',
      },
    ],
  },

  {
    id: 'instagram-post-beauty-tips',
    name: 'Beauty Tips',
    nameJa: '美容豆知識',
    descriptionJa: 'サロンの専門家が教える美容豆知識・スキンケアTipsを紹介するInstagram投稿。フォロワーの信頼を高める教育コンテンツ。',
    format: 'instagram-post',
    suggestedStylePreset: 'split-pastel',
    alternativeStylePresets: ['pastel-geometry', 'notebook-tabs'],
    slideCount: 1,
    tags: ['美容', 'スキンケア', 'ヘアケア', 'Tips', '教育', 'Instagram'],
    icon: 'fa-solid fa-lightbulb',
    category: 'education',
    generationContext: 'Beauty tip from dermatologist-supervised clinic "Hana Skin Lab". Topic: 5 habits that damage your hair without knowing it. Habits: Hot shower over 42°C, rough towel drying, combing wet hair, daily heat styling without protectant, tight ponytail everyday.',
    slides: [
      {
        title: '美容豆知識',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) educational Instagram post from beauty clinic "Hana Skin Lab". Title: "知らずにやっていた！髪を傷める5つの習慣". List 5 habits in numbered card format with warning icons: 1. 42℃以上のシャワー (頭皮乾燥の原因), 2. タオルで強くこする (キューティクル損傷), 3. 濡れたまま梳かす (切れ毛リスク), 4. ヒートプロテクトなしのアイロン, 5. 毎日きつく結ぶ (牽引性脱毛). Split pastel design: warm peach and soft mint alternating accents. Small "HAIR TIPS" badge. Bottom: "Hana Skin Lab — 皮膚科監修". Educational, trustworthy feel.',
      },
    ],
  },
];
