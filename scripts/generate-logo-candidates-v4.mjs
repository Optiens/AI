/**
 * Optiens 新ロゴ候補 v4 — 5案
 *
 * テーマ: しめ縄（三本撚り）× Ensō の発展形
 * v3-C「三螺旋編み込み」を発展させ、中央の余分な要素を除去
 * フォントは humanist geometric sans（Söhne / Aktiv Grotesk 系）を指定
 *
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
- LEFT THIRD: a square symbol/mark that can stand alone as a favicon.
- RIGHT TWO-THIRDS: the single word "Optiens" rendered as a clean wordmark.
- Generous negative space between symbol and wordmark.
- Pure white background (#FFFFFF), edge-to-edge, no frame.

WORDMARK SPECIFICATION (IMPORTANT — typography must feel premium, not generic):
- The exact word "Optiens" (capital O, lowercase p, t, i, e, n, s — 7 letters total).
- Modern HUMANIST GEOMETRIC SANS-SERIF — think Söhne, Aktiv Grotesk, General Sans, or Manrope.
- NOT plain Helvetica or Arial — needs subtle character: open apertures on the 'e' and 's',
  slightly tall x-height, balanced curves with a hint of warmth.
- Medium-bold weight (around 500–600), single line, generous but balanced letter spacing.
- Color: dark slate (#0f172a). No taglines, no underlines.

PILLAR-COLOR ASSIGNMENT (must be respected):
- Harmony pillar      = vibrant purple (#A259FF)
- Optimization pillar = sky blue (#1ABCFE)
- Circulation pillar  = emerald green (#0ACF83)

STRICT NEGATIVE CONSTRAINTS:
- Absolutely NO repeated text, NO illegible letterforms.
- NO Japanese characters, NO Chinese characters, NO foreign scripts.
- NO color codes, NO labels, NO annotations.
- Only the single wordmark "Optiens" — verify spelling exactly.
- NO drop shadows, NO 3D bevels, NO photo-realistic rendering.
- NO background patterns, NO container shapes around the whole logo.
- NO central dot, NO "eye" in the middle, NO unexplained focal point inside the symbol.
  (The symbol's center should be empty negative space.)
`;

const candidates = [
  {
    filename: 'logo-v4-01-clean-shimenawa-enso.png',
    description: 'A. クリーンな三本撚りEnsō（v3-C精製版）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Refined Shimenawa Ensō (sacred Shinto braided rope formed into a zen circle):
Three colored strands — purple (harmony), sky blue (optimization), emerald green (circulation) —
braided together into a continuous rope that forms a single Ensō circle.
The braid pattern is clearly visible: each strand weaves over and under the other two
in a regular three-strand braid, just like a real shimenawa (Japanese sacred straw rope).
The Ensō has a small characteristic gap at the upper-right (about 30 degrees of opening).
The three colors maintain their identity throughout the entire loop.
Stroke width is medium (the rope feels substantial but not heavy).

CRITICAL: The very center of the circle is EMPTY (pure white background). No dot, no eye,
no central element. Just the braided rope forming the circle, with empty space inside.
Clean, refined, sacred — feels like a contemporary tech brand with Japanese spiritual depth.
${COMMON}`,
  },
  {
    filename: 'logo-v4-02-shimenawa-with-shide.png',
    description: 'B. 紙垂(shide)付きしめ縄Ensō',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Shimenawa Ensō with subtle shide (paper streamers):
A three-strand braided rope (purple harmony, sky blue optimization, emerald green circulation)
forming a clean Ensō circle with a small gap at the upper-right.
Hanging from the bottom of the braid: TWO subtle vertical accents resembling shide
(the lightning-bolt-shaped paper streamers used in Shinto shrines).
The shide are very minimal — just two thin zigzag shapes in dark slate (#0f172a),
short and unobtrusive, hanging straight down. They give the logo a hint of Japanese
sacred identity without being literal or kitsch.

CRITICAL: The very center of the circle is EMPTY (pure white). No dot, no eye, no center mark.
The shide accents are small and tasteful, not dominant.
${COMMON}`,
  },
  {
    filename: 'logo-v4-03-loose-open-helix.png',
    description: 'C. ゆるやかに開いた三本撚りEnsō',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Loose, breathing three-strand Ensō:
Three thin strands — purple (harmony), sky blue (optimization), emerald green (circulation) —
loosely braided into an Ensō circle. The braid pattern is more open than a tight rope:
each strand is slightly visible as it spirals around the others, with small gaps of negative
space between them. This gives the symbol a sense of breath and lightness.
The Ensō has a clear gap at the upper-right.
The three strands feel like calligraphy lines that happen to weave, rather than a thick rope.

CRITICAL: The center of the circle is EMPTY (pure white). No dot, no central focal point.
Elegant, contemporary, with subtle Japanese spiritual aesthetic.
${COMMON}`,
  },
  {
    filename: 'logo-v4-04-vertical-ascending-helix.png',
    description: 'D. 縦に上昇する三本撚り螺旋',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Ascending three-strand helix (rope rising rather than circling):
Three strands — purple (harmony), sky blue (optimization), emerald green (circulation) —
braided into a vertical helix that rises from bottom to top. About 3–4 turns of the braid
visible. The helix is slightly tilted (about 5 degrees) to suggest forward motion.
The bottom of the helix is anchored, the top opens slightly upward and outward,
like a rope reaching toward the sky.

This is a variant of the shimenawa concept where the circulation is ascending
rather than closed in a circle — symbolizing growth from cyclical foundation.

CRITICAL: No central dot, no extra elements. Just the braided rising helix.
${COMMON}`,
  },
  {
    filename: 'logo-v4-05-modern-vector-braid.png',
    description: 'E. モダンなフラットベクター版（テクスチャなし）',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Modern flat-vector shimenawa Ensō (no brush texture):
A geometric, flat-vector interpretation of the three-strand braided Ensō.
Three smooth color bands (purple harmony, sky blue optimization, emerald green circulation)
weave over and under each other in a clean three-strand braid pattern that forms a circle
with a small gap at the upper-right.
The strands are smooth solid color shapes (no brush texture, no gradient on each strand —
just clean flat colors). The over-under crossings are clearly defined with subtle
slight color darkening at the under-pass to create depth.
Modern, premium SaaS brand feel — like a contemporary Japanese design studio's mark.

CRITICAL: The center of the circle is EMPTY pure white. No dot, no center element.
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
console.log(`v4 5案を順次生成します（各1〜2分・合計5〜10分）...`);

for (const c of candidates) {
  await generateImage(c.prompt, c.filename, c.description);
}

console.log('\n========================================');
console.log('v4 全5案の生成が完了しました。');
console.log('========================================');
