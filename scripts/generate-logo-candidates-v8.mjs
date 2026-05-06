/**
 * Optiens 新ロゴ候補 v8 — 5案
 *
 * テーマ: v7-A (細い円相+切れ目に青ドット) と v7-D (三日月+青ドット) の派生
 * 共通DNA: 細い紫の幾何学曲線 + 青の小さなドット1つ + 余白重視
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

WORDMARK SPECIFICATION:
- The exact word "Optiens" (capital O, lowercase p, t, i, e, n, s — 7 letters total).
- Modern HUMANIST GEOMETRIC SANS-SERIF — Söhne, Aktiv Grotesk, General Sans, or Manrope.
- Open apertures on 'e' and 's', balanced curves with hint of warmth.
- Medium weight (500), single line, balanced letter spacing.
- Color: dark slate (#0f172a). No taglines, no underlines.

TWO-AXIS COLOR ASSIGNMENT (must be respected):
- Optimization axis = sky blue (#1ABCFE)
- Ensō axis        = vibrant purple (#A259FF)
- DO NOT use green, red, orange, or any third color.

DESIGN PHILOSOPHY (must follow strictly):
- ULTRA MINIMAL — only 2 elements: one purple curve + one blue dot.
- Pure geometric vector shapes — NO brush texture, NO calligraphy, NO ink texture.
- Thin, consistent stroke width on the purple curve.
- The blue dot is small (about 1/8 of the curve's diameter) and solid.
- Generous white space inside and around the symbol.
- Think Apple, Notion, Linear minimalism.

STRICT NEGATIVE CONSTRAINTS:
- NO repeated text, NO illegible letterforms, NO foreign scripts.
- NO color codes, NO labels, NO arrowheads, NO brush flourishes.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels, NO gradients on the symbol.
- NO additional dots beyond the single specified one.
- NO three-strand braids, NO triple helix.
`;

const candidates = [
  {
    filename: 'logo-v8-01-top-gap-dot-above.png',
    description: 'A. 上部に切れ目、上方に青ドット（上昇）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Thin Ensō with top gap and ascending dot:
A perfectly clean thin geometric circle in vibrant purple (#A259FF) — pure vector,
no brush texture, uniform medium-thin stroke width. The ring has a small gap
(about 25 degrees of opening) at the very TOP (12 o'clock position).
Just above the gap, with a small breathing space, a single small solid sky blue (#1ABCFE)
dot, sized about 1/8 of the circle's diameter. The dot is centered horizontally with
the gap, positioned slightly above the ring as if it has just emerged from the opening.
The composition reads as: "ascension through the opening of the cycle".

Total elements: 2 (purple ring + blue dot above gap). Center of the symbol is
pure empty white space.
${COMMON}`,
  },
  {
    filename: 'logo-v8-02-medium-gap-dot-in-gap.png',
    description: 'B. 中間サイズ切れ目、ドットが切れ目内に',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Medium-opening Ensō with dot inside the gap:
A clean thin geometric circle in vibrant purple (#A259FF) — pure vector, no brush.
The ring has a moderate gap (about 50 degrees of opening) at the upper-right position
(roughly 1-2 o'clock direction).
Inside the gap, perfectly centered between the two ends of the open ring, a single
small solid sky blue (#1ABCFE) dot, sized about 1/8 of the circle's diameter.
The dot floats in the gap as if it were the missing point of the circle —
the optimal next step.

Total elements: 2 (purple ring + blue dot in gap). Center of the symbol is
pure empty white space.
${COMMON}`,
  },
  {
    filename: 'logo-v8-03-crescent-dot-inside.png',
    description: 'C. 三日月＋内側に青ドット',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Crescent with the dot resting inside:
A clean thin crescent shape in vibrant purple (#A259FF) — pure vector geometric curve,
no brush texture. The crescent opens to the right with a wide opening (about 90 degrees
of gap), like a "C" shape facing right. Stroke width is medium-thin and uniform.
INSIDE the crescent's open mouth (in the empty space cradled by the C shape),
a single small solid sky blue (#1ABCFE) dot, sized about 1/8 of the crescent's height,
positioned at the geometric focal point of the crescent's opening.
The composition reads as: "the optimal point held within the open Ensō".

Total elements: 2 (purple crescent + blue dot inside).
${COMMON}`,
  },
  {
    filename: 'logo-v8-04-spiral-tail-with-dot.png',
    description: 'D. 螺旋尾の円相＋尾の先に青ドット',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Subtle spiral-tail Ensō with dot at the tail's end:
A clean thin circle in vibrant purple (#A259FF) — pure vector, no brush.
The stroke begins at the upper-right, traces clockwise around the circle for about
340 degrees, then instead of closing, the end of the stroke continues for a short distance
inward (toward the center) in a subtle spiral curl, ending about 1/4 of the way to the center.
At the very tip of this spiral curl, a single small solid sky blue (#1ABCFE) dot,
sized about 1/8 of the circle's diameter, marking the destination of the spiraling line.
The composition reads as: "circulation that focuses inward to the optimal point".

Total elements: 2 (the purple curve including its spiral tail + the blue dot at the tail tip).
${COMMON}`,
  },
  {
    filename: 'logo-v8-05-bottom-gap-dot-orbiting.png',
    description: 'E. 右側に切れ目、ドットが軌道上で右へ離れる',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Right-opening Ensō with dot drifting along the orbit:
A clean thin geometric circle in vibrant purple (#A259FF) — pure vector, no brush.
The ring has a moderate gap (about 40 degrees of opening) at the right side
(3 o'clock direction).
Just to the right of the gap, slightly OUTSIDE the circle, a single small solid sky blue
(#1ABCFE) dot, sized about 1/8 of the circle's diameter. The dot is positioned as if
it has just left the orbit through the gap and is now traveling outward — about half
a dot's distance away from the gap.
The composition reads as: "the next step departing from the cycle".

Total elements: 2 (purple ring + blue dot just outside the gap).
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
console.log(`v8 5案を順次生成します（各1〜2分・合計5〜10分）...`);

for (const c of candidates) {
  await generateImage(c.prompt, c.filename, c.description);
}

console.log('\n========================================');
console.log('v8 全5案の生成が完了しました。');
console.log('========================================');
