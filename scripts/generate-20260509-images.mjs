/**
 * 2026-05-09 公開ブログ記事 10 本のアイキャッチ画像を一括生成
 * gpt-image-2 を使用（既存スクリプト generate-blog-openai.mjs と同方式）
 */
import OpenAI from 'openai';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
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
} catch {}

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('ERROR: OPENAI_API_KEY が設定されていません');
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
    slug: '20260509-ai-model-selection-guide-may-2026',
    prompt: 'A sophisticated editorial illustration of a multi-tier selection of AI models stacked like architectural levels — top tier glowing in deep cobalt blue suggesting premium quality, middle tier in lighter blue, bottom tier in soft gray. Each tier represented as floating crystalline panels with subtle node connections between them. Conveys "tiered AI model selection" without text.',
  },
  {
    slug: '20260509-tabelog-no-public-api-review-monitoring',
    prompt: 'A serene Japanese cafe storefront at golden hour, viewed from the street. Soft afternoon light, an empty wooden chalkboard menu by the door (no text on it). In the background, a subtle digital glow suggesting connected systems — but the focus is on the warmth of the cafe. Editorial photography style, evokes "monitoring local restaurant reputation".',
  },
  {
    slug: '20260509-ai-driven-development-half-year-to-2-4-months-truth',
    prompt: 'A split visual: on the left, an old paper calendar with weeks crossed off representing slow traditional development; on the right, a modern minimalist hourglass with sand flowing faster than expected, surrounded by floating blueprint sketches and code architecture diagrams (abstract, no text). Conveys "development time compression" with a thoughtful, measured tone — not exaggerated.',
  },
  {
    slug: '20260509-ai-reply-friendly-tone-low-rating-pitfall',
    prompt: 'An abstract editorial illustration of two contrasting communication tones: a soft warm cloud of muted dusty rose representing "appropriate empathy", and next to it a jarring bright cheerful balloon in saturated yellow representing "inappropriate cheerfulness". The two are visually clashing in subtle tension. Modern minimalist style.',
  },
  {
    slug: '20260509-industry-specific-demo-effective-reason',
    prompt: 'A modern editorial illustration showing a single elegant magnifying glass focusing on one specific industry icon (an abstract storefront silhouette) among a row of gray, blurred generic icons in the background. The focused industry icon is rendered in deep teal with crisp detail. Conveys "industry-specific specialization" vs generic features.',
  },
  {
    slug: '20260509-ai-api-running-cost-calculation-guide',
    prompt: 'An editorial photograph of a calm modern accountant\'s desk: a sleek calculator, an open notebook with abstract geometric shapes that could represent calculations, neat stacks of receipts (blank, no text), a small succulent plant. Soft morning light. Conveys "transparent cost calculation" with a calm, trustworthy aesthetic.',
  },
  {
    slug: '20260509-new-employee-training-replaced-by-ai',
    prompt: 'A modern editorial illustration of a young office worker sitting confidently at a clean desk, looking attentively at a softly glowing monitor (screen content abstract, no text). Behind them, transparent silhouettes of senior workers continuing their own work undisturbed. Soft natural light. Conveys "self-sufficient onboarding without interrupting seniors".',
  },
  {
    slug: '20260509-google-business-profile-api-application-approval',
    prompt: 'A modern editorial illustration of an elegant document folder being slowly unsealed by a hand, with a soft golden light emerging from inside. The folder is on a neutral wood-grain desk with a small calendar showing pages turning to indicate elapsed time. Conveys "patient waiting for official approval" with a measured, professional tone.',
  },
  {
    slug: '20260509-ai-monthly-thousands-yen-trap',
    prompt: 'A subtle editorial illustration of a tiny price tag glowing red, attached to a fishhook descending into clear water. Below the surface, the silhouette of a much larger hidden cost — like an iceberg — looms in the depths. Cool blue tones, minimalist composition. Conveys "hidden cost behind the cheap label" without alarmism.',
  },
  {
    slug: '20260509-cost-priority-vs-quality-priority-30x-difference',
    prompt: 'A modern editorial illustration of a balance scale with two distinct objects — on one side a single high-quality crystal sphere (representing premium investment), on the other a stack of small simple stones (representing cost optimization). The scale is gently tilted toward the crystal. Soft editorial lighting, neutral palette with deep blue accents. Conveys "thoughtful budget allocation".',
  },
];

const client = new OpenAI({ apiKey: API_KEY });

async function generateOne(article) {
  const outPath = `public/images/blog/${article.slug}.webp`;
  if (existsSync(outPath)) {
    console.log(`SKIP (exists): ${article.slug}`);
    return;
  }
  console.log(`Generating: ${article.slug}`);
  try {
    const response = await client.images.generate({
      model: 'gpt-image-2',
      prompt: article.prompt + STYLE_SUFFIX,
      size: '1536x1024',
      quality: 'high',
      n: 1,
    });
    const b64 = response.data[0].b64_json;
    const buffer = Buffer.from(b64, 'base64');
    const outDir = dirname(outPath);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    try {
      const sharp = (await import('sharp')).default;
      await sharp(buffer).webp({ quality: 85 }).toFile(outPath);
      console.log(`  OK -> ${outPath}`);
    } catch {
      const pngPath = outPath.replace(/\.webp$/i, '.png');
      writeFileSync(pngPath, buffer);
      console.warn(`  WARN: sharp not available, saved PNG -> ${pngPath}`);
    }
  } catch (err) {
    console.error(`  ERROR: ${article.slug}: ${err.message}`);
    if (err.status) console.error(`    HTTP ${err.status}`);
  }
}

// Sequential（並列だとレート制限に当たりやすい）
for (const article of articles) {
  await generateOne(article);
}

console.log('\n完了。');
