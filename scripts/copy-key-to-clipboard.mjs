/**
 * GCP Service Account の private_key を、.env で使える形式
 * （\n リテラル・単一行）にエスケープして Windows クリップボードへコピー
 */
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const KEY_JSON = 'C:/Users/blueb/.config/gcp-credentials/optiens-slides-automation/key.json';

const json = JSON.parse(readFileSync(KEY_JSON, 'utf-8'));

// 実際の改行（LF）を、リテラル \n （バックスラッシュ + n の2文字）に置換
const escaped = json.private_key.replace(/\n/g, '\\n');

// 検証
const hasNewline = escaped.includes('\n');
const lineCount = escaped.split('\n').length;
console.log('改行文字を含む?', hasNewline ? 'YES (NG)' : 'NO (OK)');
console.log('行数:', lineCount, '(1なら正常)');
console.log('文字数:', escaped.length);

// クリップボードへ
execSync('clip', { input: escaped });
console.log('\n✓ Windows クリップボードにコピーしました');
console.log('  Supabase Dashboard の Value 欄で Ctrl+V');
