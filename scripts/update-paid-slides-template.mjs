/**
 * 有償版 PPTX テンプレを既存 Google Slides テンプレへ反映する。
 *
 * 前提:
 * - `node scripts/generate-paid-cover-image.mjs`
 * - `node scripts/generate-paid-pptx.mjs`
 * - .env または .env.local に GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
 *
 * 既存の Slides ID を維持したまま PPTX 内容を差し替える。
 */
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

loadEnv(resolve(ROOT, '.env'));
loadEnv(resolve(ROOT, '.env.local'));

const TARGET_ID =
  process.env.GOOGLE_SLIDES_PAID_TEMPLATE_ID ||
  '1DzM-D5sncQNFpvre0b785NdJK2MF4u4fta8o27SLe54';
const FOLDER_ID = process.env.GOOGLE_SLIDES_OUTPUT_FOLDER_ID || '0AP-9nfOx7k3HUk9PVA';
const PPTX_PATH = resolve(ROOT, 'tmp/optiens-diagnosis-paid-template-v1.0.pptx');
const MAKE_BACKUP = !process.argv.includes('--no-backup');
const TEMPLATE_NAME = 'optiens-diagnosis-paid-template-v1.7';

const SA_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const SA_PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!SA_EMAIL || !SA_PRIVATE_KEY) {
  console.error('GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY が必要です');
  process.exit(1);
}

const accessToken = await getGoogleToken();
let backupId = null;

if (MAKE_BACKUP) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = await googleJson(
    `https://www.googleapis.com/drive/v3/files/${TARGET_ID}/copy?supportsAllDrives=true`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `[BACKUP before paid v1.7] ${TEMPLATE_NAME} ${stamp}`,
        parents: [FOLDER_ID],
      }),
    },
  );
  backupId = backup.id;
}

const updated = await uploadPptxToExistingSlides(TARGET_ID, PPTX_PATH, TEMPLATE_NAME);
const deck = await googleJson(
  `https://slides.googleapis.com/v1/presentations/${TARGET_ID}?fields=title,slides(objectId)`,
);

console.log(JSON.stringify({
  updated,
  backupId,
  slideCount: deck.slides?.length ?? 0,
  url: `https://docs.google.com/presentation/d/${TARGET_ID}/edit`,
}, null, 2));

function loadEnv(envPath) {
  try {
    const env = readFileSync(envPath, 'utf-8');
    env.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([^#=]+?)=(.*)$/);
      if (!m) return;
      const key = m[1].trim();
      let value = m[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (value) process.env[key] = value;
    });
  } catch {}
}

async function getGoogleToken() {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), SA_PRIVATE_KEY);
  const jwt = `${signingInput}.${signature.toString('base64url')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`OAuth: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function googleJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${options.method || 'GET'} ${url}\n${res.status} ${text}`);
  return text ? JSON.parse(text) : {};
}

async function uploadPptxToExistingSlides(fileId, pptxPath, name) {
  const pptx = readFileSync(pptxPath);
  const boundary = `codex_boundary_${Date.now()}`;
  const metadata = { name, mimeType: 'application/vnd.google-apps.presentation' };
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      'Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation\r\n\r\n',
    ),
    pptx,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  return googleJson(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,modifiedTime`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(body.length),
      },
      body,
    },
  );
}
