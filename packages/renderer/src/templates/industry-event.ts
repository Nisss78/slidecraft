import type { BuiltInTemplate } from '../template-catalog.js';

export const EVENT_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'instagram-post-wedding-invite',
    name: 'Wedding Invitation',
    nameJa: '結婚式招待状',
    descriptionJa: 'SNSで送る結婚式の招待状。日時・会場・RSVP情報を美しく伝える特別なInstagram投稿。',
    format: 'instagram-post',
    suggestedStylePreset: 'kyoto-classic',
    alternativeStylePresets: ['vintage-editorial', 'split-pastel'],
    slideCount: 1,
    tags: ['結婚式', '招待状', 'ウェディング', 'Instagram'],
    icon: 'fa-solid fa-ring',
    category: 'personal',
    generationContext: 'Wedding invitation for Takuya Shimizu and Sakura Ito. Date: September 13, 2026, Saturday. Ceremony: 12:00 at Chapel Saint-Denis Yokohama. Reception: 13:30 at the same venue. Dress code: Formal. RSVP by August 1 via LINE or designated form URL. Accommodation arrangements available upon request.',
    slides: [
      {
        title: '結婚式招待状',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) wedding invitation for Takuya Shimizu and Sakura Ito. Elegant, timeless design. Names in large elegant calligraphy-style typography: "Takuya & Sakura". Japanese text: "ご結婚式のご案内". Date: 2026年9月13日（土）. Ceremony: 挙式 12:00 / Chapel Saint-Denis Yokohama. Reception: 披露宴 13:30 / 同会場. Dress code: フォーマル. RSVP: 8月1日までにLINEまたはフォームよりご返信ください. Decorative elements: delicate floral vine border, small ring or dove illustration. Kyoto-classic palette: deep indigo, ivory, subtle gold. Refined and romantic.',
      },
    ],
  },

  {
    id: 'instagram-story-event-countdown',
    name: 'Event Countdown',
    nameJa: 'イベントカウントダウン',
    descriptionJa: 'イベント・ライブ・発売日までのカウントダウンを盛り上げるInstagramストーリー。期待感と緊急性を演出。',
    format: 'instagram-story',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['bold-signal', 'electric-studio'],
    slideCount: 1,
    tags: ['カウントダウン', 'イベント', 'ライブ', 'Instagram'],
    icon: 'fa-solid fa-hourglass-half',
    category: 'marketing',
    generationContext: 'Music festival "Neon Horizon Fest" countdown story posted 7 days before event. Festival: April 19-20 at Osaka Maishima. Lineup headliners: 3 major acts (names TBD). 10,000 attendees expected. Last tickets available: general day pass 6,800 yen, 2-day pass 11,500 yen. Gates open 15:00.',
    slides: [
      {
        title: 'イベントカウントダウン',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story countdown for music festival "Neon Horizon Fest". Electrifying design: Large "COUNTDOWN / カウントダウン" header. Giant number "7" with text "日後 / DAYS TO GO" in massive display. Event name "Neon Horizon Fest" in vivid neon. Date: 4月19日(土)〜20日(日) / 大阪 舞洲. Hours: 開場 15:00. Ticket info: 一般当日券 ¥6,800 / 2日通し券 ¥11,500. "LAST TICKETS" urgency badge. Teaser: ラインナップ 順次発表中！. CTA: "チケット → プロフィールURL". Creative voltage aesthetic with neon lights, electric energy, festival excitement.',
      },
    ],
  },

  {
    id: 'a5-event-program',
    name: 'Event Program (3 pages)',
    nameJa: 'イベントプログラム(3P)',
    descriptionJa: '式典・パーティー・セレモニーの進行プログラム。表紙・タイムスケジュール・ゲスト情報をA5縦で印刷用に。',
    format: 'a5',
    suggestedStylePreset: 'vintage-editorial',
    alternativeStylePresets: ['kyoto-classic', 'swiss-modern'],
    slideCount: 3,
    tags: ['プログラム', 'イベント', '式典', '印刷', 'A5'],
    icon: 'fa-solid fa-list-ol',
    category: 'business',
    generationContext: 'Annual company awards ceremony "Excellence Awards 2026" for tech company "Innovate Corp". Venue: Roppongi Hills Club, Tokyo. Date: April 18, 2026. 150 attendees. Program: Welcome reception 18:00, Dinner 19:00, Awards presentation (5 categories) 20:00, Special performance 21:00, Networking 21:30. Hosted by CEO Hiroshi Kato.',
    slides: [
      {
        title: '表紙',
        layout: 'single-design',
        prompt: 'Design an A5 portrait (1748x2480) event program cover for "Excellence Awards 2026" by Innovate Corp. Elegant awards ceremony program cover. Title: "Excellence Awards 2026" in prestigious typography. Company name: "Innovate Corp". Tagline: "Celebrating Our Greatest Achievements". Date: 2026年4月18日（土）. Venue: Roppongi Hills Club, Tokyo. Decorative award/trophy motif or geometric star pattern. Gold and deep navy color scheme for prestige. Bottom: program booklet indicator "Program / ご案内".',
      },
      {
        title: '式次第・タイムスケジュール',
        layout: 'single-design',
        prompt: 'Design an A5 portrait (1748x2480) event program page 2 for Excellence Awards 2026. Title: "式次第 / Program". Timeline list with times and descriptions: 18:00 ウェルカムレセプション (着席・ご歓談), 19:00 開会の辞 / 代表取締役社長 加藤 博 / ディナースタート, 20:00 表彰式 - Innovation Award / Team Excellence / Customer Hero / Leadership Award / Grand Prize, 21:00 スペシャルパフォーマンス, 21:30 フリーネットワーキング / 閉会, 22:00 お開き. Each time slot in structured timeline format with decorative time marker. Vintage editorial elegance.',
      },
      {
        title: 'ゲスト情報・アクセス',
        layout: 'single-design',
        prompt: 'Design an A5 portrait (1748x2480) event program page 3 for Excellence Awards 2026. Two sections: Guest Information section: ドレスコード: ブラックタイまたはダークスーツ / 駐車場: ご利用いただけません (タクシー推奨) / お荷物: クローク完備 / 写真撮影: 表彰式中は可 / SNS: #ExcellenceAwards2026 ハッシュタグ使用のこと. Access section: 会場: 六本木ヒルズクラブ (52F) / 最寄駅: 六本木駅 徒歩5分 / 麻布十番駅 徒歩10分. Small map placeholder. Contact: 幹事 田村 (内線 XXX). Thank you note at bottom.',
      },
    ],
  },

  {
    id: 'a4-landscape-event-poster',
    name: 'Event Poster',
    nameJa: 'イベントポスター',
    descriptionJa: '会場掲示・SNS共有両方に対応したイベント告知ポスター。日時・場所・参加方法を大きく、インパクトある横型A4で。',
    format: 'a4-landscape',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['creative-voltage', 'neon-cyber'],
    slideCount: 1,
    tags: ['ポスター', 'イベント', '告知', '印刷', 'A4横'],
    icon: 'fa-solid fa-calendar',
    category: 'marketing',
    generationContext: 'Community running event "Midori Run 2026" organized by running club. Half marathon (21km) and 5km fun run categories. Date: May 17, 2026, Sunday. Start: 7:00 AM at Yoyogi Park. Entry fee: Half marathon 4,000 yen, 5km 1,500 yen. Capacity: 500 runners. Medal for all finishers. Registration deadline April 30.',
    slides: [
      {
        title: 'イベントポスター',
        layout: 'single-design',
        prompt: 'Design a horizontal A4 (3508x2480) event poster for running event "Midori Run 2026". Bold, energetic poster design split into two visual zones. Left zone (40%): Event name "MIDORI RUN 2026" in massive bold typography with running icon. Category badges: ハーフマラソン 21km / ファンラン 5km. Right zone (60%): Event details in structured info block - 日時: 2026年5月17日（日）/ スタート 7:00, 場所: 代々木公園 スタート, Entry: ハーフ ¥4,000 / 5km ¥1,500, 定員: 500名, 特典: 全完走者にメダル贈呈. Deadline badge: "エントリー締切 4/30". Bold signal aesthetic with athletic energy, greens and strong contrast.',
      },
    ],
  },

  {
    id: 'instagram-story-afterparty',
    name: 'Event Report',
    nameJa: 'イベントレポート',
    descriptionJa: 'イベント・パーティー開催後のレポート・振り返り投稿。参加人数・ハイライトシーンをストーリー形式で伝える。',
    format: 'instagram-story',
    suggestedStylePreset: 'split-pastel',
    alternativeStylePresets: ['creative-voltage', 'vintage-editorial'],
    slideCount: 1,
    tags: ['イベントレポート', '振り返り', 'Instagram', 'アフターパーティー'],
    icon: 'fa-solid fa-camera',
    category: 'marketing',
    generationContext: 'Pop-up art event "Chromatic Pop-Up Gallery" in Shibuya completed successfully. 3-day event, 680 attendees, 28 artists exhibited, 42 artworks sold. Instagram-worthy photo spots drove massive social sharing. 350+ unique hashtag posts. Thank you to all visitors, artists, and sponsors.',
    slides: [
      {
        title: 'イベントレポート',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story event report for "Chromatic Pop-Up Gallery". Warm thank-you celebration design. Header: "EVENT REPORT / イベントレポート" with camera icon. Thank-you hero text: "ご来場ありがとうございました！". Stats in celebration card format: 来場者数 680名 / 出展アーティスト 28名 / 販売作品数 42点 / Instagram投稿数 350+. Highlight text: "3日間、多くの方々に作品と出会っていただけました。". Sponsor thanks: "スポンサー・ボランティアの皆さまに心より感謝申し上げます". Hashtag: "#ChromaticGallery2026". Teaser: "次回開催もお楽しみに！". Split pastel warm tones celebrating success.',
      },
    ],
  },
];
