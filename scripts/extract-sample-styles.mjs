/**
 * /service/sample-*.astro 12ページのインライン <style> ブロックを共有CSS参照に置換
 * 一回限りのマイグレーション
 *
 * 共有CSS: src/styles/sample-scenario.css
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = resolve(__dirname, '../src/pages/service');

const files = readdirSync(dir).filter(
  (f) => f.startsWith('sample-') && f.endsWith('.astro'),
);

const IMPORT_LINE = "import '../../styles/sample-scenario.css';";

// sample-executive など、共通スタイル以外の固有スタイル（impact-section等）も
// 共有CSSに統合済みなので、原則 inline <style> を全削除する。
// 例外的に固有スタイルが残っているページのみ警告を出す。

for (const fname of files) {
  const p = join(dir, fname);
  let src = readFileSync(p, 'utf-8');
  const before = src;

  // 1) frontmatter にCSS importを追加（既存にない場合のみ）
  if (!src.includes(IMPORT_LINE)) {
    src = src.replace(
      /^---\nimport Layout from '\.\.\/\.\.\/layouts\/Layout\.astro';\n/,
      `---\nimport Layout from '../../layouts/Layout.astro';\n${IMPORT_LINE}\n`,
    );
  }

  // 2) <style>...</style> ブロックを削除
  src = src.replace(/\n<style>[\s\S]*?<\/style>\n*/g, '\n');

  if (src === before) {
    console.log(`SKIP: ${fname} (no changes)`);
  } else {
    writeFileSync(p, src, 'utf-8');
    console.log(`UPDATED: ${fname}`);
  }
}

console.log('\nDone.');
