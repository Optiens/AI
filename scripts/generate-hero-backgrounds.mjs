/**
 * ヒーロー背景画像生成スクリプト（Gemini Imagen 4.0）
 * AI導入支援・AI小説のタブ用背景画像を生成
 */
import { GoogleGenAI } from '@google/genai';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = resolve(__dirname, '../src/assets');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY が設定されていません');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const images = [
  {
    filename: 'hero-ai-consulting.webp',
    prompt: `Wide cinematic panoramic view of a small Japanese mountain town at the base of Mount Yatsugatake,
      warm golden hour lighting, cozy wooden cafe and small shops along a quiet street,
      subtle holographic AI interface overlays floating above the buildings showing business analytics dashboards and charts,
      blend of traditional Japanese rural architecture with futuristic digital technology elements,
      warm teal and amber color palette, professional photography style,
      conveys the feeling of AI empowering small local businesses in a beautiful mountain setting,
      no people prominently visible, atmospheric and aspirational, ultra-realistic, 16:9 aspect ratio`,
  },
  {
    filename: 'hero-ai-novel.webp',
    prompt: `Wide cinematic panoramic view of an ethereal library or study at night,
      bookshelves stretching into infinity with warm amber lighting,
      streams of luminous text and Japanese characters flowing through the air like aurora borealis,
      an open notebook on a desk with golden light emanating from its pages,
      blend of traditional paper books with digital light particles and data streams,
      deep indigo and warm gold color palette, magical realism aesthetic,
      conveys the fusion of human creativity and AI in storytelling,
      atmospheric, dreamlike, mysterious yet inviting, ultra-realistic, 16:9 aspect ratio`,
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
        aspectRatio: '16:9',
      },
    });

    const imageData = response.generatedImages[0].image.imageBytes;
    const outputPath = resolve(ASSETS_DIR, filename);
    writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
    console.log(`保存完了: ${outputPath}`);
  } catch (err) {
    console.error(`エラー (${filename}):`, err.message);
  }
}

for (const img of images) {
  await generateImage(img.prompt, img.filename);
}

console.log('全画像の生成が完了しました。');
