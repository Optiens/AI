/**
 * ブログ記事 重複チェックスクリプト
 *
 * 使い方:
 *   node scripts/blog/check-duplicates.mjs "キーワード1" "キーワード2" ...
 *
 * 出力:
 *   - キーワードごとに既存記事のヒット数を表示
 *   - ヒットファイル名と該当行を簡易表示
 *   - 推奨判断（重複リスク 高/中/低）
 *
 * 判定基準:
 *   - 任意のキーワードで 5 件以上ヒット → 重複リスク高
 *   - 任意のキーワードで 2〜4 件ヒット → 重複リスク中
 *   - 全キーワードで 1 件以下 → 重複リスク低
 */
import { readdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const blogDir = resolve(here, '../../src/content/blog');

const keywords = process.argv.slice(2);

if (keywords.length === 0) {
  console.error('Usage: node scripts/blog/check-duplicates.mjs "keyword1" "keyword2" ...');
  process.exit(1);
}

const files = readdirSync(blogDir)
  .filter((f) => f.endsWith('.md') && !f.startsWith('_'));

const results = {};

for (const kw of keywords) {
  const hits = [];
  const re = new RegExp(escapeRegExp(kw), 'i');
  for (const file of files) {
    const content = readFileSync(resolve(blogDir, file), 'utf8');
    if (re.test(content)) {
      // タイトル抽出
      const titleMatch = content.match(/^title:\s*['"](.+?)['"]/m);
      const title = titleMatch ? titleMatch[1] : '(no title)';
      hits.push({ file, title });
    }
  }
  results[kw] = hits;
}

console.log('\n=== Duplicate Check Result ===\n');

let maxHits = 0;
for (const kw of keywords) {
  const hits = results[kw];
  console.log(`Keyword: "${kw}" → ${hits.length} hit(s)`);
  for (const h of hits.slice(0, 10)) {
    console.log(`  - ${h.file}: ${h.title}`);
  }
  if (hits.length > 10) {
    console.log(`  ... +${hits.length - 10} more`);
  }
  console.log();
  if (hits.length > maxHits) maxHits = hits.length;
}

let risk;
if (maxHits >= 5) risk = '🔴 High';
else if (maxHits >= 2) risk = '🟡 Medium';
else risk = '🟢 Low';

console.log(`\nDuplicate Risk: ${risk}`);
console.log(`(Max hits per single keyword: ${maxHits})\n`);

if (maxHits >= 2) {
  console.log('Recommendation: 角度を再設計するか、冒頭で既存記事との差別化を明示してください。');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
