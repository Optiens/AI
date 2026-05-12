/**
 * PPTX を Google Slides 形式に変換
 *
 * Drive API の copy エンドポイントで mimeType を指定すると変換される
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '../.env');
try {
  const env = readFileSync(envPath, 'utf-8');
  env.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([^#=]+?)=(.*)$/);
    if (m) {
      const k = m[1].trim();
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (v) process.env[k] = v;
    }
  });
} catch {}

const PPTX_ID = '1fjfYjM2S7ScrYYZdc-ydrU4h22uQlvgd';
const FOLDER_ID = '0AP-9nfOx7k3HUk9PVA';
const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SA_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

async function getToken() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now,
  };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const sig = crypto.sign('RSA-SHA256', Buffer.from(signingInput), SA_PRIVATE_KEY);
  const jwt = `${signingInput}.${sig.toString('base64url')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  return (await res.json()).access_token;
}

const token = await getToken();
console.log('PPTX → Google Slides 変換を試行...');

// copy エンドポイントで mimeType 変換
const res = await fetch(
  `https://www.googleapis.com/drive/v3/files/${PPTX_ID}/copy?supportsAllDrives=true`,
  {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'optiens-diagnosis-paid-template-v1.0',
      parents: [FOLDER_ID],
      mimeType: 'application/vnd.google-apps.presentation',
    }),
  }
);
const text = await res.text();
console.log('Status:', res.status);
console.log('Response:', text);
