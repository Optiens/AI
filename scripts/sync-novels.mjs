/**
 * 小説ファイルを optiens-novel/projects/ から public/novels/ にコピーし、
 * index.json（作品・章の一覧）を生成する。
 *
 * Usage: node scripts/sync-novels.mjs
 */
import { readdir, copyFile, mkdir, readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';

const NOVEL_SRC = 'c:/workspace/optiens-novel/projects';
const DEST = 'public/novels';

/** ファイル名から話数を抽出してソート用の数値を返す */
function extractEpisodeNum(filename) {
  // "第1章", "第1話", "第11.5話" などに対応
  const m = filename.match(/第([\d.]+)[章話]/);
  return m ? parseFloat(m[1]) : 999;
}

/** ファイル名からシーズン番号を抽出 */
function extractSeasonNum(filename) {
  const m = filename.match(/^S(\d+)_/);
  return m ? parseInt(m[1], 10) : 0;
}

async function main() {
  const novels = await readdir(NOVEL_SRC);
  const index = [];

  for (const novel of novels) {
    const chapDir = join(NOVEL_SRC, novel, 'chapters');
    let files;
    try {
      files = await readdir(chapDir);
    } catch {
      continue; // chapters/ がない作品はスキップ
    }

    // .md のみ
    files = files.filter(f => f.endsWith('.md'));

    // ソート: シーズン番号 → 話数
    files.sort((a, b) => {
      const sa = extractSeasonNum(a), sb = extractSeasonNum(b);
      if (sa !== sb) return sa - sb;
      return extractEpisodeNum(a) - extractEpisodeNum(b);
    });

    // コピー先ディレクトリ作成
    const destDir = join(DEST, novel);
    await mkdir(destDir, { recursive: true });

    const chapters = [];
    for (const file of files) {
      await copyFile(join(chapDir, file), join(destDir, file));

      // タイトルをfrontmatterから取得
      const content = await readFile(join(chapDir, file), 'utf-8');
      const titleMatch = content.match(/^title:\s*(.+)$/m);
      const title = titleMatch
        ? titleMatch[1].trim()
        : basename(file, '.md');

      chapters.push({ file, title });
    }

    index.push({ novel, chapters });
    console.log(`${novel}: ${chapters.length} chapters`);
  }

  await writeFile(join(DEST, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');
  console.log(`\nindex.json generated with ${index.length} novels`);
}

main().catch(console.error);
