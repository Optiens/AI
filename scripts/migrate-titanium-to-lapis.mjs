/**
 * Optiens ブランドカラー一括移行
 * チタンブルー #1F3A93 → ディープラピス #1F3A93
 * rgb(31, 58, 147) → rgb(31, 58, 147)
 *
 * - 対象: src/**, supabase/functions/**, executive/**（ドキュメント）
 * - 除外: legacy logo generation scripts (v12, v13)、history line in brand-guideline.md
 *         scripts/generate-logo-lapis-variants.mjs (履歴コメントを保持)
 *         executive/research/data/* (歴史的資料)
 */
import { readFileSync, writeFileSync, statSync, readdirSync } from 'fs';
import { resolve, dirname, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// 置換対象拡張子
const EXTS = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.html', '.md']);

// 置換ルール（順番に適用）
const REPLACE_RULES = [
  // hex
  { pattern: /#1F3A93\b/g,  replace: '#1F3A93', label: 'hex' },
  { pattern: /#1F3A93\b/g,  replace: '#1F3A93', label: 'hex (lowercase)' },
  // rgb / rgba (許容: スペース・コンマ間隔)
  { pattern: /rgb\(\s*61\s*,\s*111\s*,\s*160\s*\)/g,    replace: 'rgb(31, 58, 147)',   label: 'rgb()' },
  { pattern: /rgba\(\s*61\s*,\s*111\s*,\s*160\s*,/g,     replace: 'rgba(31, 58, 147,',  label: 'rgba()' },
  // 色名（コメント・ドキュメント内）— 慎重に置換
  { pattern: /チタンブルー \(titanium blue\)\s*#1F3A93/g, replace: 'ディープラピス (deep lapis lazuli) #1F3A93', label: 'comment-jp-en' },
  { pattern: /チタンブルー\s*×\s*桜/g,                     replace: 'ディープラピス × 桜',                        label: 'comment-jp-pair' },
  { pattern: /ディープラピス →/g,                           replace: 'ディープラピス →',                            label: 'comment-jp-arrow' },
  // CSS変数名
  { pattern: /--lapis-dim\b/g,    replace: '--lapis-dim',   label: 'css var --lapis-dim' },
  { pattern: /--lapis-light\b/g,  replace: '--lapis-light', label: 'css var --lapis-light' },
  { pattern: /--lapis\b/g,        replace: '--lapis',       label: 'css var --lapis' },
  // dim/light のラピス対応値
  { pattern: /#152870\b/g, replace: '#152870', label: 'titanium-dim → lapis-dim' },
  { pattern: /#6B85C9\b/g, replace: '#6B85C9', label: 'titanium-light → lapis-light' },
];

// 除外パターン（パスに含まれる場合スキップ）
const EXCLUDE_PATHS = [
  'node_modules',
  '.git',
  '.vercel',
  'dist',
  'public/images/logo-candidates', // 過去ロゴはそのまま保管
  'scripts/generate-logo-candidates-v12.mjs', // 過去スクリプト
  'scripts/generate-logo-candidates-v13.mjs', // 過去スクリプト
  'executive/research/data', // 歴史的資料
];

// ファイル単位の特殊扱い
const SPECIAL_FILES = {
  // brand-guideline.md は履歴行のみ保持（旧色を改変しない）
  'executive/marketing/brand-guideline.md': (content) => {
    return content
      // 履歴行の旧色は保護（変えない）
      .replace(/旧: チタンブルー #1F3A93/g, '__KEEP_OLD_TITANIUM__')
      // 通常置換適用後に復帰
      ;
  },
  // generate-logo-lapis-variants.mjs は履歴コメントを保持
  'scripts/generate-logo-lapis-variants.mjs': (content) => {
    return content
      .replace(/チタンブルー #1F3A93 を以下のラピス系3色に変更して比較する。/g,
               '__KEEP_LAPIS_SCRIPT_HISTORY__');
  },
};

const SPECIAL_FILES_RESTORE = {
  'executive/marketing/brand-guideline.md': (content) => {
    return content.replace(/__KEEP_OLD_TITANIUM__/g, '旧: チタンブルー #1F3A93');
  },
  'scripts/generate-logo-lapis-variants.mjs': (content) => {
    return content.replace(/__KEEP_LAPIS_SCRIPT_HISTORY__/g,
                            'チタンブルー #1F3A93 を以下のラピス系3色に変更して比較する。');
  },
};

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;
const fileStats = [];

function shouldSkip(filePath) {
  const rel = relative(ROOT, filePath).replace(/\\/g, '/');
  return EXCLUDE_PATHS.some(p => rel.includes(p));
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (shouldSkip(full)) continue;
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
    } else if (stat.isFile() && EXTS.has(extname(full))) {
      processFile(full);
    }
  }
}

function processFile(filePath) {
  totalFiles++;
  const rel = relative(ROOT, filePath).replace(/\\/g, '/');
  let content = readFileSync(filePath, 'utf-8');
  const original = content;

  // 特殊扱い (前)
  if (SPECIAL_FILES[rel]) content = SPECIAL_FILES[rel](content);

  let fileReplacements = 0;
  const ruleHits = {};
  for (const rule of REPLACE_RULES) {
    const before = content;
    content = content.replace(rule.pattern, () => {
      fileReplacements++;
      ruleHits[rule.label] = (ruleHits[rule.label] || 0) + 1;
      return rule.replace;
    });
  }

  // 特殊扱い (後)
  if (SPECIAL_FILES_RESTORE[rel]) content = SPECIAL_FILES_RESTORE[rel](content);

  if (content !== original) {
    writeFileSync(filePath, content, 'utf-8');
    modifiedFiles++;
    totalReplacements += fileReplacements;
    fileStats.push({ path: rel, replacements: fileReplacements, rules: ruleHits });
  }
}

console.log('Optiens ブランドカラー移行開始');
console.log(`チタンブルー #1F3A93 → ディープラピス #1F3A93`);
console.log(`ROOT: ${ROOT}\n`);

// 対象ディレクトリ
['src', 'supabase/functions', 'executive', 'scripts'].forEach(d => {
  const full = resolve(ROOT, d);
  try {
    walk(full);
  } catch (e) {
    console.warn(`[skip] ${d}: ${e.message}`);
  }
});

console.log(`\n=== 結果 ===`);
console.log(`走査ファイル: ${totalFiles}`);
console.log(`変更ファイル: ${modifiedFiles}`);
console.log(`総置換数:     ${totalReplacements}`);

if (fileStats.length > 0) {
  console.log(`\n=== 変更ファイル詳細 ===`);
  fileStats
    .sort((a, b) => b.replacements - a.replacements)
    .forEach(f => {
      const ruleSummary = Object.entries(f.rules).map(([k, v]) => `${k}:${v}`).join(', ');
      console.log(`  [${String(f.replacements).padStart(3)}] ${f.path}  (${ruleSummary})`);
    });
}

console.log('\n移行完了');
