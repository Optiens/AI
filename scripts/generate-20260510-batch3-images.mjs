/**
 * 2026-05-10 Batch 3: 3 articles (mandatory deployment / beginner pitfalls / codex vs claude)
 */
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const generator = resolve(here, 'generate-blog-imagen.mjs');

const targets = [
  {
    slug: '20260510-ai-mandatory-deployment-design',
    prompt:
      'Modern Japanese small business office, mid-shot of a calm executive looking at a large monitor showing organizational dashboards and AI agent activity panels, soft natural daylight from window, deep teal and warm sand color palette, minimal Japanese aesthetic, sense of structured order and quiet decisiveness, no text, no logos, photorealistic editorial style, 16:9',
  },
  {
    slug: '20260510-claude-code-beginner-pitfalls-11',
    prompt:
      'Conceptual flat illustration of a person at a desk with a laptop, surrounded by 11 small abstract warning icons (lock, key, branching arrows, dialog boxes, network, terminal) arranged like stepping stones, deep navy and warm amber palette, calm minimal Japanese editorial style, careful and cautious tone, no readable text, no logos, soft gradient background, 16:9',
  },
  {
    slug: '20260510-codex-vs-claude-code-5-criteria',
    prompt:
      'Conceptual editorial illustration of two abstract glowing orbs on a balance scale, one warm orange-red and one cool teal-green, surrounded by 5 small floating icon glyphs (coin, paint palette, lightning, shield, window grid), minimalist Japanese aesthetic, soft cream background, subtle gradients, no text, no logos, 16:9',
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

console.log('\nAll 3 images generated.');
