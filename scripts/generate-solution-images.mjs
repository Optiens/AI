/**
 * NanoBanana2 (Google Imagen via Gemini API) による
 * ソリューションページ用アイキャッチ画像生成スクリプト
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
    filename: 'precision-cultivation-model.png',
    prompt: `Industrial-grade enclosed vertical hydroponic cultivation module,
      stainless steel rack structure with integrated LED grow lights in deep green and cool white tones,
      sealed closed-loop water circulation system with visible sensor probes and control panel displays,
      clean sterile environment suggesting hospital utility room or disaster preparedness facility,
      dark teal and charcoal gray color palette, professional product photography,
      no people, no home garden aesthetic, no exposed jumper wires,
      high-end engineering product, ultra-realistic, cinematic lighting`,
  },
  {
    filename: 'data-analysis-optimization.png',
    prompt: `Professional engineer holding a tablet device outdoors or in a facility corridor,
      viewing a real-time SaaS monitoring dashboard on the tablet screen,
      dashboard shows water quality sensors, temperature graphs, nutrient EC/pH charts,
      and system uptime statistics with dark teal and green data visualizations,
      background suggests industrial or hospital utility facility, not a farm or greenhouse,
      emphasizing remote access and mobile monitoring from anywhere,
      professional B2B setting, cinematic lighting, ultra-realistic`,
  },
];

async function generateImage(prompt, filename) {
  console.log(`生成中: ${filename}`);
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
}

for (const img of images) {
  await generateImage(img.prompt, img.filename);
}

console.log('全画像の生成が完了しました。');
