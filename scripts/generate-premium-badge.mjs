/**
 * 有償版表紙用プレミアムバッジアイコン
 *
 * デザイン: ミニマルなメダリオン / シール（ワックスシール風だが洗練）
 * - 円形 or 六角形
 * - ラピス + 桜 + ゴールド微量
 * - 中央に「P」or 星 or 抽象シンボル
 *
 * 出力: tmp/optiens-premium-badge.png (512x512)
 */
import OpenAI from 'openai';
import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=]+?)=(.*)$/);
    if (m) {
      const k = m[1].trim();
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (v) process.env[k] = v;
    }
  });
} catch {}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../tmp/optiens-premium-badge.png');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prompt = `A minimal premium badge icon for a business consulting report cover.

DESIGN:
- Octagonal medallion shape (subtle 8-sided polygon, refined geometric)
- Outer thin ring in deep lapis blue (#1F3A93)
- Inner negative space (light cream/off-white)
- Center: a single capital letter "P" in deep lapis blue, serif typography (think Bodoni or Didot - elegant editorial serif)
- Tiny cherry blossom pink (#E48A95) dot or accent at the top of the medallion (12 o'clock position)
- Thin metallic gold (#C9A961) inner accent ring (very subtle)

STYLE:
- McKinsey / Harvard Business Review aesthetic
- Sophisticated, minimal, not ornate
- Editorial design quality
- Like a small foil-stamped seal on a premium publication
- Clean geometric vector quality

LAYOUT:
- Centered on transparent background (or pure white)
- Square 1:1 composition
- Generous negative space around the medallion (medallion takes ~70% of canvas)
- Symmetrical and balanced

STRICT EXCLUSIONS:
- NO ornate decorations, NO scrolls, NO laurels, NO crowns
- NO photorealism, NO 3D effects, NO drop shadows
- NO ribbons, NO banners, NO curls
- NO text other than the single letter "P"
- NO additional words or numbers
- The design should be UNDERSTATED, not flashy

The badge should feel like it could be embossed on the cover of a Tom Ford monograph or a Berghaus McKinsey report.
`;

console.log('生成中: optiens-premium-badge.png');

const response = await client.images.generate({
  model: 'gpt-image-2',
  prompt,
  size: '1024x1024',
  quality: 'high',
  n: 1,
});

const b64 = response.data[0].b64_json;
writeFileSync(OUT_PATH, Buffer.from(b64, 'base64'));
console.log(`✓ 保存完了: ${OUT_PATH}`);
