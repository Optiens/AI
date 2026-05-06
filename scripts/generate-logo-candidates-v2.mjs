/**
 * Optiens 新ロゴ候補 v2 — 5案
 *
 * テーマ: 「調和（Harmony）・最適化（Optimization）・循環（Circulation）」の3本柱
 * 各案ともこの3要素を視覚化する
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

THREE-PILLAR COLOR ASSIGNMENT for the symbol:
- Each of the three visual elements must be clearly distinguishable.
- Use vibrant purple (#A259FF), sky blue (#1ABCFE), and emerald green (#0ACF83) — one color per pillar.
- The three colors should feel balanced and harmonious together.
- Optionally add dark slate (#0f172a) as a small accent or core dot.

STRICT NEGATIVE CONSTRAINTS:
- Absolutely NO repeated text, NO illegible letterforms, NO Lorem-ipsum-like marks.
- NO Japanese characters, NO Chinese characters, NO foreign scripts.
- NO color codes, NO labels, NO annotations.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels, NO photo-realistic rendering.
- NO background patterns, NO frames, NO container shapes around the whole logo.
`;

const candidates = [
  {
    filename: 'logo-v2-01-triskelion.png',
    description: 'A. Triskelion — three spirals radiating',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — THREE PILLARS (Harmony, Optimization, Circulation):
A modern triskelion: three identical comma-shaped spirals radiating from a central point,
all rotating in the same direction (clockwise). Each spiral is one of the brand colors —
one purple, one sky blue, one emerald green — equally weighted and balanced.
The three spirals together form a perfectly harmonious wheel that suggests rotation
and continuous circulation. Clean modern execution, not Celtic, not tribal —
think contemporary tech brand. Each spiral has soft rounded ends.
Symbolizes: three pillars in harmony, all moving together (circulation),
arranged in the most balanced configuration (optimization).
${COMMON}`,
  },
  {
    filename: 'logo-v2-02-borromean-rings.png',
    description: 'B. Borromean rings — three interlocked circles',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — THREE PILLARS (Harmony, Optimization, Circulation):
Three interlocked circles arranged in a Borromean configuration —
each ring passes over one neighbor and under the other, so removing
any single ring would separate all three. One ring is purple, one is sky blue,
one is emerald green. The rings have even stroke weight (medium thickness),
no fill, just the outlines. Composition slightly tilted upward to suggest ascent.
Symbolizes: harmony (the three are interdependent), circulation (rings = cycles),
optimization (the most elegant geometric configuration of three).
${COMMON}`,
  },
  {
    filename: 'logo-v2-03-trefoil-knot.png',
    description: 'C. Trefoil knot — one line, three loops',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — THREE PILLARS (Harmony, Optimization, Circulation):
A trefoil knot: a single continuous flowing line that forms three loops,
weaving over and under itself, with no beginning and no end.
The line uses a smooth gradient flowing along its length —
purple in one loop, transitioning through sky blue in another,
emerald green in the third — and back. Medium stroke weight, soft rounded curves,
clean modern vector style.
Symbolizes: harmony (one essence flowing through three pillars),
circulation (the line is endless), optimization (the simplest knot
that creates three loops from a single stroke).
${COMMON}`,
  },
  {
    filename: 'logo-v2-04-three-petals.png',
    description: 'D. Three petals around a seed',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — THREE PILLARS (Harmony, Optimization, Circulation):
Three soft petal or leaf shapes arranged radially around a small central seed dot.
Each petal points outward at 120° from the others, creating perfect three-fold symmetry.
One petal is purple, one is sky blue, one is emerald green.
The petals have soft rounded organic curves, like a stylized clover or trillium flower.
The central seed is a small dark slate (#0f172a) circle.
Symbolizes: harmony (three pillars equally balanced),
circulation (a flower = lifecycle of growth and renewal),
optimization (the most efficient arrangement is 120° spacing).
${COMMON}`,
  },
  {
    filename: 'logo-v2-05-three-arcs-cycle.png',
    description: 'E. Three arcs forming a closed cycle',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — THREE PILLARS (Harmony, Optimization, Circulation):
Three curved arcs arranged in a triangular formation around a central point.
Each arc starts where the previous arc ends, with a small leading dot at the tip
of each arc suggesting the direction of motion. Together the three arcs form
a continuous closed cycle that flows clockwise.
One arc is purple, one is sky blue, one is emerald green —
each representing one pillar.
The arcs are smooth, medium-weight, with rounded ends. The composition has
a slight gap in the very center (no filled core).
Symbolizes: harmony (three arcs as equals),
circulation (the cycle is closed and continuous),
optimization (the most efficient handoff from one pillar to the next).
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
console.log(`v2 5案を順次生成します（各1〜2分・合計5〜10分）...`);

for (const c of candidates) {
  await generateImage(c.prompt, c.filename, c.description);
}

console.log('\n========================================');
console.log('v2 全5案の生成が完了しました。');
console.log('========================================');
