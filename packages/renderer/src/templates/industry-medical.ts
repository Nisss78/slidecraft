import type { BuiltInTemplate } from '../template-catalog.js';

export const MEDICAL_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'instagram-post-clinic-info',
    name: 'Clinic Information',
    nameJa: '診療案内',
    descriptionJa: 'クリニックの診療科目・診療時間・アクセスをわかりやすく伝えるInstagram投稿。新患獲得に役立つ基本情報発信。',
    format: 'instagram-post',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['swiss-modern', 'split-pastel'],
    slideCount: 1,
    tags: ['クリニック', '診療案内', '医療', '病院', 'Instagram'],
    icon: 'fa-solid fa-stethoscope',
    category: 'marketing',
    generationContext: 'Internal medicine and dermatology clinic "Midori Clinic" in Koenji, Tokyo. Services: Internal medicine, dermatology, allergy. Hours: Mon-Fri 9:00-12:30, 15:00-18:30. Saturday 9:00-12:30. Closed Sunday and national holidays. Access: 2 min walk from Koenji Station south exit. Online reservations available via website.',
    slides: [
      {
        title: '診療案内',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram post for "みどりクリニック" in Koenji. Clean, trustworthy medical information card. Clinic name with cross icon (fa-solid fa-cross or plus symbol in medical style). Departments section: 内科 / 皮膚科 / アレルギー科 with small icons. Schedule grid: 月〜金 9:00-12:30 / 15:00-18:30, 土曜 9:00-12:30, 日・祝 休診. Access: 高円寺駅 南口 徒歩2分. Feature badge: "WEB予約対応". Pastel teal/mint and white color scheme suggesting cleanliness and health. Structured, readable layout with ample white space.',
      },
    ],
  },

  {
    id: 'instagram-story-health-tip',
    name: 'Health Tip Card',
    nameJa: '健康情報カード',
    descriptionJa: 'クリニックや医療機関が発信する健康情報・予防医療の豆知識をわかりやすく伝えるInstagramストーリー。',
    format: 'instagram-story',
    suggestedStylePreset: 'split-pastel',
    alternativeStylePresets: ['pastel-geometry', 'swiss-modern'],
    slideCount: 1,
    tags: ['健康', '医療', '予防', 'ヘルスケア', 'Tips', 'Instagram'],
    icon: 'fa-solid fa-heart-pulse',
    category: 'education',
    generationContext: 'Health tip from internal medicine specialist at "Sunrise Medical Clinic". Topic: 5 early signs of lifestyle-related diseases that are often overlooked. Signs: persistent fatigue, increased urination frequency, blurry vision after meals, slow-healing wounds, numbness in hands/feet. Call to action: annual health checkup.',
    slides: [
      {
        title: '健康情報カード',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story health education card from "Sunrise Medical Clinic". Title: "見逃しがちな生活習慣病の5つのサイン" with doctor/medical icon. List 5 warning signs with check/warning icons: 1. 原因不明の倦怠感が続く, 2. トイレの回数が増えた, 3. 食後に視界がぼやける, 4. 傷が治りにくくなった, 5. 手足のしびれ・冷え. Each sign has a brief explanation in smaller text. Call to action section: "気になるサインがある方へ / 年に一度の健康診断を忘れずに". Bottom: "Sunrise Medical Clinic / 内科専門医監修". Split pastel design with mint and peach tones suggesting medical care.',
      },
    ],
  },

  {
    id: 'instagram-story-clinic-hours',
    name: 'Clinic Closed Notice',
    nameJa: '休診日のお知らせ',
    descriptionJa: '年末年始・お盆・臨時休診などの休診日を患者さんに告知するInstagramストーリー。緊急連絡先も掲載。',
    format: 'instagram-story',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['pastel-geometry', 'split-pastel'],
    slideCount: 1,
    tags: ['休診', 'お知らせ', 'クリニック', '医療', 'Instagram'],
    icon: 'fa-solid fa-calendar-xmark',
    category: 'marketing',
    generationContext: 'Orthopedic clinic "Sakura Ortho Clinic" in Saitama. Year-end holiday closure: December 29 to January 4. Regular services resume January 5. Emergency: nearby emergency hospital Saitama City Hospital (048-XXX-XXXX). Online appointments remain open for January and later.',
    slides: [
      {
        title: '休診日のお知らせ',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story closure notice for "さくら整形外科クリニック" in Saitama. Clean, important-information layout. Large "休診のお知らせ" header with calendar-x icon. Closure period prominently displayed: "12月29日（日）〜 1月4日（土）" in large typography with box highlight. Resume notice: "1月5日（日）より通常診療" in positive color. Emergency info section: "急患の方は / 埼玉市立病院 / 048-XXX-XXXX" with phone icon. Positive note: "ウェブ予約は引き続き受け付けております". Clinic name at bottom. Clean Swiss-modern style with clear hierarchy for medical communication.',
      },
    ],
  },

  {
    id: 'a4-clinic-brochure',
    name: 'Clinic Guide Brochure (2 pages)',
    nameJa: 'クリニック案内パンフ(2P)',
    descriptionJa: 'クリニックの待合室設置・患者様配布用の案内パンフレット。診療方針・スタッフ紹介・よくある質問を掲載。',
    format: 'a4',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['swiss-modern', 'split-pastel'],
    slideCount: 2,
    tags: ['パンフレット', 'クリニック', '医療', '印刷', 'A4'],
    icon: 'fa-solid fa-hospital',
    category: 'marketing',
    generationContext: 'Pediatric and internal medicine clinic "Hoshino Child & Family Clinic" in Yokohama. Dr. Hoshino Kenji (board certified pediatrician, 20 years experience). Philosophy: family-centered care, holistic approach. Services include: well-child visits, vaccinations, allergy testing, minor surgery, health checkups. 4 staff nurses.',
    slides: [
      {
        title: 'ご挨拶・診療方針',
        layout: 'single-design',
        prompt: 'Design an A4 portrait (2480x3508) clinic brochure page 1 for "星野こども・ファミリークリニック" in Yokohama. Welcoming, family-friendly design. Page includes: Welcome section with clinic exterior image placeholder. Doctor profile: 院長 星野健二 (小児科専門医 / 経験20年) with brief bio. Clinic philosophy box: "かかりつけ医として、お子様から大人まで家族ごと診る地域密着の総合診療を実践します". Services grid with icons: 乳幼児健診 / ワクチン接種 / アレルギー検査 / 小外科 / 健康診断. Pastel teal and soft coral palette with child-friendly design elements.',
      },
      {
        title: 'よくある質問・アクセス',
        layout: 'single-design',
        prompt: 'Design an A4 portrait (2480x3508) clinic brochure page 2 for "星野こども・ファミリークリニック". FAQ section with Q&A format: Q1: 予約なしで受診できますか？ A: 当日予約を優先しておりますが、飛び込みも受け付けます / Q2: 紹介状なしで来院できますか？ A: 不要です。初診の方も直接お越しください / Q3: 乳幼児の健診は何歳まで対応？ A: 0歳〜中学生まで. Vaccination schedule table for children. Access map placeholder: 横浜市青葉区 / 青葉台駅 徒歩5分. Contact info: TEL & web. Hours table. Nurse team icons: スタッフ一同お待ちしております.',
      },
    ],
  },

  {
    id: 'instagram-post-dental-campaign',
    name: 'Dental Checkup Campaign',
    nameJa: '歯科検診キャンペーン',
    descriptionJa: '歯科クリニックの定期検診・ホワイトニングキャンペーンを告知するInstagram投稿。特別価格と予約導線を明確に。',
    format: 'instagram-post',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['bold-signal', 'electric-studio'],
    slideCount: 1,
    tags: ['歯科', 'キャンペーン', '検診', 'ホワイトニング', 'Instagram'],
    icon: 'fa-solid fa-tooth',
    category: 'marketing',
    generationContext: 'Dental clinic "Smile Studio Dental" in Shinjuku. Spring campaign: Free dental checkup + X-ray during April. Also offering 30% off professional teeth whitening for new patients this month. Online booking through website. Clinic has latest equipment, multilingual staff.',
    slides: [
      {
        title: '歯科検診キャンペーン',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram campaign post for "Smile Studio Dental" in Shinjuku. Campaign: "春の歯の健康キャンペーン！". Two offer blocks with high impact: Offer 1: "初回検診 + レントゲン 無料" with FREE badge / 4月中. Offer 2: "ホワイトニング 30% OFF" for 初診患者様 with discount badge. Visual element: large tooth icon or smile graphic as design anchor. Campaign period: "4月1日〜30日". Key features: 最新機器完備 / 多言語対応スタッフ / 完全予約制. CTA: "今すぐWEB予約！" with button visual. Creative, energetic design with bright campaign feel.',
      },
    ],
  },
];
