import type { BuiltInTemplate } from '../template-catalog.js';

export const EDUCATION_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'instagram-post-juku-recruit',
    name: 'Cram School Recruitment',
    nameJa: '塾 生徒募集',
    descriptionJa: '学習塾・予備校の生徒募集告知。合格実績・指導方針・無料体験のご案内をインパクトある形で発信。',
    format: 'instagram-post',
    suggestedStylePreset: 'bold-signal',
    alternativeStylePresets: ['electric-studio', 'creative-voltage'],
    slideCount: 1,
    tags: ['塾', '予備校', '生徒募集', '教育', 'Instagram'],
    icon: 'fa-solid fa-graduation-cap',
    category: 'marketing',
    generationContext: 'Cram school "Akatsuki Academy" in Nerima-ku, Tokyo. Enrolling new students for April. Track record: 98% of students improved grades, 15 students passed top high school entrance exams last year. Subjects: Math, English, Science. Individualized curriculum for each student. Free trial lesson available. Small class sizes (max 6 students per group).',
    slides: [
      {
        title: '塾 生徒募集',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram post for cram school "暁アカデミー" in Nerima-ku. Bold, motivational design targeting parents and students. Large headline: "4月生 募集開始！" with graduation cap icon. Achievement badges: 成績向上率 98%, 難関校合格 15名, クラス定員6名. Subject badges: 数学 / 英語 / 理科. Key selling point: "一人ひとりに合わせたカリキュラム設計". Free trial CTA: "無料体験授業 受付中" with call-to-action button visual. Contact: 電話 or LINE. Bold signal style with strong red/navy color contrast for educational authority.',
      },
    ],
  },

  {
    id: 'instagram-story-class-schedule',
    name: 'Class Schedule',
    nameJa: '授業スケジュール',
    descriptionJa: '今週・今月の授業スケジュール・イベントを告知するInstagramストーリー。生徒・保護者への定期的な情報発信に。',
    format: 'instagram-story',
    suggestedStylePreset: 'notebook-tabs',
    alternativeStylePresets: ['swiss-modern', 'pastel-geometry'],
    slideCount: 1,
    tags: ['スケジュール', '授業', '塾', '教育', 'Instagram'],
    icon: 'fa-solid fa-chalkboard-user',
    category: 'education',
    generationContext: 'English language school "Nova English Academy" weekly schedule. Week of April 14-19. Classes: Monday 19:00 Business English, Tuesday 10:00 Morning Conversation, Wednesday 19:00 TOEIC Prep, Thursday 19:00 Grammar Intensive, Saturday 10:00 Kids English, Saturday 14:00 Beginner Speaking. Special: Thursday free workshop "Job Interview English" 18:00.',
    slides: [
      {
        title: '授業スケジュール',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story weekly class schedule for "Nova English Academy". Title: "今週の授業スケジュール (4/14-19)" with calendar icon. Schedule list in clean timetable format: 月曜 19:00 ビジネス英語, 火曜 10:00 朝活英会話, 水曜 19:00 TOEIC対策, 木曜 19:00 文法集中講座, 土曜 10:00 キッズ英語, 土曜 14:00 初心者スピーキング. Highlighted special event box: "木曜 18:00 無料ワークショップ / 面接英語対策 先着10名". CTA: "体験レッスン随時受付中 / DM・HPよりご予約". Notebook/academic style with ruled lines and tab accent colors.',
      },
    ],
  },

  {
    id: 'a4-report-card',
    name: 'Grade Report (2 pages)',
    nameJa: '成績報告書(2P)',
    descriptionJa: '生徒の成績・学習状況を保護者に報告するA4縦2ページの成績報告書。教科別成績・コメント・今後の方針を掲載。',
    format: 'a4',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['notebook-tabs', 'bold-signal'],
    slideCount: 2,
    tags: ['成績報告書', '教育', '印刷', 'A4', '学習状況'],
    icon: 'fa-solid fa-chart-bar',
    category: 'education',
    generationContext: 'Student progress report from "Sunrise Juku" for student Haruki Yamamoto (6th grade). Subjects: Japanese 85/100 (up 8 from previous), Math 72/100 (up 5), Science 90/100 (up 12 - excellent), Social Studies 78/100, English 68/100 (needs improvement). Overall comments: Excellent improvement in science, encouraging steady growth. Next focus: English vocabulary building.',
    slides: [
      {
        title: '成績概要',
        layout: 'single-design',
        prompt: 'Design an A4 portrait (2480x3508) student grade report page 1 for "サンライズ塾". Header: school name, report title "学習状況報告書", 生徒名: 山本 春希 (小学6年生), 報告期間: 2026年1〜3月. Grade summary table: 国語 85点 (前回比+8), 算数 72点 (+5), 理科 90点 (+12) with 優秀マーク, 社会 78点, 英語 68点 with 要強化マーク. Visual progress bar chart for each subject. Overall assessment rating boxes. Clean, structured academic document style in Swiss-modern layout.',
      },
      {
        title: '担任コメント・今後の方針',
        layout: 'single-design',
        prompt: 'Design an A4 portrait (2480x3508) student grade report page 2 for "サンライズ塾". Teacher comment section: "山本君は今期、特に理科において目覚ましい成長を見せてくれました。実験への積極的な姿勢が成果につながっています。英語は語彙力の強化が次のステップです。" Next period learning plan: 重点科目: 英語 (単語力強化 + リーディング), 継続強化: 理科 (応用問題へ挑戦). Recommended study hours: 平日 90分 / 休日 2時間. Parent communication section with blank signature area. Next meeting date placeholder. School seal area. Professional academic document formatting.',
      },
    ],
  },

  {
    id: 'instagram-post-exam-results',
    name: 'Exam Results',
    nameJa: '合格実績',
    descriptionJa: '入試・資格試験の合格実績を発表するInstagram投稿。塾・スクールの実績アピールと信頼感の向上に。',
    format: 'instagram-post',
    suggestedStylePreset: 'electric-studio',
    alternativeStylePresets: ['bold-signal', 'creative-voltage'],
    slideCount: 1,
    tags: ['合格実績', '入試', '塾', '教育', 'Instagram'],
    icon: 'fa-solid fa-trophy',
    category: 'marketing',
    generationContext: 'University exam results from prep school "Peak Seminar" for 2026. Results: Tokyo University 3 students, Keio University 8 students, Waseda University 12 students, Other top national universities 15 students. Total 38 students accepted to top-tier universities. 95% of students achieved their target schools.',
    slides: [
      {
        title: '合格実績',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram post announcing exam results for prep school "Peak Seminar". Celebratory design: Header "2026年度 大学合格実績" with trophy icon. Results in prominent cards: 東京大学 3名, 慶應義塾大学 8名, 早稲田大学 12名, その他国公立 15名 with star/medal graphics. Big headline statistic: "志望校合格率 95%" as the hero number. Success message: "今年度も多くの生徒が目標を達成しました！". Motivational note: "来年度の合格を一緒に目指しましょう". Electric studio style with achievement energy and gold accent colors.',
      },
    ],
  },

  {
    id: '4:3-workshop-material',
    name: 'Workshop Material (5 pages)',
    nameJa: 'ワークショップ教材(5P)',
    descriptionJa: 'セミナー・ワークショップ用の配布教材。表紙・内容・ワークシートをスタンダードな4:3比率で作成。',
    format: '4:3',
    suggestedStylePreset: 'notebook-tabs',
    alternativeStylePresets: ['swiss-modern', 'creative-voltage'],
    slideCount: 5,
    tags: ['ワークショップ', '教材', 'セミナー', '4:3', '教育'],
    icon: 'fa-solid fa-book',
    category: 'education',
    generationContext: 'Workshop: "Time Management for Professionals" by productivity consultant Akiko Mori. Duration: 2 hours. Attendees: 20 working adults. Contents: Understanding your time patterns, 4 quadrant priority system, daily planning template, 5 common time traps and solutions, action planning worksheet.',
    slides: [
      {
        title: '表紙',
        layout: 'title',
        prompt: 'Create a 4:3 (1024x768) workshop material cover page for "プロフェッショナルのための時間管理術". Presenter: 生産性コンサルタント 森 明子. Workshop date/venue placeholder. Duration: 2時間. Visual: clean notebook/planning motif with agenda lines as design element. Table of contents preview: 1.自分の時間パターンを知る 2.優先順位の4象限 3.日次プランニング 4.時間泥棒を撃退 5.アクションプラン. Notebook-tabs style with academic warmth.',
      },
      {
        title: '時間パターン分析',
        layout: 'content',
        prompt: 'Create a 4:3 workshop slide on "あなたの時間パターンを知る". Content: Explain that understanding personal time patterns is the foundation of time management. Activity instruction: "過去1週間の時間の使い方を振り返り、以下のカテゴリに分類してください". Categories table: 仕事（集中業務）/ 会議・打ち合わせ / 移動 / 休憩・食事 / 個人的時間. Insight prompt: "最も無駄に感じた時間は何でしたか？". Notebook-tabs style with worksheet elements.',
      },
      {
        title: '4象限の優先順位',
        layout: 'two-column',
        prompt: 'Create a 4:3 workshop slide explaining "優先順位の4象限 (Eisenhower Matrix)". Two column visual: Left column shows the 2x2 matrix diagram with axes "緊急度 (高/低)" and "重要度 (高/低)". The 4 quadrants labeled: 第1象限 (緊急×重要) = 即対応, 第2象限 (重要×非緊急) = 計画的実行 ★最重要, 第3象限 (緊急×非重要) = 委任, 第4象限 (非緊急×非重要) = 削除. Right column: Examples for each quadrant with bullet points. Tip: "第2象限への投資が成功者の習慣". Notebook-tabs academic style.',
      },
      {
        title: '時間泥棒TOP5',
        layout: 'content',
        prompt: 'Create a 4:3 workshop slide on "よくある時間泥棒TOP5と対策". List 5 common time traps with problem + solution format: 1. メール・チャットの常時確認 → 確認時間を固定する(朝昼夕の3回), 2. 会議の目的不明確 → アジェンダ必須ルール, 3. 完璧主義による先延ばし → 80%完成で一旦提出, 4. 割り込みへの対応 → 集中ブロック時間の設定, 5. タスクの過小見積もり → バッファ時間20%追加. Each item has problem icon (warning) and solution icon (check). Notebook-tabs style with numbered list design.',
      },
      {
        title: 'アクションプランシート',
        layout: 'single-design',
        prompt: 'Create a 4:3 (1024x768) workshop action plan worksheet for attendees to fill in. Title: "マイ アクションプランシート". Worksheet sections with writing lines: 1. 今日から止める習慣 (1つ): _____________, 2. 今日から始める習慣 (1つ): _____________, 3. 第2象限に投資する時間 (週 __時間), 4. 来週の月曜日にやること: _______________, 5. 1ヶ月後の目標: _______________. Commitment statement with signature/date line: "私は上記の行動を実行することを約束します". Name/date blanks. Encouraging footer: "小さな一歩が大きな変化を生む". Professional worksheet design with clean ruled lines.',
      },
    ],
  },

  {
    id: 'instagram-story-online-lesson',
    name: 'Online Lesson Info',
    nameJa: 'オンライン授業案内',
    descriptionJa: 'オンライン授業・e-learningの開始・新コース案内をするInstagramストーリー。特徴・受講方法・料金を明確に。',
    format: 'instagram-story',
    suggestedStylePreset: 'creative-voltage',
    alternativeStylePresets: ['electric-studio', 'bold-signal'],
    slideCount: 1,
    tags: ['オンライン授業', 'e-learning', '教育', 'Instagram'],
    icon: 'fa-solid fa-laptop',
    category: 'marketing',
    generationContext: 'Online programming school "Code Spark" launching new beginner Python course. Duration: 8 weeks, 2 lessons per week (live Zoom). Price: 48,000 yen (includes lifetime access to recordings). Maximum 10 students per cohort. Starts May 1. Includes 1:1 mentoring sessions and community Slack access.',
    slides: [
      {
        title: 'オンライン授業案内',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story for online programming school "Code Spark" launching Python beginner course. Bold tech-education announcement: "Pythonプログラミング 初心者コース 開講！". Course details grid with icons: 期間 8週間 / 週2回ライブ授業 (Zoom), 定員 10名限定, 開講日 5月1日. Price badge: "¥48,000" with "録画見放題付き" subtext. Included features: 1対1メンタリング / Slackコミュニティ / 課題フィードバック. Urgency: "残り__席" (blank for customization). CTA: "今すぐ申し込む → プロフィールURL". Creative voltage style with code/tech aesthetic and bright electric accents.',
      },
    ],
  },
];
