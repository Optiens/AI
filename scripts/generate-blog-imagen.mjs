/**
 * Optiens ブログ記事アイキャッチ画像生成（Vertex AI / Imagen 4 Ultra 版）
 *
 * Google Cloud $300 トライアルクレジットで Imagen 4 Ultra を試す
 * 単価 $0.06/画像（推定）。クレジット約 ¥41,462 で 約 4,500 画像生成可
 *
 * 使い方:
 *   node scripts/generate-blog-imagen.mjs "プロンプト" "出力ファイルパス（.webp）"
 *
 * 必要な環境変数（.env）:
 *   GCP_PROJECT_ID=gen-lang-client-0493800034
 *   GOOGLE_APPLICATION_CREDENTIALS=C:\Users\blueb\.config\optiens\gcp-imagen-key.json
 *
 * 仕様:
 *   - モデル: imagen-4.0-ultra-generate-001
 *   - リージョン: us-central1
 *   - 出力: 1024x1024 標準（モデル仕様）
 *   - PNG → WebP 変換（sharp 使用）
 *   - 16:9 アスペクト比 (aspectRatio: "16:9")
 */
import { GoogleAuth } from 'google-auth-library';
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

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_LOCATION || 'us-central1';
const MODEL = process.env.IMAGEN_MODEL || 'imagen-4.0-ultra-generate-001';

if (!PROJECT_ID) {
  console.error('ERROR: GCP_PROJECT_ID が .env に設定されていません');
  process.exit(1);
}
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('ERROR: GOOGLE_APPLICATION_CREDENTIALS が .env に設定されていません');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node scripts/generate-blog-imagen.mjs <prompt> <output_path>');
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

console.log(`Generating with ${MODEL} via Vertex AI (${LOCATION})...`);
console.log(`Prompt: ${userPrompt.slice(0, 80)}...`);

try {
  // OAuth トークン取得
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const tokenResp = await client.getAccessToken();
  const token = tokenResp.token;

  if (!token) {
    console.error('ERROR: アクセストークンの取得に失敗');
    process.exit(1);
  }

  // Vertex AI predict エンドポイント
  const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:predict`;

  const requestBody = {
    instances: [{ prompt: fullPrompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '16:9',
      safetySetting: 'block_only_high',
      personGeneration: 'allow_adult',
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`ERROR: HTTP ${response.status}`);
    console.error(errText.slice(0, 1000));
    process.exit(1);
  }

  const result = await response.json();
  const predictions = result.predictions || [];
  if (predictions.length === 0 || !predictions[0].bytesBase64Encoded) {
    console.error('ERROR: 画像データがレスポンスに含まれていません');
    console.error(JSON.stringify(result, null, 2).slice(0, 500));
    process.exit(1);
  }

  const imageBuffer = Buffer.from(predictions[0].bytesBase64Encoded, 'base64');

  // 出力ディレクトリ作成
  const outDir = dirname(outputPath);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  if (isWebp) {
    try {
      const sharp = (await import('sharp')).default;
      await sharp(imageBuffer).webp({ quality: 85 }).toFile(outputPath);
      console.log(`OK: ${outputPath} (WebP, ${MODEL})`);
    } catch (e) {
      const pngPath = outputPath.replace(/\.webp$/i, '.png');
      writeFileSync(pngPath, imageBuffer);
      console.warn(`WARN: sharp not installed, saved as PNG: ${pngPath}`);
    }
  } else {
    writeFileSync(outputPath, imageBuffer);
    console.log(`OK: ${outputPath} (${MODEL})`);
  }
} catch (err) {
  console.error(`ERROR: ${err.message}`);
  if (err.stack) console.error(err.stack.split('\n').slice(0, 5).join('\n'));
  process.exit(1);
}
