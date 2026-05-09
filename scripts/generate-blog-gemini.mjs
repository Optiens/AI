/**
 * Optiens ブログ記事アイキャッチ画像生成（Gemini 2.5 Flash Image 版）
 *
 * 完全無料枠（1 日 500 リクエストまで）で動作
 * gpt-image-2 の代替として使用
 *
 * 使い方:
 *   node scripts/generate-blog-gemini.mjs "プロンプト" "出力ファイルパス（.webp）"
 *
 * 例:
 *   node scripts/generate-blog-gemini.mjs "modern editorial illustration of balance scale" "public/images/blog/test.webp"
 *
 * 仕様:
 *   - モデル: gemini-2.5-flash-image
 *   - 出力: 1024x1024 が標準（モデル仕様）
 *   - PNG → WebP 変換（sharp 使用、未インストール時はPNG）
 *   - GEMINI_API_KEY を .env から自動読み込み
 */
import { GoogleGenAI } from '@google/genai';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// .env 読み込み
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

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/generate-blog-gemini.mjs <prompt> <output_path>');
  process.exit(1);
}

const [userPrompt, outputPath] = args;
const isWebp = outputPath.toLowerCase().endsWith('.webp');

const STYLE_SUFFIX = `

Style: modern, clean, professional editorial business magazine illustration or photography.
Use a neutral color palette appropriate to the topic — natural lighting, subdued tones,
or topic-relevant colors. DO NOT apply any specific brand color scheme.
No text, no letters, no numbers, no logos, no watermarks.
16:9 horizontal composition, plenty of negative space, sophisticated lighting, high quality.`;

const fullPrompt = `${userPrompt}${STYLE_SUFFIX}`;

const ai = new GoogleGenAI({ apiKey: API_KEY });

console.log(`Generating with gemini-2.5-flash-image...`);
console.log(`Prompt: ${userPrompt.slice(0, 80)}...`);

try {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ parts: [{ text: fullPrompt }] }],
  });

  // 画像データを抽出
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
    console.error('ERROR: 画像データがレスポンスに含まれていません');
    console.error('Response:', JSON.stringify(response, null, 2).slice(0, 500));
    process.exit(1);
  }

  // 出力ディレクトリ作成
  const outDir = dirname(outputPath);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  if (isWebp) {
    try {
      const sharp = (await import('sharp')).default;
      await sharp(imageBuffer).webp({ quality: 85 }).toFile(outputPath);
      console.log(`OK: ${outputPath} (WebP, gemini-2.5-flash-image)`);
    } catch (e) {
      const pngPath = outputPath.replace(/\.webp$/i, '.png');
      writeFileSync(pngPath, imageBuffer);
      console.warn(`WARN: sharp not installed, saved as PNG: ${pngPath}`);
    }
  } else {
    writeFileSync(outputPath, imageBuffer);
    console.log(`OK: ${outputPath} (gemini-2.5-flash-image)`);
  }
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  if (err.status) console.error(`HTTP Status: ${err.status}`);
  process.exit(1);
}
