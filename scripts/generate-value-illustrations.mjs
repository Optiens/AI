/**
 * Optiens 3つの価値観カード用フラットイラスト生成
 * Figma 4色パレット（紫・青・緑・橙）でモダンSaaS風
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
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
} catch (e) {
  console.warn('.env not found, using existing env vars');
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public/images/values');

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
    filename: 'harmony.png',
    prompt: `${STYLE}

Subject: A friendly abstract illustration representing harmony between people, nature, and technology.
Visual elements: Three abstract elements gracefully overlapping in a balanced triangular composition -
a stylized leaf shape (green), a simple human/figure silhouette as a soft round shape (orange),
and a small circuit-like geometric node pattern (purple/blue). They overlap softly in the center
suggesting unity and coexistence.
Primary color: warm orange. Secondary accents: emerald green, vibrant purple, sky blue.
The illustration suggests "different things coming together as one" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'optimization.png',
    prompt: `${STYLE}

Subject: A friendly abstract illustration representing refinement and optimization.
Visual elements: A central abstract shape transforming - on the left a slightly chaotic cluster
of small irregular geometric pieces (mixed colors), an arrow or flowing curve in the middle,
on the right the same elements rearranged into a clean elegant aligned pattern (purple dominant).
The composition reads as "messy becomes refined" through visual organization.
Primary color: vibrant purple. Secondary accents: sky blue, emerald green, warm orange.
The illustration suggests "making things better through arrangement" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'circulation.png',
    prompt: `${STYLE}

Subject: A friendly abstract illustration representing circulation and regeneration.
Visual elements: Two or three curved arrows forming a flowing circular loop, like water cycle
or recycling symbol but more organic and elegant. Inside the loop, a small stylized seedling
or growth element. Dotted particles flow along the curves suggesting continuous movement.
Primary color: emerald green. Secondary accents: sky blue, vibrant purple, warm orange.
The illustration suggests "things flowing back and growing" without any words.
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
