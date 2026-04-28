/**
 * Optiens 2事業カード用フラットイラスト生成（Gemini Imagen 4）
 * Figma 4色パレット（紫・青・緑・橙）でモダンSaaS風
 *
 * NOTE: gpt-image-2 のOrganization Verification承認後はOpenAIに切替予定
 */
import { GoogleGenAI } from '@google/genai';
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
const PUBLIC_DIR = resolve(__dirname, '../public/images/businesses');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY が設定されていません');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
    filename: 'ai-consulting.png',
    prompt: `${STYLE}

Subject: A friendly abstract illustration representing technology-assisted work transformation for businesses.
Visual elements: A stylized human silhouette working at a desk on the left, next to
a small floating purple geometric character (a soft rounded blob with two simple dot eyes,
no letters or symbols on its body). Between them, smooth flowing curved lines suggesting collaboration.
Below or around them, simple geometric document icons (rectangles in mixed colors).
Primary color: vibrant purple. Secondary accents: sky blue, emerald green, warm orange.
The illustration suggests "smart partner in daily work" without any words.
CRITICAL: The purple character must be a plain geometric blob with only dot eyes -
absolutely no letters, symbols, or markings on its surface.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'hydroponics.png',
    prompt: `${STYLE}

Subject: A friendly abstract illustration representing indoor IoT hydroponic farming.
Visual elements: A stylized green plant or leaf shape growing inside a clean rectangular frame
suggesting a vertical farm rack. Around the plant, small geometric sensor nodes
(small dots in blue, orange) connected by thin lines suggesting IoT data.
A soft horizontal line below the plant suggests water flow.
Primary color: emerald green. Secondary accents: sky blue, warm orange, vibrant purple.
The illustration suggests "plants growing inside a smart system" without any words.
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
