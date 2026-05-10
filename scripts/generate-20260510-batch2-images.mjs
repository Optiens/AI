/**
 * 2026-05-10 第二弾ブログ記事 3 本のアイキャッチ画像を Imagen 4 Ultra で生成
 */
import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const articles = [
  {
    slug: '20260510-ai-agent-5-types-7-levels-matrix',
    prompt:
      'Modern editorial illustration of a clean grid matrix on a sleek surface, with five distinct geometric shapes arranged horizontally and seven ascending layers vertically, suggesting a structured business framework for evaluating AI tools. Minimalist and architectural in style.',
  },
  {
    slug: '20260510-claude-cowork-code-windows-setup-guide',
    prompt:
      'Modern editorial illustration of a clean laptop screen displaying setup-style technical interface elements, with abstract installation flow icons and step-by-step indicators flowing across the desk. Conveys clear technical onboarding and configuration.',
  },
  {
    slug: '20260510-uv-bypass-safe-ai-development',
    prompt:
      'Modern editorial illustration of a contained sandbox environment shown as a clean transparent enclosure containing organized development tools, with a subtle protective barrier separating it from the surrounding system. Conveys safe isolation and controlled experimentation.',
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

for (const article of articles) {
  const targetPath = `public/images/blog/${article.slug}.webp`;
  console.log(`\n=== [${success + failed + 1}/${articles.length}] ${article.slug} ===`);
  try {
    await runImagen(article.prompt, targetPath);
    success++;
  } catch (err) {
    console.error(`FAILED: ${article.slug} — ${err.message}`);
    failed++;
  }
}

console.log(`\n=== Summary ===\nSuccess: ${success}/${articles.length}\nFailed:  ${failed}/${articles.length}`);
