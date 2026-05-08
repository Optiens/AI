/**
 * 共通AI事例アイコン画像を生成（gpt-image-2）
 * 出力: public/images/common-cases/case-XX.webp（512x512 正方形・WebP）
 */
import OpenAI from 'openai';
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=]+?)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  });
} catch {}

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('OPENAI_API_KEY missing');
  process.exit(1);
}

const STYLE = `
Style: minimalist flat icon design, square 1:1 composition, soft pastel background.
Use deep navy blue (#1F3A93) and subdued accent colors. Clean geometric shapes.
No text, no letters, no numbers, no logos, no watermarks.
Modern editorial business magazine icon style, high contrast, professional.
Centered subject with negative space around it.
`.trim();

const icons = [
  {
    slug: 'case-01',
    prompt: 'Minimalist icon of a document being scanned and analyzed, with subtle data extraction lines flowing out, representing automatic document reading and information extraction',
  },
  {
    slug: 'case-02',
    prompt: 'Minimalist icon of a custom dashboard with adjustable panels and a wrench or gear, representing a tailored business management interface built for a specific company',
  },
  {
    slug: 'case-03',
    prompt: 'Minimalist icon of a chat speech bubble overlapping with a database cylinder, representing natural language querying of business data',
  },
  {
    slug: 'case-04',
    prompt: 'Minimalist icon of a clock combined with an inbox or notification bell, representing 24-hour automated monitoring of incoming inquiries',
  },
  {
    slug: 'case-05',
    prompt: 'Minimalist icon of multiple connected nodes or small figures working in parallel on different tasks, representing multi-agent AI division of labor',
  },
  {
    slug: 'case-06',
    prompt: 'Minimalist icon of a dashboard with charts and a gauge meter, representing real-time visibility into running automation systems',
  },
];

const client = new OpenAI({ apiKey: API_KEY });
const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public/images/common-cases');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

async function generate(icon) {
  const outPath = resolve(outDir, `${icon.slug}.webp`);
  if (existsSync(outPath)) {
    console.log(`SKIP: ${icon.slug}.webp already exists`);
    return { slug: icon.slug, status: 'skip' };
  }

  const fullPrompt = `${icon.prompt}\n\n${STYLE}`;

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

    await sharp(buffer).resize(512, 512).webp({ quality: 90 }).toFile(outPath);
    console.log(`OK: ${icon.slug}.webp`);
    return { slug: icon.slug, status: 'ok' };
  } catch (err) {
    console.error(`ERROR ${icon.slug}: ${err.message}`);
    return { slug: icon.slug, status: 'error', error: err.message };
  }
}

console.log(`Generating ${icons.length} common-case icons with gpt-image-2...`);

const results = [];
for (const icon of icons) {
  const result = await generate(icon);
  results.push(result);
  await new Promise(r => setTimeout(r, 3000));
}

const ok = results.filter(r => r.status === 'ok').length;
const skip = results.filter(r => r.status === 'skip').length;
const err = results.filter(r => r.status === 'error').length;
console.log(`\nDone: ${ok} generated, ${skip} skipped, ${err} errors`);
if (err > 0) {
  console.log('\nErrors:');
  results.filter(r => r.status === 'error').forEach(r => console.log(`  ${r.slug}: ${r.error}`));
}
