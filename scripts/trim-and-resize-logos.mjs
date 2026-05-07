/**
 * 透過ロゴ・シンボルの不要な透明領域をトリミング + ファビコン適正サイズ化
 *
 * 問題:
 * - optiens-logo.png（1536×1024）→ 実コンテンツは中央の細い帯のみ
 *   ヘッダーで height:44px 指定すると、コンテンツが小さく見えて潰れる
 * - optiens-symbol.png（1024×1024）→ 周囲に約30%の透明余白
 *   ファビコン縮小時に実シンボルが小さくなりすぎる
 *
 * 対策:
 * - ワードマーク: トリミング後、上下左右に最小マージン（5%）を付与してから保存
 * - シンボル: トリミング後、各アイコンサイズで再生成（少しのpadding付き）
 *   - favicon (16/32px): padding 6%（縁ギリギリ回避）
 *   - apple/PWA (180/192/512px): padding 8%（角丸マスク考慮）
 */
import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { copyFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');
const IMG_DIR = resolve(PUBLIC_DIR, 'images');

/**
 * 透明領域をトリミング → 周囲に padding を付与
 * @param {string} src 入力PNGパス（透過済みの想定）
 * @param {string} dst 出力PNGパス
 * @param {number} paddingPercent 上下左右マージン（コンテンツ高さに対する%）
 * @param {object} [resize] {width, height} 任意の最終リサイズ
 */
async function trimAndPad(src, dst, paddingPercent = 5, resize = null) {
  // 1. 透明領域をトリミング（threshold=1で透明部分すべて削除）
  const trimmed = await sharp(src)
    .trim({ threshold: 1 })
    .toBuffer({ resolveWithObject: true });

  const { width: w, height: h } = trimmed.info;

  // 2. padding を計算（コンテンツの大きい辺を基準に）
  const base = Math.max(w, h);
  const pad = Math.round(base * paddingPercent / 100);
  const newW = w + pad * 2;
  const newH = h + pad * 2;

  // 3. 透明 padding を上下左右に追加（中央配置）
  let pipeline = sharp(trimmed.data)
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });

  // 4. オプション: 最終サイズへリサイズ
  if (resize) {
    pipeline = pipeline.resize(resize.width, resize.height, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3',
    });
  }

  await pipeline.png({ compressionLevel: 9 }).toFile(dst);
  console.log(`  ✓ ${dst}  (trimmed ${w}x${h} → padded ${newW}x${newH}${resize ? ` → ${resize.width}x${resize.height}` : ''})`);
}

/**
 * シンボルから正方形アイコンを生成（トリミング + リサイズ）
 */
async function makeSquareIcon(srcSquare, dst, finalSize, paddingPercent = 6) {
  // すでに正方形にトリミング済みのシンボルから、padding付きでリサイズ
  await sharp(srcSquare)
    .resize(finalSize, finalSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: 'lanczos3',
    })
    .png({ compressionLevel: 9 })
    .toFile(dst);
  console.log(`  ✓ ${finalSize}x${finalSize} → ${dst}`);
}

console.log('=== ロゴ・シンボルのトリミング & リサイズ ===\n');

// 元の白背景版から再処理（透過は維持）
const wordmarkBg = resolve(IMG_DIR, 'optiens-logo-bg.png');
const symbolBg = resolve(IMG_DIR, 'optiens-symbol-bg.png');

// もし bg.png がない場合は現在のPNGをそのまま使う
const wordmarkSrc = existsSync(wordmarkBg) ? wordmarkBg : resolve(IMG_DIR, 'optiens-logo.png');
const symbolSrc = existsSync(symbolBg) ? symbolBg : resolve(IMG_DIR, 'optiens-symbol.png');

// 一時的に透過版を作成（trim はアルファ0領域を削除）
async function ensureTransparent(src, tmpOut) {
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i], g = out[i + 1], b = out[i + 2], a = out[i + 3];
    const distance = ((255 - r) + (255 - g) + (255 - b)) / 3;
    if (distance < 8) out[i + 3] = 0;
    else if (distance < 32) out[i + 3] = Math.round(a * (distance - 8) / 24);
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png().toFile(tmpOut);
}

// ワードマーク: 透過化 → トリミング → 軽い padding（5%）
console.log('[1] ワードマーク（optiens-logo.png）');
const tmpWordmark = resolve(IMG_DIR, '_tmp-wordmark-transparent.png');
await ensureTransparent(wordmarkSrc, tmpWordmark);
await trimAndPad(tmpWordmark, resolve(IMG_DIR, 'optiens-logo.png'), 5);

// シンボル: 透過化 → トリミング → padding なしの正方形に（後で各サイズで padding 付与）
console.log('\n[2] シンボル（optiens-symbol.png）— トリミングのみ');
const tmpSymbol = resolve(IMG_DIR, '_tmp-symbol-transparent.png');
await ensureTransparent(symbolSrc, tmpSymbol);
const trimmedSymbol = await sharp(tmpSymbol).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });

// トリミング結果を正方形 canvas に配置（短い辺に padding を付けて正方形に）
const sw = trimmedSymbol.info.width;
const sh = trimmedSymbol.info.height;
const sBase = Math.max(sw, sh);
const sPadX = Math.floor((sBase - sw) / 2);
const sPadY = Math.floor((sBase - sh) / 2);
await sharp(trimmedSymbol.data)
  .extend({
    top: sPadY,
    bottom: sBase - sh - sPadY,
    left: sPadX,
    right: sBase - sw - sPadX,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .resize(1024, 1024, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
    kernel: 'lanczos3',
  })
  .png({ compressionLevel: 9 })
  .toFile(resolve(IMG_DIR, 'optiens-symbol.png'));
console.log(`  ✓ 正方形化 1024x1024 → optiens-symbol.png  (trimmed ${sw}x${sh})`);

// 各アイコンサイズを再生成（シンボルは既に正方形・padding なしなので、リサイズ時は内部 padding 6% を付ける）
console.log('\n[3] 各アイコンサイズを再生成（小padding付き）');
const symbolSquare = resolve(IMG_DIR, 'optiens-symbol.png');

// padding 込みの正方形 buffer をいったん作る
async function bufferWithPadding(srcSquare, paddingPercent) {
  const meta = await sharp(srcSquare).metadata();
  const pad = Math.round(meta.width * paddingPercent / 100);
  return await sharp(srcSquare)
    .extend({
      top: pad, bottom: pad, left: pad, right: pad,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();
}

// favicon は padding 4%（小さくしすぎないように）
const faviconBuf = await bufferWithPadding(symbolSquare, 4);
await makeSquareIcon(faviconBuf, resolve(PUBLIC_DIR, 'favicon-32.png'), 32);
await makeSquareIcon(faviconBuf, resolve(PUBLIC_DIR, 'favicon-16.png'), 16);

// apple-touch / PWA は padding 8%（角丸マスク考慮）
const appBuf = await bufferWithPadding(symbolSquare, 8);
await makeSquareIcon(appBuf, resolve(IMG_DIR, 'optiens-symbol-180.png'), 180);
await makeSquareIcon(appBuf, resolve(IMG_DIR, 'optiens-symbol-192.png'), 192);
await makeSquareIcon(appBuf, resolve(IMG_DIR, 'optiens-symbol-512.png'), 512);

// 一時ファイル削除
import('fs').then(({ unlinkSync }) => {
  try { unlinkSync(tmpWordmark); } catch {}
  try { unlinkSync(tmpSymbol); } catch {}
});

console.log('\n全工程完了');
