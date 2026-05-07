/**
 * 既存ロゴ・シンボル PNG の白背景を透過化
 *
 * 入力（白背景）:
 * - public/images/optiens-logo.png       (ワードマーク横長)
 * - public/images/optiens-symbol.png     (シンボル単体・1024x1024)
 *
 * 出力（透過 + 白背景版を別名で保持）:
 * - public/images/optiens-logo.png       → 透過化（上書き）
 * - public/images/optiens-logo-bg.png    → 白背景版を退避保存
 * - public/images/optiens-symbol.png     → 透過化（上書き）
 * - public/images/optiens-symbol-bg.png  → 白背景版を退避保存
 * - public/images/optiens-symbol-{180,192,512}.png → 透過版から再生成
 * - public/favicon-{16,32}.png           → 透過版から再生成
 *
 * アルゴリズム:
 *   各ピクセルの「白からの距離」(distance = (255-R + 255-G + 255-B) / 3) を計算
 *   distance < 8        → α=0       完全透過
 *   8 <= distance < 32  → α=線形    アンチエイリアス（エッジを綺麗に）
 *   distance >= 32      → α=元の値  そのまま
 */
import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');
const IMG_DIR = resolve(PUBLIC_DIR, 'images');

/**
 * 白背景を透過化（アンチエイリアス付き）
 */
async function whiteToTransparent(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  const len = out.length;

  for (let i = 0; i < len; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = out[i + 3];

    // 白からの距離（0=完全な白, 255=完全な黒）
    const distance = ((255 - r) + (255 - g) + (255 - b)) / 3;

    if (distance < 8) {
      // 完全な白 → 透過
      out[i + 3] = 0;
    } else if (distance < 32) {
      // 縁のアンチエイリアス領域 → 線形補間
      const ratio = (distance - 8) / 24; // 0.0 〜 1.0
      out[i + 3] = Math.round(a * ratio);
    }
    // それ以外は元の alpha を維持
  }

  await sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
}

/**
 * 退避（既存PNGを bg.png として残す）
 */
function backupOriginal(srcPath, backupPath) {
  if (existsSync(srcPath) && !existsSync(backupPath)) {
    copyFileSync(srcPath, backupPath);
    console.log(`  ↪ 白背景版を退避: ${backupPath}`);
  }
}

console.log('=== 透過化処理開始 ===\n');

// 1. ワードマーク版
const wordmarkPath = resolve(IMG_DIR, 'optiens-logo.png');
const wordmarkBgPath = resolve(IMG_DIR, 'optiens-logo-bg.png');
console.log('[1/2] optiens-logo.png（ワードマーク）');
backupOriginal(wordmarkPath, wordmarkBgPath);
await whiteToTransparent(wordmarkBgPath, wordmarkPath);
console.log('  ✓ 透過化完了\n');

// 2. シンボル単体（オリジナル 1024x1024）
const symbolPath = resolve(IMG_DIR, 'optiens-symbol.png');
const symbolBgPath = resolve(IMG_DIR, 'optiens-symbol-bg.png');
console.log('[2/2] optiens-symbol.png（シンボル単体）');
backupOriginal(symbolPath, symbolBgPath);
await whiteToTransparent(symbolBgPath, symbolPath);
console.log('  ✓ 透過化完了\n');

// 3. シンボルから各サイズ再生成（透過版を入力に）
const sizeTargets = [
  { size: 512, out: resolve(IMG_DIR, 'optiens-symbol-512.png'),  desc: 'PWA / OG / 大' },
  { size: 192, out: resolve(IMG_DIR, 'optiens-symbol-192.png'),  desc: 'Android Chrome' },
  { size: 180, out: resolve(IMG_DIR, 'optiens-symbol-180.png'),  desc: 'apple-touch-icon' },
  { size: 32,  out: resolve(PUBLIC_DIR, 'favicon-32.png'),       desc: 'favicon 32px' },
  { size: 16,  out: resolve(PUBLIC_DIR, 'favicon-16.png'),       desc: 'favicon 16px' },
];

console.log('=== 各サイズ再生成（透過維持）===');
for (const t of sizeTargets) {
  await sharp(symbolPath)
    .resize(t.size, t.size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }, // 透過背景
      kernel: 'lanczos3',
    })
    .png({ compressionLevel: 9 })
    .toFile(t.out);
  console.log(`  ✓ [${t.size}x${t.size}] ${t.desc} → ${t.out}`);
}

console.log('\n全工程完了');
