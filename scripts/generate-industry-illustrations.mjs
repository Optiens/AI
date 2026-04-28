/**
 * Optiens 11業種サンプル用フラットイラスト生成（Gemini Imagen 4）
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
const PUBLIC_DIR = resolve(__dirname, '../public/images/industries');

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
    filename: 'legal.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing legal and accounting professional services.
Visual elements: A stylized balance scale (justice scale) in the center, with a small document
or paper stack beside it. A few floating dots or geometric particles for ambiance.
Primary color: sky blue. Secondary accents: vibrant purple, warm orange.
The illustration suggests "fairness and trust" without any words. No text on documents.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'pension.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing eldercare and pension services.
Visual elements: A simple bed shape with a soft pillow, a small heart shape floating above
suggesting care, and a few gentle decorative dots.
Primary color: vibrant purple. Secondary accents: sky blue, warm orange.
The illustration suggests "comfort and safety" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'restaurant.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing a restaurant and dining service.
Visual elements: A round plate with a fork and knife crossed elegantly, with a small
cup or glass beside, and a few warm steam wisps rising up.
Primary color: warm orange. Secondary accents: vibrant purple, emerald green.
The illustration suggests "delicious meal" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'ec.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing e-commerce and online shopping.
Visual elements: A stylized cardboard package box with a delivery arrow flowing around it,
plus a small cart icon and a few floating geometric particles.
Primary color: vibrant purple. Secondary accents: sky blue, warm orange.
The illustration suggests "smooth delivery and shopping" without any words. No barcode or labels.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'construction.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing construction industry.
Visual elements: A safety helmet (hard hat) shape, with a folded blueprint or geometric
building plan beside it, and a small wrench or tool icon.
Primary color: sky blue. Secondary accents: warm orange, vibrant purple.
The illustration suggests "building and safety" without any words. No measurements visible.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'winery.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing a winery.
Visual elements: A stylized wine glass with a soft purple liquid, a small grape cluster shape
to the side, and a few decorative leaves.
Primary color: vibrant purple. Secondary accents: emerald green, warm orange.
The illustration suggests "premium wine craft" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'outdoor.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing outdoor and camping business.
Visual elements: A simple mountain shape with a small tent in front, a sun or moon above,
and a few decorative trees or plants.
Primary color: emerald green. Secondary accents: sky blue, warm orange.
The illustration suggests "nature and adventure" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'bakery.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing a bakery.
Visual elements: A round bread loaf shape, with a few wheat grain stems beside it,
and a small steam wisp suggesting fresh-baked warmth.
Primary color: warm orange. Secondary accents: emerald green, vibrant purple.
The illustration suggests "fresh-baked bread" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'farmer.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing a farmer and crop production.
Visual elements: A small seedling or plant sprout growing from rounded soil mound,
with a stylized sun above and a few floating particles for atmosphere.
Primary color: emerald green. Secondary accents: warm orange, sky blue.
The illustration suggests "growing crops" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'dairy.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing a dairy farm.
Visual elements: A simple cute cow head silhouette (rounded, friendly), with a small
milk bottle or jug beside, and a few decorative grass blades.
Primary color: emerald green. Secondary accents: warm orange, sky blue.
The illustration suggests "fresh dairy from happy cows" without any words. No spots forming letters.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'municipality.png',
    prompt: `${STYLE}\n\nSubject: An abstract illustration representing a municipality / local government office.
Visual elements: A simple government-style building with columns and a flag pole on top,
with a small map shape or location pin beside, and a few small human silhouettes.
Primary color: sky blue. Secondary accents: vibrant purple, warm orange.
The illustration suggests "civic services" without any words. No flag pattern with text.
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
