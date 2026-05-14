import type { APIRoute } from 'astro'
import { Resend } from 'resend'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const MAIL_TO = import.meta.env.CONTACT_TO ?? import.meta.env.GMAIL_USER // 受信先
const MAIL_FROM = import.meta.env.CONTACT_FROM ?? 'no-reply@optiens.com'  // Resendで認証済みドメインのアドレス

// 環境変数チェック
if (!RESEND_API_KEY || !MAIL_TO) {
  console.warn('[contact] Missing envs: RESEND_API_KEY / GMAIL_USER')
}

const resend = new Resend(RESEND_API_KEY)

// ちょい便利ユーティリティ
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

const sanitizeLine = (s: string) =>
  s.replace(/[\r\n\t]+/g, ' ').trim()

const escapeHtml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const clamp = (s: string, max: number) =>
  s.length > max ? s.slice(0, max) + '…' : s

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const form = await request.formData()
    const companyName = String(form.get('company_name') || '')
    const personName = String(form.get('person_name') || '')
    const email = String(form.get('email') || '')
    const phone = String(form.get('phone') || '')
    const inquiryType = String(form.get('inquiry_type') || '')
    const subject = String(form.get('subject') || '')
    const message = String(form.get('message') || '')
    const hp = String(form.get('website') || '') // ハニーポット

    // 入力検証
    if (!personName || !email || !subject || !message)
      return json({ error: '必須項目を入力してください' }, 400)
    if (!emailRegex.test(email) || email.length > 254)
      return json({ error: 'メールアドレスの形式が正しくありません' }, 400)
    if (hp)
      return json({ error: 'Bad request' }, 400)

    const inquiryLabels: Record<string, string> = {
      'free-diagnosis-waitlist': '【簡易版】AI活用診断の無料枠案内',
      'consult-ticket': '相談チケットの案内',
      'ai-consult': 'AI支援事業について',
      'press': '取材・メディア掲載',
      'partner': '業務提携・パートナーシップ',
      'other': 'その他',
    }
    const safeCompanyName = clamp(sanitizeLine(companyName), 120)
    const safePersonName = clamp(sanitizeLine(personName), 80)
    const safeSubject = clamp(sanitizeLine(subject), 120)
    const safeEmail = sanitizeLine(email)
    const safePhone = clamp(sanitizeLine(phone), 60)
    const safeInquiryType = clamp(sanitizeLine(inquiryType), 80)
    const typeLabel = inquiryLabels[safeInquiryType] ?? (safeInquiryType || '未選択')
    const safeText = clamp(message.replace(/\r\n/g, '\n').trim(), 5000)
    const textBody = [
      `お問い合わせ種別: ${typeLabel}`,
      `会社・団体名: ${safeCompanyName || '未入力'}`,
      `お名前: ${safePersonName}`,
      `メールアドレス: ${safeEmail}`,
      `電話番号: ${safePhone || '未入力'}`,
      '',
      '内容:',
      safeText,
    ].join('\n')

    const htmlBody = `
      <p><strong>お問い合わせ種別:</strong> ${escapeHtml(typeLabel)}</p>
      <p><strong>会社・団体名:</strong> ${escapeHtml(safeCompanyName || '未入力')}</p>
      <p><strong>お名前:</strong> ${escapeHtml(safePersonName)}</p>
      <p><strong>送信元メールアドレス:</strong> ${escapeHtml(safeEmail)}</p>
      <p><strong>電話番号:</strong> ${escapeHtml(safePhone || '未入力')}</p>
      <p><strong>内容:</strong></p>
      <pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">
${escapeHtml(safeText)}
      </pre>
    `.trim()

    const { error } = await resend.emails.send({
      from: MAIL_FROM,
      to: MAIL_TO!,
      replyTo: safeEmail,
      subject: `ウェブサイトからのお問い合わせ（${typeLabel}）: ${safeSubject}`,
      text: textBody,
      html: htmlBody,
    })

    if (error) {
      console.error('[contact] Resend error:', error)
      return json({ error: 'メールの送信に失敗しました。' }, 502)
    }

    return redirect('/contact-success')
  } catch (error: any) {
    console.error('[contact] error:', error?.message ?? String(error))
    return json({ error: 'メールの送信に失敗しました。' }, 500)
  }
}

// JSONヘルパー
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
