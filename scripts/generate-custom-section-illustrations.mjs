/**
 * service.astro「業務に合わせた、専用の仕組み」セクション用フラットイラスト生成
 * OpenAI gpt-image-2
 */
import OpenAI from 'openai';
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
const PUBLIC_DIR = resolve(__dirname, '../public/images/services');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('OPENAI_API_KEY が設定されていません');
  process.exit(1);
}

const client = new OpenAI({ apiKey: API_KEY });

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
    filename: 'custom-fit.png',
    prompt: `${STYLE}

Subject: An illustration representing a system designed to perfectly fit a unique workflow.
Visual elements: A large purple custom-shaped puzzle piece interlocking smoothly with
two or three differently-shaped surrounding pieces in blue and green. The pieces fit together
naturally without gaps. A gentle highlight on the central piece.
Primary color: vibrant purple. Secondary accents: sky blue and emerald green.
The illustration suggests "the system shapes itself to your business" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'asset-ownership.png',
    prompt: `${STYLE}

Subject: An illustration representing ownership of a software asset (no recurring license fees).
Visual elements: A friendly classic key in vibrant purple resting on top of an open simple
treasure chest or vault with abstract data blocks (cubes / stylized files) in blue, green, and
orange visible inside. The composition feels welcoming and confident, not corporate.
Primary color: vibrant purple. Secondary accents: sky blue, emerald green, warm orange.
The illustration suggests "you hold the keys to your own system" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
  {
    filename: 'easy-sharing.png',
    prompt: `${STYLE}

Subject: An illustration representing easy sharing of a system with external collaborators.
Visual elements: A central rounded device or screen in sky blue with three or four small
colorful person icons (purple, green, orange) connected to it via smooth flowing curved lines.
Each person has a soft circle indicating their role. The connections feel light and friendly.
Primary color: sky blue. Secondary accents: vibrant purple, emerald green, warm orange.
The illustration suggests "everyone can join with one link" without any words.
Pure white background. Remember: no text, no letters, no labels at all.`,
  },
];

async function generateImage(prompt, filename) {
  console.log(`生成中: ${filename}`);
  try {
    const response = await client.images.generate({
      model: 'gpt-image-2',
      prompt,
      size: '1024x1024',
      quality: 'high',
      n: 1,
    });

    const b64 = response.data[0].b64_json;
    const outputPath = resolve(PUBLIC_DIR, filename);
    writeFileSync(outputPath, Buffer.from(b64, 'base64'));
    console.log(`✓ 保存完了: ${outputPath}`);
  } catch (err) {
    console.error(`✗ エラー (${filename}):`, err.message);
    if (err.status) console.error(`  HTTPステータス: ${err.status}`);
  }
}

for (const img of images) {
  await generateImage(img.prompt, img.filename);
}

console.log('\n全画像の生成が完了しました。');
console.log(`保存先: ${PUBLIC_DIR}`);
