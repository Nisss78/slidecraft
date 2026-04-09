import { docHead, TAIL } from './html-utils.js';
import type { SeedDocument } from './types.js';

export const aiProposal: SeedDocument = {
  title: 'AI導入提案書',
  description: 'クライアント企業向けのAI導入支援提案書',
  sections: [
    {
      title: '表紙',
      html: docHead('<style>body{background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);color:#fff}</style>') + `
<div class="w-[1920px] h-[1080px] flex flex-col items-center justify-center relative">
  <div class="absolute top-12 right-16 text-right text-sm opacity-60">2026年4月</div>
  <div class="text-7xl font-black tracking-tight mb-6">AI導入提案書</div>
  <div class="w-32 h-1 bg-white/40 mb-8"></div>
  <div class="text-2xl font-light opacity-80 mb-2">株式会社テクノバーン 様</div>
  <div class="text-lg opacity-60">AIソリューション事業部</div>
  <div class="absolute bottom-16 text-sm opacity-40">CONFIDENTIAL</div>
</div>` + TAIL,
    },
    {
      title: 'エグゼクティブサマリー',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-4xl font-bold text-slate-800 mb-2">エグゼクティブサマリー</div>
  <div class="w-20 h-1 bg-blue-600 mb-10"></div>
  <div class="grid grid-cols-2 gap-8">
    <div class="bg-blue-50 rounded-2xl p-8">
      <div class="text-sm text-blue-600 font-semibold mb-2">PROJECT GOAL</div>
      <div class="text-xl font-bold text-slate-800">業務プロセスのAI化による<br>生産性40%向上</div>
    </div>
    <div class="bg-emerald-50 rounded-2xl p-8">
      <div class="text-sm text-emerald-600 font-semibold mb-2">EXPECTED ROI</div>
      <div class="text-xl font-bold text-slate-800">投資額回収期間<br>18ヶ月</div>
    </div>
    <div class="bg-amber-50 rounded-2xl p-8">
      <div class="text-sm text-amber-600 font-semibold mb-2">TIMELINE</div>
      <div class="text-xl font-bold text-slate-800">フェーズ1: 3ヶ月<br>フェーズ2: 6ヶ月</div>
    </div>
    <div class="bg-purple-50 rounded-2xl p-8">
      <div class="text-sm text-purple-600 font-semibold mb-2">BUDGET</div>
      <div class="text-xl font-bold text-slate-800">総額 2,400万円<br>(税抜)</div>
    </div>
  </div>
</div>` + TAIL,
    },
    {
      title: '現状課題の分析',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-4xl font-bold text-slate-800 mb-2">現状課題の分析</div>
  <div class="w-20 h-1 bg-red-500 mb-10"></div>
  <div class="space-y-6">
    <div class="flex items-start gap-6 bg-red-50 rounded-xl p-6">
      <div class="text-3xl font-black text-red-500">01</div>
      <div><div class="text-xl font-bold text-slate-800 mb-1">データ活用の不足</div><div class="text-slate-600">膨大な顧客データが蓄積されているが、分析に活用できていない。意思決定が属人的。</div></div>
    </div>
    <div class="flex items-start gap-6 bg-orange-50 rounded-xl p-6">
      <div class="text-3xl font-black text-orange-500">02</div>
      <div><div class="text-xl font-bold text-slate-800 mb-1">業務プロセスの非効率</div><div class="text-slate-600">手作業によるデータ入力・確認作業に月間200時間以上を費やしている。</div></div>
    </div>
    <div class="flex items-start gap-6 bg-yellow-50 rounded-xl p-6">
      <div class="text-3xl font-black text-yellow-500">03</div>
      <div><div class="text-xl font-bold text-slate-800 mb-1">競合とのデジタル格差</div><div class="text-slate-600">業界内でAI活用が進む競合他社との差が拡大しつつある。</div></div>
    </div>
  </div>
</div>` + TAIL,
    },
    {
      title: 'AI活用ソリューション',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-gradient-to-br from-blue-50 to-indigo-50 p-20">
  <div class="text-4xl font-bold text-slate-800 mb-2">AI活用ソリューション</div>
  <div class="w-20 h-1 bg-blue-600 mb-10"></div>
  <div class="grid grid-cols-3 gap-8">
    <div class="bg-white rounded-2xl p-8 shadow-lg">
      <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-2xl mb-4">🔍</div>
      <div class="text-xl font-bold text-slate-800 mb-2">データ分析AI</div>
      <div class="text-slate-600 text-sm">顧客行動予測・需要予測による経営意思決定支援</div>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow-lg">
      <div class="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mb-4">⚡</div>
      <div class="text-xl font-bold text-slate-800 mb-2">業務自動化RPA</div>
      <div class="text-slate-600 text-sm">定型業務の自動化により月間200時間の削減</div>
    </div>
    <div class="bg-white rounded-2xl p-8 shadow-lg">
      <div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-2xl mb-4">💬</div>
      <div class="text-xl font-bold text-slate-800 mb-2">AIチャットボット</div>
      <div class="text-slate-600 text-sm">24時間対応の顧客サポートと社内ヘルプデスク</div>
    </div>
  </div>
</div>` + TAIL,
    },
    {
      title: '導入ロードマップ',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-4xl font-bold text-slate-800 mb-2">導入ロードマップ</div>
  <div class="w-20 h-1 bg-blue-600 mb-10"></div>
  <div class="flex gap-4">
    <div class="flex-1 bg-blue-600 text-white rounded-2xl p-6">
      <div class="text-sm font-semibold opacity-70 mb-1">PHASE 1</div>
      <div class="text-xl font-bold mb-3">基盤構築</div>
      <div class="text-sm opacity-80">1-3ヶ月</div>
      <div class="mt-4 text-sm opacity-70">データ基盤構築<br>AIモデル選定<br>セキュリティ設計</div>
    </div>
    <div class="flex-1 bg-indigo-600 text-white rounded-2xl p-6">
      <div class="text-sm font-semibold opacity-70 mb-1">PHASE 2</div>
      <div class="text-xl font-bold mb-3">PoC実施</div>
      <div class="text-sm opacity-80">4-6ヶ月</div>
      <div class="mt-4 text-sm opacity-70">データ分析AI検証<br>RPAパイロット運用<br>効果測定</div>
    </div>
    <div class="flex-1 bg-purple-600 text-white rounded-2xl p-6">
      <div class="text-sm font-semibold opacity-70 mb-1">PHASE 3</div>
      <div class="text-xl font-bold mb-3">本番展開</div>
      <div class="text-sm opacity-80">7-9ヶ月</div>
      <div class="mt-4 text-sm opacity-70">全社展開<br>チャットボット導入<br>運用体制確立</div>
    </div>
    <div class="flex-1 bg-slate-700 text-white rounded-2xl p-6">
      <div class="text-sm font-semibold opacity-70 mb-1">PHASE 4</div>
      <div class="text-xl font-bold mb-3">最適化</div>
      <div class="text-sm opacity-80">10-12ヶ月</div>
      <div class="mt-4 text-sm opacity-70">モデル精度向上<br>追加ユースケース<br>継続改善</div>
    </div>
  </div>
</div>` + TAIL,
    },
    {
      title: '概算見積り',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-4xl font-bold text-slate-800 mb-2">概算見積り</div>
  <div class="w-20 h-1 bg-blue-600 mb-10"></div>
  <table class="w-full text-left">
    <thead><tr class="border-b-2 border-slate-200"><th class="py-4 text-slate-500 text-sm">項目</th><th class="py-4 text-slate-500 text-sm">内容</th><th class="py-4 text-slate-500 text-sm text-right">金額</th></tr></thead>
    <tbody class="text-slate-800">
      <tr class="border-b border-slate-100"><td class="py-4 font-semibold">データ基盤構築</td><td class="py-4">データレイク・DWH構築</td><td class="py-4 text-right font-mono">600万円</td></tr>
      <tr class="border-b border-slate-100"><td class="py-4 font-semibold">AIモデル開発</td><td class="py-4">分析AI・予測モデル開発</td><td class="py-4 text-right font-mono">800万円</td></tr>
      <tr class="border-b border-slate-100"><td class="py-4 font-semibold">RPA導入</td><td class="py-4">業務自動化ツール導入</td><td class="py-4 text-right font-mono">400万円</td></tr>
      <tr class="border-b border-slate-100"><td class="py-4 font-semibold">チャットボット</td><td class="py-4">AIチャットボット開発</td><td class="py-4 text-right font-mono">300万円</td></tr>
      <tr class="border-b border-slate-100"><td class="py-4 font-semibold">保守運用(1年)</td><td class="py-4">監視・保守・改善</td><td class="py-4 text-right font-mono">300万円</td></tr>
    </tbody>
  </table>
  <div class="mt-8 bg-blue-50 rounded-xl p-6 flex justify-between items-center">
    <div class="text-lg text-slate-600">総額(税抜)</div>
    <div class="text-3xl font-black text-blue-600">2,400万円</div>
  </div>
</div>` + TAIL,
    },
  ],
};
