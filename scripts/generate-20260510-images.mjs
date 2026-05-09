/**
 * 2026-05-10 公開ブログ記事 3 本のアイキャッチ画像を一括生成
 * Gemini 2.5 Flash Image 使用（無料枠 500 req/日内）
 */
import { GoogleGenAI } from '@google/genai';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([^#=]+?)=(.*)$/);
    if (m) {
      const k = m[1].trim();
      const v = m[2].trim();
      if (v) process.env[k] = v;
    }
  });
} catch {}

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('ERROR: GEMINI_API_KEY が設定されていません');
  process.exit(1);
}

const STYLE_SUFFIX = `

Style: modern, clean, professional editorial business magazine illustration or photography.
Use a neutral color palette appropriate to the topic — natural lighting, subdued tones,
or topic-relevant colors. DO NOT apply any specific brand color scheme.
No text, no letters, no numbers, no logos, no watermarks.
16:9 horizontal composition, plenty of negative space, sophisticated lighting, high quality.`;

const articles = [
  {
    slug: '20260510-instagram-graph-api-app-review-guide',
    prompt: 'A modern editorial illustration of an official-looking document folder being carefully reviewed under a magnifying glass on a clean wooden desk. Beside it, a small calendar with several pages turning suggesting elapsed weeks. Soft golden afternoon light. Conveys "patient progression through formal approval process" with a measured, professional tone. Subtle blue accent.',
  },
  {
    slug: '20260510-trust-but-verify-ai-numbers',
    prompt: 'A sophisticated editorial photograph: a clean modern desk with an open notebook displaying abstract geometric data shapes (no text), a magnifying glass hovering over them, a small calculator nearby. Soft morning light from a window. The composition emphasizes "verifying numbers carefully before trusting them" with calm precision. Neutral palette with deep teal accents.',
  },
  {
    slug: '20260510-ai-erasing-ask-senior-culture',
    prompt: 'A modern editorial illustration showing two contrasting scenes side by side: on the left, a young office worker quietly typing at a sleek minimal desk facing a softly glowing screen (representing AI dialogue); on the right, the silhouette of a warm conversation between two coworkers with coffee cups (representing human mentorship). The two scenes are gently connected by a subtle bridge of light. Conveys "balance between AI efficiency and human relationship" with thoughtful warmth.',
  },
];

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function generateOne(article) {
  const outPath = `public/images/blog/${article.slug}.webp`;
  if (existsSync(outPath)) {
    console.log(`SKIP (exists): ${article.slug}`);
    return;
  }
  console.log(`Generating: ${article.slug}`);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: article.prompt + STYLE_SUFFIX }] }],
    });

    let imageBuffer = null;
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          imageBuffer = Buffer.from(part.inlineData.data, 'base64');
          break;
        }
      }
      if (imageBuffer) break;
    }

    if (!imageBuffer) {
      console.error(`  ERROR: 画像データなし for ${article.slug}`);
      return;
    }

    const outDir = dirname(outPath);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    try {
      const sharp = (await import('sharp')).default;
      await sharp(imageBuffer).webp({ quality: 85 }).toFile(outPath);
      console.log(`  OK -> ${outPath}`);
    } catch {
      const pngPath = outPath.replace(/\.webp$/i, '.png');
      writeFileSync(pngPath, imageBuffer);
      console.warn(`  WARN: sharp not available, PNG -> ${pngPath}`);
    }
  } catch (err) {
    console.error(`  ERROR: ${article.slug}: ${err.message}`);
    if (err.status) console.error(`    HTTP ${err.status}`);
  }
}

for (const article of articles) {
  await generateOne(article);
}

console.log('\n完了。');
