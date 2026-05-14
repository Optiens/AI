/**
 * 有償版レポート表紙用カバー画像
 *
 * デザイン方針:
 * - Webサイト準拠の Optiens ブランドカラーに統一
 * - 人物・顔・ロゴ・文字なし
 * - AI 生成ではなく、再現性のある SVG → PNG 生成
 *
 * 出力: tmp/optiens-paid-cover.png (1024x1024)
 */
import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../tmp/optiens-paid-cover.png');

const svg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#FAFCFB"/>
  <rect x="0" y="0" width="1024" height="1024" fill="#FAFCFB"/>

  <g opacity="0.18" stroke="#DDE7E4" stroke-width="2" fill="none">
    <circle cx="678" cy="278" r="242"/>
    <circle cx="678" cy="278" r="154"/>
    <circle cx="212" cy="736" r="270"/>
    <path d="M88 226H938"/>
    <path d="M108 804H914"/>
    <path d="M762 64V958"/>
  </g>

  <g fill="none" stroke-linecap="round">
    <path d="M264 774C416 662 490 532 486 382C482 262 548 178 662 130" stroke="#1F3A93" stroke-width="42"/>
    <path d="M476 622C590 562 660 482 686 382C708 298 764 238 856 198" stroke="#6B85C9" stroke-width="24"/>
    <path d="M252 774C394 734 512 746 606 810" stroke="#E48A95" stroke-width="16"/>
  </g>

  <g fill="#1F3A93">
    <rect x="104" y="676" width="176" height="176" rx="0" opacity="0.95"/>
    <rect x="736" y="144" width="116" height="116" rx="0" opacity="0.92"/>
  </g>

  <g fill="#6B85C9">
    <rect x="296" y="596" width="128" height="128" rx="0" opacity="0.78"/>
    <rect x="822" y="286" width="72" height="72" rx="0" opacity="0.84"/>
  </g>

  <g fill="#E48A95">
    <circle cx="640" cy="812" r="22"/>
    <circle cx="864" cy="188" r="14"/>
    <rect x="214" y="812" width="46" height="46" rx="0"/>
  </g>

  <g stroke="#1F3A93" stroke-width="3" opacity="0.42" fill="none">
    <path d="M88 852L936 126"/>
    <path d="M104 674L640 812"/>
    <path d="M736 144L864 188"/>
  </g>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT_PATH);
console.log(`✓ 保存完了: ${OUT_PATH}`);
