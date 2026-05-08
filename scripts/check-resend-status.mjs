/**
 * Resend ドメイン認証ステータスを直接確認
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=]+?)=(.*)$/);
    if (m) {
      const k = m[1].trim();
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (v) process.env[k] = v;
    }
  });
} catch {}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) { console.error('RESEND_API_KEY 必要'); process.exit(1); }

async function r(path) {
  const res = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  return await res.json();
}

console.log('=== Resend ドメイン一覧 ===');
const list = await r('/domains');
for (const d of list.data || []) {
  console.log(`\n■ ${d.name}`);
  console.log(`  id: ${d.id}`);
  console.log(`  status: ${d.status}`);
  console.log(`  region: ${d.region}`);
  console.log(`  created_at: ${d.created_at}`);

  // 詳細レコード取得
  const detail = await r(`/domains/${d.id}`);
  console.log(`  records: ${(detail.records || []).length} 件`);
  for (const rec of (detail.records || [])) {
    const status = rec.status === 'verified' ? '✓' : '✗';
    console.log(`    [${status}] ${rec.type.padEnd(6)} ${(rec.name || '').padEnd(40)} status=${rec.status}`);
  }
}
