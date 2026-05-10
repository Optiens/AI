/**
 * バッチ画像生成スクリプト（Imagen 4 Ultra）
 *
 * 使い方:
 *   node scripts/blog/generate-images-batch.mjs path/to/batch.json
 *
 * batch.json 形式:
 *   [
 *     { "slug": "20260510-foo-bar", "prompt": "Concept illustration of ..." },
 *     { "slug": "20260510-baz-qux", "prompt": "Photo of ..." }
 *   ]
 *
 * 出力:
 *   public/images/blog/<slug>.webp
 *
 * 注意:
 *   - generate-blog-imagen.mjs を順次呼び出す（並列はしない、Vertex AI クォータ保護）
 *   - 失敗した slug を最後にまとめて表示
 */
import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const generator = resolve(here, '../generate-blog-imagen.mjs');

const batchPath = process.argv[2];

if (!batchPath) {
  console.error('Usage: node scripts/blog/generate-images-batch.mjs path/to/batch.json');
  process.exit(1);
}

if (!existsSync(batchPath)) {
  console.error(`File not found: ${batchPath}`);
  process.exit(1);
}

const batch = JSON.parse(readFileSync(batchPath, 'utf8'));

if (!Array.isArray(batch)) {
  console.error('batch.json must be an array of {slug, prompt} objects');
  process.exit(1);
}

console.log(`\n=== Batch Image Generation: ${batch.length} images ===\n`);

const results = { success: [], failure: [] };

for (let i = 0; i < batch.length; i++) {
  const t = batch[i];
  // slug に `samples/foo` のように `/` を含めると、その階層が public/images/ 配下に作成される。
  // 階層なしのときは従来どおり public/images/blog/ 配下。
  const baseDir = t.slug.includes('/')
    ? `../../public/images/${t.slug}.webp`
    : `../../public/images/blog/${t.slug}.webp`;
  const out = resolve(here, baseDir);
  console.log(`\n[${i + 1}/${batch.length}] Generating: ${t.slug}`);
  try {
    await runGenerator(t.prompt, out);
    results.success.push(t.slug);
  } catch (err) {
    console.error(`  ✗ Failed: ${err.message}`);
    results.failure.push({ slug: t.slug, error: err.message });
  }
}

console.log('\n=== Summary ===');
console.log(`Success: ${results.success.length}`);
console.log(`Failure: ${results.failure.length}`);
if (results.failure.length > 0) {
  console.log('\nFailed slugs:');
  for (const f of results.failure) {
    console.log(`  - ${f.slug}: ${f.error}`);
  }
}

function runGenerator(prompt, output) {
  return new Promise((res, rej) => {
    const p = spawn('node', [generator, prompt, output], { stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`exit ${code}`))));
  });
}
