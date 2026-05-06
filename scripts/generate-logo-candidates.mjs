/**
 * Optiens 新ロゴ候補 5案を gpt-image-2 で生成
 *
 * コンセプト: 「optiens」が螺旋状に上昇しつつ循環する
 * 哲学: Optimization（最適化）× Ensō（円相、禅の一筆書き）
 * /message ページ参照: 競争から協調へ、所有から共有へ、分離から統合へ
 *
 * レイアウト: 左にロゴシンボル、右に「Optiens」ワードマーク
 * ファビコン用に左半分が単独で成立する構図
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

// 共通: レイアウト・色・タイポ・禁止事項
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

COLOR PALETTE for the symbol:
- Vibrant purple (#A259FF), sky blue (#1ABCFE), emerald green (#0ACF83).
- May use a smooth gradient combining these. Dark slate (#0f172a) accents allowed.

STRICT NEGATIVE CONSTRAINTS:
- Absolutely NO repeated text, NO illegible letterforms, NO Lorem-ipsum-like marks.
- NO Japanese characters, NO Chinese characters, NO foreign scripts.
- NO color codes, NO labels, NO annotations, NO callouts.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels, NO photo-realistic rendering.
- NO background patterns, NO frames, NO container shapes around the whole logo.
`;

const candidates = [
  {
    filename: 'logo-01-enso-spiral.png',
    description: 'A. Enso brush spiral ascending',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT: An Enso (zen circle) brush stroke that opens upward into an ascending spiral.
A single confident calligraphic stroke spirals from the bottom-left, sweeps around
clockwise, and rises gently as it loops — suggesting circulation that climbs.
The stroke uses a smooth gradient: emerald green at the start, transitioning through
sky blue, ending in vibrant purple at the rising tip. Slightly tapered ends, hand-drawn
energy but precise. Reads as both "circulation" and "upward growth".
${COMMON}`,
  },
  {
    filename: 'logo-02-particle-helix.png',
    description: 'B. Particle helix rising',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT: A constellation of small dots forming an ascending helix.
Tiny circular particles (some emerald green, some sky blue, some vibrant purple)
trace the path of a 3D helix that rises from the bottom of the symbol area to the top.
Each loop is slightly larger than the one below. The dots vary subtly in size,
suggesting motion and acceleration. Clean, minimal, technical feel — like a data
visualization of growth. The overall shape reads as both a spiral and an ascent.
${COMMON}`,
  },
  {
    filename: 'logo-03-ribbon-mobius.png',
    description: 'C. Möbius ribbon ascending',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT: A smooth flat ribbon shaped like a Möbius strip, twisting and rising.
The ribbon has soft rounded edges and is filled with a smooth gradient that flows
from emerald green through sky blue to vibrant purple along its length.
The twist creates an infinity-like loop, but instead of lying flat, it spirals
upward — symbolizing endless circulation that also grows.
Elegant, minimal, like a Figma or Stripe brand mark. Solid color fill, no outlines.
${COMMON}`,
  },
  {
    filename: 'logo-04-monogram-O.png',
    description: 'D. Minimalist O with internal ascent',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT: A bold geometric capital "O" as the core monogram, with a subtle internal
detail: an upward-rising spiral or arrow tracing inside the O, suggesting
that circulation contains growth. The outer O is in vibrant purple,
the internal ascending element uses a sky blue to emerald green gradient.
The O has perfectly even stroke weight, modern geometric construction.
The internal mark is delicate, minimal, breathing room around it.
Could double as a minimal app icon. Clean, sophisticated, tech-brand feel.
${COMMON}`,
  },
  {
    filename: 'logo-05-orbit-circulation.png',
    description: 'E. Three orbiting arcs (harmony of three)',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT: Three concentric arcs orbiting around a small bright center,
each arc representing one of the three pillars: human (purple),
technology (sky blue), nature (emerald green). The arcs are not closed circles —
each has a slight gap and a small dot at its leading end, suggesting motion.
The arcs are arranged so that, together, they imply an ascending spiral when
viewed as a whole — top arc shifted slightly upward, others rotating around.
Light, balanced, harmonious — like a planetary motion diagram simplified.
At the very center: a tiny solid circle in dark slate.
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
console.log(`5案を順次生成します（各1〜2分・合計5〜10分）...`);

for (const c of candidates) {
  await generateImage(c.prompt, c.filename, c.description);
}

console.log('\n========================================');
console.log('全5案の生成が完了しました。');
console.log('確認: public/images/logo-candidates/');
console.log('========================================');
