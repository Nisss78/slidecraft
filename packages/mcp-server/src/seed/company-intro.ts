import { docHead, TAIL } from './html-utils.js';
import type { SeedDocument } from './types.js';

export const companyIntro: SeedDocument = {
  title: '会社・サービス紹介',
  description: '自社の会社概要とサービスラインナップの紹介資料',
  sections: [
    {
      title: '表紙',
      html: docHead('<style>body{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#fff}</style>') + `
<div class="w-[1920px] h-[1080px] flex flex-col items-center justify-center">
  <div class="text-7xl font-black tracking-tight mb-6">会社紹介</div>
  <div class="w-32 h-1 bg-blue-400/40 mb-8"></div>
  <div class="text-2xl font-light opacity-80">株式会社テクノバーン</div>
</div>` + TAIL,
    },
    {
      title: '会社概要',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-4xl font-bold text-slate-800 mb-10">会社概要</div>
  <div class="grid grid-cols-2 gap-12">
    <table class="text-slate-700"><tbody>
      <tr class="border-b border-slate-100"><td class="py-4 text-slate-500 w-40">社名</td><td class="py-4 font-semibold">株式会社テクノバーン</td></tr>
      <tr class="border-b border-slate-100"><td class="py-4 text-slate-500">設立</td><td class="py-4">2018年4月</td></tr>
      <tr class="border-b border-slate-100"><td class="py-4 text-slate-500">代表取締役</td><td class="py-4">山田 太郎</td></tr>
      <tr class="border-b border-slate-100"><td class="py-4 text-slate-500">資本金</td><td class="py-4">1,000万円</td></tr>
      <tr class="border-b border-slate-100"><td class="py-4 text-slate-500">従業員数</td><td class="py-4">45名</td></tr>
      <tr><td class="py-4 text-slate-500">所在地</td><td class="py-4">東京都渋谷区神宮前5-10-1</td></tr>
    </tbody></table>
    <div class="bg-slate-50 rounded-2xl p-8">
      <div class="text-lg font-bold text-slate-800 mb-4">ミッション</div>
      <div class="text-2xl font-bold text-blue-600 mb-4">"テクノロジーでビジネスの常識を変える"</div>
      <div class="text-slate-600">AIとデータサイエンスを活用し、企業のDXを支援するプロフェッショナル集団です。</div>
    </div>
  </div>
</div>` + TAIL,
    },
    {
      title: 'サービスラインナップ',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-gradient-to-br from-slate-50 to-blue-50 p-20">
  <div class="text-4xl font-bold text-slate-800 mb-10">サービスラインナップ</div>
  <div class="grid grid-cols-3 gap-6">
    <div class="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-blue-500">
      <div class="text-xl font-bold text-slate-800 mb-2">AI導入コンサルティング</div>
      <div class="text-sm text-slate-500 mb-4">AIの活用戦略策定から導入支援まで</div>
      <div class="text-2xl font-black text-blue-600">300万円〜</div>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-emerald-500">
      <div class="text-xl font-bold text-slate-800 mb-2">Webアプリ開発</div>
      <div class="text-sm text-slate-500 mb-4">Next.js/Reactベースのモダン開発</div>
      <div class="text-2xl font-black text-emerald-600">500万円〜</div>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-purple-500">
      <div class="text-xl font-bold text-slate-800 mb-2">データ分析基盤構築</div>
      <div class="text-sm text-slate-500 mb-4">BI/DWH構築からダッシュボード開発</div>
      <div class="text-2xl font-black text-purple-600">400万円〜</div>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-amber-500">
      <div class="text-xl font-bold text-slate-800 mb-2">RPA導入支援</div>
      <div class="text-sm text-slate-500 mb-4">業務自動化の企画から運用保守まで</div>
      <div class="text-2xl font-black text-amber-600">200万円〜</div>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-rose-500">
      <div class="text-xl font-bold text-slate-800 mb-2">デザイン制作</div>
      <div class="text-sm text-slate-500 mb-4">UI/UXデザインからブランディング</div>
      <div class="text-2xl font-black text-rose-600">150万円〜</div>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-cyan-500">
      <div class="text-xl font-bold text-slate-800 mb-2">保守運用サービス</div>
      <div class="text-sm text-slate-500 mb-4">24/7監視・障害対応・改善支援</div>
      <div class="text-2xl font-black text-cyan-600">月額30万円〜</div>
    </div>
  </div>
</div>` + TAIL,
    },
    {
      title: '導入実績',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-4xl font-bold text-slate-800 mb-10">導入実績</div>
  <div class="grid grid-cols-4 gap-6 mb-10">
    <div class="text-center p-6"><div class="text-5xl font-black text-blue-600">120</div><div class="text-slate-500 mt-2">導入企業数</div></div>
    <div class="text-center p-6"><div class="text-5xl font-black text-emerald-600">98%</div><div class="text-slate-500 mt-2">顧客満足度</div></div>
    <div class="text-center p-6"><div class="text-5xl font-black text-purple-600">45</div><div class="text-slate-500 mt-2">プロフェッショナル</div></div>
    <div class="text-center p-6"><div class="text-5xl font-black text-amber-600">7年</div><div class="text-slate-500 mt-2">事業継続年数</div></div>
  </div>
  <div class="bg-slate-50 rounded-2xl p-8">
    <div class="text-lg font-bold text-slate-800 mb-4">主要取引先(一部)</div>
    <div class="text-slate-600">株式会社ABCホールディングス / 〇〇銀行 / △△製薬 / 株式会社XYZシステムズ / 〇〇大学 ほか</div>
  </div>
</div>` + TAIL,
    },
    {
      title: 'お問い合わせ',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex flex-col items-center justify-center">
  <div class="text-5xl font-black mb-6">お気軽にご相談ください</div>
  <div class="w-24 h-1 bg-white/30 mb-8"></div>
  <div class="text-xl opacity-80 mb-2">株式会社テクノバーン</div>
  <div class="text-lg opacity-60 mb-8">AIソリューション事業部</div>
  <div class="flex gap-12 text-center">
    <div><div class="text-sm opacity-60 mb-1">TEL</div><div class="text-xl font-semibold">03-1234-5678</div></div>
    <div><div class="text-sm opacity-60 mb-1">MAIL</div><div class="text-xl font-semibold">info@technobarn.example</div></div>
  </div>
</div>` + TAIL,
    },
  ],
};
