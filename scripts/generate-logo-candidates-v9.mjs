/**
 * Optiens 新ロゴ候補 v9 — 5案
 *
 * テーマ: 黄金比螺旋 × Ensō
 * 「最適化」を別要素ではなく、黄金比（φ≈1.618）の数学的最適性で表現
 * v8-Dの発展形。青ドットは廃し、形そのものに最適化を埋め込む
 *
 * 色: 紫 #A259FF（円相）
 * 一部案で青 #1ABCFE をサブで使用
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
- Optional accent (only where specified): sky blue (#1ABCFE).
- Wordmark: dark slate (#0f172a).
- DO NOT use green, red, orange, or any other color.

GOLDEN RATIO SPECIFICATION (very important):
- The spiral MUST follow the golden ratio (φ ≈ 1.618) — also called the
  Fibonacci spiral, logarithmic spiral, or nautilus spiral.
- Each quarter-turn of the spiral expands or contracts by a factor of approximately 1.618.
- The spiral feels mathematically perfect — like a nautilus shell, sunflower seed pattern,
  or galaxy arm. Not a generic spiral, not an Archimedean spiral with constant spacing.

DESIGN PHILOSOPHY (must follow strictly):
- ULTRA MINIMAL — single continuous line forming the entire symbol.
- Pure geometric vector — NO brush texture, NO calligraphy ink texture.
- The Ensō circle and the golden spiral are ONE continuous form.
- Generous white space inside and around the symbol.

STRICT NEGATIVE CONSTRAINTS:
- NO repeated text, NO illegible letterforms, NO foreign scripts.
- NO color codes, NO labels, NO arrowheads, NO blue dots.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels.
- NO Fibonacci square construction lines visible (just the spiral curve itself).
`;

const candidates = [
  {
    filename: 'logo-v9-01-pure-golden-spiral-enso.png',
    description: 'A. 純粋な黄金比螺旋Ensō（単色紫・均一線幅）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Pure golden-ratio spiral Ensō (single purple line):
A single thin continuous line in vibrant purple (#A259FF), pure vector geometric curve
(no brush texture). The line begins at the upper-right, traces clockwise around to
form approximately 340 degrees of a circle (Ensō), then instead of closing,
the end of the line continues inward and curls into a TIGHT GOLDEN RATIO SPIRAL
(Fibonacci / logarithmic spiral, where each quarter-turn contracts by φ ≈ 1.618).
The spiral makes about 1.5 to 2 inward turns before terminating at its mathematical center.
The stroke width is uniform and medium-thin throughout the entire line.
The whole symbol reads as ONE continuous form: an Ensō that focuses inward
following the most mathematically optimal curve in nature.

Total elements: 1 (the single purple line).
${COMMON}`,
  },
  {
    filename: 'logo-v9-02-tapered-golden-spiral.png',
    description: 'B. テーパー線幅の黄金螺旋（始点太く、螺旋中心で細く）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Tapered-stroke golden spiral Ensō:
Same composition as concept A — a single vibrant purple (#A259FF) continuous line
forming an Ensō circle (~340 degrees) that curls inward into a golden ratio spiral.
The key difference: the STROKE WIDTH ITSELF FOLLOWS THE GOLDEN RATIO.
The line begins thick at the upper-right starting point (about 4× the final width),
and gradually tapers along its length, becoming thinner as it travels around the circle
and through the inward spiral, reaching its thinnest point at the spiral's terminus center.
The taper is smooth and continuous, not stepped.
The whole symbol expresses the golden ratio in TWO ways at once: the curve's geometry
and the stroke's diminishing width.

Total elements: 1 (the single tapered purple line).
${COMMON}`,
  },
  {
    filename: 'logo-v9-03-outward-golden-spiral.png',
    description: 'C. 外側に展開する黄金螺旋Ensō（中心から外へ）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Outward-unfolding golden-ratio spiral that opens into Ensō:
A single thin continuous line in vibrant purple (#A259FF), pure vector geometric curve.
Reverse direction from the typical: the line BEGINS at the center as a tight golden ratio
spiral, then unwinds OUTWARD over about 1.5 to 2 turns (each turn expanding by φ ≈ 1.618),
and finally sweeps around to form an Ensō circle (~340 degrees) before terminating
near where the spiral started.
The stroke width is uniform and medium-thin throughout.
The composition reads as: "the optimal core unfolding outward into the harmonious whole" —
the opposite narrative of an inward spiral.

Total elements: 1 (the single purple unfolding line).
${COMMON}`,
  },
  {
    filename: 'logo-v9-04-two-tone-golden-spiral.png',
    description: 'D. 二色グラデの黄金螺旋（紫→青、円相→最適化への変容）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Two-tone gradient golden-ratio spiral Ensō:
Same composition as concept A — a single continuous line forming an Ensō (~340 degrees)
that curls inward into a golden ratio spiral.
The line uses a SMOOTH COLOR GRADIENT along its length: vibrant purple (#A259FF)
at the starting upper-right (the Ensō portion), gradually transitioning to sky blue
(#1ABCFE) by the time it reaches the inward spiral's center.
The transition is smooth and continuous, suggesting "circulation transforming
into optimization" — the Ensō (purple) flowing into the most optimized form (blue).
Stroke width is uniform and medium-thin.

Total elements: 1 (the single gradient line).
${COMMON}`,
  },
  {
    filename: 'logo-v9-05-concentric-enso-and-spiral.png',
    description: 'E. 同心構造：外側に細い円相＋内側に独立した黄金螺旋',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Concentric: outer Ensō + inner independent golden spiral:
TWO separate purple (#A259FF) elements, both pure vector lines:
(1) Outer Ensō: a thin clean geometric circle with a small gap (about 25 degrees) at the
upper-right. Medium-thin uniform stroke width.
(2) Inner golden spiral: positioned at the geometric center inside the Ensō, sized about
1/3 of the Ensō's diameter. A pure golden ratio spiral with about 2 inward turns,
slightly thinner stroke than the outer ring.
Both elements share the same purple color but exist as two distinct shapes —
an Ensō and a small golden spiral nested within.
The composition reads as: "the optimal pattern lives at the center of the cycle".

Total elements: 2 (outer purple ring + inner purple golden spiral). Both purple, no blue.
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
console.log(`v9 5案を順次生成します（各1〜2分・合計5〜10分）...`);

for (const c of candidates) {
  await generateImage(c.prompt, c.filename, c.description);
}

console.log('\n========================================');
console.log('v9 全5案の生成が完了しました。');
console.log('========================================');
