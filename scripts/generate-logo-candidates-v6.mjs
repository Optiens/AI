/**
 * Optiens 新ロゴ候補 v6 — 5案
 *
 * テーマ: 原点回帰 — 社名由来の2軸（Optimization × Ensō）のみで構成
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

WORDMARK SPECIFICATION (typography must feel premium, not generic):
- The exact word "Optiens" (capital O, lowercase p, t, i, e, n, s — 7 letters total).
- Modern HUMANIST GEOMETRIC SANS-SERIF — Söhne, Aktiv Grotesk, General Sans, or Manrope style.
- Open apertures on 'e' and 's', slightly tall x-height, balanced curves with a hint of warmth.
- Medium-bold weight (500–600), single line, balanced letter spacing.
- Color: dark slate (#0f172a). No taglines, no underlines.

TWO-AXIS COLOR ASSIGNMENT (must be respected):
- Optimization axis = sky blue (#1ABCFE)
- Ensō axis        = vibrant purple (#A259FF)
- Optional dark slate (#0f172a) for the wordmark only.
- DO NOT use green or any third color.

STRICT NEGATIVE CONSTRAINTS:
- Absolutely NO repeated text, NO illegible letterforms.
- NO Japanese characters, NO Chinese characters, NO foreign scripts.
- NO color codes, NO labels, NO annotations.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels, NO photo-realistic rendering.
- NO background patterns, NO container shapes around the whole logo.
- NO unexplained focal point inside the symbol.
- NO three-strand braids, NO triple helix, NO three petals — use only TWO elements.
`;

const candidates = [
  {
    filename: 'logo-v6-01-enso-with-rising-arrow.png',
    description: 'A. 円相＋内側の上昇矢印',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Two axes: Ensō (circulation/wholeness) + Optimization (ascending arrow):
A clean Ensō circle drawn as a calligraphic brush stroke in vibrant purple (#A259FF),
with the characteristic small gap at the upper-right.
Inside the circle, a single elegant arrow in sky blue (#1ABCFE) rising from
the bottom-left toward the upper-right, perfectly straight, with a clean modern arrowhead.
The arrow does not touch the Ensō's brush stroke — there is breathing space between them.
The composition reads as: "the optimal path within the cycle of harmony".

CRITICAL: Only TWO colored elements — the purple Ensō and the blue arrow.
Center of the symbol is empty negative space except for the arrow.
${COMMON}`,
  },
  {
    filename: 'logo-v6-02-single-stroke-enso-arrow.png',
    description: 'B. 一本の筆書き：円相が矢印に変わる',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Single calligraphic stroke that is both Ensō and arrow:
A single continuous brushstroke drawn in one motion. The stroke begins at the lower-left,
sweeps clockwise to trace an Ensō circle (about 320 degrees of arc), then instead of
closing the circle, the stroke's ending tail rises upward and curves into a clean
arrow tip pointing up-and-right.
The stroke uses a smooth color gradient: vibrant purple (#A259FF) for the circular
portion (Ensō), gradually transitioning to sky blue (#1ABCFE) for the rising arrow tail
(Optimization). The transition is smooth, suggesting one essence becoming two expressions.
The brush stroke has natural width variation and slightly textured edges.

CRITICAL: ONE single continuous stroke. No separate elements. The Ensō and the arrow
are the same line. Center of the symbol is empty negative space.
${COMMON}`,
  },
  {
    filename: 'logo-v6-03-launch-from-gap.png',
    description: 'C. 円相の切れ目から上昇する光',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ascension launching from the Ensō's gap:
A vibrant purple (#A259FF) Ensō brush-stroke circle, oriented so that its characteristic
gap is at the very top (12 o'clock position). From this gap, a small sky blue (#1ABCFE)
ascending element emerges and rises above the circle: a slim arrow, or three small
ascending dots stacked vertically getting larger as they rise, suggesting upward motion.
The element clearly comes "out of the gap" — the gap is the launch point.

CRITICAL: Only TWO colored elements — purple Ensō and blue ascending element.
The gap in the Ensō is at the top, not the upper-right.
Center of the symbol is empty negative space.
${COMMON}`,
  },
  {
    filename: 'logo-v6-04-inner-spiral.png',
    description: 'D. 円相の中で渦を巻く最適化螺旋',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Optimization spiral nested inside Ensō:
An outer Ensō circle drawn as a calligraphic brush stroke in vibrant purple (#A259FF),
with the characteristic small gap at the upper-right.
Inside the circle, a clean geometric spiral in sky blue (#1ABCFE) — drawn as a single
smooth line that starts at the center and spirals outward in 1.5 to 2 turns.
The spiral does not touch the Ensō. Breathing space between them.
The spiral suggests "the path of optimization unfolding within the cycle".
The spiral feels precise and mathematical (as opposed to the brushy organic Ensō),
creating a deliberate contrast: the calculated within the cyclical.

CRITICAL: Only TWO colored elements — purple Ensō and blue spiral.
${COMMON}`,
  },
  {
    filename: 'logo-v6-05-optimal-line-circle.png',
    description: 'E. 最適化された線分が円相を構成',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ensō drawn from optimized line segments:
An Ensō circle constructed from a series of short straight line segments (about 12 to 16
segments) arranged to approximate a circle. The line segments are clean and geometric
(not curves), in sky blue (#1ABCFE). Together they form a polygonal Ensō with
the characteristic small gap at the upper-right.
At the center of the polygonal circle, a single small vibrant purple (#A259FF) dot —
the still center.
The composition suggests: "the cyclical drawn through optimization" — discrete optimized
steps that together create a continuous circle.
A subtle dialogue between mathematics (line segments, blue) and presence (center dot, purple).

CRITICAL: The line segments are clearly straight and discrete (not a smooth curve).
The center dot is small and intentional. Only TWO colors used.
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
console.log(`v6 5案を順次生成します（各1〜2分・合計5〜10分）...`);

for (const c of candidates) {
  await generateImage(c.prompt, c.filename, c.description);
}

console.log('\n========================================');
console.log('v6 全5案の生成が完了しました。');
console.log('========================================');
