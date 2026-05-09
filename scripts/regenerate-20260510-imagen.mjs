/**
 * 2026-05-10 ブログ記事 3 本のアイキャッチ画像を Imagen 4 Ultra で再生成
 * Gemini 2.5 Flash Image との品質比較用
 *
 * 既存ファイルは _gemini.webp としてバックアップ
 *
 * 使い方:
 *   node scripts/regenerate-20260510-imagen.mjs
 */
import { spawn } from 'child_process';
import { existsSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const articles = [
  {
    slug: '20260510-instagram-graph-api-app-review-guide',
    prompt:
      'Modern editorial illustration of a smartphone displaying a social media-style review interface, surrounded by floating document icons representing API approval forms, with a subtle network of connections and verification checkmarks. Conveys the formal, bureaucratic process of obtaining API access permissions.',
  },
  {
    slug: '20260510-trust-but-verify-ai-numbers',
    prompt:
      'Modern editorial illustration of a businessperson examining glowing financial data and numbers projected from a tablet, with a magnifying glass revealing discrepancies, surrounded by abstract spreadsheet grids and calculator-like elements. Conveys careful verification of AI-generated data before making decisions.',
  },
  {
    slug: '20260510-ai-erasing-ask-senior-culture',
    prompt:
      'Modern editorial illustration of a young professional working independently with AI assistance via laptop, while in the background senior colleagues appear less interrupted, focused on their own complex work. Symbolizes a shift from "asking the senior" to "asking the AI" in workplace knowledge transfer.',
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
  const backupPath = `public/images/blog/${article.slug}_gemini.webp`;
  const fullTarget = resolve(PROJECT_ROOT, targetPath);
  const fullBackup = resolve(PROJECT_ROOT, backupPath);

  console.log(`\n=== ${article.slug} ===`);

  // 既存（Gemini 版）をバックアップ
  if (existsSync(fullTarget) && !existsSync(fullBackup)) {
    copyFileSync(fullTarget, fullBackup);
    console.log(`Backup: ${backupPath}`);
  }

  try {
    await runImagen(article.prompt, targetPath);
    success++;
  } catch (err) {
    console.error(`FAILED: ${article.slug} — ${err.message}`);
    failed++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Success: ${success}/${articles.length}`);
console.log(`Failed:  ${failed}/${articles.length}`);
