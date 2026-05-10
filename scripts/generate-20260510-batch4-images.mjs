/**
 * 2026-05-10 Batch 4: 2 articles (image gen comparison / workspace agents checklist)
 */
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const generator = resolve(here, 'generate-blog-imagen.mjs');

const targets = [
  {
    slug: '20260510-image-generation-model-comparison-4',
    prompt:
      'Conceptual editorial illustration of 4 abstract glowing orbs floating in a row, each with distinct color identity (deep teal / warm orange / golden yellow / soft pink), connected by subtle gradient lines suggesting comparison and selection, minimal Japanese aesthetic, soft cream background with subtle paper texture, no text, no logos, no faces, photorealistic studio lighting, 16:9',
  },
  {
    slug: '20260510-workspace-agents-deployment-checklist-10',
    prompt:
      'Conceptual editorial illustration of a clean clipboard with 10 small checkmark icons in a vertical list, set against a calm office workspace background with soft daylight, minimal Japanese aesthetic, deep navy and warm beige color palette, sense of structured careful preparation, no readable text, no logos, no faces, photorealistic editorial style, 16:9',
  },
];

async function run(prompt, output) {
  return new Promise((res, rej) => {
    const p = spawn('node', [generator, prompt, output], { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`exit ${code}`))));
  });
}

for (const t of targets) {
  const out = resolve(here, `../public/images/blog/${t.slug}.webp`);
  console.log(`\n=== Generating: ${t.slug} ===`);
  await run(t.prompt, out);
}

console.log('\nAll 2 images generated.');
