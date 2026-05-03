/**
 * 入金自動照合エンドポイント（freee API 連携・会社名ファジーマッチ）
 *
 * 動作:
 * - Vercel Cron などから定期実行（推奨: 毎時）
 * - freee API で過去N日の入金取引を取得
 * - Supabase の `pending_payment` 状態の申込と照合（金額一致 + 会社名ファジーマッチ）
 * - マッチした申込のステータスを `paid` に更新
 * - 顧客に「入金を確認しました」メールを自動送信
 * - CEO に「レポート作成依頼」通知
 *
 * 認証: Authorization: Bearer <CRON_SECRET> ヘッダ必須
 *
 * 環境変数:
 * - CRON_SECRET: Cron実行時の認証トークン
 * - FREEE_CLIENT_ID, FREEE_CLIENT_SECRET, FREEE_REFRESH_TOKEN: freee OAuth
 * - FREEE_COMPANY_ID: freeeの company_id（合同会社Optiens: 12562850）
 *
 * テスト:
 *   curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:4321/api/payment-check
 */

import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const CRON_SECRET = import.meta.env.CRON_SECRET
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const MAIL_FROM = import.meta.env.CONTACT_FROM ?? 'no-reply@optiens.com'
const MAIL_TO = import.meta.env.CONTACT_TO ?? import.meta.env.GMAIL_USER

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

const FREEE_CLIENT_ID = import.meta.env.FREEE_CLIENT_ID
const FREEE_CLIENT_SECRET = import.meta.env.FREEE_CLIENT_SECRET
const FREEE_REFRESH_TOKEN = import.meta.env.FREEE_REFRESH_TOKEN
const FREEE_COMPANY_ID = Number(import.meta.env.FREEE_COMPANY_ID || 12562850)
const FREEE_API_BASE = 'https://api.freee.co.jp'
const FREEE_TOKEN_URL = 'https://accounts.secure.freee.co.jp/public_api/token'

// freee アクセストークンキャッシュ（プロセス内・1時間有効）
let cachedAccessToken: string | null = null
let cachedTokenExpiresAt = 0

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const escapeHtml = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

interface PendingApplication {
  id: number | string
  application_id: string
  company_name: string
  person_name: string
  email: string
  amount_jpy: number
  created_at?: string
}

interface FreeeWalletTxn {
  id: number
  amount: number
  description?: string
  date: string
  entry_side: 'income' | 'expense'
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

/**
 * freee OAuth: refresh_token から access_token を取得
 */
async function getFreeeAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedTokenExpiresAt - 60_000) {
    return cachedAccessToken
  }
  if (!FREEE_CLIENT_ID || !FREEE_CLIENT_SECRET || !FREEE_REFRESH_TOKEN) {
    throw new Error('FREEE_CLIENT_ID / FREEE_CLIENT_SECRET / FREEE_REFRESH_TOKEN が未設定')
  }
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: FREEE_CLIENT_ID,
    client_secret: FREEE_CLIENT_SECRET,
    refresh_token: FREEE_REFRESH_TOKEN,
  })
  const res = await fetch(FREEE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`freee token refresh failed (${res.status}): ${t.slice(0, 200)}`)
  }
  const data: any = await res.json()
  cachedAccessToken = data.access_token
  cachedTokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000
  // ⚠️ refresh_token はワンタイムなので、新しい refresh_token を出力（運用者は環境変数を更新する必要あり）
  if (data.refresh_token && data.refresh_token !== FREEE_REFRESH_TOKEN) {
    console.warn('[payment-check] freee returned a new refresh_token. Update FREEE_REFRESH_TOKEN env var:', data.refresh_token.slice(0, 12) + '...')
  }
  return cachedAccessToken!
}

/**
 * freee API: 過去N日の入金取引を取得
 */
async function fetchFreeeIncomingTxns(daysBack: number): Promise<FreeeWalletTxn[]> {
  const token = await getFreeeAccessToken()
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const params = new URLSearchParams({
    company_id: String(FREEE_COMPANY_ID),
    entry_side: 'income',
    start_date: since,
    limit: '100',
  })
  const res = await fetch(`${FREEE_API_BASE}/api/1/wallet_txns?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Api-Version': '2020-06-15',
    },
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`freee wallet_txns failed (${res.status}): ${t.slice(0, 200)}`)
  }
  const data: any = await res.json()
  return (data.wallet_txns || []) as FreeeWalletTxn[]
}

/**
 * 会社名 vs freee取引の摘要 を ファジーマッチ
 *
 * 正規化:
 * - 全角・半角空白除去
 * - カタカナ→ひらがな変換（または逆）して比較
 * - 「株式会社」「(株)」「合同会社」「(合)」「有限会社」「(有)」「合資会社」を除去
 * - "振込" プレフィックスを摘要から除去
 *
 * マッチ判定: 正規化後、片方の文字列がもう片方に含まれるか
 */
function normalizeName(s: string): string {
  if (!s) return ''
  let v = s
  // 全角空白・半角空白を統一
  v = v.replace(/[\s　]+/g, '')
  // 振込関連プレフィックス除去
  v = v.replace(/^(振込|振り込み|フリコミ|フリコム|オフリコミ)/i, '')
  // 法人格表記を除去
  v = v.replace(/(株式会社|（株）|\(株\)|合同会社|（合）|\(合\)|有限会社|（有）|\(有\)|合資会社|（資）|\(資\)|G\.K\.|GK|Co\.,?\s?Ltd\.?|LLC|Inc\.?|Corp\.?)/gi, '')
  // カタカナ→ひらがな変換（freee側がカタカナで来る前提を吸収）
  v = v.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
  // 大文字小文字統一
  v = v.toLowerCase()
  return v
}

function matchByCompanyName(txnDescription: string, companyName: string): boolean {
  const a = normalizeName(txnDescription)
  const b = normalizeName(companyName)
  if (!a || !b) return false
  // 短い方が長い方に含まれていればマッチ
  if (a.length >= b.length) return a.includes(b)
  return b.includes(a)
}

export const POST: APIRoute = async ({ request }) => {
  // ---- Cron認証 ----
  const authHeader = request.headers.get('authorization') || ''
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  if (!supabase) {
    return json({ error: 'Supabase not configured' }, 500)
  }

  // ---- 保留中の申込を取得 ----
  const { data: pending, error: queryError } = await supabase
    .from('diagnosis_leads')
    .select('id, application_id, company_name, person_name, email, amount_jpy, created_at')
    .eq('status', 'pending_payment')
    .gt('amount_jpy', 0)

  if (queryError) {
    console.error('[payment-check] Supabase query error:', queryError)
    return json({ error: 'Failed to query pending applications' }, 500)
  }

  if (!pending || pending.length === 0) {
    return json({ status: 'ok', message: 'No pending applications', matched_count: 0 })
  }

  // ---- freee から最近の取引を取得 ----
  let txns: FreeeWalletTxn[] = []
  try {
    txns = await fetchFreeeIncomingTxns(14) // 過去14日
  } catch (e: any) {
    console.error('[payment-check] freee API error:', e)
    return json({ error: 'freee API failed', detail: e?.message || String(e) }, 500)
  }

  // ---- 照合 ----
  const matched: { app: PendingApplication; txn: FreeeWalletTxn }[] = []
  const usedTxnIds = new Set<number>()
  for (const app of (pending as PendingApplication[])) {
    const candidates = txns.filter(
      (t) =>
        !usedTxnIds.has(t.id) &&
        t.amount === app.amount_jpy &&
        matchByCompanyName(t.description || '', app.company_name)
    )
    if (candidates.length === 0) continue
    // 最も古い未使用取引を選ぶ
    const txn = candidates.sort((x, y) => x.date.localeCompare(y.date))[0]
    usedTxnIds.add(txn.id)
    matched.push({ app, txn })
  }

  // ---- マッチした申込を paid に更新 + 通知 ----
  const updates: any[] = []
  for (const m of matched) {
    const { error: updateError } = await supabase
      .from('diagnosis_leads')
      .update({ status: 'paid', paid_at: new Date().toISOString(), freee_txn_id: m.txn.id })
      .eq('id', m.app.id)
    if (updateError) {
      console.error('[payment-check] Update error for', m.app.application_id, updateError)
      continue
    }

    // 顧客に入金確認メール
    if (resend && m.app.email) {
      try {
        await resend.emails.send({
          from: MAIL_FROM,
          to: m.app.email,
          subject: `【Optiens】お振込を確認しました（申込番号: ${m.app.application_id}）`,
          text: buildPaymentConfirmedEmail(m.app),
          html: buildPaymentConfirmedEmailHtml(m.app),
        })
      } catch (e) {
        console.error('[payment-check] Customer email error:', e)
      }
      // CEO 通知
      if (MAIL_TO) {
        try {
          await resend.emails.send({
            from: MAIL_FROM,
            to: MAIL_TO,
            subject: `【入金確認】${m.app.application_id} ${m.app.company_name} → レポート作成へ`,
            text: `申込番号: ${m.app.application_id}\n企業: ${m.app.company_name}\n担当: ${m.app.person_name}\nメール: ${m.app.email}\n金額: ¥${m.app.amount_jpy.toLocaleString()}\nfreee取引ID: ${m.txn.id}\nfreee摘要: ${m.txn.description || ''}\n\n5営業日以内に詳細レポート＋MTG日程調整リンクを作成・送付してください。\n編集: ${import.meta.env.SITE_URL || 'https://optiens.com'}/admin/leads/${m.app.id}`,
          })
        } catch (e) {
          console.error('[payment-check] CEO notify error:', e)
        }
      }
    }

    updates.push({
      application_id: m.app.application_id,
      company_name: m.app.company_name,
      txn_id: m.txn.id,
      amount: m.txn.amount,
      txn_description: m.txn.description,
    })
  }

  return json({
    status: 'ok',
    pending_count: pending.length,
    txn_count: txns.length,
    matched_count: matched.length,
    updates,
  })
}

// GET でも実行できるようにする（手動テスト・Vercel Cron 互換用）
export const GET: APIRoute = (ctx) => POST(ctx)

function buildPaymentConfirmedEmail(app: PendingApplication): string {
  return `${app.company_name} ${app.person_name} 様

合同会社Optiensです。
詳細AI診断のお振込を確認いたしました。
ありがとうございます。

申込番号: ${app.application_id}
ご請求金額: ¥${app.amount_jpy.toLocaleString()}（税込）

これより詳細レポートの作成プロセスに入ります。
5営業日以内に下記をお届けします。
- 詳細レポート（5〜8ページ・PDF）
- 60分オンラインMTGの日程調整リンク

レポート作成中、追加でヒアリングが必要な場合は別途ご連絡いたします。

合同会社Optiens
〒407-0301 山梨県北杜市高根町清里3545番地2483
https://optiens.com
`
}

function buildPaymentConfirmedEmailHtml(app: PendingApplication): string {
  const safeCompany = escapeHtml(app.company_name)
  const safePerson = escapeHtml(app.person_name)
  return `<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.8;color:#333;max-width:560px;">
<p>${safeCompany} ${safePerson} 様</p>
<p>合同会社Optiensです。<br/>詳細AI診断のお振込を確認いたしました。ありがとうございます。</p>

<table style="border-collapse:collapse;width:100%;margin:16px 0;background:#D1FAE5;border:1px solid #6EE7B7;border-radius:8px;">
  <tr><td style="padding:8px 14px;font-weight:bold;width:140px;">申込番号</td><td style="padding:8px 14px;font-family:monospace;color:#065F46;font-weight:bold;">${escapeHtml(app.application_id)}</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;">ご請求金額</td><td style="padding:8px 14px;">¥${app.amount_jpy.toLocaleString()}（税込）</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;">ステータス</td><td style="padding:8px 14px;color:#065F46;font-weight:bold;">✅ お振込確認済み</td></tr>
</table>

<p>これより詳細レポートの作成プロセスに入ります。<br/>5営業日以内に下記をお届けします。</p>
<ul style="margin:0 0 16px;padding-left:20px;">
  <li>詳細レポート（5〜8ページ・PDF）</li>
  <li>60分オンラインMTGの日程調整リンク</li>
</ul>
<p style="font-size:13px;color:#64748b;">レポート作成中、追加でヒアリングが必要な場合は別途ご連絡いたします。</p>

<p style="margin-top:24px;font-size:12px;color:#64748b;">
合同会社Optiens<br/>
〒407-0301 山梨県北杜市高根町清里3545番地2483<br/>
<a href="https://optiens.com">https://optiens.com</a>
</p>
</div>`
}
