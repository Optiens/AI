/**
 * .env から指定キーの値を取り出して Windows クリップボードにコピー
 *
 * 使い方:
 *   node scripts/copy-secret-to-clipboard.mjs ANTHROPIC_API_KEY
 *   node scripts/copy-secret-to-clipboard.mjs RESEND_API_KEY
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const ENV_PATH = 'c:/workspace/optiens-hydroponics/.env';
const keyName = process.argv[2];

if (!keyName) {
  console.error('Usage: node scripts/copy-secret-to-clipboard.mjs <KEY_NAME>');
  process.exit(1);
}

const env = readFileSync(ENV_PATH, 'utf-8');
const re = new RegExp(`^${keyName}=(.+)$`, 'm');
const m = env.match(re);

if (!m) {
  console.error(`${keyName} は .env に見つかりません`);
  process.exit(1);
}

let value = m[1].trim();
// クォート除去
if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
  value = value.slice(1, -1);
}

execSync('clip', { input: value });
console.log(`✓ ${keyName} を Windows クリップボードにコピー`);
console.log(`  文字数: ${value.length}`);
console.log(`  プレビュー: ${value.substring(0, 12)}...${value.substring(value.length - 4)}`);
console.log('');
console.log('Supabase Dashboard で Ctrl+V で貼り付けてください:');
console.log('https://supabase.com/dashboard/project/qhbirjrbhqmbyrtgdjes/settings/functions');
