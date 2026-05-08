/**
 * Resend ドメイン認証の完全自動化
 *
 * 前提:
 * - optiens.com は Vercel DNS で管理されている
 * - Resend API キーが .env に存在
 * - Vercel CLI が認証済 (vercel login 実施済) → ~/.local/share/com.vercel.cli/auth.json
 *   もしくは VERCEL_TOKEN 環境変数
 *
 * フロー:
 *   1. Resend に optiens.com を登録 → DNS レコードを取得
 *   2. Vercel DNS に取得したレコードを追加
 *   3. Resend に verify をトリガー
 *   4. ポーリングで完了を待つ（最大10分）
 *
 * 使い方:
 *   VERCEL_TOKEN=xxx node scripts/verify-resend-domain.mjs
 *   もしくは:
 *   node scripts/verify-resend-domain.mjs   (vercel CLI 認証情報を使用)
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

// ===== Load .env =====
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
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
} catch (e) {
  console.warn('.env not found');
}

const DOMAIN = 'optiens.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
let VERCEL_TOKEN = process.env.VERCEL_TOKEN;

if (!RESEND_API_KEY) {
  console.error('✗ RESEND_API_KEY が .env に必要');
  process.exit(1);
}

// Vercel CLI 認証情報をフォールバックで読込（Windows）
if (!VERCEL_TOKEN) {
  const authPaths = [
    resolve(homedir(), 'AppData/Roaming/com.vercel.cli/Data/auth.json'),
    resolve(homedir(), 'AppData/Roaming/com.vercel.cli/auth.json'),
    resolve(homedir(), '.local/share/com.vercel.cli/auth.json'),
    resolve(homedir(), '.config/com.vercel.cli/auth.json'),
  ];
  for (const p of authPaths) {
    if (existsSync(p)) {
      try {
        const auth = JSON.parse(readFileSync(p, 'utf-8'));
        VERCEL_TOKEN = auth.token;
        console.log(`✓ Vercel CLI 認証情報を発見: ${p}`);
        break;
      } catch {}
    }
  }
}

if (!VERCEL_TOKEN) {
  console.error('✗ VERCEL_TOKEN 環境変数か Vercel CLI 認証が必要');
  console.error('  Vercel Token 取得: https://vercel.com/account/tokens');
  process.exit(1);
}

// ===== Helpers =====
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function resendRequest(path, init = {}) {
  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`Resend API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function vercelRequest(path, init = {}) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`Vercel API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ===== Step 1: Resend ドメイン作成 / 既存取得 =====
console.log(`\n[1/4] Resend にドメイン ${DOMAIN} を登録中...`);

let resendDomain;
try {
  resendDomain = await resendRequest('/domains', {
    method: 'POST',
    body: JSON.stringify({ name: DOMAIN, region: 'ap-northeast-1' }),
  });
  console.log(`  ✓ 新規登録: id=${resendDomain.id}`);
} catch (err) {
  // 既存ドメインの場合は取得
  const errStr = String(err);
  if (errStr.includes('already exists') || errStr.includes('already_exists') || errStr.includes('registered already') || errStr.includes('already registered')) {
    console.log(`  → 既に登録済。一覧から取得`);
    const list = await resendRequest('/domains');
    resendDomain = list.data?.find(d => d.name === DOMAIN);
    if (!resendDomain) throw new Error(`ドメイン ${DOMAIN} が見つかりません`);
    // 詳細を取得（DNS records 含む）
    resendDomain = await resendRequest(`/domains/${resendDomain.id}`);
    console.log(`  ✓ 既存取得: id=${resendDomain.id} status=${resendDomain.status}`);
  } else {
    throw err;
  }
}

// ===== Step 2: Vercel DNS にレコード追加 =====
console.log(`\n[2/4] Vercel DNS にレコード追加中...`);

const records = resendDomain.records || [];
console.log(`  Resend が要求する DNS レコード: ${records.length} 件`);

const addResults = { added: 0, alreadyExists: 0, failed: 0 };

for (const r of records) {
  // Resend のレコード形式 → Vercel DNS 形式に変換
  const recordType = r.type;  // 'TXT' or 'CNAME' or 'MX'
  const recordName = r.name;  // 'send', 'resend._domainkey', etc. (sub-name only)
  const recordValue = r.value;

  // name が full domain なら subdomain だけ抽出
  let dnsName = recordName.replace(new RegExp(`\\.?${DOMAIN}$`), '');
  if (!dnsName || dnsName === '@') dnsName = '@';

  console.log(`  ・${recordType.padEnd(6)} ${dnsName.padEnd(30)} → ${String(recordValue).substring(0, 60)}${String(recordValue).length > 60 ? '...' : ''}`);

  try {
    await vercelRequest(`/v2/domains/${DOMAIN}/records`, {
      method: 'POST',
      body: JSON.stringify({
        type: recordType,
        name: dnsName,
        value: recordValue,
        ttl: r.ttl || 60,
      }),
    });
    addResults.added++;
    console.log(`    ✓ 追加成功`);
  } catch (err) {
    if (String(err).includes('already_exists') || String(err).includes('record_already_exists')) {
      addResults.alreadyExists++;
      console.log(`    → 既に存在`);
    } else {
      addResults.failed++;
      console.log(`    ✗ 失敗: ${String(err).substring(0, 200)}`);
    }
  }
}

console.log(`  結果: 追加=${addResults.added} / 既存=${addResults.alreadyExists} / 失敗=${addResults.failed}`);

// ===== Step 3: Resend に verify をトリガー =====
console.log(`\n[3/4] Resend に verify をトリガー...`);
await resendRequest(`/domains/${resendDomain.id}/verify`, { method: 'POST' });
console.log(`  ✓ verify リクエスト送信完了`);

// ===== Step 4: ポーリングで verified 確認 =====
console.log(`\n[4/4] verification 完了をポーリング中（最大10分）...`);

const POLL_INTERVAL = 30_000;  // 30秒
const POLL_MAX = 20;  // 最大10分

for (let i = 1; i <= POLL_MAX; i++) {
  await sleep(POLL_INTERVAL);
  const status = await resendRequest(`/domains/${resendDomain.id}`);
  const verifiedCount = (status.records || []).filter(r => r.status === 'verified').length;
  const totalCount = (status.records || []).length;
  console.log(`  [${String(i).padStart(2, '0')}/${POLL_MAX}] domain status: ${status.status} | records verified: ${verifiedCount}/${totalCount}`);

  if (status.status === 'verified') {
    console.log(`\n✅ 認証完了！ optiens.com から Resend 送信が可能です。`);
    console.log(`  Resend Domain ID: ${resendDomain.id}`);
    process.exit(0);
  }
}

console.log(`\n⚠ 10分経過しましたが未完了。Resend 側で待機継続中の可能性があります。`);
console.log(`  Resend Dashboard で確認: https://resend.com/domains`);
process.exit(1);
