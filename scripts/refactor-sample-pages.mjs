/**
 * /service/sample-*.astro のヒーロー＆ブランド色をサイトテーマに合わせて一括更新
 * 一回限りのマイグレーションスクリプト
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = resolve(__dirname, '../src/pages/service');

const files = readdirSync(dir).filter((f) => f.startsWith('sample-') && f.endsWith('.astro'));

for (const fname of files) {
  const p = join(dir, fname);
  let src = readFileSync(p, 'utf-8');
  const before = src;

  // 1) Hero gradient（業種別ダークカラー） → 白基調のライトグラデ
  src = src.replace(
    /background:\s*linear-gradient\(135deg,\s*#[0-9A-Fa-f]{6}\s*0%,\s*#[0-9A-Fa-f]{6}\s*100%\);/g,
    'background: linear-gradient(180deg, #ffffff 0%, #F8FAFD 100%);',
  );

  // 2) 旧プライマリ色（緑 #2e574c）をブランド色（ラピス #1F3A93）へ
  src = src.replace(/var\(--color-primary,\s*#2e574c\)/g, 'var(--brand, #1F3A93)');
  src = src.replace(/#2e574c/g, '#1F3A93');

  // 3) Hero h1 の白文字 → 濃紺
  src = src.replace(
    /(\.hero-section h1\s*\{[^}]*?color:\s*)#fff/g,
    '$1#0f172a',
  );

  // 4) back-link の白文字 → muted
  src = src.replace(
    /(\.back-link\s*\{[^}]*?color:\s*)rgba\(255,\s*255,\s*255,\s*0\.7\)/g,
    '$1#64748b',
  );
  src = src.replace(
    /(\.back-link:hover\s*\{[^}]*?color:\s*)#fff/g,
    '$1#1F3A93',
  );

  // 5) hero-badge 背景（白透明 → ラピス薄）+ color 追加
  src = src.replace(
    /(\.hero-badge\s*\{[^}]*?background:\s*)rgba\(255,\s*255,\s*255,\s*0\.15\)/g,
    '$1rgba(31, 58, 147, 0.10);\n    color: #1F3A93',
  );

  // 6) hero-sub: opacity 指定 → color 指定（白用→ muted）
  src = src.replace(
    /\.hero-sub\s*\{\s*opacity:\s*0\.85;\s*font-size:\s*0\.95rem;\s*\}/g,
    '.hero-sub { color: #64748b; font-size: 0.95rem; line-height: 1.85; }',
  );

  // 7) .hero-section { ... color: #fff; ... } → color: #0f172a;
  src = src.replace(
    /(\.hero-section\s*\{[^}]*?)color:\s*#fff;/g,
    '$1color: #0f172a;',
  );

  // 8) Hero padding 上限を増やす（fixed nav 分の余白確保）
  src = src.replace(
    /(\.hero-section\s*\{[^}]*?padding:\s*clamp\()40px(\s*,\s*8vw\s*,\s*72px\))/g,
    '$1110px$2',
  );
  // 1 行版にも対応
  src = src.replace(
    /(\.hero-section\s*\{\s*background:[^;]+;\s*color:[^;]+;\s*padding:\s*clamp\()40px/g,
    '$1110px',
  );

  // 9) impact-section（sample-executive 用）の暗グラデを淡い背景に
  src = src.replace(
    /(\.impact-section\s*\{[^}]*?background:\s*)linear-gradient\(180deg,\s*#f8fafc\s*0%,\s*#ffffff\s*100%\)/g,
    '$1#F8FAFD',
  );

  // 10) executive 専用: dark hero gradient
  src = src.replace(
    /background:\s*linear-gradient\(135deg,\s*#0f172a\s*0%,\s*#1e1238\s*60%,\s*#1F3A93\s*100%\);/g,
    'background: linear-gradient(180deg, #ffffff 0%, #F8FAFD 100%);',
  );

  if (src === before) {
    console.log(`SKIP: ${fname} (no changes)`);
  } else {
    writeFileSync(p, src, 'utf-8');
    console.log(`UPDATED: ${fname}`);
  }
}

console.log('\nDone.');
