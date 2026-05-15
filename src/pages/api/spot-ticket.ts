import type { APIRoute } from 'astro'
import { Resend } from 'resend'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const MAIL_TO = import.meta.env.CONTACT_TO ?? import.meta.env.GMAIL_USER
const MAIL_FROM = import.meta.env.CONTACT_FROM ?? 'no-reply@optiens.com'

if (!RESEND_API_KEY || !MAIL_TO) {
  console.warn('[spot-ticket] Missing envs: RESEND_API_KEY / GMAIL_USER')
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
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
    if (mode === 'redeem' && (!ticketNumber || !requestDetail)) {
      return json({ error: 'チケット番号と依頼内容を入力してください。' }, 400)
    }

    const modeLabel = mode === 'purchase' ? '購入申込' : '利用申請'
    const lines = [
      `種別: ${modeLabel}`,
      `会社・団体名: ${companyName}`,
      `お名前: ${personName}`,
      `メールアドレス: ${email}`,
      `電話番号: ${phone || '未入力'}`,
      '',
      `希望サービス: ${serviceLabel}`,
      mode === 'purchase' ? `購入希望枚数: ${ticketCountLabel}` : `チケット番号: ${ticketNumber}`,
      mode === 'purchase' ? `請求書宛名: ${invoiceName || companyName}` : `希望日程: ${preferredSchedule || '未入力'}`,
      '',
      mode === 'purchase' ? '購入前メモ:' : '依頼内容:',
      mode === 'purchase' ? (notes || '未入力') : requestDetail,
    ]
    if (mode === 'redeem' && notes) {
      lines.push('', '補足:', notes)
    }

    const htmlBody = `
      <p><strong>種別:</strong> ${escapeHtml(modeLabel)}</p>
      <p><strong>会社・団体名:</strong> ${escapeHtml(companyName)}</p>
      <p><strong>お名前:</strong> ${escapeHtml(personName)}</p>
      <p><strong>メールアドレス:</strong> ${escapeHtml(email)}</p>
      <p><strong>電話番号:</strong> ${escapeHtml(phone || '未入力')}</p>
      <p><strong>希望サービス:</strong> ${escapeHtml(serviceLabel)}</p>
      <p><strong>${mode === 'purchase' ? '購入希望枚数' : 'チケット番号'}:</strong> ${escapeHtml(mode === 'purchase' ? ticketCountLabel : ticketNumber)}</p>
      <p><strong>${mode === 'purchase' ? '請求書宛名' : '希望日程'}:</strong> ${escapeHtml(mode === 'purchase' ? (invoiceName || companyName) : (preferredSchedule || '未入力'))}</p>
      <p><strong>${mode === 'purchase' ? '購入前メモ' : '依頼内容'}:</strong></p>
      <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(mode === 'purchase' ? (notes || '未入力') : requestDetail)}</pre>
      ${mode === 'redeem' && notes ? `<p><strong>補足:</strong></p><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(notes)}</pre>` : ''}
    `.trim()

    if (!resend) return json({ error: 'メール送信設定が未完了です。' }, 500)

    const adminSubject = `スポット相談チケット ${modeLabel}: ${companyName}`
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
      ? [
          `${personName} 様`,
          '',
          'スポット相談チケットの購入申込を受け付けました。',
          '内容を確認のうえ、請求・お支払い案内をお送りします。',
          '入金確認後にチケット番号を発行します。利用申請時は、そのチケット番号をフォームに入力してください。',
          '',
          '申込内容:',
          `購入希望枚数: ${ticketCountLabel}`,
          `希望サービス: ${serviceLabel}`,
        ].join('\n')
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
      subject: `【Optiens】スポット相談チケット${modeLabel}を受け付けました`,
      text: customerText,
      html: `<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(customerText)}</pre>`,
    })

    return redirect(`/spot-ticket-success?mode=${mode}`)
  } catch (error: any) {
    console.error('[spot-ticket] error:', error?.message ?? String(error))
    return json({ error: '送信に失敗しました。' }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
