/**
 * Optiens 確定ロゴ v13-02 — ラピスラズリブルー比較版（3案）
 *
 * v13-02 (Ensō + 中心ドット + ptiens) のデザインを維持し、
 * チタンブルー #3D6FA0 を以下のラピス系3色に変更して比較する。
 *
 * A. クラシックラピス #26619C — Vermeer寄り、群青、万能
 * B. ディープラピス #1F3A93 — 仏教的群青、深く知的
 * C. ロイヤルラピス #1E3F66 — 暗めで重厚
 *
 * ドット色は桜 #E48A95 のまま固定。
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

/** 共通指示文を組み立て（色だけ可変） */
function buildPrompt({ ensoColor, wordmarkColor, ensoColorName }) {
  return `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Mark = Ensō with sakura focal dot at center (focus metaphor):
The mark replaces the "O" in "Optiens" and consists of:
- A thick clean geometric Ensō circle in ${ensoColorName} (${ensoColor}).
- Stroke width: about 14% of circle diameter (THICK).
- Small gap at upper-right (about 20 degrees).
- At the geometric center of the Ensō, a small filled solid circle (dot)
  in cherry blossom pink (#E48A95).
- Dot diameter: about 18% of Ensō diameter (clearly visible but not overpowering).
- The center dot represents "focus / essence / the optimal point".

Then the wordmark "ptiens" follows directly to the right of the mark.
Final result reads as: [Mark]ptiens — appearing as "Optiens" with the mark as the "O".

LAYOUT (CRITICAL — please follow exactly):
- Horizontal logo composition for a website header.
- The mark (Ensō circle + center dot) REPLACES the letter "O" in "Optiens".
- Result: [MARK]ptiens — the mark IS the "O", followed directly by "ptiens".
- The mark height matches the cap-height / x-height of the wordmark for visual balance.
- The mark sits flush against "ptiens" with proper kerning (small natural gap).
- Pure white background (#FFFFFF), edge-to-edge, no frame.
- Generous negative space around the entire logo.

WORDMARK SPECIFICATION:
- The exact letters "ptiens" (lowercase p, t, i, e, n, s — 6 letters total).
- DO NOT include the letter "O" or "o" — the mark replaces it.
- Modern HUMANIST GEOMETRIC SANS-SERIF — Söhne, Aktiv Grotesk, General Sans, or Manrope.
- Open apertures on 'e' and 's', balanced curves.
- Medium weight (500-600), single line, balanced letter spacing.
- Color: dark version of ${ensoColorName} (${wordmarkColor}).

ENSŌ MARK SPECIFICATION:
- Ensō = a near-complete circle with a small gap (about 20 degrees) at the upper-right.
- Stroke: THICK and confident geometric vector (about 12-16% of circle diameter as stroke width).
- NOT brushed, NOT calligraphy texture — clean geometric vector lines only.
- Color: ${ensoColorName} (${ensoColor}).
- The gap should be visible but small, so it still reads as a circle from a distance.

DESIGN PHILOSOPHY:
- ULTRA SIMPLE — geometric vector only, no texture, no shading, no gradients on shapes.
- Modern, clean, Japanese-influenced minimalism.
- The mark should work perfectly as a small favicon (32px).
- Generous white space.

STRICT NEGATIVE CONSTRAINTS:
- Do NOT include the letter "O" or "o" anywhere in the wordmark — only "ptiens".
- NO repeated text, NO illegible letterforms, NO foreign scripts.
- NO color codes, NO labels, NO additional dots beyond the design intent.
- NO drop shadows, NO 3D bevels, NO gradients on shapes (solid fills only).
- NO brush texture, NO ink wash, NO calligraphy effects.
- NO golden ratio spirals, NO Fibonacci shapes.
- NO purple-violet, NO green, NO orange, NO turquoise — ONLY ${ensoColorName} (${ensoColor}) and sakura pink (#E48A95).
- The blue must be ${ensoColorName} as specified — NOT the default tech blue / not titanium blue / not navy.
`;
}

const candidates = [
  {
    filename: 'logo-v13-02-lapis-A-classic.png',
    description: 'A. クラシックラピス #26619C（Vermeer寄り・群青・万能）',
    ensoColor: '#26619C',
    wordmarkColor: '#173E62',
    ensoColorName: 'classic lapis lazuli blue',
  },
  {
    filename: 'logo-v13-02-lapis-B-deep.png',
    description: 'B. ディープラピス #1F3A93（仏教的群青・深く知的）',
    ensoColor: '#1F3A93',
    wordmarkColor: '#142565',
    ensoColorName: 'deep lapis lazuli blue',
  },
  {
    filename: 'logo-v13-02-lapis-C-royal.png',
    description: 'C. ロイヤルラピス #1E3F66（暗めで重厚・印刷物向け）',
    ensoColor: '#1E3F66',
    wordmarkColor: '#11253D',
    ensoColorName: 'royal deep lapis blue',
  },
];

console.log(`Optiens v13-02 ラピス比較版を ${candidates.length} パターン生成します...`);

for (const c of candidates) {
  console.log(`\n[${c.filename}]`);
  console.log(`  ${c.description}`);
  try {
    const response = await client.images.generate({
      model: 'gpt-image-2',
      prompt: buildPrompt({
        ensoColor: c.ensoColor,
        wordmarkColor: c.wordmarkColor,
        ensoColorName: c.ensoColorName,
      }),
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

console.log('\nラピス比較版の生成が完了しました');
console.log('比較先: public/images/logo-candidates/logo-v13-02-lapis-{A,B,C}-*.png');
