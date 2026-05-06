/**
 * 既存ブログ記事の frontmatter に image フィールドを追加
 * 既に image: が含まれている記事はスキップ
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const blogDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/blog');
const targetFiles = readdirSync(blogDir)
  .filter(f => /^(20260506|20260507).*\.md$/.test(f));

let updated = 0;
let skipped = 0;
const updatedSlugs = [];

for (const file of targetFiles) {
  const fullPath = resolve(blogDir, file);
  const content = readFileSync(fullPath, 'utf-8');

  if (/^image:/m.test(content)) {
    skipped++;
    continue;
  }

  const slug = file.replace(/\.md$/, '');
  const imageLine = `image: '/images/blog/${slug}.webp'`;

  // excerpt の後に image を挿入。frontmatter は --- ... --- に挟まれている
  const newContent = content.replace(
    /^(excerpt: .*?\n)(?=---)/sm,
    `$1${imageLine}\n`,
  );

  if (newContent === content) {
    console.warn(`WARN: could not insert image for ${file}`);
    continue;
  }

  writeFileSync(fullPath, newContent);
  updated++;
  updatedSlugs.push(slug);
  console.log(`OK: ${file} (image: ${slug}.webp)`);
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped (already had image)`);
