/**
 * Optiens /service ページ ステップカード用 小イラスト生成
 * - 3 枚: AI活用診断 / 導入支援 / 保守
 * - サイズ: 1024x1024（カードに小さく配置するため正方形）
 * - スタイル: フラットイラスト、サイトのネイビー基調と整合
 *
 * 使い方: node scripts/generate-step-illustrations.mjs
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

Style: modern flat vector illustration in editorial business style.
Color palette: deep navy blue (#1F3A93), light periwinkle (#6B85C9), soft slate gray (#94A3B8),
warm white background (#FFFFFF), single soft accent of muted pink-coral (#E48A95).
Minimal but informative — multiple small elements composed together to convey the concept.
Smooth gradients allowed but no harsh shadows. Clean lines, geometric shapes.
NO text, NO letters, NO numbers, NO logos, NO watermarks, NO faces.
Square 1:1 composition, centered, generous padding around the illustration.
Premium SaaS landing page illustration aesthetic.`;

const illustrations = [
  {
    filename: 'public/images/service/step-01-diagnosis.webp',
    prompt: `An illustration representing AI business consultation and analysis.
A magnifying glass examining a stylized business workflow diagram composed of small abstract document icons,
arrow connections, and data chart fragments. Inside the magnifying glass lens, glowing connection nodes
suggest AI detecting opportunity areas. A few sparkle accents around the magnifier to suggest insight.
Compose elements around a central magnifying glass.`,
  },
  {
    filename: 'public/images/service/step-02-implementation.webp',
    prompt: `An illustration representing custom software implementation for a business.
A stylized blueprint or wireframe layout in the foreground showing a UI window with abstract dashboard
elements, intersected by gear cogs, code brackets, and a small stack of building blocks suggesting modular
construction. A few connection lines weave through the elements showing system integration.
Convey "designing and building a tailored system".`,
  },
  {
    filename: 'public/images/service/step-03-maintenance.webp',
    prompt: `An illustration representing ongoing software maintenance and continuous improvement.
A stylized line chart trending upward across a small dashboard panel, with a circular refresh arrow looping
around it. Small calendar marks or month indicators along the chart baseline. A subtle wrench or shield
icon overlapping one corner suggests guardianship. A couple of small notification bubbles indicate
proactive alerts. Convey "monthly subscription, continuous improvement, monitored over time".`,
  },
];

const client = new OpenAI({ apiKey: API_KEY });

for (const item of illustrations) {
  const fullPrompt = item.prompt + STYLE_SUFFIX;
  const outPath = item.filename;
  console.log(`Generating: ${outPath}`);
  console.log(`  Prompt head: ${item.prompt.slice(0, 80)}...`);
  try {
    const response = await client.images.generate({
      model: 'gpt-image-2',
      prompt: fullPrompt,
      size: '1024x1024',
      quality: 'high',
      n: 1,
    });
    const b64 = response.data[0].b64_json;
    const buffer = Buffer.from(b64, 'base64');
    const outDir = dirname(outPath);
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

    if (outPath.endsWith('.webp')) {
      try {
        const sharp = (await import('sharp')).default;
        await sharp(buffer).webp({ quality: 90 }).toFile(outPath);
        console.log(`  OK -> ${outPath} (WebP)`);
      } catch {
        const pngPath = outPath.replace(/\.webp$/i, '.png');
        writeFileSync(pngPath, buffer);
        console.warn(`  WARN: sharp not installed, saved PNG -> ${pngPath}`);
      }
    } else {
      writeFileSync(outPath, buffer);
      console.log(`  OK -> ${outPath}`);
    }
  } catch (err) {
    console.error(`  ERROR (${outPath}): ${err.message}`);
    if (err.status) console.error(`    HTTP Status: ${err.status}`);
  }
}

console.log('\n完了。');
