/**
 * Optiens ブログ記事アイキャッチ画像生成（OpenAI gpt-image-2 版）
 * Skill: write-blog-article の Step 4 で利用
 *
 * 使い方:
 *   node scripts/generate-blog-openai.mjs "プロンプト" "出力ファイルパス（.webp）"
 *
 * 例:
 *   node scripts/generate-blog-openai.mjs "modern AI orchestrator coordinating agents" "public/images/blog/test.webp"
 *
 * 仕様:
 *   - モデル: gpt-image-2
 *   - サイズ: 1536x1024（16:9寄り）、品質: high
 *   - PNG → WebP 変換（sharp 利用、未インストール時はPNGのまま保存）
 *   - OPENAI_API_KEY を .env から自動読み込み
 */
import OpenAI from 'openai';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// .env 読み込み
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

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('ERROR: OPENAI_API_KEY が設定されていません');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/generate-blog-openai.mjs <prompt> <output_path>');
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

const client = new OpenAI({ apiKey: API_KEY });

console.log(`Generating image with gpt-image-2...`);
console.log(`Prompt: ${userPrompt.slice(0, 80)}...`);

try {
  const response = await client.images.generate({
    model: 'gpt-image-2',
    prompt: fullPrompt,
    size: '1536x1024',
    quality: 'high',
    n: 1,
  });

  const b64 = response.data[0].b64_json;
  const buffer = Buffer.from(b64, 'base64');

  // 出力ディレクトリ作成
  const outDir = dirname(outputPath);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  if (isWebp) {
    // WebP変換が必要 — sharp があれば使用、なければPNG保存
    try {
      const sharp = (await import('sharp')).default;
      await sharp(buffer).webp({ quality: 85 }).toFile(outputPath);
      console.log(`OK: ${outputPath} (WebP, gpt-image-2)`);
    } catch (e) {
      // sharp未インストール時はPNGとして保存し、拡張子も変える
      const pngPath = outputPath.replace(/\.webp$/i, '.png');
      writeFileSync(pngPath, buffer);
      console.warn(`WARN: sharp not installed, saved as PNG: ${pngPath}`);
    }
  } else {
    writeFileSync(outputPath, buffer);
    console.log(`OK: ${outputPath} (PNG, gpt-image-2)`);
  }
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  if (err.status) console.error(`HTTP Status: ${err.status}`);
  process.exit(1);
}
