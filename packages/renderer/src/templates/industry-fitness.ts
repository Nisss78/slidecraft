import type { BuiltInTemplate } from '../template-catalog.js';

export const FITNESS_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'instagram-post-gym-class',
    name: 'Gym Class Schedule',
    nameJa: 'ジムクラス案内',
    descriptionJa: 'フィットネスジムのグループクラス・スタジオプログラムを告知するInstagram投稿。時間・難易度・定員を見やすく。',
    format: 'instagram-post',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['electric-studio', 'neon-cyber'],
    slideCount: 1,
    tags: ['ジム', 'フィットネス', 'クラス', 'スタジオ', 'Instagram'],
    icon: 'fa-solid fa-dumbbell',
    category: 'marketing',
    generationContext: 'Fitness gym "Iron & Flow Studio" in Osaka. New class lineup: Monday 7:00 Morning HIIT (45min, all levels, 15 spots), Wednesday 19:30 Yoga Flow (60min, beginner-friendly, 20 spots), Friday 12:00 Lunch Pilates (30min, intermediate, 12 spots), Saturday 10:00 Kickboxing (60min, all levels, 10 spots). Book via app or reception.',
    slides: [
      {
        title: 'ジムクラス案内',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram post for fitness studio "Iron & Flow Studio" in Osaka. Bold, energetic class schedule card. Header: "クラス一覧 / Class Schedule" with dumbbell icon. Schedule grid with 4 classes in rows: 月曜 7:00 朝活HIIT (45分 / 全レベル / 残15席), 水曜 19:30 Yoga Flow (60分 / 初心者OK / 残20席), 金曜 12:00 ランチピラティス (30分 / 中級 / 残12席), 土曜 10:00 キックボクシング (60分 / 全レベル / 残10席). Each row with intensity indicator dots. CTA: "アプリまたは受付でご予約を". Bold signal style with strong red/black contrast and athletic energy.',
      },
    ],
  },

  {
    id: 'instagram-story-trainer-intro',
    name: 'Trainer Introduction',
    nameJa: 'トレーナー紹介',
    descriptionJa: 'パーソナルトレーナーやインストラクターのプロフィール紹介をするInstagramストーリー。資格・専門分野・予約導線を掲載。',
    format: 'instagram-story',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['bold-signal', 'creative-voltage'],
    slideCount: 1,
    tags: ['トレーナー', 'パーソナルトレーニング', 'フィットネス', 'Instagram'],
    icon: 'fa-solid fa-person-running',
    category: 'marketing',
    generationContext: 'Personal trainer Keita Watanabe at "Peak Performance Gym" in Fukuoka. Certified: NSCA-CPT, Functional Movement Specialist. Specialties: muscle building, fat loss, athletic performance. 8 years experience, 200+ clients. Success story: helped client lose 15kg in 6 months. Available Mon, Wed, Fri, Sat. Trial session 5,000 yen.',
    slides: [
      {
        title: 'トレーナー紹介',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story trainer profile for "Peak Performance Gym" in Fukuoka. Trainer profile card: Name "渡辺 啓太 トレーナー" with large photo placeholder area (top 40%). Profile info section: NSCA-CPT資格 / ファンクショナルムーブメント専門. Specialties badges: 筋肥大 / 脂肪燃焼 / 競技パフォーマンス向上. Experience: 8年 / 200名以上のクライアント. Success story highlight: "6ヶ月でー15kgを達成したクライアントも！". Availability: 月・水・金・土. Trial CTA: "体験セッション ¥5,000" in prominent button style. Electric studio aesthetic with vivid accent and sport photography feel.',
      },
    ],
  },

  {
    id: 'instagram-post-workout-menu',
    name: 'Workout Menu',
    nameJa: 'トレーニングメニュー',
    descriptionJa: '自宅や外出先でできるトレーニングメニューを紹介するInstagram投稿。フォロワーに価値ある情報を提供する教育コンテンツ。',
    format: 'instagram-post',
    suggestedStylePreset: 'neon-cyber',
    alternativeStylePresets: ['bold-signal', 'electric-studio'],
    slideCount: 1,
    tags: ['トレーニング', '筋トレ', '自宅ワークアウト', 'フィットネス', 'Instagram'],
    icon: 'fa-solid fa-clipboard-list',
    category: 'education',
    generationContext: 'Home workout by "FitLife Japan" trainer Yuki Sato. Full body 20-minute workout, no equipment needed. Routine: Warm-up 3 min jumping jacks, 3 rounds of: 20 squats, 15 push-ups, 30-sec plank, 10 lunges per leg, 20 mountain climbers. Cool-down 3 min stretching. Rest 30 seconds between exercises.',
    slides: [
      {
        title: 'トレーニングメニュー',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram workout card from "FitLife Japan". Title: "器具なし！20分全身ワークアウト". Header with stopwatch icon and "HOME WORKOUT" label. Workout structure card: ウォームアップ 3分 (ジャンピングジャック). 3ラウンド circuit list with reps: スクワット ×20, プッシュアップ ×15, プランク 30秒, ランジ ×10(両脚), マウンテンクライマー ×20. Rest note: 各セット間 30秒休憩. クールダウン 3分. Total badge: "合計20分 / 全身". Trainer credit: "by 佐藤 友紀トレーナー". Neon-cyber aesthetic with electric green on dark background for high-energy workout feel.',
      },
    ],
  },

  {
    id: 'instagram-story-gym-campaign',
    name: 'Gym Campaign',
    nameJa: 'ジム入会キャンペーン',
    descriptionJa: 'フィットネスジムの入会キャンペーン・初月無料などの特典を告知するInstagramストーリー。申し込み締切を明示して緊急性を演出。',
    format: 'instagram-story',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['bold-signal', 'electric-studio'],
    slideCount: 1,
    tags: ['キャンペーン', 'ジム', '入会', 'フィットネス', 'Instagram'],
    icon: 'fa-solid fa-fire',
    category: 'marketing',
    generationContext: 'Gym "Body Republic" in Sapporo running spring membership campaign. Offer: Join in April = first month free (normally 8,800 yen/month), no enrollment fee (normally 11,000 yen), free personal training session (normally 5,000 yen). Total savings of 24,800 yen. Offer valid until April 30. Limited spots (first 30 members).',
    slides: [
      {
        title: 'ジム入会キャンペーン',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story gym campaign for "Body Republic" in Sapporo. Explosive campaign design: "春の入会キャンペーン！" header with fire icon. Main offer boxes: 1ヶ月会費 無料 (通常¥8,800), 入会金 0円 (通常¥11,000), 体験トレーニング 無料 (通常¥5,000). Total savings highlight: "合計 ¥24,800 お得！" in giant number. Urgency elements: 先着30名様 limited badge + "4月30日まで" countdown style. CTA: "今すぐ申し込む！" bold button. Creative voltage style with explosive energy, bold typography, and electric accent colors.',
      },
    ],
  },

  {
    id: 'a5-fitness-program',
    name: 'Fitness Program (2 pages)',
    nameJa: 'フィットネスプログラム(2P)',
    descriptionJa: '4週間のフィットネスプログラム計画をA5縦で印刷して渡す。週次メニュー・食事指導・進捗記録欄を含む。',
    format: 'a5',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['notebook-tabs', 'bold-signal'],
    slideCount: 2,
    tags: ['フィットネスプログラム', '印刷', 'A5', 'トレーニング計画'],
    icon: 'fa-solid fa-calendar-days',
    category: 'personal',
    generationContext: '4-week beginner fitness program from "ActiveBody Studio". Goal: build exercise habit and lose 2kg. Week 1-2: 3x/week basics (20 min walk + bodyweight), Week 3-4: increase to 4x/week (add resistance training). Daily caloric target 1800 kcal. Track: weight, waist, daily exercise checkboxes.',
    slides: [
      {
        title: '4週間プログラム計画',
        layout: 'single-design',
        prompt: 'Design an A5 portrait (1748x2480) fitness program handout page 1 from "ActiveBody Studio". Title: "4週間フィットネスプログラム". Goal: 体重-2kg / 運動習慣の定着. Program overview table: Week 1-2 (基礎期): 週3回 ウォーキング20分+自重トレーニング. Week 3-4 (強化期): 週4回 抵抗トレーニング追加. Daily calorie target: 1,800kcal. Weekly schedule grid showing training days vs rest days. Key principles section with 3 icons: 継続性 / 段階的負荷 / 十分な休息. Swiss-modern clean grid layout suitable for printing.',
      },
      {
        title: '進捗記録シート',
        layout: 'single-design',
        prompt: 'Design an A5 portrait (1748x2480) fitness program tracking sheet page 2 for "ActiveBody Studio". Title: "進捗記録シート". Weekly tracking table with columns: 週 / 体重 / ウエスト / 今週の感想. Rows for Week 1-4 with blank fill-in fields. Daily checklist section: 4-week calendar grid (Mon-Sun x 4 weeks) with small checkboxes for marking completed workouts. Habit tracker rows: 水2L飲んだ / 野菜摂れた / 7時間睡眠. Motivational quote at bottom: "小さな積み重ねが大きな変化を生む". Clean, functional worksheet design with ruled lines and checkbox elements.',
      },
    ],
  },
];
