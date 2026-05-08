/**
 * 有償版レポート表紙用プレミアム画像
 *
 * デザイン方針:
 * - 抽象幾何 / エディトリアルデザイン（McKinsey / HBR 系）
 * - Optiens ブランドカラー（ディープラピス + 桜）
 * - 人物・顔・ロゴ・文字なし
 * - 静謐で知的な印象
 *
 * 出力: tmp/optiens-paid-cover.png (1024x1024)
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
const OUT_PATH = resolve(__dirname, '../tmp/optiens-paid-cover.png');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const prompt = `An abstract editorial design illustration for a premium business intelligence report cover.

STYLE:
- Sophisticated, minimal, McKinsey/Harvard Business Review aesthetic
- Architectural composition with geometric precision
- Editorial design quality, like a premium financial publication

COMPOSITION:
- Abstract geometric shapes: thin lines, minimal forms, intersecting circles or arcs
- Layered architectural elements suggesting "structure", "analysis", "depth"
- Asymmetric balance with strong negative space
- Clean, refined, NO clutter

COLOR PALETTE (strict):
- Background: pure off-white (#FAFAFA) or very light cream
- Primary: deep lapis lazuli blue (#1F3A93) - dominant
- Accent: cherry blossom pink (#E48A95) - sparse, precise
- Subtle: light gray (#E5E7EB) for secondary lines
- NO other colors

MOOD:
- Quiet sophistication, not loud or flashy
- Professional, premium, restrained
- Suggests: depth, analysis, careful thought, expertise
- Like the cover of a high-end consulting white paper

STRICT EXCLUSIONS:
- NO people, NO faces, NO hands, NO bodies
- NO text, NO letters, NO numbers, NO words
- NO logos, NO icons, NO ChatGPT/AI imagery
- NO photorealism, NO stock-photo style
- NO 3D effects, NO drop shadows, NO gradients except subtle
- NO bright/saturated colors beyond the brand palette

The image should feel like it could be on the cover of a premium consulting report, evoking quality and expertise through restraint and refinement.
`;

console.log('生成中: optiens-paid-cover.png');

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
