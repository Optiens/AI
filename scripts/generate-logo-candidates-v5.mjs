/**
 * Optiens 新ロゴ候補 v5 — 5案
 *
 * テーマ: しめ縄 × DNA三重螺旋（triple helix）
 * 「これからは三重螺旋構造の時代」という時代観を象徴
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

WORDMARK SPECIFICATION (typography must feel premium, not generic):
- The exact word "Optiens" (capital O, lowercase p, t, i, e, n, s — 7 letters total).
- Modern HUMANIST GEOMETRIC SANS-SERIF — Söhne, Aktiv Grotesk, General Sans, or Manrope style.
- NOT plain Helvetica or Arial — needs subtle character: open apertures on 'e' and 's',
  slightly tall x-height, balanced curves with hint of warmth.
- Medium-bold weight (around 500–600), single line, balanced letter spacing.
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
- NO drop shadows, NO 3D bevels in a fake-3D way, NO photo-realistic rendering.
- NO background patterns, NO container shapes around the whole logo.
- NO central black dot, NO unexplained focal point inside the symbol.
`;

const candidates = [
  {
    filename: 'logo-v5-01-helix-becomes-enso.png',
    description: 'A. 三重螺旋がEnsō円に変容',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Triple helix transforming into Ensō:
At the bottom of the symbol, three strands (purple harmony, sky blue optimization,
emerald green circulation) are woven into a tight DNA-like triple helix for about 2 turns.
The strands then smoothly sweep outward and curve to meet at the top, forming a closed
Ensō circle. The logo reads as one continuous form: helix at the foundation,
circle at the completion. The transition between helix and circle is fluid and elegant —
no sharp break.
Symbolizes: from cellular structure (DNA) to harmonious whole (Ensō) — the triple helix
era manifesting as a complete cycle.
${COMMON}`,
  },
  {
    filename: 'logo-v5-02-top-down-helix-enso.png',
    description: 'B. 三重螺旋を上から見たEnsō',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Triple helix Ensō viewed from above (top-down 3D perspective):
Imagine a triple-helix rope coiled into a single closed loop, then viewed from directly above.
The result: three concentric flowing curves (purple, sky blue, emerald green) that interweave
as they trace the same Ensō circle. Where strands cross over each other, there is subtle
slight color darkening to suggest depth (3D braiding viewed top-down).
The Ensō has the characteristic gap at the upper-right.
Center is empty white space. Three strands clearly visible throughout.
Symbolizes: looking down on the triple-helix structure as a unified Ensō — the three
pillars seen from a higher vantage as one harmonious cycle.
${COMMON}`,
  },
  {
    filename: 'logo-v5-03-compact-helix-with-halo.png',
    description: 'C. コンパクト三重螺旋＋上部にEnsōハロー',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Compact triple helix with Ensō halo above:
A vertical DNA-like triple helix at the bottom (purple, sky blue, emerald green strands),
about 2 to 3 turns tall, designed to fit a roughly square footprint (not too tall).
Above the helix, a thin elegant Ensō ring in dark slate (#0f172a) with brush-stroke
character, sized so its diameter matches the helix width. The Ensō appears as a halo
or crown above the helix, like the helix is reaching up into a gateway.
Slight breathing space between helix and ring.
Symbolizes: triple-helix foundation reaching toward the harmonious whole above —
DNA structure meeting zen circle.
${COMMON}`,
  },
  {
    filename: 'logo-v5-04-helix-lemniscate.png',
    description: 'D. 三重螺旋による無限大(∞)',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Triple helix lemniscate (infinity sign):
Three strands (purple harmony, sky blue optimization, emerald green circulation) woven
together as a triple helix that traces the path of an infinity symbol (∞ / lemniscate).
The strands continuously braid through both loops of the infinity, crossing at the center.
The center crossing is graceful, not crowded — the strands simply transition from
one loop to the other.
Symbolizes: the triple-helix era flowing endlessly — infinite circulation of three pillars.
A modern reinterpretation of shimenawa as eternal flow.
${COMMON}`,
  },
  {
    filename: 'logo-v5-05-twin-helix-rings.png',
    description: 'E. 二つの三重螺旋リングが交差',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Two interlocked triple-helix rings (orbital arrangement):
Two rings, each formed by a three-strand helical braid in purple, sky blue, and emerald green.
The two rings interlock at right angles like atomic orbitals or a 3D molecular model,
but rendered as a flat 2D vector composition (no fake 3D shading).
One ring stands roughly vertical (oriented "front-facing"), the other is tilted
horizontal (oriented "edge-on"), creating a sense of multi-axis circulation.
The two rings share the same color identity — both have all three pillar colors visible.
Symbolizes: triple helix not as a single line but as a multi-dimensional structure —
the era of layered, interlocking systems.
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
console.log(`v5 5案を順次生成します（各1〜2分・合計5〜10分）...`);

for (const c of candidates) {
  await generateImage(c.prompt, c.filename, c.description);
}

console.log('\n========================================');
console.log('v5 全5案の生成が完了しました。');
console.log('========================================');
