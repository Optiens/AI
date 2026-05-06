/**
 * Optiens 新ロゴ候補 v10 — 5案
 *
 * テーマ: 黄金比螺旋 × Ensō のバランス改善
 * v9の反省: 螺旋に寄りすぎてEnsō要素が薄くなった
 * v10: Ensōの存在感を戻しつつ、黄金比の最適性を維持
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
- Open apertures on 'e' and 's', balanced curves.
- Medium weight (500), single line, balanced letter spacing.
- Color: dark slate (#0f172a). No taglines, no underlines.

COLOR PALETTE:
- Primary: vibrant purple (#A259FF).
- Optional accent: sky blue (#1ABCFE).
- Wordmark: dark slate (#0f172a).
- DO NOT use green, red, orange, or any other color.

GOLDEN RATIO SPECIFICATION:
- The spiral MUST follow the golden ratio (φ ≈ 1.618) — Fibonacci spiral / nautilus shape.
- Each quarter-turn expands or contracts by approximately 1.618×.

DESIGN PHILOSOPHY:
- ULTRA MINIMAL — single continuous line forming the entire symbol.
- Pure geometric vector — NO brush texture, NO calligraphy ink texture.
- Generous white space inside and around the symbol.
- Ensō (the closed circular form) must be VISIBLE — not just a spiral.

STRICT NEGATIVE CONSTRAINTS:
- NO repeated text, NO illegible letterforms, NO foreign scripts.
- NO color codes, NO labels, NO arrowheads, NO blue dots, NO additional dots.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels.
- NO Fibonacci square construction lines visible.
`;

const candidates = [
  {
    filename: 'logo-v10-01-enso-with-small-inward-spiral.png',
    description: 'A. 大きなEnsō + 内側に小さな黄金螺旋（Ensō優位）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ensō dominant with a small golden spiral focal point:
A clean thin geometric Ensō circle in vibrant purple (#A259FF), full size, with the
characteristic small gap (about 25 degrees) at the upper-right. Pure vector, no brush.
Inside the Ensō, near the center but slightly offset to balance the gap, a SMALL
golden ratio spiral, also in vibrant purple but with a thinner stroke. The inner spiral
is sized about 1/4 of the Ensō's diameter and makes about 2 inward turns.
Both elements share the purple color, making it read as one composition.
The Ensō dominates; the inner spiral is a quiet focal point.
Reads as: "the cycle holds the optimal core within".

Total elements: 2 (outer Ensō + small inner golden spiral, both purple).
Center area between them is empty white space.
${COMMON}`,
  },
  {
    filename: 'logo-v10-02-spiral-emerges-from-enso-gap.png',
    description: 'B. Ensō切れ目から黄金螺旋が放射（一筆連続）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Single line: Ensō continuing into a golden spiral through its gap:
A single continuous vibrant purple (#A259FF) line, pure vector, no brush texture.
The line begins at the bottom-right and traces a clean Ensō circle counterclockwise
for about 320 degrees, ending at the upper-right. From there, instead of closing the
circle, the line CONTINUES OUTWARD through the gap and spirals OUT in a golden ratio
spiral (each turn expanding by φ ≈ 1.618), making about 1.5 outward turns and tapering
slightly at the very end.
The Ensō remains clearly visible as a circle; the outward golden spiral is the
"emerging" continuation of the same line.
Reads as: "the cycle that opens into optimal expansion".

Total elements: 1 (single continuous purple line). Center of the Ensō is empty white.
${COMMON}`,
  },
  {
    filename: 'logo-v10-03-twin-mirrored-spirals.png',
    description: 'C. 双子の鏡対称螺旋（陰陽風、紫+青）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Twin mirrored golden spirals (yin-yang harmony):
Two golden ratio spirals arranged in mirror symmetry, together forming a circular composition.
The first spiral, in vibrant purple (#A259FF), starts from the upper-right and curls
inward clockwise. The second spiral, in sky blue (#1ABCFE), starts from the lower-left
and curls inward counterclockwise. The two spirals' outer edges trace the perimeter
of a single combined circle (like two halves of a yin-yang composed of golden spirals
instead of solid teardrops).
Pure vector, thin uniform stroke width on both spirals.
Reads as: "two complementary forces — circulation and optimization — in dynamic balance".

Total elements: 2 (mirrored purple and blue spirals).
${COMMON}`,
  },
  {
    filename: 'logo-v10-04-reverse-two-tone.png',
    description: 'D. 二色逆配色（Ensōが青、螺旋が紫）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Reverse two-tone golden spiral Ensō:
A single continuous line forming an Ensō (~340 degrees) that curls inward into a
golden ratio spiral. SAME composition as v9-D but with COLORS REVERSED:
sky blue (#1ABCFE) at the start of the Ensō (the outer, circulating portion),
gradually transitioning to vibrant purple (#A259FF) at the inward spiral's center.
This reverses the narrative: "from optimization (the cycle) into the harmonious core (Ensō center)".
Pure vector, uniform medium-thin stroke. Smooth gradient transition.

Total elements: 1 (single gradient line, blue→purple).
${COMMON}`,
  },
  {
    filename: 'logo-v10-05-balanced-half-and-half.png',
    description: 'E. 半円Ensō + 黄金螺旋（左右半々）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Half Ensō + half golden spiral, joined as one:
A single continuous vibrant purple (#A259FF) line. The LEFT HALF of the symbol is
a clean half-circle (the left semicircle, like a "C" facing right). The RIGHT HALF
of the symbol is a tight golden ratio spiral (about 2 inward turns) whose outer edge
matches the right side of where a full circle would be.
The two halves connect smoothly at the top and bottom, forming a single coherent shape:
left = pure curve (Ensō half), right = mathematical spiral (golden).
Pure vector, uniform medium-thin stroke.
Reads as: "harmony on one side, optimization on the other, joined as one form".

Total elements: 1 (single continuous purple line).
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
console.log(`v10 5案を順次生成します（各1〜2分・合計5〜10分）...`);

for (const c of candidates) {
  await generateImage(c.prompt, c.filename, c.description);
}

console.log('\n========================================');
console.log('v10 全5案の生成が完了しました。');
console.log('========================================');
