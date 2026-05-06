/**
 * ブログ記事の日付を均等に再配分
 *
 * 方針:
 * - 対象: agriculture/welfare/social 以外の main category 記事
 * - 範囲: 2026-03-02（official-website-launch）〜 2026-05-07
 * - 既存の日付順序は維持（古い順は古いまま）
 * - 5/5, 5/6, 5/7 にクラスターしている分を遡って分散
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const blogDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/content/blog');

const HYDRO_CATEGORIES = ['agriculture', 'welfare', 'social'];

// 対象記事を抽出（メインカテゴリのみ）
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

// 既存の日付順でソート（古い順）
articles.sort((a, b) => new Date(a.date) - new Date(b.date));

// 範囲: 最古日付（先頭）〜 最新日付（末尾）を維持しつつ均等配分
const startDate = new Date(articles[0].date);
const endDate = new Date(articles[articles.length - 1].date);
const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);

const newDates = articles.map((_, i) => {
  if (articles.length === 1) return articles[0].date;
  const ratio = i / (articles.length - 1);
  const dayOffset = Math.round(ratio * totalDays);
  const d = new Date(startDate);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().slice(0, 10);
});

// 同日重複を許容（境界記事のみ）し、書き込み
let updated = 0;
articles.forEach((art, i) => {
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

console.log(`\nDone: ${updated}/${articles.length} articles redistributed`);
console.log(`Range: ${articles[0].date} → ${articles[articles.length - 1].date}`);
