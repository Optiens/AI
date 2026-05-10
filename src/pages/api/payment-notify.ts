/**
 * 振込完了通知エンドポイント（お客様クリック起点）
 *
 * 動作:
 * - 顧客がメール内の `/payment-notify?id=...&t=...` リンクから誘導されたページの
 *   「振込完了を通知する」ボタンが叩く API
 * - HMAC トークンを検証し、該当申込番号の入金確認のみを単発実行
 *   （payment-check.ts の cron ロジックの 1件版）
 * - freee API で該当申込の company_name + amount_jpy を照合
 * - マッチしたら status を paid に更新し、お客様 + CEO へ通知メール
 * - マッチしなければ「銀行→freee の反映待ち」メッセージを返す
 *
 * 1日1回の自動 cron (`/api/payment-check`) は引き続き動作し続けるので、
 * このエンドポイントは「即時化のためのオプション動線」という位置づけ。
 */

import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { verifyPaymentToken } from '../../lib/payment-token'

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

let cachedAccessToken: string | null = null
let cachedTokenExpiresAt = 0

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const escapeHtml = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

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
  if (data.refresh_token && data.refresh_token !== FREEE_REFRESH_TOKEN) {
    console.warn('[payment-notify] freee returned a new refresh_token:', data.refresh_token.slice(0, 12) + '...')
  }
  return cachedAccessToken!
}

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

function normalizeName(s: string): string {
  if (!s) return ''
  let v = s
  v = v.replace(/[\s　]+/g, '')
  v = v.replace(/^(振込|振り込み|フリコミ|フリコム|オフリコミ)/i, '')
  v = v.replace(/(株式会社|（株）|\(株\)|合同会社|（合）|\(合\)|有限会社|（有）|\(有\)|合資会社|（資）|\(資\)|G\.K\.|GK|Co\.,?\s?Ltd\.?|LLC|Inc\.?|Corp\.?)/gi, '')
  v = v.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
  v = v.toLowerCase()
  return v
}

function matchByCompanyName(txnDescription: string, companyName: string): boolean {
  const a = normalizeName(txnDescription)
  const b = normalizeName(companyName)
  if (!a || !b) return false
  if (a.length >= b.length) return a.includes(b)
  return b.includes(a)
}

export const POST: APIRoute = async ({ request }) => {
  let applicationId = ''
  let token = ''
  try {
    const body = await request.json().catch(() => ({}))
    applicationId = String(body.id || '').trim()
    token = String(body.t || '').trim()
  } catch {
    return json({ status: 'error', message: 'Invalid request body' }, 400)
  }

  if (!applicationId || !token) {
    return json({ status: 'error', message: 'パラメータが不足しています' }, 400)
  }

  if (!verifyPaymentToken(applicationId, token)) {
    return json({ status: 'error', message: 'リンクが無効です。メールに記載されたリンクから再度アクセスしてください' }, 401)
  }

  if (!supabase) {
    return json({ status: 'error', message: 'Supabase 未設定' }, 500)
  }

  const { data: app, error: queryError } = await supabase
    .from('diagnosis_leads')
    .select('id, application_id, company_name, person_name, email, amount_jpy, status, paid_at')
    .eq('application_id', applicationId)
    .maybeSingle()

  if (queryError || !app) {
    return json({ status: 'error', message: '該当する申込が見つかりません' }, 404)
  }

  if (app.status === 'paid') {
    return json({
      status: 'already_paid',
      message: 'この申込はすでに入金確認済みです。レポート作成にお進みしています。',
      paid_at: app.paid_at,
    })
  }

  if (app.status !== 'pending_payment' || !app.amount_jpy || app.amount_jpy <= 0) {
    return json({
      status: 'not_payable',
      message: 'この申込は入金確認の対象外です',
    }, 400)
  }

  // freee 取引取得（過去14日）
  let txns: FreeeWalletTxn[] = []
  try {
    txns = await fetchFreeeIncomingTxns(14)
  } catch (e: any) {
    console.error('[payment-notify] freee API error:', e)
    return json({
      status: 'error',
      message: '入金照会に失敗しました。しばらくしてからもう一度お試しください',
    }, 500)
  }

  // 単一申込にマッチする取引を探す
  const candidates = txns.filter(
    (t) =>
      t.amount === app.amount_jpy &&
      matchByCompanyName(t.description || '', app.company_name)
  )

  if (candidates.length === 0) {
    return json({
      status: 'pending',
      message: '銀行からfreeeへの取引反映には数分〜数時間かかる場合があります。少し時間をおいてから再度お試しください。（このまま放置でも、毎朝9時に自動で入金確認します）',
    })
  }

  const txn = candidates.sort((x, y) => x.date.localeCompare(y.date))[0]

  // ステータス更新
  const { error: updateError } = await supabase
    .from('diagnosis_leads')
    .update({ status: 'paid', paid_at: new Date().toISOString(), freee_txn_id: txn.id })
    .eq('id', app.id)

  if (updateError) {
    console.error('[payment-notify] Update error:', updateError)
    return json({ status: 'error', message: 'ステータス更新に失敗しました' }, 500)
  }

  // 顧客に確認メール
  if (resend && app.email) {
    try {
      await resend.emails.send({
        from: MAIL_FROM,
        to: app.email,
        subject: `【Optiens】お振込を確認しました（申込番号: ${app.application_id}）`,
        text: buildPaymentConfirmedEmail(app),
        html: buildPaymentConfirmedEmailHtml(app),
      })
    } catch (e) {
      console.error('[payment-notify] Customer email error:', e)
    }
    // CEO 通知
    if (MAIL_TO) {
      try {
        await resend.emails.send({
          from: MAIL_FROM,
          to: MAIL_TO,
          subject: `【入金確認/即時通知】${app.application_id} ${app.company_name} → レポート作成へ`,
          text: `お客様クリックで即時検知しました。\n\n申込番号: ${app.application_id}\n企業: ${app.company_name}\n担当: ${app.person_name}\nメール: ${app.email}\n金額: ¥${app.amount_jpy.toLocaleString()}\nfreee取引ID: ${txn.id}\nfreee摘要: ${txn.description || ''}\n\n5営業日以内に詳細レポート＋MTG日程調整リンクを作成・送付してください。\n編集: ${(import.meta.env.SITE_URL || 'https://optiens.com').replace(/\/$/, '')}/admin/leads/${app.id}`,
        })
      } catch (e) {
        console.error('[payment-notify] CEO notify error:', e)
      }
    }
  }

  return json({
    status: 'paid',
    message: 'お振込を確認しました。レポート作成プロセスに入ります。確認メールをお送りしました。',
  })
}

function buildPaymentConfirmedEmail(app: { company_name: string; person_name: string; application_id: string; amount_jpy: number }): string {
  return `${app.company_name} ${app.person_name} 様

合同会社Optiensです。
【詳細版】AI活用診断のお振込を確認いたしました。
ありがとうございます。

申込番号: ${app.application_id}
ご請求金額: ¥${app.amount_jpy.toLocaleString()}（税込）

これより詳細レポートの作成プロセスに入ります。
5営業日以内に下記をお届けします。
- 詳細レポート（PDF）
- 60分オンラインMTGの日程調整リンク

レポート作成中、追加でヒアリングが必要な場合は別途ご連絡いたします。

合同会社Optiens
〒407-0301 山梨県北杜市高根町清里3545番地2483
https://optiens.com
`
}

function buildPaymentConfirmedEmailHtml(app: { company_name: string; person_name: string; application_id: string; amount_jpy: number }): string {
  const safeCompany = escapeHtml(app.company_name)
  const safePerson = escapeHtml(app.person_name)
  return `<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.8;color:#333;max-width:560px;">
<p>${safeCompany} ${safePerson} 様</p>
<p>合同会社Optiensです。<br/>【詳細版】AI活用診断のお振込を確認いたしました。ありがとうございます。</p>

<table style="border-collapse:collapse;width:100%;margin:16px 0;background:#D1FAE5;border:1px solid #6EE7B7;border-radius:8px;">
  <tr><td style="padding:8px 14px;font-weight:bold;width:140px;">申込番号</td><td style="padding:8px 14px;font-family:monospace;color:#065F46;font-weight:bold;">${escapeHtml(app.application_id)}</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;">ご請求金額</td><td style="padding:8px 14px;">¥${app.amount_jpy.toLocaleString()}（税込）</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;">ステータス</td><td style="padding:8px 14px;color:#065F46;font-weight:bold;">✅ お振込確認済み</td></tr>
</table>

<p>これより詳細レポートの作成プロセスに入ります。<br/>5営業日以内に下記をお届けします。</p>
<ul style="margin:0 0 16px;padding-left:20px;">
  <li>詳細レポート（PDF）</li>
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
