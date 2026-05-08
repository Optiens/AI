/**
 * apple-touch-icon 用に白背景版シンボルを生成
 *
 * iOS は apple-touch-icon の透過部分を黒で塗りつぶす仕様。
 * 透過版 (optiens-symbol-180.png) のままだと iPhone ショートカット時に
 * 背景が黒くなる。
 *
 * 解決: 白背景にシンボルを乗せた版を別途生成。
 *
 * 出力: public/images/optiens-symbol-180-bg.png  (apple-touch-icon 専用)
 */
import sharp from 'sharp';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, '../public');

const SOURCE = resolve(PUBLIC_DIR, 'images/optiens-symbol.png');
const OUTPUT = resolve(PUBLIC_DIR, 'images/optiens-symbol-180-bg.png');

console.log('apple-touch-icon (白背景) 生成中...');

await sharp(SOURCE)
  .resize(180, 180, {
    fit: 'contain',
    background: { r: 255, g: 255, b: 255, alpha: 1 },  // 白背景
    kernel: 'lanczos3',
  })
  .flatten({ background: '#FFFFFF' })  // 透過部分を白で塗りつぶし
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

console.log(`✓ 保存完了: ${OUTPUT}`);
