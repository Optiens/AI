/**
 * 日付プレフィックスのない記事 23 本のアイキャッチ画像を Imagen 4 Ultra で再生成
 * 既存ファイルが .png のものは .webp に統一し、frontmatter の画像パスはこのスクリプト外で修正
 *
 * 使い方:
 *   node scripts/regenerate-non-prefixed-imagen.mjs
 *
 * コスト試算: 23 画像 × $0.06 × ¥150 ≒ ¥207
 */
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const articles = [
  {
    slug: 'a-type-welfare-hydroponics-wages',
    prompt:
      'Modern editorial illustration of a clean, well-lit indoor vertical farming facility with neat rows of LED-lit hydroponic shelves growing fresh leafy herbs. Conveys steady, inclusive workplace and stable income through controlled-environment agriculture.',
  },
  {
    slug: 'abandoned-school-agriculture-revitalization',
    prompt:
      'Modern editorial illustration of an old wooden school classroom interior repurposed into a hydroponic vertical farming space, with sunlight streaming through tall windows onto rows of green leafy plants. Conveys revitalization of unused regional facilities.',
  },
  {
    slug: 'ai-agriculture-revolution-2025',
    prompt:
      'Modern editorial illustration of a precision agriculture field with subtle digital data overlays — sensor markers, satellite signal arcs, and a small autonomous drone above. Conveys data-driven farming evolution.',
  },
  {
    slug: 'ai-plant-health-image-recognition',
    prompt:
      'Modern editorial illustration of close-up green plant leaves with a soft transparent digital scanning grid and faint annotation markers detecting subtle discolorations. Conveys AI-powered plant health diagnosis.',
  },
  {
    slug: 'b-type-welfare-indoor-hydroponics-model',
    prompt:
      'Modern editorial illustration of a calm collaborative indoor hydroponic herb production workspace with people working at low-stress pace, tending to vibrant green plants under soft LED light.',
  },
  {
    slug: 'food-miles-local-production-indoor-farming',
    prompt:
      'Modern editorial illustration contrasting two paths — a long international shipping route on one side versus a short local-to-restaurant route on the other — with fresh herbs at the center. Conveys food miles reduction.',
  },
  {
    slug: 'food-security-japan-2030',
    prompt:
      'Modern editorial illustration of a modern indoor controlled-environment agriculture facility with abundant fresh produce, layered with a subtle abstract supply-chain network in the background. Conveys food security and production resilience.',
  },
  {
    slug: 'generative-ai-business-2025',
    prompt:
      'Modern editorial illustration of agricultural sensor data streams flowing into a clean tablet interface showing organized reports and recommendations. Conveys generative AI augmenting agriculture business operations.',
  },
  {
    slug: 'hydroponics-automation-global-market-2026',
    prompt:
      'Modern editorial illustration of an automated commercial-scale hydroponic facility with a subtle robotic arm tending plants, alongside ascending market trend indicators in soft transparent overlays. Conveys global market analysis.',
  },
  {
    slug: 'hydroponics-herb-sales-channel-strategy',
    prompt:
      'Modern editorial illustration of fresh premium herbs displayed in three contexts side by side — a restaurant kitchen counter, a farm-stand display, and a wholesale shipping crate. Conveys multi-channel sales strategy.',
  },
  {
    slug: 'hydroponics-nutrient-ec-ph-management',
    prompt:
      'Modern editorial illustration of a hydroponic root zone close-up with translucent overlay panels showing clean dashboard-like indicators for EC and pH levels. Conveys precision nutrient management.',
  },
  {
    slug: 'hydroponics-startup-cost-breakeven',
    prompt:
      'Modern editorial illustration of a compact small-scale indoor hydroponic rack setup, with subtle ascending revenue curve and break-even crossover line in the background. Conveys lean startup economics.',
  },
  {
    slug: 'hydroponics-water-efficiency',
    prompt:
      'Modern editorial illustration of a closed-loop hydroponic water circulation system with crystal clear water droplets and circulation arrows, contrasted subtly against an arid earth background. Conveys radical water efficiency.',
  },
  {
    slug: 'iot-ai-hydroponic-herb-production',
    prompt:
      'Modern editorial illustration of a Raspberry Pi single-board computer connected via thin cables to environmental sensors placed among green hydroponic herbs, with subtle data flow lines. Conveys IoT-AI integrated hydroponic production.',
  },
  {
    slug: 'led-light-spectrum-herb-cultivation',
    prompt:
      'Modern editorial illustration of fresh hydroponic herbs growing under a bank of horticultural LED lights, with a subtle visible spectrum gradient (red to blue) reflected on the leaves. Conveys spectral light optimization.',
  },
  {
    slug: 'mcp-model-context-protocol-farm-control',
    prompt:
      'Modern editorial illustration of a Raspberry Pi at the center connected by abstract data conduits to both an AI assistant interface above and farm sensors below. Conveys voice/text control of farm IoT systems.',
  },
  {
    slug: 'microgreens-business-indoor-farming-2026',
    prompt:
      'Modern editorial illustration of stacked trays of vibrant fresh microgreens at varying growth stages, with a subtle ascending business growth chart in the soft background. Conveys microgreen business profitability analysis.',
  },
  {
    slug: 'mqtt-supabase-farm-dashboard',
    prompt:
      'Modern editorial illustration of a clean real-time analytics dashboard interface displaying farm sensor metrics, with thin connection lines suggesting data pipeline from edge devices. Conveys real-time IoT visualization.',
  },
  {
    slug: 'official-website-launch',
    prompt:
      'Modern editorial illustration of a sleek minimalist website displayed on a clean laptop screen on an organized desk, with soft natural lighting and a sense of professional new beginnings. Conveys business website launch announcement.',
  },
  {
    slug: 'optiens-company-founded-april-2026',
    prompt:
      'Modern editorial illustration of a clean professional workspace with subtle Japanese countryside mountain silhouettes visible through a large window, conveying a fresh business founding in a regional setting.',
  },
  {
    slug: 'optiens-two-weeks-after-founding',
    prompt:
      'Modern editorial illustration of three ascending platform steps in clean architectural style, each platform progressively larger, suggesting a structured three-step adoption journey.',
  },
  {
    slug: 'welfare-hydroponics-social-impact',
    prompt:
      'Modern editorial illustration of people of varied roles collaborating gently in a calm indoor hydroponic farming environment, soft natural composition. Conveys social inclusion through agriculture.',
  },
  {
    slug: 'zigbee-wifi-lora-agriculture-iot-protocol',
    prompt:
      'Modern editorial illustration of three distinct wireless signal patterns radiating from compact sensor nodes placed across a farm, each pattern visually distinct in shape to imply different protocols. Conveys wireless protocol comparison.',
  },
];

function runImagen(prompt, output) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      process.execPath,
      ['scripts/generate-blog-imagen.mjs', prompt, output],
      { cwd: PROJECT_ROOT, stdio: 'inherit', shell: false }
    );
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Exit code ${code}`));
    });
  });
}

let success = 0;
let failed = 0;
const failedSlugs = [];

for (const article of articles) {
  const targetPath = `public/images/blog/${article.slug}.webp`;
  console.log(`\n=== [${success + failed + 1}/${articles.length}] ${article.slug} ===`);

  try {
    await runImagen(article.prompt, targetPath);
    success++;
  } catch (err) {
    console.error(`FAILED: ${article.slug} — ${err.message}`);
    failed++;
    failedSlugs.push(article.slug);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Success: ${success}/${articles.length}`);
console.log(`Failed:  ${failed}/${articles.length}`);
if (failedSlugs.length > 0) {
  console.log(`Failed slugs:`);
  failedSlugs.forEach((s) => console.log(`  - ${s}`));
}
