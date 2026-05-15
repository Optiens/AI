import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { generatePaymentToken } from '../../lib/payment-token'
import { formatYen } from '../../lib/paid-billing'
import {
  buildSpotTicketInvoiceText,
  spotTicketAmount,
} from '../../lib/spot-ticket-billing'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const MAIL_TO = import.meta.env.CONTACT_TO ?? import.meta.env.GMAIL_USER
const MAIL_FROM = import.meta.env.CONTACT_FROM ?? 'no-reply@optiens.com'
const SITE_URL = (import.meta.env.SITE_URL || 'https://optiens.com').replace(/\/$/, '')

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

if (!RESEND_API_KEY || !MAIL_TO) {
  console.warn('[spot-ticket] Missing envs: RESEND_API_KEY / GMAIL_USER')
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

const sanitizeLine = (value: string) =>
  value.replace(/[\r\n\t]+/g, ' ').trim()

const clamp = (value: string, max: number) =>
  value.length > max ? value.slice(0, max) + '…' : value

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const serviceLabels: Record<string, string> = {
  review: 'AI活用レビュー面談',
  requirements: '有償要件定義',
  small_build: '簡易実装・軽微な自動化',
  undecided: '未定・相談したい',
}

const ticketCountLabels: Record<string, string> = {
  '1': '1枚',
  '2': '2枚',
  '3': '3枚',
  '4plus': '4枚以上（個別確認）',
}

const ticketCountValues: Record<string, number> = {
  '1': 1,
  '2': 2,
  '3': 3,
}

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const form = await request.formData()
    const mode = String(form.get('mode') || '')
    const hp = String(form.get('website') || '')
    if (hp) return json({ error: 'Bad request' }, 400)
    if (mode !== 'purchase' && mode !== 'redeem') {
      return json({ error: '申込種別が正しくありません。' }, 400)
    }

    const companyName = clamp(sanitizeLine(String(form.get('company_name') || '')), 120)
    const personName = clamp(sanitizeLine(String(form.get('person_name') || '')), 80)
    const email = sanitizeLine(String(form.get('email') || ''))
    const phone = clamp(sanitizeLine(String(form.get('phone') || '')), 60)
    const serviceType = sanitizeLine(String(form.get('service_type') || ''))
    const serviceLabel = serviceLabels[serviceType] ?? (serviceType || '未選択')
    const ticketCount = sanitizeLine(String(form.get('ticket_count') || ''))
    const ticketCountLabel = ticketCountLabels[ticketCount] ?? (ticketCount || '未選択')
    const ticketNumber = clamp(sanitizeLine(String(form.get('ticket_number') || '')), 80)
    const preferredSchedule = clamp(String(form.get('preferred_schedule') || '').trim(), 1000)
    const requestDetail = clamp(String(form.get('request_detail') || '').trim(), 5000)
    const invoiceName = clamp(sanitizeLine(String(form.get('invoice_name') || '')), 160)
    const notes = clamp(String(form.get('notes') || '').trim(), 3000)

    if (!companyName || !personName || !email) {
      return json({ error: '会社名・お名前・メールアドレスを入力してください。' }, 400)
    }
    if (!emailRegex.test(email) || email.length > 254) {
      return json({ error: 'メールアドレスの形式が正しくありません。' }, 400)
    }
    if (mode === 'purchase' && !ticketCount) {
      return json({ error: '購入枚数を選択してください。' }, 400)
    }
    if (mode === 'purchase' && ticketCount !== '4plus' && !ticketCountValues[ticketCount]) {
      return json({ error: '購入枚数が正しくありません。' }, 400)
    }
    if (mode === 'redeem' && (!ticketNumber || !requestDetail)) {
      return json({ error: 'チケット番号と依頼内容を入力してください。' }, 400)
    }

    const modeLabel = mode === 'purchase' ? '購入申込' : '利用申請'
    const isQuoteRequired = mode === 'purchase' && ticketCount === '4plus'
    const purchaseCount = mode === 'purchase' ? (ticketCountValues[ticketCount] || 0) : 0
    const purchaseAmount = purchaseCount > 0 ? spotTicketAmount(purchaseCount).total : 0
    let orderId = ''
    let notifyUrl = ''

    if (mode === 'purchase') {
      orderId = await generateUniqueSpotTicketOrderId()
      notifyUrl = purchaseCount > 0 ? buildSpotTicketNotifyUrl(orderId) : ''
      if (supabase) {
        const { error: orderError } = await supabase.from('spot_ticket_orders').insert({
          order_id: orderId,
          company_name: companyName,
          person_name: personName,
          email,
          phone: phone || null,
          invoice_name: invoiceName || null,
          service_type: serviceType || null,
          ticket_count: purchaseCount,
          amount_jpy: purchaseAmount,
          status: isQuoteRequired ? 'quote_required' : 'pending_payment',
          notes: notes || null,
        })
        if (orderError) {
          console.error('[spot-ticket] Supabase order insert error:', orderError)
          return json({ error: '購入申込の登録に失敗しました。時間をおいて再度お試しください。' }, 500)
        }
      } else {
        console.warn('[spot-ticket] Supabase not configured, skipping order persistence')
      }
    } else if (supabase) {
      const { data: order, error: orderLookupError } = await supabase
        .from('spot_ticket_orders')
        .select('id, order_id, ticket_number, status, ticket_count, company_name, email')
        .eq('ticket_number', ticketNumber)
        .maybeSingle()

      if (orderLookupError) {
        console.error('[spot-ticket] ticket lookup error:', orderLookupError)
      } else if (!order) {
        return json({ error: '入力されたチケット番号が見つかりません。番号をご確認ください。' }, 400)
      } else if (!['ticket_issued', 'redeemed'].includes(order.status)) {
        return json({ error: 'このチケット番号はまだ利用申請できる状態ではありません。' }, 400)
      } else {
        const { error: redeemError } = await supabase
          .from('spot_ticket_orders')
          .update({
            status: 'redeemed',
            redeemed_at: new Date().toISOString(),
            redeem_company_name: companyName,
            redeem_person_name: personName,
            redeem_email: email,
            redeem_phone: phone || null,
            redeem_service_type: serviceType || null,
            request_detail: requestDetail,
            preferred_schedule: preferredSchedule || null,
            redeem_notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id)
        if (redeemError) {
          console.error('[spot-ticket] redeem update error:', redeemError)
        }
      }
    }

    const lines = [
      `種別: ${modeLabel}`,
      mode === 'purchase' ? `申込番号: ${orderId || '未採番'}` : '',
      `会社・団体名: ${companyName}`,
      `お名前: ${personName}`,
      `メールアドレス: ${email}`,
      `電話番号: ${phone || '未入力'}`,
      '',
      `希望サービス: ${serviceLabel}`,
      mode === 'purchase' ? `購入希望枚数: ${ticketCountLabel}` : `チケット番号: ${ticketNumber}`,
      mode === 'purchase' && purchaseAmount > 0 ? `請求金額: ${formatYen(purchaseAmount)}（税込）` : '',
      mode === 'purchase' ? `請求書宛名: ${invoiceName || companyName}` : `希望日程: ${preferredSchedule || '未入力'}`,
      '',
      mode === 'purchase' ? '購入前メモ:' : '依頼内容:',
      mode === 'purchase' ? (notes || '未入力') : requestDetail,
    ].filter(Boolean)
    if (mode === 'redeem' && notes) {
      lines.push('', '補足:', notes)
    }

    const htmlBody = `
      <p><strong>種別:</strong> ${escapeHtml(modeLabel)}</p>
      <p><strong>会社・団体名:</strong> ${escapeHtml(companyName)}</p>
      <p><strong>お名前:</strong> ${escapeHtml(personName)}</p>
      <p><strong>メールアドレス:</strong> ${escapeHtml(email)}</p>
      <p><strong>電話番号:</strong> ${escapeHtml(phone || '未入力')}</p>
      ${mode === 'purchase' ? `<p><strong>申込番号:</strong> ${escapeHtml(orderId || '未採番')}</p>` : ''}
      <p><strong>希望サービス:</strong> ${escapeHtml(serviceLabel)}</p>
      <p><strong>${mode === 'purchase' ? '購入希望枚数' : 'チケット番号'}:</strong> ${escapeHtml(mode === 'purchase' ? ticketCountLabel : ticketNumber)}</p>
      ${mode === 'purchase' && purchaseAmount > 0 ? `<p><strong>請求金額:</strong> ${escapeHtml(formatYen(purchaseAmount))}（税込）</p>` : ''}
      <p><strong>${mode === 'purchase' ? '請求書宛名' : '希望日程'}:</strong> ${escapeHtml(mode === 'purchase' ? (invoiceName || companyName) : (preferredSchedule || '未入力'))}</p>
      <p><strong>${mode === 'purchase' ? '購入前メモ' : '依頼内容'}:</strong></p>
      <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(mode === 'purchase' ? (notes || '未入力') : requestDetail)}</pre>
      ${mode === 'redeem' && notes ? `<p><strong>補足:</strong></p><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(notes)}</pre>` : ''}
    `.trim()

    if (!resend) return json({ error: 'メール送信設定が未完了です。' }, 500)

    const adminSubject = `スポット相談チケット ${modeLabel}${orderId ? ` ${orderId}` : ''}: ${companyName}`
    const { error: adminError } = await resend.emails.send({
      from: MAIL_FROM,
      to: MAIL_TO!,
      replyTo: email,
      subject: adminSubject,
      text: lines.join('\n'),
      html: htmlBody,
    })
    if (adminError) {
      console.error('[spot-ticket] admin mail error:', adminError)
      return json({ error: 'メールの送信に失敗しました。' }, 502)
    }

    const customerText = mode === 'purchase'
      ? buildPurchaseCustomerText({
          companyName,
          personName,
          orderId,
          ticketCountLabel,
          serviceLabel,
          purchaseCount,
          purchaseAmount,
          notifyUrl,
          isQuoteRequired,
        })
      : [
          `${personName} 様`,
          '',
          'スポット相談チケットの利用申請を受け付けました。',
          'チケット番号と依頼内容を確認し、日程候補または次の確認事項をご連絡します。',
          '',
          '申請内容:',
          `チケット番号: ${ticketNumber}`,
          `希望サービス: ${serviceLabel}`,
        ].join('\n')

    await resend.emails.send({
      from: MAIL_FROM,
      to: email,
      replyTo: MAIL_TO!,
      subject: `【Optiens】スポット相談チケット${modeLabel}を受け付けました${orderId ? `（${orderId}）` : ''}`,
      text: customerText,
      html: `<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(customerText)}</pre>`,
    })

    return redirect(`/spot-ticket-success?mode=${mode}`)
  } catch (error: any) {
    console.error('[spot-ticket] error:', error?.message ?? String(error))
    return json({ error: '送信に失敗しました。' }, 500)
  }
}

function buildPurchaseCustomerText(input: {
  companyName: string
  personName: string
  orderId: string
  ticketCountLabel: string
  serviceLabel: string
  purchaseCount: number
  purchaseAmount: number
  notifyUrl: string
  isQuoteRequired: boolean
}): string {
  if (input.isQuoteRequired) {
    return `${input.companyName} ${input.personName} 様

合同会社Optiensです。
スポット相談チケットの購入申込を受け付けました。

4枚以上のご希望は、依頼内容を確認したうえで個別に枚数・見積をご案内します。
この時点ではお振込は不要です。

申込番号: ${input.orderId}
購入希望枚数: ${input.ticketCountLabel}
希望サービス: ${input.serviceLabel}

内容確認後、次のご案内をお送りします。

合同会社Optiens
https://optiens.com
`
  }

  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const deadlineStr = `${deadline.getFullYear()}年${deadline.getMonth() + 1}月${deadline.getDate()}日`
  const invoiceText = buildSpotTicketInvoiceText({
    customerName: input.companyName,
    orderId: input.orderId,
    ticketCount: input.purchaseCount,
    dueDate: deadline,
  })
  return `${input.companyName} ${input.personName} 様

合同会社Optiensです。
スポット相談チケットの購入申込を受け付けました。

━━━━━━━━━━━━━━━━━━━━━━
■ 申込番号: ${input.orderId}
■ 購入希望枚数: ${input.ticketCountLabel}
■ 希望サービス: ${input.serviceLabel}
■ ご請求金額: ${formatYen(input.purchaseAmount)}（税込）
━━━━━━━━━━━━━━━━━━━━━━

${invoiceText}

下記口座へお振込をお願いいたします。

━━━ お振込先 ━━━
金融機関  : GMOあおぞらネット銀行（金融機関コード 0310）
支店    : フリー支店（支店コード 101）
預金種別  : 普通
口座番号  : 1211110
口座名義  : ゴウドウガイシャオプティエンス
振込金額  : ${formatYen(input.purchaseAmount)}（税込）
振込期限  : ${deadlineStr}（お申込から7日以内）

━━━ お振込時のお願い ━━━
振込人名義は、お申込時にご入力いただいた【${input.companyName}】でお振込ください。

━━━ この後の流れ ━━━
1. 上記口座へお振込（手数料はお客様ご負担）
2. お振込み後、下記URLをクリックいただくと即座に入金確認を試みます
   ${input.notifyUrl}
   （クリックを忘れた場合も、毎朝9時に自動で入金確認します）
3. 入金確認後、チケット番号をメールで自動送信します
4. チケット番号を使って、利用申請フォームから依頼内容を送信してください

ご不明な点は info@optiens.com までお問い合わせください。

合同会社Optiens
https://optiens.com
`
}

async function generateUniqueSpotTicketOrderId(): Promise<string> {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  for (let attempt = 0; attempt < 5; attempt++) {
    let suffix = ''
    for (let i = 0; i < 8; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)]
    }
    const candidate = `STO-${suffix}`
    if (!supabase) return candidate
    const { data, error } = await supabase
      .from('spot_ticket_orders')
      .select('id')
      .eq('order_id', candidate)
      .limit(1)
      .maybeSingle()
    if (error) {
      console.warn('[spot-ticket] order_id uniqueness check error:', error)
      return candidate
    }
    if (!data) return candidate
  }
  return `STO-${Date.now().toString(36).toUpperCase()}`
}

function buildSpotTicketNotifyUrl(orderId: string): string {
  const token = generatePaymentToken(orderId)
  return `${SITE_URL}/spot-ticket-payment-notify?id=${encodeURIComponent(orderId)}&t=${token}`
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
