/**
 * Resend が要求する DNS レコードを完全な値で取得（手動追加用）
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
const DOMAIN_ID = 'a3195d94-ccf2-4cdb-93bb-ffa902870a61';

const res = await fetch(`https://api.resend.com/domains/${DOMAIN_ID}`, {
  headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
});
const detail = await res.json();

console.log('=== Vercel DNS に追加すべきレコード（optiens.com） ===\n');

(detail.records || []).forEach((r, i) => {
  console.log(`【レコード ${i + 1}】 ${r.type} ${r.name}`);
  console.log(`  Type: ${r.type}`);
  console.log(`  Name: ${r.name.replace(/\.optiens\.com$/, '')}${r.name.includes('optiens.com') ? '' : ''}`);
  console.log(`  Value:`);
  console.log(`    ${r.value}`);
  if (r.priority) console.log(`  Priority: ${r.priority}`);
  console.log(`  TTL: ${r.ttl || 'Auto'}`);
  console.log(`  Status: ${r.status}`);
  console.log('');
});
