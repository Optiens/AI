/**
 * ブログ記事の日付を均等に再配分（v2 — アンカー対応）
 *
 * アンカー（固定日付）:
 * - official-website-launch.md = 2026-03-02
 * - optiens-company-founded-april-2026.md = 2026-04-06
 *
 * その他は 2026-04-06（設立日）〜 2026-05-07 に均等配分
 * （設立前の日付に Optiens 関連記事が来ないようにする）
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const blogDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/blog');

const HYDRO_CATEGORIES = ['agriculture', 'welfare', 'social'];

const ANCHORS = {
  'official-website-launch.md': '2026-03-02',
  'optiens-company-founded-april-2026.md': '2026-04-06',
};

const FOUNDING_DATE = '2026-04-06';
const END_DATE = '2026-05-07';

const files = readdirSync(blogDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));
const articles = [];

for (const f of files) {
  const path = resolve(blogDir, f);
  const content = readFileSync(path, 'utf-8');
  const dateMatch = content.match(/^date:\s*['"]([^'"]+)['"]/m);
  const catMatch = content.match(/^category:\s*['"]([^'"]+)['"]/m);
  if (!dateMatch || !catMatch) continue;
  if (HYDRO_CATEGORIES.includes(catMatch[1])) continue;
  articles.push({ file: f, path, date: dateMatch[1], category: catMatch[1] });
}

// アンカー記事を分離
const anchored = [];
const unanchored = [];
for (const a of articles) {
  if (ANCHORS[a.file]) {
    anchored.push({ ...a, fixedDate: ANCHORS[a.file] });
  } else {
    unanchored.push(a);
  }
}

// 既存日付順でソート（古い順）
unanchored.sort((a, b) => new Date(a.date) - new Date(b.date));

// 設立日〜END_DATE に均等配分
const start = new Date(FOUNDING_DATE);
const end = new Date(END_DATE);
// 設立日と最終日を除いた範囲で均等配分（境界に被らないように）
const totalDays = (end - start) / (1000 * 60 * 60 * 24);

const newDates = unanchored.map((_, i) => {
  if (unanchored.length === 1) return FOUNDING_DATE;
  // 設立日翌日から最終日までに均等配分
  const ratio = (i + 1) / (unanchored.length + 1);
  const dayOffset = Math.round(ratio * totalDays);
  const d = new Date(start);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
});

let updated = 0;

// アンカー記事を固定
for (const a of anchored) {
  if (a.date === a.fixedDate) continue;
  const content = readFileSync(a.path, 'utf-8');
  const newContent = content.replace(
    /^(date:\s*['"])[^'"]+(['"])/m,
    `$1${a.fixedDate}$2`,
  );
  writeFileSync(a.path, newContent);
  console.log(`[ANCHOR] ${a.date} → ${a.fixedDate}  ${a.file}`);
  updated++;
}

// その他の記事を再配分
unanchored.forEach((art, i) => {
  const newDate = newDates[i];
  if (newDate === art.date) return;
  const content = readFileSync(art.path, 'utf-8');
  const newContent = content.replace(
    /^(date:\s*['"])[^'"]+(['"])/m,
    `$1${newDate}$2`,
  );
  writeFileSync(art.path, newContent);
  console.log(`${art.date} → ${newDate}  ${art.file}`);
  updated++;
});

console.log(`\nDone: ${updated} articles updated`);
console.log(`Anchors: official-website-launch=${ANCHORS['official-website-launch.md']}, founding=${ANCHORS['optiens-company-founded-april-2026.md']}`);
console.log(`Other articles: ${FOUNDING_DATE} 〜 ${END_DATE} に均等配分`);
