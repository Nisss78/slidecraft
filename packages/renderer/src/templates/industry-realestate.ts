import type { BuiltInTemplate } from '../template-catalog.js';

export const REALESTATE_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'instagram-post-property-listing',
    name: 'Property Listing Card',
    nameJa: '物件紹介カード',
    descriptionJa: '売買・賃貸物件をスタイリッシュなカードで紹介するInstagram投稿。間取り・価格・立地を視覚的に伝える。',
    format: 'instagram-post',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['electric-studio', 'bold-signal'],
    slideCount: 1,
    tags: ['不動産', '物件', '賃貸', '売買', 'Instagram'],
    icon: 'fa-solid fa-house',
    category: 'marketing',
    generationContext: 'Property listing for apartment in Minato-ku Tokyo. 2LDK, 58sqm, 10th floor, south-facing, newly renovated. Rent: 250,000 yen/month (management fee 15,000 yen). Walking distance: 3 min to Azabujuban Station. Key features: floor heating, auto-lock, city view, pet-friendly.',
    slides: [
      {
        title: '物件紹介カード',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram property listing card for a luxury apartment in Minato-ku Tokyo. Clean, professional real estate card layout. Property badge "NEW LISTING" at top. Property name: "南麻布 Terrace Residence". Key specs in icon grid: 2LDK / 58㎡, 10階南向き, 麻布十番駅 徒歩3分, 築浅リノベーション. Price: "¥250,000/月 (管理費 ¥15,000)". Feature badges: 床暖房 / オートロック / ペット可 / 眺望良好. Clean Swiss-modern grid layout with structured typography. CTA: "詳細・内見のご相談はDMまで". Real estate agency "Minato Properties" at bottom.',
      },
    ],
  },

  {
    id: 'instagram-story-open-house',
    name: 'Open House Notice',
    nameJa: 'オープンハウス案内',
    descriptionJa: 'オープンハウス・現地見学会の告知をするInstagramストーリー。日時・物件概要・参加方法を明確に。',
    format: 'instagram-story',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['electric-studio', 'swiss-modern'],
    slideCount: 1,
    tags: ['オープンハウス', '見学会', '不動産', 'Instagram'],
    icon: 'fa-solid fa-door-open',
    category: 'marketing',
    generationContext: 'Open house for a newly built detached house in Setagaya-ku Tokyo. 4LDK, 105sqm lot, 85sqm floor, 2-story. Date: Next Sunday 10:00-16:00. Price: 78 million yen. 8 minutes from Sangenjaya Station. No reservation needed but advance contact preferred.',
    slides: [
      {
        title: 'オープンハウス案内',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story open house announcement. Bold headline "OPEN HOUSE / オープンハウス開催！" with event details. Property: 世田谷区 新築一戸建て. Date/time strip: "今週日曜日 10:00〜16:00" in prominent block. Property specs: 4LDK / 敷地105㎡ / 延床85㎡ / 2階建. Price: "7,800万円". Location: 三軒茶屋駅 徒歩8分. Note: "予約不要 (事前連絡歓迎)". Map/direction icon element. CTA: "詳しくはプロフィールURLまたはDMへ". Bold, energetic color blocks in dark navy and bright white. Agency logo area at bottom.',
      },
    ],
  },

  {
    id: 'a4-property-flyer',
    name: 'Property Detail Flyer (2 pages)',
    nameJa: '物件詳細チラシ(2P)',
    descriptionJa: '物件の詳細情報を掲載した2ページの印刷用チラシ。物件概要・フロアプラン・アクセス・会社情報を網羅。',
    format: 'a4',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['bold-signal', 'notebook-tabs'],
    slideCount: 2,
    tags: ['物件チラシ', '印刷', 'A4', '不動産', 'フロアプラン'],
    icon: 'fa-solid fa-building',
    category: 'marketing',
    generationContext: 'Condo listing: "Shirokane Park Residence #803" in Minato-ku, 3LDK, 82sqm, built 2019, 8th floor, south-east facing, balcony, walk-in closet. Asking price: 92 million yen. Building: 15 floors, 120 units, managed by Nomura Real Estate. 5 min from Shirokane-Takanawa Station. Monthly: maintenance 28,000 yen, sinking fund 12,000 yen.',
    slides: [
      {
        title: '物件概要・外観',
        layout: 'single-design',
        prompt: 'Design an A4 portrait (2480x3508) property flyer page 1 for condo "白金パークレジデンス #803". Header: Property name in bold + "SOLD / 売買物件" status badge. Large property image placeholder area (upper half). Property summary table: 所在地 港区白金 / 価格 ¥9,200万 / 間取り 3LDK / 専有面積 82.00㎡ / 築年 2019年 / 階数 8階 (15階建) / 向き 南東 / バルコニー面積 12.5㎡. Key features badges: ウォークインクローゼット / 床暖房 / ディスポーザー / 24時間管理. Clean, structured grid layout for professional real estate marketing.',
      },
      {
        title: 'フロアプラン・アクセス',
        layout: 'single-design',
        prompt: 'Design an A4 portrait (2480x3508) property flyer page 2 for "白金パークレジデンス #803". Left column: Floor plan area placeholder with room labels (LDK 20.5帖, 洋室A 7.5帖, 洋室B 6.5帖, 洋室C 5.5帖, WIC, 浴室, 洗面台, トイレ×2, バルコニー). Right column: Access map placeholder area with station info: 白金高輪駅 徒歩5分, 白金台駅 徒歩7分, 品川駅 自転車10分. Monthly costs table: 管理費 ¥28,000 / 修繕積立金 ¥12,000 / 合計 ¥40,000. Bottom: Agency contact "MINATO PROPERTIES" / TEL 03-XXXX-XXXX / 免許番号表示. Professional two-column print layout.',
      },
    ],
  },

  {
    id: 'instagram-post-sold',
    name: 'Sold Announcement',
    nameJa: 'ご成約御礼',
    descriptionJa: '物件成約のお祝い報告をするInstagram投稿。不動産会社のブランディングと実績アピールに活用できる。',
    format: 'instagram-post',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['bold-signal', 'swiss-modern'],
    slideCount: 1,
    tags: ['成約', '不動産', '実績', 'Instagram'],
    icon: 'fa-solid fa-handshake',
    category: 'marketing',
    generationContext: 'Real estate agency "Urban Nest Realty" celebrating a sold property. Property was listed for 2 weeks, received multiple offers, and sold above asking price. Located in Shibuya-ku. Buyer: young family relocating from Osaka. Message of gratitude to all involved.',
    slides: [
      {
        title: 'ご成約御礼',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram post celebrating a property sale for "Urban Nest Realty". Celebratory "SOLD! / ご成約御礼" as the hero element in bold, electric typography. Large confetti or geometric celebration graphic. Text: "渋谷区の物件が掲載から2週間で成約！複数のオファーをいただき、当初の価格を上回る条件で成約となりました。大阪からお引越しのご家族に素晴らしい新生活のスタートを！" - abbreviated to key points. Agency branding: "Urban Nest Realty" logo area. Hashtags: #成約御礼 #不動産 #渋谷. Electric studio style with vivid accent colors celebrating the achievement.',
      },
    ],
  },

  {
    id: 'linkedin-post-market-report',
    name: 'Real Estate Market Report',
    nameJa: '不動産マーケットレポート',
    descriptionJa: '不動産市況・価格動向レポートをビジュアルデータで伝えるLinkedIn投稿。専門家の知見を示すコンテンツ。',
    format: 'linkedin-post',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['electric-studio', 'bold-signal'],
    slideCount: 1,
    tags: ['市況レポート', '不動産', 'データ', 'LinkedIn', 'マーケット'],
    icon: 'fa-solid fa-chart-line',
    category: 'data',
    generationContext: 'Tokyo residential market Q1 2026 report from analyst firm "Japan Property Analytics". Key findings: Average condo price in 23 wards +8.2% YoY (65,800 yen/sqm), transaction volume up 12%, inner-city rentals tightening at 95% occupancy, interest rate impact starting to show in outer areas.',
    slides: [
      {
        title: '不動産マーケットレポート',
        layout: 'single-design',
        prompt: 'Design a LinkedIn post image (1200x627) as a market report card for "Japan Property Analytics". Title: "東京23区 不動産市況レポート Q1 2026". Key metrics in bold data callouts: 平均坪単価 ¥65,800/㎡ (+8.2% YoY), 成約件数 前年比 +12%, 都心賃貸稼働率 95%, 外周区は金利影響で調整局面. Simple bar or trend line graphic element. Clean Swiss-modern data presentation. Expert credibility note: "Japan Property Analytics / 不動産調査レポート". Professional LinkedIn visual style with structured grid and data hierarchy.',
      },
    ],
  },
];
