import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { igPost, igStory, wideCard, docPage, PRESETS, CANVAS, head, tail } from './html-gen.mjs';

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
function deck(id, title, desc, slides, format, templateId) {
  return {
    id, title, description: desc,
    slides: slides.map((s, i) => ({ id: s.id, title: s.title, order: i })),
    createdAt: now(), updatedAt: now(),
    metadata: { canvasSize: format, templateId },
  };
}

// ─── 1. instagram-post-cafe-menu ─────────────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['dark-botanical'];
  const html = `${head('dark-botanical', 'instagram-post')}
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;padding:56px;position:relative">
  <div style="position:absolute;top:0;left:0;width:100%;height:6px;background:linear-gradient(90deg,${p.accent},${p.accent2})"></div>
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:32px">
    <i class="fa-solid fa-mug-hot" style="font-size:28px;color:${p.accent}"></i>
    <div>
      <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:${p.accent};font-weight:700">Today's Menu</div>
      <div style="font-size:13px;letter-spacing:.1em;opacity:.6">本日のメニュー</div>
    </div>
  </div>
  <h1 style="font-family:'Cormorant',serif;font-size:68px;font-weight:700;line-height:1.05;margin:0 0 8px;color:${p.text}">Amber<br><span style="color:${p.accent}">&</span> Leaf</h1>
  <p style="font-size:16px;opacity:.5;margin:0 0 36px;letter-spacing:.08em">SPECIALTY CAFÉ — SHIBUYA</p>
  <div style="flex:1;display:flex;flex-direction:column;gap:14px">
    ${[
      { icon:'fa-mug-hot', ja:'モーニングブレンドコーヒー', en:'Morning Blend Coffee', price:'¥550' },
      { icon:'fa-seedling', ja:'アボカドトースト', en:'Avocado Toast', price:'¥980' },
      { icon:'fa-glass-water', ja:'季節のスムージー (マンゴー&パッションフルーツ)', en:'Seasonal Smoothie', price:'¥750' },
      { icon:'fa-bread-slice', ja:'アーモンドクロワッサン', en:'Almond Croissant', price:'¥420' },
    ].map((item, i) => `<div style="display:flex;align-items:center;gap:16px;padding:16px 20px;background:${p.surface};border-radius:8px;border-left:3px solid ${i===0?p.accent:p.accent2}">
      <i class="fa-solid ${item.icon}" style="font-size:18px;color:${p.accent};width:22px;text-align:center;opacity:.8"></i>
      <div style="flex:1">
        <div style="font-size:17px;font-weight:600">${item.ja}</div>
        <div style="font-size:13px;opacity:.5;font-style:italic">${item.en}</div>
      </div>
      <div style="font-size:20px;font-weight:700;color:${p.accent}">${item.price}</div>
    </div>`).join('')}
  </div>
  <div style="margin-top:28px;padding-top:20px;border-top:1px solid ${p.border};display:flex;align-items:center;gap:10px">
    <i class="fa-brands fa-instagram" style="color:${p.accent}"></i>
    <span style="font-size:15px;opacity:.6">@amber.and.leaf</span>
    <span style="opacity:.3">|</span>
    <i class="fa-solid fa-location-dot" style="color:${p.accent};font-size:13px"></i>
    <span style="font-size:15px;opacity:.6">Shibuya, Tokyo</span>
  </div>
</div>
${tail()}`;
  await saveDeck(deck(did,'カフェ本日のメニュー','カフェの本日のおすすめメニューInstagram投稿',[{id:sid,title:'カフェ本日のメニュー'}],'instagram-post','instagram-post-cafe-menu'),{[sid]:html});
}

// ─── 2. instagram-story-restaurant-daily ─────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['kyoto-classic'];
  const html = igStory('kyoto-classic', {
    topLabel: 'Today\'s Lunch / 本日のランチ',
    icon: 'fa-solid fa-utensils',
    mainTitle: 'Trattoria\nSole',
    subtitle: 'イタリアンレストラン 大阪 心斎橋',
    items: [
      { label: 'Main / メイン', sub: 'グリルサーモン レモンバターソース', price: '' },
      { label: 'Side / サラダ', sub: '季節野菜サラダ', price: '' },
      { label: 'Soup / スープ', sub: 'ミネストローネ', price: '' },
      { label: 'パン付き', sub: 'ランチセット', price: '' },
    ],
    highlightBox: { label: 'ランチセット料金', value: '¥1,200' },
    cta: 'LUNCH 11:30〜14:30',
    ctaSmall: '大阪市中央区 心斎橋',
    handle: '@trattoriasole.osaka',
  });
  await saveDeck(deck(did,'レストラン日替わりランチ','レストランの日替わりランチInstagramストーリー',[{id:sid,title:'レストラン日替わりランチ'}],'instagram-story','instagram-story-restaurant-daily'),{[sid]:html});
}

// ─── 3. instagram-post-izakaya-event ─────────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['neon-cyber'];
  const html = `${head('neon-cyber', 'instagram-post')}
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;padding:56px;position:relative;overflow:hidden">
  <div style="position:absolute;top:-100px;right:-100px;width:500px;height:500px;border-radius:50%;background:${p.accent}18;pointer-events:none"></div>
  <div style="position:absolute;bottom:-80px;left:-80px;width:400px;height:400px;border-radius:50%;background:${p.accent2}12;pointer-events:none"></div>
  <div style="margin-bottom:28px">
    <div style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:${p.accent};font-weight:700">夜の星 — YORU NO HOSHI</div>
    <div style="font-size:12px;opacity:.4;margin-top:4px">Shinjuku, Tokyo</div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:24px">
    <h1 style="font-family:'Orbitron',sans-serif;font-size:58px;font-weight:900;line-height:1.05;margin:0;color:${p.accent};text-shadow:0 0 30px ${p.accent}60">SUMMER<br>ENDLESS<br>NIGHT</h1>
    <div style="padding:24px 28px;border:2px solid ${p.accent};border-radius:8px;background:${p.accent}10">
      <div style="font-size:16px;opacity:.7;margin-bottom:8px">飲み放題 2時間</div>
      <div style="font-size:64px;font-weight:900;color:${p.accent2};line-height:1">¥2,980</div>
    </div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      ${['毎週 金・土曜日', '8月中開催', '18:00 START', '要予約'].map(t => `<div style="padding:8px 16px;background:${p.surface};border:1px solid ${p.border};border-radius:4px;font-size:14px;font-weight:600;color:${p.accent}">${t}</div>`).join('')}
    </div>
  </div>
  <div style="margin-top:32px;padding-top:20px;border-top:1px solid ${p.border};display:flex;align-items:center;gap:10px">
    <i class="fa-brands fa-instagram" style="color:${p.accent}"></i>
    <span style="font-size:14px;opacity:.5">@yorunohoshi_shinjuku</span>
    <span style="margin-left:auto;font-size:13px;opacity:.4">LINE予約受付中</span>
  </div>
</div>
${tail()}`;
  await saveDeck(deck(did,'居酒屋イベント告知','居酒屋のイベント告知Instagram投稿',[{id:sid,title:'居酒屋イベント告知'}],'instagram-post','instagram-post-izakaya-event'),{[sid]:html});
}

// ─── 4. instagram-story-bakery-newitem ───────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const html = igStory('pastel-geometry', {
    topLabel: 'NEW ARRIVAL',
    icon: 'fa-solid fa-bread-slice',
    mainTitle: '抹茶クリーム\nブリオッシュ',
    subtitle: 'Farine & Blé — 京都岡崎',
    items: [
      { label: '宇治産有機抹茶使用', sub: 'Uji Organic Matcha' },
      { label: 'ダブルクリーム仕立て', sub: 'Double Cream Filling' },
      { label: 'ホワイトチョコパール仕上げ', sub: 'White Chocolate Pearls' },
    ],
    priceMain: '¥480',
    urgency: '1日限定30個 · 毎週金曜より販売',
    cta: 'ご予約はプロフィールURLから',
    handle: '@farine.ble.kyoto',
  });
  await saveDeck(deck(did,'ベーカリー新作パン','ベーカリーの新作パン紹介Instagramストーリー',[{id:sid,title:'ベーカリー新作パン'}],'instagram-story','instagram-story-bakery-newitem'),{[sid]:html});
}

// ─── 5. a5-restaurant-menu (3 slides) ────────────────────────────────────────
{
  const did = makeId();
  const s1 = makeId(), s2 = makeId(), s3 = makeId();
  const p = PRESETS['vintage-editorial'];
  const cv = CANVAS['a5'];

  const cover = `${head('vintage-editorial', 'a5')}
<div style="width:${cv.w}px;height:${cv.h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px;text-align:center;border:12px solid ${p.accent};margin:20px;box-sizing:border-box;position:relative">
  <div style="position:absolute;top:20px;left:20px;right:20px;bottom:20px;border:2px solid ${p.border}"></div>
  <div style="font-family:'Fraunces',serif;font-size:14px;letter-spacing:.3em;text-transform:uppercase;color:${p.accent};margin-bottom:24px">Maison Hirondelle</div>
  <i class="fa-solid fa-utensils" style="font-size:32px;color:${p.accent};margin-bottom:20px;opacity:.6"></i>
  <h1 style="font-family:'Fraunces',serif;font-size:72px;font-weight:700;margin:0 0 16px;line-height:1">MENU</h1>
  <div style="width:60px;height:2px;background:${p.accent};margin:20px auto"></div>
  <p style="font-size:16px;opacity:.5;letter-spacing:.1em">メゾン・イロンデル</p>
  <p style="font-size:13px;opacity:.4;margin-top:8px">名古屋市中区 錦3丁目</p>
</div>
${tail()}`;

  const mainMenu = docPage('vintage-editorial', 'a5', {
    logo: 'Maison Hirondelle',
    title: 'STARTERS & MAINS',
    subtitle: '前菜・メインディッシュ',
    sections: [
      { heading: 'STARTERS / 前菜', items: [
        { label: 'Soupe à l\'Oignon オニオングラタンスープ', value: '¥1,200' },
        { label: 'Salade Niçoise ニソワーズサラダ', value: '¥1,400' },
        { label: 'Escargot de Bourgogne エスカルゴ', value: '¥1,800' },
        { label: 'Terrine de Campagne テリーヌ・ド・カンパーニュ', value: '¥1,500' },
        { label: 'Foie Gras Poêlé フォアグラのソテー', value: '¥1,800' },
      ]},
      { heading: 'MAINS / メインディッシュ', items: [
        { label: 'Bœuf Bourguignon ブルゴーニュ風ビーフシチュー', value: '¥3,200' },
        { label: 'Poulet Rôti aux Herbes ハーブのロースト鶏', value: '¥2,400' },
        { label: 'Sole Meunière ムニエル', value: '¥3,800' },
        { label: 'Risotto aux Champignons きのこリゾット', value: '¥2,600' },
      ]},
    ],
    footer: 'サービス料は含まれておりません / Service charge not included',
  });

  const drinksMenu = docPage('vintage-editorial', 'a5', {
    logo: 'Maison Hirondelle',
    title: 'WINE & DRINKS',
    subtitle: 'ワイン・ドリンク・デザート',
    sections: [
      { heading: 'WINE / ワイン', items: [
        { label: 'House Red — Côtes du Rhône (グラス)', value: '¥700' },
        { label: 'House White — Chablis (グラス)', value: '¥700' },
        { label: 'Bordeaux Château Margaux 2018 (ボトル)', value: '¥12,000' },
        { label: 'Burgundy Gevrey-Chambertin (ボトル)', value: '¥9,500' },
      ]},
      { heading: 'DRINKS / ドリンク', items: [
        { label: 'Café カフェ', value: '¥500' },
        { label: 'Thé 紅茶', value: '¥500' },
        { label: 'Jus d\'orange オレンジジュース', value: '¥500' },
        { label: 'Chocolat chaud ホットチョコレート', value: '¥600' },
      ]},
      { heading: 'DESSERT / デザート', items: [
        { label: 'Crème Brûlée クレームブリュレ', value: '¥800' },
        { label: 'Moelleux au Chocolat ガトーショコラ', value: '¥800' },
      ]},
    ],
    footer: 'Maison Hirondelle — 名古屋市中区 錦3丁目 — TEL: 052-XXX-XXXX',
  });

  await saveDeck(deck(did,'卓上メニュー(3P)','レストランの卓上メニューA5縦3ページ',[
    {id:s1,title:'表紙'},{id:s2,title:'前菜・メイン'},{id:s3,title:'ドリンク・デザート'}
  ],'a5','a5-restaurant-menu'),{[s1]:cover,[s2]:mainMenu,[s3]:drinksMenu});
}

// ─── 6. instagram-post-food-review ───────────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['swiss-modern'];
  const html = `${head('swiss-modern', 'instagram-post')}
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;padding:56px;position:relative">
  <div style="position:absolute;top:0;right:0;width:6px;height:100%;background:${p.accent}"></div>
  <div style="margin-bottom:24px">
    <div style="font-size:13px;letter-spacing:.15em;text-transform:uppercase;color:${p.accent};font-weight:700">GOURMET REVIEW / グルメレビュー</div>
  </div>
  <h1 style="font-family:'Archivo',sans-serif;font-size:56px;font-weight:900;line-height:1.1;margin:0 0 8px">塩ラーメン<br>誉</h1>
  <p style="font-size:16px;opacity:.5;margin:0 0 32px"><i class="fa-solid fa-location-dot" style="color:${p.accent};margin-right:8px"></i>札幌 すすきの</p>
  <div style="display:flex;align-items:center;gap:20px;padding:24px 28px;background:${p.surface};border-radius:10px;margin-bottom:24px">
    <div style="font-size:72px;font-weight:900;color:${p.accent};line-height:1">4.8</div>
    <div>
      <div style="color:${p.accent};font-size:24px;letter-spacing:4px">★★★★★</div>
      <div style="font-size:14px;opacity:.5;margin-top:4px">5段階評価</div>
    </div>
  </div>
  <div style="flex:1;padding:24px 28px;background:${p.surface};border-radius:10px;border-left:4px solid ${p.accent2}">
    <i class="fa-solid fa-quote-left" style="color:${p.accent};font-size:20px;margin-bottom:12px;display:block;opacity:.5"></i>
    <p style="font-size:19px;line-height:1.65;margin:0;font-style:italic;opacity:.85">鶏白湯ベースの澄んだ塩スープが絶品。チャーシューは箸でほぐれる柔らかさ。並んでも食べる価値あり！</p>
  </div>
  <div style="margin-top:24px;display:flex;gap:24px;flex-wrap:wrap">
    ${[
      {icon:'fa-yen-sign',text:'¥950'},
      {icon:'fa-clock',text:'11:00〜14:30 / 18:00〜21:00'},
      {icon:'fa-calendar-xmark',text:'水曜定休'},
    ].map(d => `<div style="display:flex;align-items:center;gap:8px;font-size:14px;opacity:.65">
      <i class="fa-solid ${d.icon}" style="color:${p.accent}"></i>${d.text}
    </div>`).join('')}
  </div>
</div>
${tail()}`;
  await saveDeck(deck(did,'グルメレビューカード','グルメレビューInstagram投稿',[{id:sid,title:'グルメレビューカード'}],'instagram-post','instagram-post-food-review'),{[sid]:html});
}

// ─── 7. a4-landscape-cafe-pricelist ──────────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['notebook-tabs'];
  const cv = CANVAS['a4-landscape'];
  const colData = [
    { title: 'COFFEE / コーヒー', icon: 'fa-mug-hot', items: [
      ['エスプレッソ', '¥420'],['アメリカーノ', '¥480'],['カプチーノ', '¥550'],
      ['カフェラテ', '¥580'],['コールドブリュー', '¥650'],['アイスはすべて +¥50',''],
    ]},
    { title: 'SPECIALTY / スペシャルティ', icon: 'fa-leaf', items: [
      ['抹茶ラテ', '¥620'],['ほうじ茶ラテ', '¥600'],['オーツミルクラテ', '¥630'],
      ['季節限定スペシャル', '¥680'],['カフェモカ', '¥600'],['チャイラテ', '¥580'],
    ]},
    { title: 'FOOD / フード', icon: 'fa-bread-slice', items: [
      ['ブルーベリースコーン', '¥380'],['バナナブレッド', '¥420'],['チーズケーキ', '¥500'],
      ['クッキーセット', '¥350'],['プレーンスコーン', '¥320'],['カスタードタルト', '¥450'],
    ]},
  ];
  const html = `${head('notebook-tabs', 'a4-landscape')}
<div style="width:${cv.w}px;height:${cv.h}px;display:flex;flex-direction:column;padding:80px 100px">
  <div style="text-align:center;margin-bottom:48px;border-bottom:3px solid ${p.accent};padding-bottom:32px">
    <div style="font-family:'Bodoni Moda',serif;font-size:52px;font-weight:700;color:${p.text}">珈琲 結晶</div>
    <div style="font-size:18px;letter-spacing:.2em;opacity:.5;margin-top:8px">Kessho — FUKUOKA — Single Origin Specialty Coffee</div>
  </div>
  <div style="display:flex;gap:60px;flex:1">
    ${colData.map(col => `<div style="flex:1">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:12px;border-bottom:2px solid ${p.border}">
        <i class="fa-solid ${col.icon}" style="color:${p.accent};font-size:18px"></i>
        <span style="font-family:'Bodoni Moda',serif;font-size:18px;font-weight:700;letter-spacing:.08em">${col.title}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${col.items.map(([name, price]) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid ${p.border}40">
          <span style="font-size:16px;${!price?'opacity:.5;font-style:italic':''}">${name}</span>
          ${price ? `<span style="font-weight:700;color:${p.accent};font-size:16px">${price}</span>` : ''}
        </div>`).join('')}
      </div>
    </div>`).join('')}
  </div>
</div>
${tail()}`;
  await saveDeck(deck(did,'カフェ価格表','カフェの全メニュー価格表 A4横',[{id:sid,title:'カフェ価格表'}],'a4-landscape','a4-landscape-cafe-pricelist'),{[sid]:html});
}

// ─── 8. instagram-post-salon-style ───────────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['split-pastel'];
  const html = `${head('split-pastel', 'instagram-post')}
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;overflow:hidden">
  <div style="height:360px;background:linear-gradient(135deg,${p.accent}40 0%,${p.accent2}30 100%);display:flex;align-items:center;justify-content:center;position:relative">
    <i class="fa-solid fa-scissors" style="font-size:80px;color:${p.text};opacity:.15;position:absolute"></i>
    <div style="text-align:center;z-index:1">
      <div style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:${p.text};opacity:.5;font-weight:700">LUCENT HAIR</div>
      <div style="font-family:'Outfit',sans-serif;font-size:40px;font-weight:800;color:${p.text};margin-top:8px">Style Showcase</div>
    </div>
  </div>
  <div style="flex:1;padding:40px 48px;display:flex;flex-direction:column;justify-content:space-between">
    <div>
      <h1 style="font-family:'Outfit',sans-serif;font-size:44px;font-weight:800;line-height:1.1;margin:0 0 8px;color:${p.text}">Warm Honey<br>Balayage</h1>
      <p style="font-size:16px;opacity:.55;margin:0 0 28px">ウォームハニーバレイヤージュ</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px">
        ${['フェイスフレーミング', 'バレイヤージュカラー', 'ウォームトーン'].map(t => `<span style="padding:6px 14px;background:${p.surface};border:1px solid ${p.border};border-radius:100px;font-size:13px;font-weight:600;color:${p.accent}">${t}</span>`).join('')}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;justify-content:space-between;padding:14px 18px;background:${p.surface};border-radius:8px">
        <span style="font-size:15px"><i class="fa-solid fa-user" style="color:${p.accent};margin-right:10px"></i>担当: Mio Nakamura / 7年のキャリア</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:14px 18px;background:${p.accent};border-radius:8px;color:white">
        <span style="font-size:15px;font-weight:600"><i class="fa-solid fa-scissors" style="margin-right:10px"></i>Cut + Color + Treatment</span>
        <span style="font-size:18px;font-weight:700">¥18,000</span>
      </div>
      <div style="font-size:13px;opacity:.5;text-align:center;margin-top:4px">
        <i class="fa-brands fa-instagram" style="margin-right:6px"></i>@lucenthair.omotesando / Instagram DM · HOT PEPPER 予約
      </div>
    </div>
  </div>
</div>
${tail()}`;
  await saveDeck(deck(did,'美容室スタイル紹介','美容室スタイル紹介Instagram投稿',[{id:sid,title:'美容室スタイル紹介'}],'instagram-post','instagram-post-salon-style'),{[sid]:html});
}

// ─── 9. instagram-story-nail-design ──────────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const html = igStory('pastel-geometry', {
    topLabel: 'NEW DESIGN — SPRING 2026',
    icon: 'fa-solid fa-hand-sparkles',
    mainTitle: '春の桜ネイル',
    subtitle: 'Petal Nails — 原宿',
    items: [
      { label: 'ペールピンクベース', sub: 'Pale Pink Base Gel' },
      { label: '3D桜アート', sub: '3D Cherry Blossom Art' },
      { label: 'ゴールドホイル仕上げ', sub: 'Gold Foil Accent' },
    ],
    priceMain: '¥7,800',
    priceSub: '3Dアート追加 +¥1,500',
    urgency: '春季限定デザイン',
    cta: 'ご予約はプロフィールURLから',
    handle: '@petalnails.harajuku',
  });
  await saveDeck(deck(did,'ネイルサロン新デザイン','ネイルサロン新作Instagramストーリー',[{id:sid,title:'ネイルサロン新デザイン'}],'instagram-story','instagram-story-nail-design'),{[sid]:html});
}

// ─── 10. instagram-story-salon-coupon ────────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['creative-voltage'];
  const html = `${head('creative-voltage', 'instagram-story')}
<div style="width:1080px;height:1920px;display:flex;flex-direction:column;padding:80px 60px;position:relative;overflow:hidden">
  <div style="position:absolute;top:-200px;right:-200px;width:600px;height:600px;border-radius:50%;background:${p.accent}20"></div>
  <div style="position:absolute;bottom:-150px;left:-150px;width:400px;height:400px;border-radius:50%;background:${p.accent2}15"></div>
  <div style="margin-bottom:48px">
    <div style="font-family:'Syne',sans-serif;font-size:32px;font-weight:800;color:${p.accent}">LANA Beauty</div>
    <div style="font-size:14px;opacity:.4;margin-top:4px">渋谷</div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:32px">
    <div style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:${p.accent2};font-weight:700">Instagram限定クーポン</div>
    <h1 style="font-family:'Syne',sans-serif;font-size:80px;font-weight:900;line-height:1;margin:0;color:${p.text}">COUPON</h1>
    <div style="padding:36px 40px;border:3px dashed ${p.accent};border-radius:12px;background:${p.surface}">
      <div style="font-size:20px;font-weight:600;margin-bottom:16px;color:${p.accent}">全メニュー</div>
      <div style="font-family:'Syne',sans-serif;font-size:80px;font-weight:900;line-height:1;color:${p.text}">20%<br>OFF</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      ${['最低施術金額 ¥5,000','他クーポンとの併用不可','受付時にこのストーリーを提示'].map(t => `<div style="display:flex;align-items:center;gap:12px;font-size:18px;opacity:.75">
        <i class="fa-solid fa-circle-check" style="color:${p.accent2};font-size:16px"></i>${t}
      </div>`).join('')}
    </div>
    <div style="padding:20px 24px;background:${p.accent}18;border-radius:8px;font-size:18px;font-weight:700;text-align:center;border:1px solid ${p.accent}40">
      <i class="fa-solid fa-clock" style="margin-right:10px"></i>今月末まで有効
    </div>
  </div>
  <div style="margin-top:40px;text-align:center">
    <div style="padding:22px 32px;background:${p.accent};color:${p.bg};font-size:22px;font-weight:700;border-radius:10px">今すぐ予約してこの特典を使おう！</div>
    <div style="font-size:14px;opacity:.4;margin-top:16px">@lana.beauty.shibuya</div>
  </div>
</div>
${tail()}`;
  await saveDeck(deck(did,'サロン限定クーポン','サロン限定クーポンInstagramストーリー',[{id:sid,title:'サロン限定クーポン'}],'instagram-story','instagram-story-salon-coupon'),{[sid]:html});
}

// ─── 11. instagram-post-esthetic-menu ────────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const html = igPost('dark-botanical', {
    badge: 'SIGNATURE COURSE',
    title: 'Serenité',
    subtitle: 'Ginza — Luxury Esthetics',
    icon: 'fa-solid fa-spa',
    items: [
      { label: 'クレンジング → スチーム → 毛穴ケア', price: '' },
      { label: 'フェイシャルマッサージ', price: '' },
      { label: '集中パック → 保湿仕上げ', price: '' },
    ],
    priceMain: '¥15,000',
    priceSub: '初回限定 ¥8,000',
    footer: '所要時間 90分 | 乾燥肌・敏感肌向け | Sothys Paris 使用',
  });
  await saveDeck(deck(did,'エステメニュー紹介','エステサロンのメニュー紹介Instagram投稿',[{id:sid,title:'エステメニュー紹介'}],'instagram-post','instagram-post-esthetic-menu'),{[sid]:html});
}

// ─── 12. a5-landscape-salon-card ─────────────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['kyoto-classic'];
  const cv = CANVAS['a5-landscape'];
  const html = `${head('kyoto-classic', 'a5-landscape')}
<div style="width:${cv.w}px;height:${cv.h}px;display:flex;padding:60px;gap:60px">
  <div style="width:720px;display:flex;flex-direction:column;justify-content:center;align-items:center;border-right:2px solid ${p.border};padding-right:60px;text-align:center">
    <div style="width:80px;height:80px;border:2px solid ${p.accent};border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:20px">
      <i class="fa-solid fa-scissors" style="color:${p.accent};font-size:28px"></i>
    </div>
    <h1 style="font-family:'Noto Serif JP',serif;font-size:40px;font-weight:700;margin:0 0 8px;color:${p.text}">Atelier Aoi</h1>
    <p style="font-size:14px;opacity:.5;margin:0;letter-spacing:.1em">横浜市青葉区</p>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between">
    <div>
      <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:${p.accent};font-weight:700;margin-bottom:12px">次回ご予約カード</div>
      <div style="font-size:20px;font-weight:600;margin-bottom:4px">田中 様</div>
      <div style="font-size:14px;opacity:.5;margin-bottom:24px">担当: Rena Fujii</div>
      <div style="font-size:14px;opacity:.6;margin-bottom:6px">本日のご施術: Cut + Highlight</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <div style="padding:14px 18px;background:${p.surface};border-radius:8px;border-left:3px solid ${p.accent}">
        <div style="font-size:13px;opacity:.5;margin-bottom:4px">次回おすすめ</div>
        <div style="font-size:15px;font-weight:600">カラータッチアップ（6〜8週間後）</div>
      </div>
      <div style="padding:14px 18px;background:${p.surface};border-radius:8px;border-left:3px solid ${p.accent2}">
        <div style="font-size:13px;opacity:.5;margin-bottom:4px">月1回推奨</div>
        <div style="font-size:15px;font-weight:600">トリートメント</div>
      </div>
      <div style="font-size:13px;opacity:.5;text-align:center;margin-top:4px">
        TEL: 045-XXX-XXXX / LINE: @atelieraoi / 10:00〜20:00（火曜定休）
      </div>
    </div>
  </div>
</div>
${tail()}`;
  await saveDeck(deck(did,'サロン次回予約カード','サロン次回予約カード A5横印刷用',[{id:sid,title:'サロン次回予約カード'}],'a5-landscape','a5-landscape-salon-card'),{[sid]:html});
}

// ─── 13. instagram-post-beauty-tips ──────────────────────────────────────────
{
  const did = makeId(), sid = makeId();
  const p = PRESETS['split-pastel'];
  const tips = [
    {num:'01', text:'42℃以上のシャワー', sub:'頭皮乾燥の原因に'},
    {num:'02', text:'タオルで強くこすらない', sub:'キューティクル損傷リスク'},
    {num:'03', text:'濡れたまま梳かす', sub:'切れ毛・枝毛の原因'},
    {num:'04', text:'毎日アイロン（プロテクトなし）', sub:'熱ダメージが蓄積'},
    {num:'05', text:'毎日きつく結ぶ', sub:'牽引性脱毛のリスク'},
  ];
  const html = `${head('split-pastel', 'instagram-post')}
<div style="width:1080px;height:1080px;display:flex;flex-direction:column;padding:56px">
  <div style="margin-bottom:28px">
    <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${p.accent};font-weight:700;margin-bottom:6px">HAIR TIPS — Hana Skin Lab 皮膚科監修</div>
    <h1 style="font-family:'Outfit',sans-serif;font-size:32px;font-weight:800;line-height:1.25;margin:0;color:${p.text}">知らずにやっていた！<br>髪を傷める5つの習慣</h1>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;gap:12px">
    ${tips.map((t, i) => `<div style="display:flex;align-items:center;gap:16px;padding:14px 18px;background:${i%2===0?p.surface:p.bg};border-radius:8px;border:1px solid ${p.border}">
      <div style="min-width:40px;height:40px;background:${i<3?p.accent:p.accent2};color:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;flex-shrink:0">${t.num}</div>
      <div>
        <div style="font-size:17px;font-weight:700">${t.text}</div>
        <div style="font-size:13px;opacity:.55;margin-top:2px">${t.sub}</div>
      </div>
      <i class="fa-solid fa-triangle-exclamation" style="color:${p.accent};font-size:16px;margin-left:auto;opacity:.5"></i>
    </div>`).join('')}
  </div>
  <div style="margin-top:20px;font-size:13px;opacity:.5;text-align:center">@hanaskinlab · 皮膚科専門医監修</div>
</div>
${tail()}`;
  await saveDeck(deck(did,'美容豆知識','美容豆知識Instagram投稿',[{id:sid,title:'美容豆知識'}],'instagram-post','instagram-post-beauty-tips'),{[sid]:html});
}

console.log('\n✅ Batch 1 (FB + Beauty) 完了: 13 decks generated');
