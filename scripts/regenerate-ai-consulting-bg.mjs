import { GoogleGenAI } from '@google/genai';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = resolve(__dirname, '../src/assets');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const prompt = `Abstract bright clean data visualization artwork,
  flowing luminous network lines and nodes connecting across the canvas,
  soft white and light teal gradient background with subtle mint green and pale gold accents,
  geometric data flow patterns resembling neural networks and business process diagrams,
  glowing connection points like stars scattered across a bright sky,
  light rays streaming through translucent data layers,
  minimal, modern, airy and optimistic feeling,
  no text, no people, no devices, no buildings,
  bright white and teal color palette with warm gold highlights,
  professional corporate abstract art style, ultra high quality, 16:9 aspect ratio`;

console.log('生成中: hero-ai-consulting.webp');
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
const outputPath = resolve(ASSETS_DIR, 'hero-ai-consulting.webp');
writeFileSync(outputPath, Buffer.from(imageData, 'base64'));
console.log('保存完了:', outputPath);
