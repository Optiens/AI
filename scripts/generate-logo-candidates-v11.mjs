/**
 * Optiens 新ロゴ候補 v11 — 5案
 *
 * テーマ: 太いストローク × 黄金比螺旋 × Ensō × ブランドカラー
 * v10 の反省: 線が細く、Ensōと螺旋の組み合わせが弱い印象
 * v11: ストロークを大幅に太くし、ブランドカラー（濃紺・銀・桜）を採用
 *
 * ブランドカラー:
 *   - 濃紺 (Noukon)  #0E2A47 — Primary
 *   - 銀   (Gin)     #C0C0C0 — Secondary
 *   - 桜   (Sakura)  #E48A95 — Accent
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
- Medium weight (500-600), single line, balanced letter spacing.
- Color: dark navy (#0E2A47). No taglines, no underlines.

BRAND COLOR PALETTE (Optiens — Wa-Tech / Japanese aesthetic):
- Primary: dark navy / Noukon (#0E2A47).
- Secondary: silver / Gin (#C0C0C0).
- Accent: cherry blossom pink / Sakura (#E48A95).
- DO NOT use green, orange, yellow, or any other color outside this palette.

STROKE WEIGHT (very important — v11 emphasizes BOLD):
- The symbol stroke MUST be THICK and CONFIDENT.
- Stroke weight comparable to the wordmark's letter strokes (medium weight).
- NOT a thin hairline. NOT a calligraphy brush. A bold, clean geometric line.
- The thickness should make the symbol read clearly even at favicon size (32px).

GOLDEN RATIO SPECIFICATION:
- The spiral MUST follow the golden ratio (φ ≈ 1.618) — Fibonacci spiral / nautilus shape.
- Each quarter-turn expands or contracts by approximately 1.618×.

DESIGN PHILOSOPHY:
- ULTRA MINIMAL — geometric vector forms only.
- NO brush texture, NO ink calligraphy texture, NO 3D, NO gradients on shapes (solid fills only).
- Generous white space inside and around the symbol.
- Ensō (the closed circular form) must be VISIBLE and BOLD — not faded.
- Japanese minimalism with Western precision.

STRICT NEGATIVE CONSTRAINTS:
- NO repeated text, NO illegible letterforms, NO foreign scripts.
- NO color codes, NO labels, NO arrowheads, NO additional dots.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels.
- NO Fibonacci square construction lines visible.
- NO purple, NO blue, NO green colors — ONLY navy / silver / sakura pink.
`;

const candidates = [
  {
    filename: 'logo-v11-01-bold-enso-with-golden-spiral.png',
    description: 'A. 太いEnsō（濃紺）+ 内側に黄金螺旋（桜）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Bold Ensō with golden spiral inside:
A bold thick geometric Ensō circle in dark navy (#0E2A47), full size with the characteristic
small gap (about 25 degrees) at the upper-right. The stroke is THICK and confident,
matching the wordmark's letter weight.
Inside the Ensō, slightly off-center to balance the gap, a golden ratio spiral
in cherry blossom pink (#E48A95) — also with a bold stroke.
The inner spiral makes 2 full inward turns following Fibonacci/golden ratio expansion.
Spiral diameter: approximately 1/3 of the Ensō diameter.
The two colors create harmony: navy provides depth, sakura adds elegance.
Reads as: "the bold cycle holds the optimal core within".

${COMMON}`,
  },
  {
    filename: 'logo-v11-02-spiral-completing-enso.png',
    description: 'B. 黄金螺旋がEnsōの一部を構成（一筆書き風）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — A single continuous bold line forming both Ensō and golden spiral:
One single thick continuous stroke in dark navy (#0E2A47) that draws an Ensō circle,
and at one point the stroke spirals inward following the golden ratio,
making one tight inward turn before the line ends. The Ensō has the characteristic
gap at the upper-right (about 30 degrees).
The stroke is THICK and bold throughout — like a single confident brush of geometry.
At the inward end of the spiral, a small filled circle (dot) in cherry blossom pink (#E48A95)
marks the focal point.
This represents "one continuous gesture from cycle to optimal core".

${COMMON}`,
  },
  {
    filename: 'logo-v11-03-double-circle-with-spiral.png',
    description: 'C. 二重円（濃紺＋銀）+ 中央に小さな黄金螺旋（桜）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Double Ensō with golden spiral focal point:
Two concentric Ensō circles, both with bold thick strokes:
- Outer Ensō: dark navy (#0E2A47), full size, with the gap at upper-right.
- Inner Ensō: silver (#C0C0C0), about 65% diameter of the outer one (golden ratio relationship),
  with a smaller gap also at the upper-right.
- Centered inside the inner Ensō: a small golden ratio spiral in cherry blossom pink (#E48A95),
  about 1/3 the diameter of the inner circle, bold stroke, 2 inward turns.

The composition reads as: "concentric harmony with an optimal core" — three elements,
all bold and confident, all geometric.

${COMMON}`,
  },
  {
    filename: 'logo-v11-04-enso-with-sakura-spiral-end.png',
    description: 'D. 濃紺Ensō + 終点が桜色に変化する黄金螺旋',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Bold Ensō with a gradient-tipped golden spiral inside:
A bold thick Ensō circle in dark navy (#0E2A47), full size, with the gap at upper-right.
Inside the Ensō, centered, a golden ratio spiral with bold stroke that gradually transitions
from dark navy (#0E2A47) at its outer end to cherry blossom pink (#E48A95) at its inner end.
The spiral makes 2.5 inward turns following the golden ratio.
The color transition happens smoothly along the spiral path — this is the ONLY use of gradient
in the whole logo, used to express "evolution toward the optimal".
Spiral diameter: about 60% of the Ensō diameter.

${COMMON}`,
  },
  {
    filename: 'logo-v11-05-enso-as-spiral-emerging.png',
    description: 'E. Ensōの隙間から黄金螺旋が外側に展開（成長表現）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Bold Ensō with a golden spiral emerging through the gap outward:
A bold thick Ensō circle in dark navy (#0E2A47), full size with the gap at upper-right.
From the gap, a golden ratio spiral emerges OUTWARD in cherry blossom pink (#E48A95),
with a bold stroke that expands following the golden ratio over 1.5 turns.
The spiral curls gently away from the Ensō and ends in open white space.
The Ensō is the inner cycle; the spiral represents growth/optimization expanding outward.
Both elements have bold geometric strokes (no brush texture).

${COMMON}`,
  },
];

console.log(`Generating ${candidates.length} logo candidates v11 with gpt-image-2...`);

for (const c of candidates) {
  console.log(`\n[${c.filename}] ${c.description}`);
  try {
    const response = await client.images.generate({
      model: 'gpt-image-2',
      prompt: c.prompt,
      size: '1536x1024',
      quality: 'high',
      n: 1,
    });

    const b64 = response.data[0].b64_json;
    const outputPath = resolve(OUT_DIR, c.filename);
    writeFileSync(outputPath, Buffer.from(b64, 'base64'));
    console.log(`  ✓ 保存完了: ${c.filename}`);
  } catch (err) {
    console.error(`  ✗ エラー (${c.filename}):`, err.message);
    if (err.status) console.error(`    HTTPステータス: ${err.status}`);
  }
}

console.log('\nv11 ロゴ候補の生成完了');
