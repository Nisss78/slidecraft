import { docHead, TAIL } from './html-utils.js';
import type { SeedDocument } from './types.js';

const inputStyle = 'border-b-2 border-dotted border-slate-300 outline-none bg-transparent min-w-[200px] px-1';
const checkStyle = 'w-5 h-5 accent-teal-600';

export const hearingSheet: SeedDocument = {
  title: 'ヒアリングシート',
  description: '顧客要件定義用の構造化ヒアリングシート',
  sections: [
    {
      title: '表紙・基本情報',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-4xl font-bold text-teal-700 mb-2">ヒアリングシート</div>
  <div class="w-20 h-1 bg-teal-500 mb-2"></div>
  <div class="text-slate-500 mb-10">顧客要件定義用インタビューシート</div>
  <div class="bg-teal-50 rounded-2xl p-8 mb-8">
    <div class="text-lg font-bold text-teal-800 mb-4">基本情報</div>
    <div class="grid grid-cols-2 gap-6 text-slate-700">
      <div>顧客名: <input class="\${inputStyle} flex-1" placeholder="株式会社○○" /></div>
      <div>担当者: <input class="\${inputStyle} flex-1" placeholder="山田 太郎" /></div>
      <div>部署: <input class="\${inputStyle} flex-1" placeholder="情シス部" /></div>
      <div>実施日: <input class="\${inputStyle} flex-1" type="date" /></div>
    </div>
  </div>
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-slate-50 rounded-xl p-6 text-center"><div class="text-sm text-slate-500 mb-2">プロジェクト種別</div><div class="space-y-2 text-left text-sm"><label class="flex items-center gap-2"><input type="checkbox" class="\${checkStyle}"> 新規開発</label><label class="flex items-center gap-2"><input type="checkbox" class="\${checkStyle}"> リニューアル</label><label class="flex items-center gap-2"><input type="checkbox" class="\${checkStyle}"> AI導入</label></div></div>
    <div class="bg-slate-50 rounded-xl p-6 text-center"><div class="text-sm text-slate-500 mb-2">予算感</div><div class="space-y-2 text-left text-sm"><label class="flex items-center gap-2"><input type="checkbox" class="\${checkStyle}"> 〜500万</label><label class="flex items-center gap-2"><input type="checkbox" class="\${checkStyle}"> 500-1000万</label><label class="flex items-center gap-2"><input type="checkbox" class="\${checkStyle}"> 1000万〜</label></div></div>
    <div class="bg-slate-50 rounded-xl p-6 text-center"><div class="text-sm text-slate-500 mb-2">希望時期</div><div class="space-y-2 text-left text-sm"><label class="flex items-center gap-2"><input type="checkbox" class="\${checkStyle}"> 3ヶ月以内</label><label class="flex items-center gap-2"><input type="checkbox" class="\${checkStyle}"> 半年以内</label><label class="flex items-center gap-2"><input type="checkbox" class="\${checkStyle}"> 1年以内</label></div></div>
  </div>
</div>` + TAIL,
    },
    {
      title: '現状課題',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-3xl font-bold text-teal-700 mb-8">現状の課題・ペインポイント</div>
  <div class="space-y-8">
    <div class="bg-red-50 rounded-xl p-6"><div class="font-bold text-red-700 mb-3">Q1. 現在最も困っている業務課題は？</div><textarea class="w-full h-20 border border-slate-200 rounded-lg p-3 text-slate-700 outline-none" placeholder="例: 月次レポート作成に3日かかっている..."></textarea></div>
    <div class="bg-amber-50 rounded-xl p-6"><div class="font-bold text-amber-700 mb-3">Q2. 業務で一番時間がかかっている作業は？</div><textarea class="w-full h-20 border border-slate-200 rounded-lg p-3 text-slate-700 outline-none" placeholder="例: データの手入力、確認作業..."></textarea></div>
    <div class="bg-blue-50 rounded-xl p-6"><div class="font-bold text-blue-700 mb-3">Q3. 現在のシステムで不満な点は？</div><textarea class="w-full h-20 border border-slate-200 rounded-lg p-3 text-slate-700 outline-none" placeholder="例: 操作が複雑、レスポンスが遅い..."></textarea></div>
  </div>
</div>` + TAIL,
    },
    {
      title: '要望・希望',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-3xl font-bold text-teal-700 mb-8">要望・希望</div>
  <div class="space-y-6">
    <div class="bg-teal-50 rounded-xl p-6"><div class="font-bold text-teal-800 mb-3">Q4. 新システムで実現したいことは？</div><textarea class="w-full h-20 border border-slate-200 rounded-lg p-3 text-slate-700 outline-none"></textarea></div>
    <div class="bg-teal-50 rounded-xl p-6"><div class="font-bold text-teal-800 mb-3">Q5. 必須機能の優先順位（高・中・低）</div>
      <div class="space-y-2 text-sm"><div class="flex items-center gap-4">1. <input class="\${inputStyle} flex-1" placeholder="機能名" /> <select class="border border-slate-200 rounded px-3 py-1"><option>高</option><option>中</option><option>低</option></select></div><div class="flex items-center gap-4">2. <input class="\${inputStyle} flex-1" placeholder="機能名" /> <select class="border border-slate-200 rounded px-3 py-1"><option>高</option><option>中</option><option>低</option></select></div><div class="flex items-center gap-4">3. <input class="\${inputStyle} flex-1" placeholder="機能名" /> <select class="border border-slate-200 rounded px-3 py-1"><option>高</option><option>中</option><option>低</option></select></div></div>
    </div>
    <div class="bg-teal-50 rounded-xl p-6"><div class="font-bold text-teal-800 mb-3">Q6. 利用ユーザー数と属性</div><textarea class="w-full h-16 border border-slate-200 rounded-lg p-3 text-slate-700 outline-none" placeholder="例: 社員200名 + 外部パートナー50名"></textarea></div>
  </div>
</div>` + TAIL,
    },
    {
      title: '技術環境',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-3xl font-bold text-teal-700 mb-8">技術環境・制約条件</div>
  <div class="grid grid-cols-2 gap-6">
    <div class="bg-slate-50 rounded-xl p-6"><div class="font-bold text-slate-700 mb-3">Q7. 現在のインフラ環境</div><textarea class="w-full h-16 border border-slate-200 rounded-lg p-3 text-slate-700 outline-none" placeholder="AWS / Azure / オンプレミス"></textarea></div>
    <div class="bg-slate-50 rounded-xl p-6"><div class="font-bold text-slate-700 mb-3">Q8. セキュリティ要件</div><textarea class="w-full h-16 border border-slate-200 rounded-lg p-3 text-slate-700 outline-none" placeholder="ISMS、個人情報保護、等"></textarea></div>
    <div class="bg-slate-50 rounded-xl p-6"><div class="font-bold text-slate-700 mb-3">Q9. 連携が必要な既存システム</div><textarea class="w-full h-16 border border-slate-200 rounded-lg p-3 text-slate-700 outline-none" placeholder="Salesforce、kintone、等"></textarea></div>
    <div class="bg-slate-50 rounded-xl p-6"><div class="font-bold text-slate-700 mb-3">Q10. 稼働時間・SLA要件</div><textarea class="w-full h-16 border border-slate-200 rounded-lg p-3 text-slate-700 outline-none" placeholder="24/7 / 平日9-18時 / 99.9%"></textarea></div>
  </div>
</div>` + TAIL,
    },
    {
      title: 'まとめ・次回アクション',
      html: docHead() + `
<div class="w-[1920px] h-[1080px] bg-white p-20">
  <div class="text-3xl font-bold text-teal-700 mb-8">まとめ・次回アクション</div>
  <div class="space-y-6">
    <div class="bg-teal-50 rounded-xl p-6"><div class="font-bold text-teal-800 mb-3">ヒアリング総括</div><textarea class="w-full h-24 border border-slate-200 rounded-lg p-3 text-slate-700 outline-none" placeholder="本日のヒアリングで判明した重要事項をまとめてください"></textarea></div>
    <div class="bg-blue-50 rounded-xl p-6"><div class="font-bold text-blue-800 mb-3">次回アクション</div>
      <div class="space-y-3 text-sm"><div class="flex items-center gap-4"><div class="text-slate-500 w-20">担当:</div><input class="\${inputStyle} flex-1" placeholder="山田" /></div><div class="flex items-center gap-4"><div class="text-slate-500 w-20">期限:</div><input class="\${inputStyle} flex-1" type="date" /></div><div class="flex items-center gap-4"><div class="text-slate-500 w-20">内容:</div><input class="\${inputStyle} flex-1" placeholder="要件定義書ドラフト提出" /></div></div>
    </div>
    <div class="flex justify-end gap-6 mt-8 text-sm text-slate-500"><div>記入者: <input class="\${inputStyle}" placeholder="署名" /></div><div>承認者: <input class="\${inputStyle}" placeholder="署名" /></div></div>
  </div>
</div>` + TAIL,
    },
  ],
};
