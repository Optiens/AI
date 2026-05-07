/**
 * Optiens 新ロゴ候補 v12 — 5案
 *
 * テーマ: 筆で描いたような Ensō（円相）+ 黄金比螺旋 × ブランドカラー
 *
 * 参考:
 * - logo-01-enso-spiral: 筆で描いたような有機的な質感
 * - logo-v11-05-enso-as-spiral-emerging: Ensō（丸）+ 黄金比（螺旋）の組み合わせ
 *
 * v12 の特徴:
 * - 筆書き（ink brush）の有機的な質感を採用
 * - Ensō と黄金比螺旋を1つの構成に統合
 * - ブランドカラー: チタンブルー #3D6FA0 / 桜 #E48A95
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
- Color: dark navy (#1F4D7A). No taglines, no underlines.

BRAND COLOR PALETTE (Optiens — Titanium Blue × Sakura):
- Primary: titanium blue (#3D6FA0).
- Accent: cherry blossom pink / sakura (#E48A95).
- DO NOT use green, orange, yellow, purple, or any other color outside this palette.

ARTISTIC STYLE — INK BRUSH (very important):
- The Ensō circle and golden spiral MUST be rendered with an ORGANIC INK BRUSH texture.
- Like Japanese sumi-e calligraphy: a confident continuous brushstroke.
- Visible brush texture: slight irregularities in stroke width, natural ink flow,
  occasional dry-brush effect at the end of strokes.
- NOT a perfect geometric vector. NOT a thin uniform line.
- Inspired by zen calligraphy painted with a single brush in one breath.
- The wordmark "Optiens" stays as a clean modern sans-serif (NOT brushed).

GOLDEN RATIO SPECIFICATION:
- The spiral MUST follow the golden ratio (φ ≈ 1.618) — Fibonacci spiral / nautilus shape.
- Each quarter-turn expands or contracts by approximately 1.618×.
- The spiral itself is also painted with the ink brush style.

DESIGN PHILOSOPHY:
- Japanese aesthetic with Western design precision.
- The Ensō (closed circular form) must be VISIBLE and dominant.
- Brush texture conveys craftsmanship and intentionality.
- Generous negative space.

STRICT NEGATIVE CONSTRAINTS:
- NO repeated text, NO illegible letterforms, NO foreign scripts.
- NO color codes, NO labels, NO arrowheads, NO additional dots beyond the ink trail.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels.
- NO Fibonacci square construction lines visible.
- NO purple, NO green, NO orange — ONLY titanium blue (#3D6FA0) and sakura pink (#E48A95).
- NO western calligraphy or fountain pen style — strictly Japanese ink brush.
`;

const candidates = [
  {
    filename: 'logo-v12-01-brushed-enso-with-spiral-inside.png',
    description: 'A. 筆書きEnsō（チタンブルー）+ 内側に黄金螺旋（桜）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ink-brushed Ensō with golden spiral inside:
A confident ink-brushed Ensō circle painted in titanium blue (#3D6FA0), full size,
with the characteristic small gap (about 25 degrees) at the upper-right.
The brushstroke has organic Japanese sumi-e texture: slight irregularity in stroke width,
visible brush hairs, natural ink flow.
Inside the Ensō, slightly off-center to balance the gap, a golden ratio spiral
in cherry blossom pink (#E48A95), also painted with the same ink brush technique,
making 2 inward turns following Fibonacci/golden ratio expansion.
Spiral diameter: approximately 1/3 of the Ensō diameter.

${COMMON}`,
  },
  {
    filename: 'logo-v12-02-brushed-spiral-emerging-from-enso.png',
    description: 'B. 筆書きEnsō（チタンブルー）+ 隙間から外側に展開する黄金螺旋（桜）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ink-brushed Ensō with golden spiral emerging through the gap:
A confident ink-brushed Ensō circle painted in titanium blue (#3D6FA0), full size
with the characteristic gap at the upper-right.
From the gap, an ink-brushed golden ratio spiral emerges OUTWARD in cherry blossom pink (#E48A95),
expanding following the golden ratio over 1.5 turns.
The spiral curls gently away from the Ensō and ends in open white space with a natural
dry-brush taper (subtle ink fade at the very end).
Both elements share the same Japanese sumi-e brush texture.

${COMMON}`,
  },
  {
    filename: 'logo-v12-03-single-stroke-enso-becoming-spiral.png',
    description: 'C. 一筆書きEnsō → 内側で黄金螺旋に変化（チタンブルー → 桜のグラデ）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Single continuous ink brushstroke: Ensō transforming into golden spiral:
One continuous Japanese ink brushstroke that:
- Starts as an Ensō circle in titanium blue (#3D6FA0)
- At the gap point (upper-right), the stroke continues inward
- Spirals inward following the golden ratio for 2 turns
- Gradually transitions in color to cherry blossom pink (#E48A95) as it spirals inward
- Ends with a natural dry-brush dot at the spiral's center
The entire mark is ONE continuous gesture, painted in a single breath.
The brush texture is consistently visible throughout.

${COMMON}`,
  },
  {
    filename: 'logo-v12-04-brushed-enso-with-pink-spiral-half-overlap.png',
    description: 'D. 筆書きEnsō（チタンブルー）と黄金螺旋（桜）が部分的に重なる',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ink-brushed Ensō and golden spiral, partially overlapping:
A confident ink-brushed Ensō circle in titanium blue (#3D6FA0) with the gap at upper-right.
A golden ratio spiral in cherry blossom pink (#E48A95) is positioned so that its outer
arc partially overlaps with the right side of the Ensō.
Both painted with Japanese sumi-e brush texture.
The spiral makes 2 inward turns following Fibonacci/golden ratio expansion.
Where the two strokes overlap, you can see both colors layered (natural ink wash effect).
Composition: Ensō on the left, spiral nested into the right side of the Ensō.

${COMMON}`,
  },
  {
    filename: 'logo-v12-05-minimal-enso-with-tiny-spiral-focal.png',
    description: 'E. 筆書きEnsō（チタンブルー）+ 中央に小さな桜の黄金螺旋（焦点）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Bold ink-brushed Ensō with tiny golden spiral as focal point:
A bold confident ink-brushed Ensō circle in titanium blue (#3D6FA0), full size,
with the characteristic gap at upper-right.
The brush stroke is thicker and more dominant than usual.
At the geometric center of the Ensō, a small but precise golden ratio spiral
in cherry blossom pink (#E48A95), also brush-painted, with 2 tight inward turns.
Spiral diameter: only about 20% of the Ensō diameter — like a quiet focal point
inside a large meditative circle.
Visual hierarchy: Ensō dominates, spiral is the silent center.

${COMMON}`,
  },
];

console.log(`Generating ${candidates.length} logo candidates v12 with gpt-image-2...`);

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

console.log('\nv12 ロゴ候補の生成完了');
