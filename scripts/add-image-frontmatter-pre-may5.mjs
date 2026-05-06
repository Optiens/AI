/**
 * 5月5日以前のブログのfrontmatterにimage欄を追加
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const blogDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/blog');
const targets = readdirSync(blogDir).filter(f =>
  /^(20260424|20260427|20260429|20260430|20260501|20260504|20260505).*\.md$/.test(f)
);

let updated = 0;
for (const file of targets) {
  const path = resolve(blogDir, file);
  const content = readFileSync(path, 'utf-8');
  if (/^image:/m.test(content)) continue;

  const slug = file.replace(/\.md$/, '');
  const newContent = content.replace(
    /^(excerpt: .*?\n)(?=---)/sm,
    `$1image: '/images/blog/${slug}.webp'\n`,
  );
  if (newContent === content) continue;
  writeFileSync(path, newContent);
  updated++;
  console.log(`OK: ${file}`);
}
console.log(`\nDone: ${updated} updated`);
