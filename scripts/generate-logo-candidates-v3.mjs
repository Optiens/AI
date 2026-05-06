/**
 * Optiens 新ロゴ候補 v3 — 5案
 *
 * テーマ: Ensō（円相）哲学 × 3本柱（調和・最適化・循環）のハイブリッド
 * 色アサイン:
 *   - 調和 (Harmony)      = 紫 #A259FF
 *   - 最適化 (Optimization) = 青 #1ABCFE
 *   - 循環 (Circulation)   = 緑 #0ACF83
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
      const v = m[2].trim();
      if (v) process.env[k] = v;
    }
  });
} catch (e) {
  console.warn('.env not found, using existing env vars');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../public/images/logo-candidates');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('OPENAI_API_KEY が設定されていません');
  process.exit(1);
}

const client = new OpenAI({ apiKey: API_KEY });

const COMMON = `
LAYOUT (very important):
- Horizontal logo composition for a website header.
- LEFT THIRD: a square symbol/mark that can stand alone as a favicon (must be visually complete on its own when cropped).
- RIGHT TWO-THIRDS: the single word "Optiens" rendered as a clean modern wordmark.
- Generous negative space between symbol and wordmark.
- Pure white background (#FFFFFF), edge-to-edge, no frame.

WORDMARK SPECIFICATION:
- The exact word "Optiens" (capital O, lowercase p, t, i, e, n, s — 7 letters total).
- Modern geometric sans-serif typography (think Inter, SF Pro, Helvetica Now, or Söhne).
- Dark slate color (#0f172a), single line, well-balanced letter spacing.
- No taglines, no underlines, no other words.

PILLAR-COLOR ASSIGNMENT (must be respected):
- Harmony pillar      = vibrant purple (#A259FF)
- Optimization pillar = sky blue (#1ABCFE)
- Circulation pillar  = emerald green (#0ACF83)
- Each visual element corresponding to a pillar must use its assigned color.
- Optional dark slate (#0f172a) accent for a small core/center dot.

STRICT NEGATIVE CONSTRAINTS:
- Absolutely NO repeated text, NO illegible letterforms.
- NO Japanese characters, NO Chinese characters, NO foreign scripts.
- NO color codes, NO labels, NO annotations, NO callouts.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels, NO photo-realistic rendering.
- NO background patterns, NO frames, NO container shapes around the whole logo.
- NO recycle symbol, NO Olympic rings, NO clichéd icons.
`;

const candidates = [
  {
    filename: 'logo-v3-01-triple-enso.png',
    description: 'A. Triple Enso — 3色の円相が重なり上昇',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Triple Ensō ascending:
Three Ensō (zen brush circles), one in purple (harmony), one in sky blue (optimization),
one in emerald green (circulation). The three circles are slightly offset from each other
in a vertical stack, creating an ascending diagonal composition (bottom-left → top-right).
Each circle is drawn with a single confident calligraphic brush stroke, with the characteristic
gap of an Ensō. The brush strokes have natural variation in width, slightly textured edges,
suggesting a real ink brush. The three circles partially overlap so they read as one unified
mark while the three colors remain distinct.
Symbolizes: three pillars (harmony, optimization, circulation) layered into one ascending essence.
${COMMON}`,
  },
  {
    filename: 'logo-v3-02-enso-with-three-dots.png',
    description: 'B. 円相内に3つの種子',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ensō with three pillar seeds:
A single elegant Ensō (zen brush circle) in dark slate (#0f172a) with the characteristic
brush-stroke variation and small gap. Inside the circle, three small filled dots arranged
in a perfect equilateral triangle formation: one purple dot (harmony) at top, one sky blue
dot (optimization) at bottom-right, one emerald green dot (circulation) at bottom-left.
The dots are perfectly placed, slightly elevated to suggest they float within the circle.
The Ensō's gap is at the upper-right, suggesting openness and continued growth.
Symbolizes: the three pillars contained within the harmonious whole of the Ensō.
${COMMON}`,
  },
  {
    filename: 'logo-v3-03-three-spirals-forming-enso.png',
    description: 'C. 3螺旋が編み込まれてEnsōを形成',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Three spirals braided into one Ensō:
Three thin spirals (purple for harmony, sky blue for optimization, emerald green for circulation)
that braid together as they sweep around to form a single Ensō circle. The three colored
strands weave over and under each other smoothly along the circle's path, creating a
cord-like or braided rope effect. The circle has the characteristic Ensō gap in the upper-right.
Stroke weight is medium, feels both spiritual (Ensō) and structural (three threads).
Symbolizes: the three pillars woven into one continuous circle of practice.
${COMMON}`,
  },
  {
    filename: 'logo-v3-04-ascending-seed-in-enso.png',
    description: 'D. Ensō中央から上昇する3色の芽',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ensō with an ascending three-color sprout:
A clean Ensō circle in dark slate (#0f172a) with brush-stroke character. From the center
of the circle, three slim leaf shapes rise upward in a fan-like configuration:
the central leaf is sky blue (optimization, the straight upward path),
the left leaf is emerald green (circulation, growth),
the right leaf is purple (harmony, integration).
The three leaves emerge from a single small slate seed at the bottom-center of the circle.
The composition reads as "growth from the center of the circle".
Symbolizes: from harmonious cycle (Ensō), the three pillars sprout upward as a unified plant.
${COMMON}`,
  },
  {
    filename: 'logo-v3-05-layered-enso-rings.png',
    description: 'E. 三層の円相が同心で重なる',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Three concentric Ensō rings:
Three concentric Ensō circles, one inside the other. The outermost ring is purple (harmony),
the middle ring is sky blue (optimization), the innermost ring is emerald green (circulation).
Each ring is drawn as a brush-stroke Ensō with its own gap, and the gaps of the three rings
are deliberately positioned at different angles, so each ring's "opening" faces a different
direction (e.g., outer gap at upper-right, middle at upper-left, inner at bottom).
This creates visual rotation and depth. Stroke weight is medium for outer, slightly thinner
for middle and inner. Each ring is clearly its own Ensō, not just a concentric circle.
Symbolizes: the three pillars as nested layers — outer harmony contains optimization,
which contains the inner circulation.
${COMMON}`,
  },
];

async function generateImage(prompt, filename, description) {
  console.log(`\n[${description}] 生成中...`);
  try {
    const response = await client.images.generate({
      model: 'gpt-image-2',
      prompt,
      size: '1536x1024',
      quality: 'high',
      n: 1,
    });

    const b64 = response.data[0].b64_json;
    const outputPath = resolve(OUT_DIR, filename);
    writeFileSync(outputPath, Buffer.from(b64, 'base64'));
    console.log(`  ✓ 保存完了: ${filename}`);
  } catch (err) {
    console.error(`  ✗ エラー (${filename}):`, err.message);
    if (err.status) console.error(`    HTTPステータス: ${err.status}`);
  }
}

console.log(`生成先: ${OUT_DIR}`);
console.log(`v3 5案を順次生成します（各1〜2分・合計5〜10分）...`);

for (const c of candidates) {
  await generateImage(c.prompt, c.filename, c.description);
}

console.log('\n========================================');
console.log('v3 全5案の生成が完了しました。');
console.log('========================================');
