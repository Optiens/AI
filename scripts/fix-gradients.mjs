/**
 * グラデーションの視認性改善
 *
 * 問題: lapis → C0C0C0（silver）グラデが、右側で薄くなり白文字が読めない
 *
 * 対策: silver の代わりに lapis-light (#6B85C9) を使う
 *       - ブランドカラー系列内の同系色グラデになる
 *       - 右端でも十分な濃度を保つ（白文字との contrast 比 4.5:1 以上）
 *       - ラピスの「群青の濃淡」アイデンティティを強化
 *
 * 補足: テキストグラデ（background-clip: text）では brand-gradient
 *       (lapis → sakura #E48A95) が綺麗だが、ボタン等の塗りには
 *       sakura は明るすぎて白文字との相性が悪いため、lapis-light を採用。
 */
import { readFileSync, writeFileSync, statSync, readdirSync } from 'fs';
import { resolve, dirname, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const REPLACE_RULES = [
  // 2-stop: lapis → silver
  { pattern: /#1F3A93 0%,\s*#C0C0C0 100%/g, replace: '#1F3A93 0%, #6B85C9 100%' },
  { pattern: /#1F3A93,\s*#C0C0C0/g,         replace: '#1F3A93, #6B85C9' },
  // 3-stop: lapis → mid → silver
  { pattern: /#1F3A93 0%,\s*#4a7ba8 60%,\s*#C0C0C0 100%/g,
    replace: '#1F3A93 0%, #3A5BAD 50%, #6B85C9 100%' },
  { pattern: /#1F3A93 0%,\s*#2c5282 50%,\s*#C0C0C0 100%/g,
    replace: '#152870 0%, #1F3A93 50%, #6B85C9 100%' },
  // 上下方向: lapis → silver
  { pattern: /#1F3A93 0%,\s*#C0C0C0 100%/g, replace: '#1F3A93 0%, #6B85C9 100%' },
];

const EXTS = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.html']);
const EXCLUDE = ['node_modules', '.git', '.vercel', 'dist', 'public/images/logo-candidates'];

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;
const fileStats = [];

function shouldSkip(filePath) {
  const rel = relative(ROOT, filePath).replace(/\\/g, '/');
  return EXCLUDE.some(p => rel.includes(p));
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (shouldSkip(full)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full);
    else if (stat.isFile() && EXTS.has(extname(full))) processFile(full);
  }
}

function processFile(filePath) {
  totalFiles++;
  const rel = relative(ROOT, filePath).replace(/\\/g, '/');
  let content = readFileSync(filePath, 'utf-8');
  const original = content;
  let fileReplacements = 0;
  for (const rule of REPLACE_RULES) {
    content = content.replace(rule.pattern, () => {
      fileReplacements++;
      return rule.replace;
    });
  }
  if (content !== original) {
    writeFileSync(filePath, content, 'utf-8');
    modifiedFiles++;
    totalReplacements += fileReplacements;
    fileStats.push({ path: rel, replacements: fileReplacements });
  }
}

console.log('=== グラデーション視認性修正（lapis→silver を lapis→lapis-light に置換）===\n');

['src'].forEach(d => walk(resolve(ROOT, d)));

console.log(`走査ファイル: ${totalFiles}`);
console.log(`変更ファイル: ${modifiedFiles}`);
console.log(`総置換数:     ${totalReplacements}\n`);

fileStats
  .sort((a, b) => b.replacements - a.replacements)
  .forEach(f => console.log(`  [${String(f.replacements).padStart(2)}] ${f.path}`));

console.log('\n完了');
