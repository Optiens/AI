/**
 * Optiens 確定ロゴ v13-02 — シンボル単体（正方形・ファビコン用）
 *
 * 円相（ディープラピス #1F3A93）+ 中心ドット（桜 #E48A95）のみ
 * ワードマークなし、ファビコン・アプリアイコン用途。
 *
 * 出力:
 * - public/images/optiens-symbol.png         (1024x1024 オリジナル)
 * - public/images/optiens-symbol-512.png     (PWA・OG用)
 * - public/images/optiens-symbol-192.png     (Android Chrome)
 * - public/images/optiens-symbol-180.png     (apple-touch-icon)
 * - public/favicon-32.png                    (favicon 32x32)
 * - public/favicon-16.png                    (favicon 16x16)
 */
import OpenAI from 'openai';
import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

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
const PUBLIC_DIR = resolve(__dirname, '../public');
const IMG_DIR = resolve(PUBLIC_DIR, 'images');

const SOURCE_PATH = resolve(IMG_DIR, 'optiens-symbol.png');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('OPENAI_API_KEY が設定されていません');
  process.exit(1);
}

const client = new OpenAI({ apiKey: API_KEY });

const prompt = `Design a SQUARE logo symbol for a Japanese AI/tech company called "Optiens".
This is the symbol-only version (no wordmark / no text), for use as a favicon and app icon.

LAYOUT (CRITICAL):
- Square 1:1 composition, the symbol perfectly centered.
- Pure white background (#FFFFFF), edge-to-edge, no frame.
- Generous negative space around the symbol (the symbol occupies about 70% of the canvas).
- NO TEXT anywhere — pure symbol only.

SYMBOL SPECIFICATION (Ensō with center dot):
- A thick clean geometric Ensō circle in deep lapis lazuli blue (#1F3A93).
- Stroke width: about 14% of circle diameter (THICK and confident).
- Small gap at upper-right (about 20 degrees).
- At the geometric center of the Ensō, a small filled solid circle (dot)
  in cherry blossom pink (#E48A95).
- Dot diameter: about 18% of Ensō diameter (clearly visible but not overpowering).
- The center dot represents "focus / essence / the optimal point".

DESIGN PHILOSOPHY:
- ULTRA SIMPLE — geometric vector only, no texture, no shading, no gradients.
- Modern, clean, Japanese-influenced minimalism.
- The symbol should be perfectly readable at 32x32 pixels.

STRICT NEGATIVE CONSTRAINTS:
- NO text anywhere, NO letters, NO foreign scripts.
- NO drop shadows, NO 3D bevels, NO gradients (solid fills only).
- NO brush texture, NO ink wash, NO calligraphy effects.
- NO purple-violet, NO green, NO orange, NO turquoise — ONLY deep lapis lazuli blue (#1F3A93) and sakura pink (#E48A95).
- NO additional dots, NO additional shapes inside or outside the Ensō.
- NO border, NO frame, NO box around the symbol.
- The blue must be deep lapis lazuli — NOT default tech blue / NOT navy / NOT royal blue.
`;

console.log('Optiens シンボル単体（正方形・ラピスB版）を生成中...');

try {
  const response = await client.images.generate({
    model: 'gpt-image-2',
    prompt,
    size: '1024x1024',
    quality: 'high',
    n: 1,
  });

  const b64 = response.data[0].b64_json;
  writeFileSync(SOURCE_PATH, Buffer.from(b64, 'base64'));
  console.log(`✓ オリジナル保存: ${SOURCE_PATH}`);
} catch (err) {
  console.error('✗ 生成エラー:', err.message);
  if (err.status) console.error(`HTTPステータス: ${err.status}`);
  process.exit(1);
}

// ===== 各サイズ生成 =====
const sizeTargets = [
  { size: 512, out: resolve(IMG_DIR, 'optiens-symbol-512.png'),  desc: 'PWA / OG / 大' },
  { size: 192, out: resolve(IMG_DIR, 'optiens-symbol-192.png'),  desc: 'Android Chrome' },
  { size: 180, out: resolve(IMG_DIR, 'optiens-symbol-180.png'),  desc: 'apple-touch-icon' },
  { size: 32,  out: resolve(PUBLIC_DIR, 'favicon-32.png'),       desc: 'favicon 32px' },
  { size: 16,  out: resolve(PUBLIC_DIR, 'favicon-16.png'),       desc: 'favicon 16px' },
];

console.log('\n各サイズへリサイズ中...');
for (const t of sizeTargets) {
  await sharp(SOURCE_PATH)
    .resize(t.size, t.size, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      kernel: 'lanczos3',
    })
    .png({ compressionLevel: 9 })
    .toFile(t.out);
  console.log(`  ✓ [${t.size}x${t.size}] ${t.desc} → ${t.out}`);
}

console.log('\n全サイズ生成完了');
