/**
 * Optiens 新ロゴ候補 v13 — 5案
 *
 * テーマ:
 * - 「O」をマークに置換 → [Ensō+最適化シンボル] + ptiens の融合型
 * - 筆書きを廃し、シンプルなジオメトリックベクター
 * - 円相を太目（thick stroke）に
 * - 黄金比に代わる「最適化」表現を5パターン:
 *   A. 上向き矢印（改善・成長）
 *   B. 中心ドット（焦点・本質）
 *   C. 内向き三本線（収束プロセス）
 *   D. 上昇ライン（rising trend）
 *   E. 内向き三角形（targeting / 焦点）
 *
 * ブランドカラー: チタンブルー #3D6FA0 / 桜 #E48A95
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
LAYOUT (CRITICAL — please follow exactly):
- Horizontal logo composition for a website header.
- The mark (Ensō circle + optimization symbol) REPLACES the letter "O" in "Optiens".
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
- Color: dark navy / titanium blue dim (#1F4D7A).

BRAND COLOR PALETTE (Optiens):
- Primary: titanium blue (#3D6FA0).
- Accent: cherry blossom pink / sakura (#E48A95).
- Wordmark: titanium blue dim (#1F4D7A).
- DO NOT use green, orange, yellow, purple, or any other color.

ENSŌ MARK SPECIFICATION:
- Ensō = a near-complete circle with a small gap (about 20 degrees) at the upper-right.
- Stroke: THICK and confident geometric vector (about 12-16% of circle diameter as stroke width).
- NOT brushed, NOT calligraphy texture — clean geometric vector lines only.
- Color: titanium blue (#3D6FA0).
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
- NO purple, NO green, NO orange — ONLY titanium blue (#3D6FA0) and sakura pink (#E48A95).
`;

const candidates = [
  {
    filename: 'logo-v13-01-enso-with-upward-arrow.png',
    description: 'A. 太い円相（チタン）+ 内側に上向き矢印（桜）+ ptiens',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Mark = Ensō with upward arrow inside (improvement metaphor):
The mark replaces the "O" in "Optiens" and consists of:
- A thick clean geometric Ensō circle in titanium blue (#3D6FA0).
- Stroke width: about 14% of circle diameter (THICK and confident).
- Small gap at upper-right (about 20 degrees).
- Inside the Ensō, centered, a small upward-pointing arrow in cherry blossom pink (#E48A95).
- Arrow style: simple geometric (a triangular arrowhead with short shaft).
- Arrow size: about 40% of Ensō diameter.
- The arrow represents "improvement / optimization upward".

Then the wordmark "ptiens" follows directly to the right of the mark.
Final result reads as: [Mark]ptiens — appearing as "Optiens" with the mark as the "O".

${COMMON}`,
  },
  {
    filename: 'logo-v13-02-enso-with-center-dot.png',
    description: 'B. 太い円相（チタン）+ 中心に小ドット（桜）+ ptiens',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Mark = Ensō with sakura focal dot at center (focus metaphor):
The mark replaces the "O" in "Optiens" and consists of:
- A thick clean geometric Ensō circle in titanium blue (#3D6FA0).
- Stroke width: about 14% of circle diameter (THICK).
- Small gap at upper-right (about 20 degrees).
- At the geometric center of the Ensō, a small filled solid circle (dot)
  in cherry blossom pink (#E48A95).
- Dot diameter: about 18% of Ensō diameter (clearly visible but not overpowering).
- The center dot represents "focus / essence / the optimal point".

Then the wordmark "ptiens" follows directly to the right of the mark.
Final result reads as: [Mark]ptiens — appearing as "Optiens" with the mark as the "O".

${COMMON}`,
  },
  {
    filename: 'logo-v13-03-enso-with-converging-lines.png',
    description: 'C. 太い円相（チタン）+ 中心に向かう3本線（桜）+ ptiens',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Mark = Ensō with three converging lines (optimization convergence):
The mark replaces the "O" in "Optiens" and consists of:
- A thick clean geometric Ensō circle in titanium blue (#3D6FA0).
- Stroke width: about 14% of circle diameter (THICK).
- Small gap at upper-right (about 20 degrees).
- Inside the Ensō, three short straight lines in cherry blossom pink (#E48A95)
  that converge toward the center point from three directions
  (top, bottom-left, bottom-right — like a peace symbol but shorter).
- Lines do NOT touch the center; they end about 25% from center.
- Lines are clean geometric strokes, about 8% width of Ensō diameter.
- Represents "convergence to the optimal point" / "data flowing into insight".

Then the wordmark "ptiens" follows directly to the right of the mark.
Final result reads as: [Mark]ptiens — appearing as "Optiens" with the mark as the "O".

${COMMON}`,
  },
  {
    filename: 'logo-v13-04-enso-with-rising-line.png',
    description: 'D. 太い円相（チタン）+ 内側に上昇する短いライン（桜）+ ptiens',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Mark = Ensō with a rising line inside (growth/optimization trend):
The mark replaces the "O" in "Optiens" and consists of:
- A thick clean geometric Ensō circle in titanium blue (#3D6FA0).
- Stroke width: about 14% of circle diameter (THICK).
- Small gap at upper-right (about 20 degrees).
- Inside the Ensō, a short ascending line in cherry blossom pink (#E48A95)
  going from the lower-left to the upper-right (about 45-degree angle).
- Line style: simple geometric stroke, about 10% width of Ensō diameter,
  ending in a small dot at both ends (or just a clean line).
- Length: about 50% of Ensō diameter.
- Represents "growth / improvement / upward trend".

Then the wordmark "ptiens" follows directly to the right of the mark.
Final result reads as: [Mark]ptiens — appearing as "Optiens" with the mark as the "O".

${COMMON}`,
  },
  {
    filename: 'logo-v13-05-enso-with-inward-triangle.png',
    description: 'E. 太い円相（チタン）+ 内向きの三角形（桜）+ ptiens',
    prompt: `Design a horizontal logo for a Japanese AI/tech company called "Optiens".

CONCEPT — Mark = Ensō with an inward-pointing triangle (targeting/focus):
The mark replaces the "O" in "Optiens" and consists of:
- A thick clean geometric Ensō circle in titanium blue (#3D6FA0).
- Stroke width: about 14% of circle diameter (THICK).
- Small gap at upper-right (about 20 degrees).
- Inside the Ensō, slightly off-center (positioned at the upper area, balancing the gap),
  a small filled solid triangle in cherry blossom pink (#E48A95) pointing downward toward
  the center of the Ensō.
- Triangle size: about 22% of Ensō diameter.
- Represents "targeting the optimal / arrow toward focus".

Then the wordmark "ptiens" follows directly to the right of the mark.
Final result reads as: [Mark]ptiens — appearing as "Optiens" with the mark as the "O".

${COMMON}`,
  },
];

console.log(`Generating ${candidates.length} logo candidates v13 with gpt-image-2...`);

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

console.log('\nv13 ロゴ候補の生成完了');
