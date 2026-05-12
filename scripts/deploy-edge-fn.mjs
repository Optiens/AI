/**
 * Edge Function を Supabase Management API 経由でデプロイ
 *
 * 必要: SUPABASE_ACCESS_TOKEN（Personal Access Token）
 *   取得: https://supabase.com/dashboard/account/tokens
 */
import { readFileSync } from 'fs';

const PROJECT_REF = 'qhbirjrbhqmbyrtgdjes';
const FUNC_NAME = 'process-diagnosis';
const FUNC_FILE = 'c:/workspace/optiens-hydroponics/supabase/functions/process-diagnosis/index.ts';

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN 環境変数が必要です');
  console.error('  https://supabase.com/dashboard/account/tokens で取得');
  process.exit(1);
}

const content = readFileSync(FUNC_FILE, 'utf-8');

// Multipart form data 構築
const boundary = '----formdata-' + Math.random().toString(36).slice(2);
const metadata = JSON.stringify({
  name: FUNC_NAME,
  verify_jwt: true,
  entrypoint_path: 'index.ts',
});

const parts = [
  `--${boundary}`,
  'Content-Disposition: form-data; name="metadata"',
  'Content-Type: application/json',
  '',
  metadata,
  `--${boundary}`,
  `Content-Disposition: form-data; name="file"; filename="index.ts"`,
  'Content-Type: application/typescript',
  '',
  content,
  `--${boundary}--`,
  '',
].join('\r\n');

const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/deploy?slug=${FUNC_NAME}`;

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
  },
  body: parts,
});

const text = await res.text();
console.log('Status:', res.status);
console.log('Body:', text);
