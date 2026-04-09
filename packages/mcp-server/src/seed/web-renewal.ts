import { docHead, TAIL } from './html-utils.js';
import type { SeedDocument } from './types.js';

export const webRenewal: SeedDocument = {
  title: 'Webサイトリニューアル企画書',
  description: '企業Webサイトのリニューアル企画・提案書',
  sections: [
    {
      title: '表紙',
      html: docHead('<style>body{background:linear-gradient(135deg,#064e3b 0%,#059669 100%);color:#fff}</style>') + `
<div class="w-[1920px] h-[1080px] flex flex-col items-center justify-center">
  <div class="text-7xl font-black tracking-tight mb-6">Webサイトリニューアル企画書</div>
  <div class="w-32 h-1 bg-white/40 mb-8"></div>
  <div class="text-2xl font-light opacity-80 mb-2">ABC商事株式会社 様</div>
  <div class="text-lg opacity-60">デジタルクリエイティブ事業部</div>
</div>` + TAIL,
    },
    {
      title: 'プロジェクト概要',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-4xl font-bold text-slate-800 mb-2">プロジェクト概要</div>
  <div class="w-20 h-1 bg-emerald-600 mb-10"></div>
  <div class="grid grid-cols-2 gap-8">
    <div class="bg-emerald-50 rounded-2xl p-8">
      <div class="text-sm text-emerald-700 font-semibold mb-2">目的</div>
      <div class="text-lg text-slate-800">コーポレートサイトの全面リニューアルによるブランド力向上とコンバージョン率改善</div>
    </div>
    <div class="bg-slate-50 rounded-2xl p-8">
      <div class="text-sm text-slate-500 font-semibold mb-2">期間</div>
      <div class="text-lg text-slate-800">2026年5月〜2026年10月(6ヶ月)</div>
    </div>
    <div class="bg-slate-50 rounded-2xl p-8">
      <div class="text-sm text-slate-500 font-semibold mb-2">目標KPI</div>
      <div class="text-lg text-slate-800">CV率 200%UP / 直帰率 30%改善 / 月間PV 150%UP</div>
    </div>
    <div class="bg-emerald-50 rounded-2xl p-8">
      <div class="text-sm text-emerald-700 font-semibold mb-2">予算</div>
      <div class="text-lg text-slate-800">850万円(税抜)</div>
    </div>
  </div>
</div>` + TAIL,
    },
    {
      title: '現サイトの課題',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-4xl font-bold text-slate-800 mb-2">現サイトの課題</div>
  <div class="w-20 h-1 bg-red-500 mb-10"></div>
  <div class="grid grid-cols-3 gap-8">
    <div class="bg-red-50 rounded-2xl p-8 border-l-4 border-red-500">
      <div class="text-2xl font-bold text-red-600 mb-3">デザイン</div>
      <div class="text-slate-600">2019年から更新なし。古いデザインがブランドイメージを低下させている。</div>
    </div>
    <div class="bg-orange-50 rounded-2xl p-8 border-l-4 border-orange-500">
      <div class="text-2xl font-bold text-orange-600 mb-3">UX</div>
      <div class="text-slate-600">ナビゲーションが複雑で、ユーザーが求める情報にたどり着けない。</div>
    </div>
    <div class="bg-yellow-50 rounded-2xl p-8 border-l-4 border-yellow-500">
      <div class="text-2xl font-bold text-yellow-600 mb-3">モバイル</div>
      <div class="text-slate-600">モバイル表示に問題があり、スマホからの離脱率が78%と極めて高い。</div>
    </div>
    <div class="bg-blue-50 rounded-2xl p-8 border-l-4 border-blue-500">
      <div class="text-2xl font-bold text-blue-600 mb-3">SEO</div>
      <div class="text-slate-600">Core Web Vitalsスコアが低く、検索順位が低下傾向。</div>
    </div>
    <div class="bg-purple-50 rounded-2xl p-8 border-l-4 border-purple-500">
      <div class="text-2xl font-bold text-purple-600 mb-3">CMS</div>
      <div class="text-slate-600">更新に専門知識が必要で、コンテンツ更新が滞っている。</div>
    </div>
    <div class="bg-slate-50 rounded-2xl p-8 border-l-4 border-slate-400">
      <div class="text-2xl font-bold text-slate-600 mb-3">セキュリティ</div>
      <div class="text-slate-600">SSL設定やセキュリティパッチが不十分。</div>
    </div>
  </div>
</div>` + TAIL,
    },
    {
      title: 'リニューアル方針',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-gradient-to-br from-emerald-50 to-teal-50 p-20">
  <div class="text-4xl font-bold text-slate-800 mb-2">リニューアル方針</div>
  <div class="w-20 h-1 bg-emerald-600 mb-10"></div>
  <div class="space-y-6">
    <div class="bg-white rounded-2xl p-8 shadow flex items-center gap-8">
      <div class="text-5xl font-black text-emerald-200">01</div>
      <div><div class="text-xl font-bold text-slate-800 mb-1">モバイルファースト設計</div><div class="text-slate-600">レスポンシブデザインで全デバイスに最適化。モバイルUXを最優先。</div></div>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow flex items-center gap-8">
      <div class="text-5xl font-black text-emerald-200">02</div>
      <div><div class="text-xl font-bold text-slate-800 mb-1">Next.js + Headless CMS</div><div class="text-slate-600">高速レンダリングと容易なコンテンツ更新を実現するモダンスタック。</div></div>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow flex items-center gap-8">
      <div class="text-5xl font-black text-emerald-200">03</div>
      <div><div class="text-xl font-bold text-slate-800 mb-1">コンバージョン最適化</div><div class="text-slate-600">A/Bテスト可能な導線設計とCTA最適化で問い合わせ数を最大化。</div></div>
    </div>
  </div>
</div>` + TAIL,
    },
    {
      title: 'スケジュール・費用',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-4xl font-bold text-slate-800 mb-2">スケジュール・費用</div>
  <div class="w-20 h-1 bg-emerald-600 mb-10"></div>
  <div class="grid grid-cols-5 gap-4 mb-12">
    <div class="bg-emerald-600 text-white rounded-xl p-4 text-center"><div class="font-bold">要件定義</div><div class="text-sm opacity-70">5月</div></div>
    <div class="bg-emerald-500 text-white rounded-xl p-4 text-center"><div class="font-bold">デザイン</div><div class="text-sm opacity-70">6-7月</div></div>
    <div class="bg-teal-500 text-white rounded-xl p-4 text-center"><div class="font-bold">開発</div><div class="text-sm opacity-70">7-9月</div></div>
    <div class="bg-cyan-500 text-white rounded-xl p-4 text-center"><div class="font-bold">テスト</div><div class="text-sm opacity-70">9-10月</div></div>
    <div class="bg-blue-500 text-white rounded-xl p-4 text-center"><div class="font-bold">本番公開</div><div class="text-sm opacity-70">10月</div></div>
  </div>
  <table class="w-full"><thead><tr class="border-b-2 border-slate-200"><th class="py-3 text-left text-sm text-slate-500">項目</th><th class="py-3 text-right text-sm text-slate-500">金額</th></tr></thead>
  <tbody class="text-slate-800">
    <tr class="border-b border-slate-100"><td class="py-3">戦略立案・要件定義</td><td class="py-3 text-right font-mono">100万円</td></tr>
    <tr class="border-b border-slate-100"><td class="py-3">UI/UXデザイン</td><td class="py-3 text-right font-mono">200万円</td></tr>
    <tr class="border-b border-slate-100"><td class="py-3">フロントエンド開発</td><td class="py-3 text-right font-mono">300万円</td></tr>
    <tr class="border-b border-slate-100"><td class="py-3">CMS構築・コンテンツ移行</td><td class="py-3 text-right font-mono">150万円</td></tr>
    <tr class="border-b border-slate-100"><td class="py-3">テスト・運用支援</td><td class="py-3 text-right font-mono">100万円</td></tr>
  </tbody></table>
  <div class="mt-6 bg-emerald-50 rounded-xl p-4 flex justify-between items-center"><span class="text-slate-600">総額(税抜)</span><span class="text-2xl font-black text-emerald-600">850万円</span></div>
</div>` + TAIL,
    },
  ],
};
