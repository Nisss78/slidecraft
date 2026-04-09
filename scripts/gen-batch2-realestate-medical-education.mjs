import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { igPost, igStory, wideCard, docPage, presSlide, PRESETS, CANVAS, head, tail } from './html-gen.mjs';

const BASE = join(homedir(), '.slidecraft', 'decks');
async function saveDeck(deck, slidesHtml) {
  const deckDir = join(BASE, deck.id);
  await mkdir(join(deckDir, 'slides'), { recursive: true });
  await writeFile(join(deckDir, 'deck.json'), JSON.stringify(deck, null, 2));
  for (const [slideId, html] of Object.entries(slidesHtml)) {
    await writeFile(join(deckDir, 'slides', `${slideId}.html`), html);
  }
  console.log(`✓ ${deck.title} [${deck.id}]`);
}
function makeId() { return crypto.randomUUID().replace(/-/g, '').substring(0, 16); }
function now() { return new Date().toISOString(); }
function mkDeck(id, title, desc, slideArr, format, templateId) {
  return { id, title, description: desc, slides: slideArr.map((s, i) => ({ id: s.id, title: s.title, order: i })), createdAt: now(), updatedAt: now(), metadata: { canvasSize: format, templateId } };
}

// ─── REALESTATE 1: instagram-post-property-listing ───────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['swiss-modern'];
  const html = `${head('swiss-modern', 'instagram-post')}
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;padding:56px;position:relative">
  <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,${p.accent},${p.accent2})"></div>
  <div style="margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start">
    <div>
      <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${p.accent};font-weight:700">NEW LISTING</div>
      <div style="font-size:12px;opacity:.5;margin-top:2px">Minato Properties</div>
    </div>
    <div style="padding:6px 14px;background:${p.accent};color:white;font-size:13px;font-weight:700;border-radius:4px">FOR RENT</div>
  </div>
  <h1 style="font-family:'Archivo',sans-serif;font-size:40px;font-weight:900;margin:0 0 4px;line-height:1.15">南麻布<br>Terrace Residence</h1>
  <p style="font-size:15px;opacity:.5;margin:0 0 28px"><i class="fa-solid fa-location-dot" style="color:${p.accent};margin-right:6px"></i>東京都港区南麻布</p>
  <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
    ${[
      {icon:'fa-building', label:'間取り', value:'2LDK / 58㎡'},
      {icon:'fa-layer-group', label:'階数', value:'10階 / 南向き'},
      {icon:'fa-train', label:'アクセス', value:'麻布十番駅 徒歩3分'},
      {icon:'fa-calendar', label:'入居', value:'即入居可 / 築浅リノベ'},
    ].map(d => `<div style="display:flex;align-items:center;gap:14px;padding:12px 16px;background:${p.surface};border-radius:6px">
      <i class="fa-solid ${d.icon}" style="color:${p.accent};width:18px;text-align:center"></i>
      <span style="font-size:14px;opacity:.6;width:70px">${d.label}</span>
      <span style="font-size:15px;font-weight:600">${d.value}</span>
    </div>`).join('')}
  </div>
  <div style="display:flex;align-items:baseline;gap:8px;padding:20px 24px;background:${p.accent};color:white;border-radius:8px;margin-bottom:16px">
    <span style="font-size:44px;font-weight:900">¥250,000</span>
    <span style="font-size:16px;opacity:.8">/月 (管理費 ¥15,000)</span>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    ${['床暖房', 'オートロック', 'ペット可', 'シティビュー'].map(t => `<span style="padding:6px 12px;background:${p.surface};border:1px solid ${p.border};border-radius:4px;font-size:13px;font-weight:600;color:${p.accent2}">${t}</span>`).join('')}
  </div>
  <div style="margin-top:auto;padding-top:16px;border-top:1px solid ${p.border};font-size:13px;opacity:.5">詳細・内見のご相談はDMまで | Minato Properties</div>
</div>
${tail()}`;
  await saveDeck(mkDeck(did,'物件紹介カード','物件紹介Instagram投稿',[{id:sid,title:'物件紹介カード'}],'instagram-post','instagram-post-property-listing'),{[sid]:html});
}

// ─── REALESTATE 2: instagram-story-open-house ────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const html = igStory('bold-signal', {
    topLabel: 'OPEN HOUSE / オープンハウス開催！',
    icon: 'fa-solid fa-door-open',
    mainTitle: '世田谷区\n新築一戸建て',
    highlightBox: { label: '開催日時', value: '今週日曜日 10:00〜16:00' },
    items: [
      { label: '間取り: 4LDK', sub: '敷地105㎡ / 延床85㎡ / 2階建' },
      { label: '価格: 7,800万円', sub: 'お値引き相談可能' },
      { label: '三軒茶屋駅 徒歩8分', sub: '東急田園都市線' },
    ],
    note: '予約不要 (事前連絡歓迎) / ご来場の際は身分証をご持参ください',
    cta: '詳しくはDMまたはプロフィールURL',
    handle: 'Urban Nest Realty',
  });
  await saveDeck(mkDeck(did,'オープンハウス案内','オープンハウス告知Instagramストーリー',[{id:sid,title:'オープンハウス案内'}],'instagram-story','instagram-story-open-house'),{[sid]:html});
}

// ─── REALESTATE 3: a4-property-flyer (2 slides) ──────────────────────────────
{
  const did = makeId(); const s1 = makeId(), s2 = makeId();
  const slide1 = docPage('swiss-modern', 'a4', {
    logo: 'MINATO PROPERTIES',
    title: '白金パークレジデンス #803',
    subtitle: '東京都港区白金 — 売買物件',
    sections: [
      { heading: '物件概要', items: [
        { label: '価格', value: '9,200万円' }, { label: '間取り', value: '3LDK' },
        { label: '専有面積', value: '82.00㎡' }, { label: '築年', value: '2019年' },
        { label: '階数', value: '8階 (全15階建)' }, { label: '向き', value: '南東' },
        { label: 'バルコニー', value: '12.5㎡' },
      ]},
      { heading: '特徴・設備', items: [
        { label: 'ウォークインクローゼット' }, { label: '床暖房' },
        { label: 'ディスポーザー' }, { label: '24時間有人管理' },
      ]},
    ],
    footer: 'TEL: 03-XXXX-XXXX | 宅建業免許 東京都知事(X)第XXXXX号',
  });
  const slide2 = docPage('swiss-modern', 'a4', {
    logo: 'MINATO PROPERTIES',
    title: 'フロアプラン・アクセス',
    subtitle: '白金パークレジデンス #803',
    sections: [
      { heading: '間取り図', body: 'LDK 20.5帖 / 洋室A 7.5帖 / 洋室B 6.5帖 / 洋室C 5.5帖 / WIC / 浴室・洗面台 / バルコニー 12.5㎡' },
      { heading: 'アクセス', items: [
        { label: '白金高輪駅 (都営三田線・南北線)', value: '徒歩5分' },
        { label: '白金台駅 (都営三田線・南北線)', value: '徒歩7分' },
        { label: '品川駅 (JR・新幹線)', value: '自転車10分' },
      ]},
      { heading: '月額費用', items: [
        { label: '管理費', value: '¥28,000' },
        { label: '修繕積立金', value: '¥12,000' },
        { label: '合計', value: '¥40,000' },
      ]},
    ],
    footer: 'MINATO PROPERTIES | TEL: 03-XXXX-XXXX',
  });
  await saveDeck(mkDeck(did,'物件詳細チラシ(2P)','物件詳細A4縦2ページ',[{id:s1,title:'物件概要'},{id:s2,title:'フロアプラン・アクセス'}],'a4','a4-property-flyer'),{[s1]:slide1,[s2]:slide2});
}

// ─── REALESTATE 4: instagram-post-sold ───────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['electric-studio'];
  const html = `${head('electric-studio', 'instagram-post')}
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px;text-align:center;position:relative">
  <div style="position:absolute;inset:0;background:linear-gradient(135deg,${p.accent}10 0%,${p.accent2}08 100%)"></div>
  <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${p.accent}"></div>
  <div style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:${p.accent};font-weight:700;margin-bottom:20px">Urban Nest Realty</div>
  <div style="font-family:'Manrope',sans-serif;font-size:100px;font-weight:900;line-height:1;color:${p.accent};margin-bottom:8px">SOLD!</div>
  <h1 style="font-size:34px;font-weight:700;margin:0 0 24px">ご成約御礼</h1>
  <div style="padding:28px 36px;background:${p.surface};border-radius:12px;max-width:700px;text-align:left;margin-bottom:28px">
    <p style="font-size:18px;line-height:1.65;margin:0;opacity:.8">渋谷区の物件が掲載からわずか<strong style="color:${p.accent}">2週間</strong>で成約となりました。複数のお申込みをいただき、当初の価格を上回る条件での成約となりました。大阪からお引越しのご家族に、素晴らしい新生活のスタートをお祈りします。</p>
  </div>
  <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center">
    ${['#成約御礼', '#渋谷区', '#不動産', '#UrbanNestRealty'].map(t => `<span style="font-size:14px;color:${p.accent2};font-weight:600">${t}</span>`).join('')}
  </div>
</div>
${tail()}`;
  await saveDeck(mkDeck(did,'ご成約御礼','成約御礼Instagram投稿',[{id:sid,title:'ご成約御礼'}],'instagram-post','instagram-post-sold'),{[sid]:html});
}

// ─── REALESTATE 5: linkedin-post-market-report ───────────────────────────────
{
  const did = makeId(), sid = makeId();
  const html = wideCard('swiss-modern', 'linkedin-post', {
    eyebrow: 'Japan Property Analytics — Q1 2026 Market Report',
    icon: 'fa-solid fa-chart-line',
    title: '東京23区 不動産市況レポート',
    stats: [
      { value: '¥65,800/㎡', label: '平均坪単価 (+8.2% YoY)' },
      { value: '+12%', label: '成約件数 前年比' },
      { value: '95%', label: '都心賃貸 稼働率' },
      { value: '調整局面', label: '外周区 (金利影響)' },
    ],
    footer: 'Japan Property Analytics — 不動産調査レポート | 2026年Q1',
  });
  await saveDeck(mkDeck(did,'不動産マーケットレポート','不動産市況LinkedIn投稿',[{id:sid,title:'不動産マーケットレポート'}],'linkedin-post','linkedin-post-market-report'),{[sid]:html});
}

// ─── MEDICAL 1: instagram-post-clinic-info ───────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const html = igPost('pastel-geometry', {
    badge: '診療案内',
    title: 'みどり\nクリニック',
    subtitle: '高円寺駅 南口 徒歩2分',
    icon: 'fa-solid fa-stethoscope',
    items: [
      { label: '内科 / 皮膚科 / アレルギー科', price: '' },
      { label: '月〜金 9:00-12:30 / 15:00-18:30', price: '' },
      { label: '土曜 9:00-12:30', price: '' },
      { label: '日・祝 休診', price: '' },
    ],
    footer: 'WEB予約対応 | みどりクリニック 東京都杉並区高円寺',
  });
  await saveDeck(mkDeck(did,'診療案内','クリニック診療案内Instagram投稿',[{id:sid,title:'診療案内'}],'instagram-post','instagram-post-clinic-info'),{[sid]:html});
}

// ─── MEDICAL 2: instagram-story-health-tip ───────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const html = igStory('split-pastel', {
    topLabel: 'HEALTH TIPS — Sunrise Medical Clinic',
    icon: 'fa-solid fa-heart-pulse',
    mainTitle: '見逃しがちな\n生活習慣病の\n5つのサイン',
    items: [
      { label: '原因不明の倦怠感が続く', sub: '慢性疲労に要注意' },
      { label: 'トイレの回数が増えた', sub: '頻尿・多飲に注意' },
      { label: '食後に視界がぼやける', sub: '血糖値スパイクの可能性' },
      { label: '傷が治りにくくなった', sub: '免疫低下のサイン' },
      { label: '手足のしびれ・冷え', sub: '末梢神経への影響' },
    ],
    cta: '年に一度の健康診断を忘れずに',
    ctaSmall: 'Sunrise Medical Clinic / 内科専門医監修',
    handle: '@sunrisemedical',
  });
  await saveDeck(mkDeck(did,'健康情報カード','健康情報Instagramストーリー',[{id:sid,title:'健康情報カード'}],'instagram-story','instagram-story-health-tip'),{[sid]:html});
}

// ─── MEDICAL 3: instagram-story-clinic-hours ─────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['swiss-modern'];
  const html = `${head('swiss-modern', 'instagram-story')}
<div style="width:1080px;height:1920px;display:flex;flex-direction:column;padding:80px 60px">
  <div style="margin-bottom:48px;display:flex;align-items:center;gap:16px">
    <i class="fa-solid fa-triangle-exclamation" style="font-size:28px;color:${p.accent}"></i>
    <div>
      <div style="font-family:'Archivo',sans-serif;font-size:20px;font-weight:700;color:${p.text}">さくら整形外科クリニック</div>
      <div style="font-size:13px;opacity:.5">埼玉県さいたま市</div>
    </div>
  </div>
  <h1 style="font-family:'Archivo',sans-serif;font-size:64px;font-weight:900;margin:0 0 48px;line-height:1.1">休診の<br>お知らせ</h1>
  <div style="padding:40px;background:${p.accent};color:white;border-radius:16px;text-align:center;margin-bottom:32px">
    <div style="font-size:18px;font-weight:600;opacity:.85;margin-bottom:12px"><i class="fa-solid fa-calendar-xmark" style="margin-right:10px"></i>休診期間</div>
    <div style="font-size:48px;font-weight:900;line-height:1.2">12月29日（日）<br>〜 1月4日（土）</div>
  </div>
  <div style="padding:28px 32px;background:${p.surface};border-radius:12px;margin-bottom:24px;border-left:4px solid ${p.accent2}">
    <div style="font-size:16px;font-weight:700;margin-bottom:8px;color:${p.accent2}"><i class="fa-solid fa-circle-check" style="margin-right:8px"></i>診療再開</div>
    <div style="font-size:28px;font-weight:700">1月5日（日）より通常診療</div>
  </div>
  <div style="padding:24px 28px;background:${p.surface};border-radius:12px;border-left:4px solid ${p.accent}">
    <div style="font-size:14px;font-weight:700;margin-bottom:8px;color:${p.accent}"><i class="fa-solid fa-phone" style="margin-right:8px"></i>急患の方</div>
    <div style="font-size:18px;font-weight:600">埼玉市立病院</div>
    <div style="font-size:22px;font-weight:700;color:${p.accent};margin-top:4px">048-XXX-XXXX</div>
  </div>
  <div style="margin-top:auto;padding-top:32px;text-align:center">
    <div style="padding:20px;background:${p.surface};border-radius:10px;font-size:16px">
      <i class="fa-solid fa-laptop" style="color:${p.accent2};margin-right:10px"></i>
      ウェブ予約は引き続き受け付けております
    </div>
  </div>
</div>
${tail()}`;
  await saveDeck(mkDeck(did,'休診日のお知らせ','休診日告知Instagramストーリー',[{id:sid,title:'休診日のお知らせ'}],'instagram-story','instagram-story-clinic-hours'),{[sid]:html});
}

// ─── MEDICAL 4: a4-clinic-brochure (2 slides) ────────────────────────────────
{
  const did = makeId(); const s1 = makeId(), s2 = makeId();
  const slide1 = docPage('pastel-geometry', 'a4', {
    logo: '星野こども・ファミリークリニック',
    title: 'ご挨拶・診療のご案内',
    subtitle: '横浜市青葉区 / 青葉台駅 徒歩5分',
    sections: [
      { heading: '院長ご挨拶', body: '星野健二 院長（小児科専門医・経験20年）。お子様から大人まで家族ごと診る地域密着の総合診療を実践します。' },
      { heading: '診療サービス', items: [
        { label: '乳幼児健診 (0〜6歳)' }, { label: 'ワクチン接種' },
        { label: 'アレルギー検査' }, { label: '小外科処置' },
        { label: '健康診断 (学校・職場)' },
      ]},
      { heading: '診療時間', items: [
        { label: '月〜金 (午前)', value: '9:00〜12:30' },
        { label: '月〜金 (午後)', value: '15:00〜18:30' },
        { label: '土曜 (午前)', value: '9:00〜12:30' },
        { label: '日曜・祝日', value: '休診' },
      ]},
    ],
    footer: 'TEL: 045-XXX-XXXX | WEB予約: hoshino-clinic.jp',
  });
  const slide2 = docPage('pastel-geometry', 'a4', {
    logo: '星野こども・ファミリークリニック',
    title: 'よくあるご質問',
    subtitle: 'FAQ & アクセス',
    sections: [
      { heading: 'よくあるご質問', items: [
        { label: 'Q: 予約なしで受診できますか？', value: '' },
        { label: 'A: 当日予約優先ですが、飛び込みも受け付けます', note: '' },
        { label: 'Q: 紹介状なしで来院できますか？', value: '' },
        { label: 'A: 不要です。初診の方も直接お越しください', note: '' },
        { label: 'Q: 何歳まで診てもらえますか？', value: '' },
        { label: 'A: 乳幼児〜中学生まで小児科で対応', note: '' },
      ]},
      { heading: 'アクセス', items: [
        { label: '所在地', value: '横浜市青葉区XXX-X' },
        { label: '青葉台駅', value: '徒歩5分' },
        { label: 'たまプラーザ駅', value: '車5分' },
        { label: '駐車場', value: '4台完備' },
      ]},
    ],
    footer: 'スタッフ一同、心よりお待ちしております',
  });
  await saveDeck(mkDeck(did,'クリニック案内パンフ(2P)','クリニック案内パンフレット A4縦2ページ',[{id:s1,title:'ご挨拶・診療案内'},{id:s2,title:'FAQ・アクセス'}],'a4','a4-clinic-brochure'),{[s1]:slide1,[s2]:slide2});
}

// ─── MEDICAL 5: instagram-post-dental-campaign ───────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['creative-voltage'];
  const html = `${head('creative-voltage', 'instagram-post')}
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;padding:56px;position:relative;overflow:hidden">
  <div style="position:absolute;top:-100px;right:-100px;width:400px;height:400px;border-radius:50%;background:${p.accent}18"></div>
  <div style="margin-bottom:20px">
    <div style="font-size:13px;letter-spacing:.15em;text-transform:uppercase;color:${p.accent};font-weight:700">Smile Studio Dental — 新宿</div>
  </div>
  <h1 style="font-family:'Syne',sans-serif;font-size:44px;font-weight:900;margin:0 0 32px;line-height:1.1">春の歯の健康<br>キャンペーン！</h1>
  <div style="display:flex;flex-direction:column;gap:16px;flex:1">
    <div style="padding:28px 32px;background:${p.surface};border-radius:12px;border-left:4px solid ${p.accent}">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:14px;opacity:.6;margin-bottom:4px"><i class="fa-solid fa-tooth" style="color:${p.accent};margin-right:8px"></i>初回検診 + レントゲン</div>
          <div style="font-size:32px;font-weight:900;color:${p.accent}">無料</div>
        </div>
        <div style="padding:8px 16px;background:${p.accent};color:${p.bg};font-size:14px;font-weight:700;border-radius:6px">FREE</div>
      </div>
    </div>
    <div style="padding:28px 32px;background:${p.surface};border-radius:12px;border-left:4px solid ${p.accent2}">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:14px;opacity:.6;margin-bottom:4px"><i class="fa-solid fa-star" style="color:${p.accent2};margin-right:8px"></i>ホワイトニング (初診患者様)</div>
          <div style="font-size:32px;font-weight:900;color:${p.accent2}">30% OFF</div>
        </div>
        <div style="padding:8px 16px;background:${p.accent2};color:${p.bg};font-size:14px;font-weight:700;border-radius:6px">SALE</div>
      </div>
    </div>
  </div>
  <div style="margin-top:20px;padding:16px 20px;background:${p.surface};border-radius:8px;font-size:14px;text-align:center;border:1px solid ${p.border}40">
    <i class="fa-solid fa-calendar" style="color:${p.accent};margin-right:8px"></i>4月1日〜30日 限定 | 最新機器完備 | 多言語対応スタッフ
  </div>
  <div style="margin-top:12px;padding:18px;background:${p.accent};border-radius:8px;font-weight:700;font-size:18px;text-align:center;color:${p.bg}">
    今すぐWEB予約！ smilestudio-dental.jp
  </div>
</div>
${tail()}`;
  await saveDeck(mkDeck(did,'歯科検診キャンペーン','歯科キャンペーンInstagram投稿',[{id:sid,title:'歯科検診キャンペーン'}],'instagram-post','instagram-post-dental-campaign'),{[sid]:html});
}

// ─── EDUCATION 1: instagram-post-juku-recruit ────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const html = igPost('bold-signal', {
    badge: '4月生 募集開始！',
    title: '暁\nアカデミー',
    subtitle: '練馬区 / 完全個別対応の進学塾',
    icon: 'fa-solid fa-graduation-cap',
    items: [
      { label: '成績向上率', badge: '98%' },
      { label: '難関校合格', badge: '15名' },
      { label: 'クラス定員', badge: '6名' },
    ],
    cta: '無料体験授業 受付中 → LINE / TEL',
    footer: '数学・英語・理科 | 練馬区XX丁目 | @akatsuki_academy',
  });
  await saveDeck(mkDeck(did,'塾 生徒募集','塾生徒募集Instagram投稿',[{id:sid,title:'塾 生徒募集'}],'instagram-post','instagram-post-juku-recruit'),{[sid]:html});
}

// ─── EDUCATION 2: instagram-story-class-schedule ─────────────────────────────
{
  const did = makeId(), sid = makeId();
  const html = igStory('notebook-tabs', {
    topLabel: '今週の授業スケジュール (4/14-19)',
    icon: 'fa-solid fa-chalkboard-user',
    mainTitle: 'Nova English\nAcademy',
    items: [
      { label: '月曜 19:00 ビジネス英語', sub: 'Business English' },
      { label: '火曜 10:00 朝活英会話', sub: 'Morning Conversation' },
      { label: '水曜 19:00 TOEIC対策', sub: 'TOEIC Prep' },
      { label: '土曜 10:00 キッズ英語', sub: 'Kids English' },
      { label: '土曜 14:00 初心者スピーキング', sub: 'Beginner Speaking' },
    ],
    urgency: '木曜 18:00 無料ワークショップ「面接英語」先着10名',
    cta: '体験レッスン随時受付中',
    ctaSmall: 'DM・HPよりご予約 / @novaenglish_academy',
    handle: '@novaenglish.academy',
  });
  await saveDeck(mkDeck(did,'授業スケジュール','授業スケジュールInstagramストーリー',[{id:sid,title:'授業スケジュール'}],'instagram-story','instagram-story-class-schedule'),{[sid]:html});
}

// ─── EDUCATION 3: a4-report-card (2 slides) ──────────────────────────────────
{
  const did = makeId(); const s1 = makeId(), s2 = makeId();
  const slide1 = docPage('swiss-modern', 'a4', {
    logo: 'サンライズ塾',
    title: '学習状況報告書',
    subtitle: '生徒名: 山本 春希 (小学6年生) | 報告期間: 2026年1〜3月',
    sections: [
      { heading: '教科別成績', table: {
        header: ['教科', '今回', '前回比', '評価'],
        rows: [
          ['国語', '85点', '+8', '良好'],
          ['算数', '72点', '+5', '改善中'],
          ['理科', '90点', '+12', '★優秀'],
          ['社会', '78点', '+3', '良好'],
          ['英語', '68点', '-2', '要強化'],
        ]
      }},
    ],
    footer: '担任: 田中先生 | 次回面談: 4月XX日予定',
  });
  const slide2 = docPage('swiss-modern', 'a4', {
    logo: 'サンライズ塾',
    title: '担任コメント・今後の方針',
    subtitle: '山本 春希 (小学6年生)',
    sections: [
      { heading: '担任コメント', body: '山本君は今期、特に理科において目覚ましい成長を見せてくれました。実験への積極的な姿勢が成果につながっています。英語は語彙力の強化が次のステップです。算数も着実に伸びており、この調子で継続しましょう。' },
      { heading: '次期学習計画', items: [
        { label: '重点科目: 英語', value: '単語力強化 + リーディング' },
        { label: '継続強化: 理科', value: '応用問題へ挑戦' },
        { label: '推奨学習時間: 平日', value: '90分/日' },
        { label: '推奨学習時間: 休日', value: '2時間/日' },
      ]},
    ],
    footer: '保護者様サイン: _____________ / 日付: _____________',
  });
  await saveDeck(mkDeck(did,'成績報告書(2P)','成績報告書A4縦2ページ',[{id:s1,title:'成績概要'},{id:s2,title:'担任コメント・学習計画'}],'a4','a4-report-card'),{[s1]:slide1,[s2]:slide2});
}

// ─── EDUCATION 4: instagram-post-exam-results ────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['electric-studio'];
  const html = `${head('electric-studio', 'instagram-post')}
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;padding:56px;position:relative">
  <div style="position:absolute;top:0;right:0;width:8px;height:100%;background:linear-gradient(180deg,${p.accent},${p.accent2})"></div>
  <div style="font-size:13px;letter-spacing:.15em;text-transform:uppercase;color:${p.accent};font-weight:700;margin-bottom:8px">Peak Seminar</div>
  <h1 style="font-family:'Manrope',sans-serif;font-size:40px;font-weight:900;margin:0 0 28px;line-height:1.15"><i class="fa-solid fa-trophy" style="color:${p.accent};margin-right:16px"></i>2026年度<br>大学合格実績</h1>
  <div style="display:flex;flex-direction:column;gap:12px;flex:1">
    ${[
      {name:'東京大学', count:'3名', accent:true},
      {name:'慶應義塾大学', count:'8名', accent:false},
      {name:'早稲田大学', count:'12名', accent:false},
      {name:'その他国公立・難関私立', count:'15名', accent:false},
    ].map(u => `<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:${u.accent?p.accent:p.surface};border-radius:8px;${u.accent?`color:white`:''}">
      <span style="font-size:18px;font-weight:600">${u.name}</span>
      <span style="font-size:28px;font-weight:900;color:${u.accent?'white':p.accent}">${u.count}</span>
    </div>`).join('')}
  </div>
  <div style="margin-top:20px;padding:24px;background:${p.accent};color:white;border-radius:12px;text-align:center">
    <div style="font-size:16px;opacity:.85;margin-bottom:4px">志望校合格率</div>
    <div style="font-family:'Manrope',sans-serif;font-size:64px;font-weight:900;line-height:1">95%</div>
  </div>
  <div style="margin-top:12px;font-size:13px;opacity:.5;text-align:center">来年度の合格を一緒に目指しましょう！ | @peak_seminar</div>
</div>
${tail()}`;
  await saveDeck(mkDeck(did,'合格実績','合格実績Instagram投稿',[{id:sid,title:'合格実績'}],'instagram-post','instagram-post-exam-results'),{[sid]:html});
}

// ─── EDUCATION 5: 4:3-workshop-material (5 slides) ───────────────────────────
{
  const did = makeId();
  const s = [makeId(), makeId(), makeId(), makeId(), makeId()];
  const slides = {
    [s[0]]: presSlide('notebook-tabs', '4:3', { type:'title', topLabel:'2時間ワークショップ', title:'プロフェッショナルのための\n時間管理術', subtitle:'by 生産性コンサルタント 森 明子', metaLine:'参加者 20名 / 資料配布用', bgAccent:true }),
    [s[1]]: presSlide('notebook-tabs', '4:3', { topLabel:'SECTION 1', title:'あなたの時間パターンを知る', items: [
      { label:'1週間の時間の使い方を振り返る', sub:'仕事(集中業務) / 会議 / 移動 / 休憩 / 個人的時間' },
      { label:'最も無駄に感じた時間は何か？', sub:'自己認識が改善の第一歩' },
      { label:'時間記録シートで可視化する', sub:'3日間のタイムログをつけてみましょう' },
    ]}),
    [s[2]]: presSlide('notebook-tabs', '4:3', { type:'three-col', topLabel:'SECTION 2 — 優先順位の4象限', title:'Eisenhower Matrix / 重要度 × 緊急度',
      cols: [
        { title:'第1象限', stat:'即対応', body:'緊急×重要：締切、クライアント対応', icon:'fa-solid fa-fire' },
        { title:'第2象限 ★', stat:'計画実行', body:'重要×非緊急：戦略、健康、自己成長', icon:'fa-solid fa-bullseye' },
        { title:'第3・4象限', stat:'委任/削除', body:'非重要：ほとんどのメール、SNS閲覧', icon:'fa-solid fa-trash' },
      ]
    }),
    [s[3]]: presSlide('notebook-tabs', '4:3', { topLabel:'SECTION 3', title:'よくある時間泥棒 TOP5 と対策', items: [
      { label:'メール・チャットの常時確認', sub:'→ 確認時間を固定する（朝昼夕3回）', badge:'対策1' },
      { label:'会議の目的不明確', sub:'→ アジェンダ必須ルールを設ける', badge:'対策2' },
      { label:'完璧主義による先延ばし', sub:'→ 80%完成で一旦提出する', badge:'対策3' },
      { label:'割り込みへの対応', sub:'→ 集中ブロック時間の設定', badge:'対策4' },
      { label:'タスクの過小見積もり', sub:'→ バッファ時間20%を追加', badge:'対策5' },
    ]}),
    [s[4]]: presSlide('notebook-tabs', '4:3', { topLabel:'ACTION PLAN', title:'マイ アクションプランシート', subtitle:'今日から始める3つのコミットメント', items: [
      { label:'今日から止める習慣 (1つ):', sub:'_________________________________' },
      { label:'今日から始める習慣 (1つ):', sub:'_________________________________' },
      { label:'第2象限に投資する時間:', sub:'週 __ 時間 / 来週月曜日にやること: ___________' },
    ]}),
  };
  await saveDeck(mkDeck(did,'ワークショップ教材(5P)','時間管理ワークショップ教材4:3 5枚',
    s.map((id,i) => ({id, title:['表紙','時間パターン分析','4象限の優先順位','時間泥棒TOP5','アクションプラン'][i]})),
    '4:3','4:3-workshop-material'),slides);
}

// ─── EDUCATION 6: instagram-story-online-lesson ──────────────────────────────
{
  const did = makeId(), sid = makeId();
  const html = igStory('creative-voltage', {
    topLabel: 'NEW COURSE — Code Spark',
    icon: 'fa-solid fa-laptop',
    mainTitle: 'Python\n初心者コース\n開講！',
    items: [
      { label: '期間: 8週間 / 週2回Zoom', sub: 'Live Online Lessons' },
      { label: '定員: 10名限定', sub: 'Small Group Cohort' },
      { label: '開講日: 5月1日', sub: 'May 1st Start' },
    ],
    priceMain: '¥48,000',
    priceSub: '録画見放題 + 課題フィードバック付き',
    urgency: '1対1メンタリング + Slackコミュニティ',
    cta: '今すぐ申し込む → プロフィールURL',
    handle: '@codespark.jp',
  });
  await saveDeck(mkDeck(did,'オンライン授業案内','オンライン授業告知Instagramストーリー',[{id:sid,title:'オンライン授業案内'}],'instagram-story','instagram-story-online-lesson'),{[sid]:html});
}

console.log('\n✅ Batch 2 (Realestate + Medical + Education) 完了: 16 decks generated');
