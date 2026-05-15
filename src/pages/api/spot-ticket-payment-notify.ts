/**
 * Spot consultation ticket payment notification endpoint.
 *
 * Customer clicks the signed URL after bank transfer. The endpoint checks
 * recent freee incoming wallet transactions and, on match, issues a ticket
 * number and sends it to the customer automatically.
 */

import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { verifyPaymentToken } from '../../lib/payment-token'
import { fetchFreeeIncomingTxns, type FreeeWalletTxn } from '../../lib/freee-oauth'
import { buildSpotTicketNumber, buildSpotTicketPaymentConfirmedEmail, buildSpotTicketPaymentConfirmedEmailHtml } from '../../lib/spot-ticket-billing'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const MAIL_FROM = import.meta.env.CONTACT_FROM ?? 'no-reply@optiens.com'
const MAIL_TO = import.meta.env.CONTACT_TO ?? import.meta.env.GMAIL_USER

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

const FREEE_CLIENT_ID = import.meta.env.FREEE_CLIENT_ID
const FREEE_CLIENT_SECRET = import.meta.env.FREEE_CLIENT_SECRET
const FREEE_REFRESH_TOKEN = import.meta.env.FREEE_REFRESH_TOKEN
const FREEE_COMPANY_ID = Number(import.meta.env.FREEE_COMPANY_ID || 12562850)

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

type SpotTicketOrder = {
  id: number | string
  order_id: string
  company_name: string
  person_name: string
  email: string
  ticket_count: number
  amount_jpy: number
  status: string
  paid_at?: string | null
  ticket_number?: string | null
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
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
  let orderId = ''
  let token = ''
  try {
    const body = await request.json().catch(() => ({}))
    orderId = String(body.id || '').trim()
    token = String(body.t || '').trim()
  } catch {
    return json({ status: 'error', message: 'Invalid request body' }, 400)
  }

  if (!orderId || !token) {
    return json({ status: 'error', message: 'パラメータが不足しています' }, 400)
  }
  if (!verifyPaymentToken(orderId, token)) {
    return json({ status: 'error', message: 'リンクが無効です。メールに記載されたリンクから再度アクセスしてください' }, 401)
  }
  if (!supabase) {
    return json({ status: 'error', message: 'Supabase 未設定' }, 500)
  }

  const { data: order, error: queryError } = await supabase
    .from('spot_ticket_orders')
    .select('id, order_id, company_name, person_name, email, ticket_count, amount_jpy, status, paid_at, ticket_number')
    .eq('order_id', orderId)
    .maybeSingle()

  if (queryError || !order) {
    return json({ status: 'error', message: '該当する申込が見つかりません' }, 404)
  }

  const app = order as SpotTicketOrder
  if (['paid', 'ticket_issued', 'redeemed'].includes(app.status)) {
    return json({
      status: 'already_paid',
      message: app.ticket_number
        ? `この申込はすでに入金確認済みです。チケット番号: ${app.ticket_number}`
        : 'この申込はすでに入金確認済みです。',
      ticket_number: app.ticket_number,
      paid_at: app.paid_at,
    })
  }
  if (app.status !== 'pending_payment' || !app.amount_jpy || app.amount_jpy <= 0) {
    return json({ status: 'not_payable', message: 'この申込は入金確認の対象外です' }, 400)
  }

  let txns: FreeeWalletTxn[] = []
  try {
    txns = await fetchFreeeIncomingTxns({
      supabase,
      clientId: FREEE_CLIENT_ID,
      clientSecret: FREEE_CLIENT_SECRET,
      envRefreshToken: FREEE_REFRESH_TOKEN,
      companyId: FREEE_COMPANY_ID,
      daysBack: 14,
      source: 'spot-ticket-payment-notify',
    })
  } catch (e: any) {
    console.error('[spot-ticket-payment-notify] freee API error:', e)
    return json({
      status: 'error',
      message: '入金照会に失敗しました。しばらくしてからもう一度お試しください',
    }, 500)
  }

  const candidates = txns.filter(
    (t) =>
      t.amount === app.amount_jpy &&
      matchByCompanyName(t.description || '', app.company_name)
  )

  if (candidates.length === 0) {
    return json({
      status: 'pending',
      message: '銀行からfreeeへの取引反映には数分〜数時間かかる場合があります。少し時間をおいてから再度お試しください。急ぎの場合はお問い合わせフォームから申込番号・振込人名義・振込日時をお知らせください。（このまま放置でも、毎朝9時に自動で入金確認します）',
    })
  }

  const txn = candidates.sort((x, y) => x.date.localeCompare(y.date))[0]
  if (!txn) {
    return json({ status: 'pending', message: '入金候補が見つかりませんでした。少し時間をおいてから再度お試しください。' })
  }

  const now = new Date()
  const ticketNumber = buildSpotTicketNumber(app.order_id, now)
  const { error: updateError } = await supabase
    .from('spot_ticket_orders')
    .update({
      status: 'ticket_issued',
      paid_at: now.toISOString(),
      freee_txn_id: txn.id,
      ticket_number: ticketNumber,
      ticket_issued_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', app.id)

  if (updateError) {
    console.error('[spot-ticket-payment-notify] Update error:', updateError)
    return json({ status: 'error', message: 'ステータス更新に失敗しました' }, 500)
  }

  await sendTicketIssuedEmails(app, ticketNumber, txn)

  return json({
    status: 'paid',
    message: `お振込を確認しました。チケット番号 ${ticketNumber} をメールでお送りしました。`,
    ticket_number: ticketNumber,
  })
}

export const GET: APIRoute = (ctx) => POST(ctx)

async function sendTicketIssuedEmails(app: SpotTicketOrder, ticketNumber: string, txn: FreeeWalletTxn) {
  if (!resend) return

  try {
    await resend.emails.send({
      from: MAIL_FROM,
      to: app.email,
      subject: `【Optiens】スポット相談チケット番号を発行しました（${ticketNumber}）`,
      text: buildSpotTicketPaymentConfirmedEmail({
        companyName: app.company_name,
        personName: app.person_name,
        orderId: app.order_id,
        ticketCount: app.ticket_count,
        amountJpy: app.amount_jpy,
        ticketNumber,
      }),
      html: buildSpotTicketPaymentConfirmedEmailHtml({
        companyName: app.company_name,
        personName: app.person_name,
        orderId: app.order_id,
        ticketCount: app.ticket_count,
        amountJpy: app.amount_jpy,
        ticketNumber,
      }),
    })
  } catch (e) {
    console.error('[spot-ticket-payment-notify] Customer email error:', e)
  }

  if (!MAIL_TO) return
  try {
    await resend.emails.send({
      from: MAIL_FROM,
      to: MAIL_TO,
      subject: `【チケット発行】${ticketNumber} ${app.company_name}`,
      text: `スポット相談チケットの入金を確認し、チケット番号を発行しました。\n\n申込番号: ${app.order_id}\nチケット番号: ${ticketNumber}\n企業: ${app.company_name}\n担当: ${app.person_name}\nメール: ${app.email}\n枚数: ${app.ticket_count}枚\n金額: ¥${app.amount_jpy.toLocaleString()}（税込）\nfreee取引ID: ${txn.id}\nfreee摘要: ${txn.description || ''}\n\n利用申請が届いたら、チケット番号と依頼内容を確認してください。`,
    })
  } catch (e) {
    console.error('[spot-ticket-payment-notify] CEO notify error:', e)
  }
}
