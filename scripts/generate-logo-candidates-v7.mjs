/**
 * Optiens 新ロゴ候補 v7 — 5案
 *
 * テーマ: ultra minimal — 2軸（Optimization × Ensō）を最小限の要素で
 * 装飾を削ぎ、2要素以下の構成
 *
 * 色アサイン:
 *   - 最適化 (Optimization) = 青 #1ABCFE
 *   - 円相 (Ensō)            = 紫 #A259FF
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
- LEFT THIRD: a square symbol/mark that can stand alone as a favicon.
- RIGHT TWO-THIRDS: the single word "Optiens" rendered as a clean wordmark.
- Generous negative space between symbol and wordmark.
- Pure white background (#FFFFFF), edge-to-edge, no frame.

WORDMARK SPECIFICATION (typography must feel premium):
- The exact word "Optiens" (capital O, lowercase p, t, i, e, n, s — 7 letters total).
- Modern HUMANIST GEOMETRIC SANS-SERIF — Söhne, Aktiv Grotesk, General Sans, or Manrope style.
- Open apertures on 'e' and 's', slightly tall x-height, balanced curves.
- Medium weight (500), single line, balanced letter spacing.
- Color: dark slate (#0f172a). No taglines, no underlines.

TWO-AXIS COLOR ASSIGNMENT:
- Optimization axis = sky blue (#1ABCFE)
- Ensō axis        = vibrant purple (#A259FF)
- DO NOT use green, red, orange, or any third color.

DESIGN PHILOSOPHY (must follow):
- ULTRA MINIMAL — fewer elements is always better.
- Maximum 2 visual elements (or 1 unified element that reads as 2 meanings).
- NO brush texture flourishes unless explicitly requested in the concept.
- NO arrowheads, NO multiple dots, NO spirals inside, NO patterns.
- Think Apple logo simplicity, Slack 2019 minimal, Notion N, Linear arrow simplicity.
- White space is a primary design element. Empty is good.

STRICT NEGATIVE CONSTRAINTS:
- NO repeated text, NO illegible letterforms.
- NO Japanese characters, NO foreign scripts.
- NO color codes, NO labels, NO annotations.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels, NO gradients on the symbol unless specified.
- NO three-strand braids, NO triple helix, NO multiple petals.
`;

const candidates = [
  {
    filename: 'logo-v7-01-thin-enso-accent-dot.png',
    description: 'A. 細い円相＋切れ目の青ドット',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ultra-minimal: Thin Ensō with a single accent dot:
A perfectly clean thin geometric circle in vibrant purple (#A259FF) — NOT a brush stroke,
but a precise smooth vector ring. The ring has a small gap (about 25 degrees of opening)
at the upper-right position. Stroke width is medium-thin and consistent throughout.
At the gap, exactly one small solid sky blue (#1ABCFE) dot, positioned just where
the gap is, sized about 1/8 of the circle's diameter.
That's it. Nothing else. The center of the circle is pure empty white space.

Total elements: 2 (purple ring + blue dot). No other marks.
${COMMON}`,
  },
  {
    filename: 'logo-v7-02-single-open-curve.png',
    description: 'B. 一筆の開いた曲線（テーパー＆2色グラデ）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ultra-minimal: Single open curve, one stroke:
A single confident calligraphic stroke that traces about 270 degrees of a circle
(an Ensō opened wider than usual). The stroke is thick at the start and gradually
tapers to a thin point at the end.
The stroke uses a smooth color gradient along its length: vibrant purple (#A259FF)
at the thick beginning, transitioning smoothly to sky blue (#1ABCFE) at the tapered tip.
NO arrowhead. NO additional elements. Just one line.
The opening of the curve is at the upper-right.

Total elements: 1 (the single gradient stroke). Center is pure empty white space.
${COMMON}`,
  },
  {
    filename: 'logo-v7-03-concentric-circle-and-dot.png',
    description: 'C. 同心：紫の細い円＋中心の青ドット',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ultra-minimal: Concentric Ensō with a centered optimization dot:
A perfect thin clean geometric circle (vector, not brush) in vibrant purple (#A259FF),
with NO gap — a complete closed circle. Stroke is medium-thin and uniform.
At the exact geometric center of the circle, a single small solid sky blue (#1ABCFE)
dot, sized about 1/6 of the circle's diameter.

Total elements: 2 (purple ring + blue center dot). Highly geometric, perfectly balanced.
Reads as: "the optimal core within the harmonious whole".
${COMMON}`,
  },
  {
    filename: 'logo-v7-04-crescent-and-dot.png',
    description: 'D. 紫の三日月＋右に青ドット',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ultra-minimal: Crescent and orbiting dot:
A clean thin crescent shape (a circle with a wider opening — about 90 degrees of gap)
in vibrant purple (#A259FF), opening to the right (gap at the right side, like a "C" shape).
Just to the right of the crescent, in the empty space where the circle would have closed,
a single solid sky blue (#1ABCFE) dot, positioned as if it were "orbiting" the crescent.
The dot is sized about 1/8 of the crescent's height.

Total elements: 2 (purple crescent + blue dot). Reads like a moon and a bright star,
or an open Ensō with the next moment captured.
${COMMON}`,
  },
  {
    filename: 'logo-v7-05-half-circle-stack.png',
    description: 'E. 紫の半円＋下に青の水平線',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ultra-minimal: Half-circle resting on a horizontal line:
A clean thin half-circle (the upper half, like a dome or a sunrise arc) in
vibrant purple (#A259FF), drawn as a precise vector curve, not a brush stroke.
Just below the half-circle, with a small breathing gap, a single thin horizontal line
in sky blue (#1ABCFE), the same width as the half-circle's diameter.
The composition reads as a horizon: an arc rising above a clean baseline.

Total elements: 2 (purple arc + blue line). Reads as: cyclical wholeness above
the optimized path.
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
console.log(`v7 5案を順次生成します（各1〜2分・合計5〜10分）...`);

for (const c of candidates) {
  await generateImage(c.prompt, c.filename, c.description);
}

console.log('\n========================================');
console.log('v7 全5案の生成が完了しました。');
console.log('========================================');
