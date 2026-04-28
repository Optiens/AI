/**
 * Optiens サービスカード用フラットイラスト生成
 * Figma 4色パレット（紫・青・緑・橙）でモダンSaaS風
 */
import { GoogleGenAI } from '@google/genai';
import { writeFileSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// .env を手動でパース（dotenv不要）
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=]+?)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
} catch (e) {
  console.warn('.env not found, using existing env vars');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public/images/services');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY が設定されていません');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// 共通のスタイル指示（色コード・テキスト・ラベルは絶対に書かない）
const STYLE = `Flat vector illustration in modern Figma design style.
Clean, friendly, approachable, minimalist composition.
Pure white background.
Use these colors for the illustration: vibrant purple, sky blue, emerald green, warm orange.
Geometric shapes with soft rounded corners. Solid color fills.
No 3D rendering, no realistic photo, no drop shadows, no gradients on shapes.
ABSOLUTELY NO TEXT. NO LETTERS. NO NUMBERS. NO LABELS. NO COLOR CODES.
NO HEX CODES VISIBLE. NO ANNOTATIONS. NO CALLOUTS WITH WORDS.
The image must contain only visual shapes - no typography of any kind.
Centered composition with balanced negative space.
Style reference: Notion empty states, Stripe documentation hero illustrations,
Slack onboarding graphics. Clean and silent visual storytelling without words.`;

const images = [
  {
    filename: 'ai-diagnosis.png',
    prompt: `${STYLE}

Subject: A friendly abstract illustration representing AI business diagnosis.
Visual elements: A purple magnifying glass examining stylized abstract chart bars
(small bars in blue and green), with a few floating geometric particles around it.
Primary color: vibrant purple. Secondary accents: sky blue and emerald green.
The illustration suggests "discovering insights" without any words or labels.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'implementation.png',
    prompt: `${STYLE}

Subject: A friendly abstract illustration representing AI system building.
Visual elements: Three or four interconnected geometric blocks or gears in different colors,
linked by smooth flowing lines suggesting data movement.
Primary color: sky blue. Secondary accents: vibrant purple, emerald green, warm orange.
The illustration suggests "building a connected system" without any words or labels.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'maintenance.png',
    prompt: `${STYLE}

Subject: A friendly abstract illustration representing ongoing care and circular support.
Visual elements: A circular arrow loop in green forming an Ensō-like shape,
with stylized small gears or care symbols inside the loop.
Primary color: emerald green. Secondary accents: sky blue and warm orange.
The illustration suggests "continuous care and growth" without any words or labels.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
];

async function generateImage(prompt, filename) {
  console.log(`生成中: ${filename}`);
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });

    const imageData = response.generatedImages[0].image.imageBytes;
    const outputPath = resolve(PUBLIC_DIR, filename);
    writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
    console.log(`✓ 保存完了: ${outputPath}`);
  } catch (err) {
    console.error(`✗ エラー (${filename}):`, err.message);
  }
}

for (const img of images) {
  await generateImage(img.prompt, img.filename);
}

console.log('\n全画像の生成が完了しました。');
console.log(`保存先: ${PUBLIC_DIR}`);
