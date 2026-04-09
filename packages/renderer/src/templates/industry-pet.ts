import type { BuiltInTemplate } from '../template-catalog.js';

export const PET_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'instagram-post-petshop-newpet',
    name: 'Pet Shop New Arrival',
    nameJa: 'ペットショップ新着',
    descriptionJa: 'ペットショップの新着ペット・動物を紹介するInstagram投稿。種類・性格・価格・問い合わせ方法を可愛らしく伝える。',
    format: 'instagram-post',
    suggestedStylePreset: 'pastel-geometry',
    alternativeStylePresets: ['split-pastel', 'dark-botanical'],
    slideCount: 1,
    tags: ['ペットショップ', '新着', 'ペット', 'Instagram'],
    icon: 'fa-solid fa-paw',
    category: 'marketing',
    generationContext: 'Pet shop "Paws & Whiskers" in Nakameguro. New arrivals: 3 French Bulldog puppies (2 brindle, 1 cream), 8 weeks old, health checked, vaccinated, microchipped. Pedigree certified. Price from 380,000 yen. Financing available. Visit by appointment only.',
    slides: [
      {
        title: 'ペットショップ新着',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram pet shop new arrival post for "Paws & Whiskers" in Nakameguro. Adorable, warm design with paw print motifs. Header: "NEW ARRIVAL / 新着入荷！" with paw icon. Pet listing: フレンチブルドッグ 子犬 (生後8週). Count badges: ブリンドル 2頭 / クリーム 1頭. Health info icons: ワクチン済 / マイクロチップ / 血統書付き. Age: 生後8週. Price: ¥380,000〜. Financing badge: ローン対応可. Visit info: 要予約 / 中目黒駅徒歩5分. Contact: "ご見学予約はDMまたは電話で". Pastel geometry with warm cream and terracotta tones evoking warmth and love for animals.',
      },
    ],
  },

  {
    id: 'instagram-story-grooming-ba',
    name: 'Grooming Before & After',
    nameJa: 'トリミングビフォーアフター',
    descriptionJa: 'トリミングサロンのビフォーアフターを紹介するInstagramストーリー。技術力と変身感で新規顧客を引きつける。',
    format: 'instagram-story',
    suggestedStylePreset: 'split-pastel',
    alternativeStylePresets: ['pastel-geometry', 'dark-botanical'],
    slideCount: 1,
    tags: ['トリミング', 'ビフォーアフター', 'ペット', 'Instagram'],
    icon: 'fa-solid fa-wand-magic-sparkles',
    category: 'marketing',
    generationContext: 'Dog grooming salon "Fluffy & Fresh" in Setagaya-ku. Showcase: Toy Poodle named Mochi, 3 years old. Before: overgrown, matted coat. After: teddy bear cut, perfectly trimmed. Grooming service time: 2 hours. Price: standard grooming + teddy bear style 8,500 yen. Mochi\'s owner gave 5-star review.',
    slides: [
      {
        title: 'トリミングビフォーアフター',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story grooming before-and-after for "Fluffy & Fresh" salon in Setagaya-ku. Split panel design: Top half "BEFORE" section with label and dog photo placeholder (overgrown), bottom half "AFTER" section with label and dog photo placeholder (beautiful teddy bear cut). Dog: もちちゃん (トイプードル / 3歳). Service: テディベアカット. Price: ¥8,500. Time: 施術時間 約2時間. Customer review quote: "こんなに可愛くなって、もちもありがとうとお礼を言いそう！★★★★★". CTA: "ご予約はDMまたはホームページから". Salon handle "@fluffy.fresh.setagaya". Pastel split-tone design with soft pink and mint on warm white.',
      },
    ],
  },

  {
    id: 'instagram-post-vet-info',
    name: 'Veterinary Clinic Info',
    nameJa: '動物病院案内',
    descriptionJa: '動物病院の診療案内・診療時間・得意分野を伝えるInstagram投稿。地域のペット飼い主に信頼される情報発信。',
    format: 'instagram-post',
    suggestedStylePreset: 'swiss-modern',
    alternativeStylePresets: ['pastel-geometry', 'split-pastel'],
    slideCount: 1,
    tags: ['動物病院', '獣医', 'ペット', 'Instagram'],
    icon: 'fa-solid fa-shield-dog',
    category: 'marketing',
    generationContext: 'Veterinary clinic "Midori Animal Hospital" in Koenji. Specialties: internal medicine, surgery, dentistry, dermatology for dogs and cats. Dr. Midori Hayashi (15 years experience). Hours: Mon-Sat 9:00-12:00, 15:00-18:00, Sunday 9:00-12:00 only. Emergency contact available for existing patients. Online appointment system.',
    slides: [
      {
        title: '動物病院案内',
        layout: 'single-design',
        prompt: 'Design a square (1080x1080) Instagram post for "みどり動物病院" in Koenji. Clean, trustworthy veterinary clinic card. Clinic name with shield-dog icon in caring, professional design. Doctor: 院長 林 みどり 獣医師 (経験15年). Specialties grid with small icons: 内科 / 外科 / 歯科 / 皮膚科. Patients: 犬 / 猫. Schedule: 月〜土 9:00-12:00 / 15:00-18:00, 日曜 9:00-12:00のみ. Feature badges: Web予約対応 / 往診相談可. Existing patient emergency note: "既存患者様の緊急連絡対応あり". CTA: "WEB予約 → プロフィールURL". Swiss-modern clean style with teal/green medical palette.',
      },
    ],
  },

  {
    id: 'instagram-story-pet-health-tip',
    name: 'Pet Health Tip',
    nameJa: 'ペット健康豆知識',
    descriptionJa: '獣医師・ペット専門家が教えるペットの健康管理豆知識をInstagramストーリーで発信。フォロワーの信頼構築に役立つ教育コンテンツ。',
    format: 'instagram-story',
    suggestedStylePreset: 'dark-botanical',
    alternativeStylePresets: ['pastel-geometry', 'split-pastel'],
    slideCount: 1,
    tags: ['ペット', '健康', '豆知識', 'Instagram', '教育'],
    icon: 'fa-solid fa-notes-medical',
    category: 'education',
    generationContext: 'Pet health tip from veterinary clinic "Sunny Paws Vet". Topic: 5 early warning signs that your dog may be unwell that owners often miss. Signs: reduced appetite for over 24 hours, excessive drinking/urination, lethargy or hiding, changes in stool/urine color, persistent licking of one area. Advice: when in doubt, consult your vet.',
    slides: [
      {
        title: 'ペット健康豆知識',
        layout: 'single-design',
        prompt: 'Design a vertical (1080x1920) Instagram Story pet health education card from "Sunny Paws Vet". Title: "愛犬からのSOSサイン 見逃していませんか？" with medical notes icon. Health warning signs list with paw-print bullet points: 1. 24時間以上の食欲不振, 2. 水をがぶ飲み・頻尿, 3. ぐったりしている・隠れている, 4. 便や尿の色の変化, 5. 同じ場所を繰り返しなめる. Each sign has brief 1-line explanation. Advice box: "少しでも様子がおかしいと思ったら、早めにご相談ください". Bottom CTA: "Sunny Paws Vet / 獣医師監修". Contact info area. Dark botanical design with rich forest green and gentle plant motifs suggesting natural care and expertise.',
      },
    ],
  },
];
