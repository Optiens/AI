import type { APIRoute } from 'astro'
import sgMail, { MailDataRequired } from '@sendgrid/mail'

const SENDGRID_API_KEY = import.meta.env.SENDGRID_API_KEY
const MAIL_TO = import.meta.env.CONTACT_TO ?? import.meta.env.GMAIL_USER // 受信先
const MAIL_FROM = import.meta.env.CONTACT_FROM ?? import.meta.env.GMAIL_USER // 送信元（SendGridで認証済み）

// 環境変数チェック
if (!SENDGRID_API_KEY || !MAIL_TO || !MAIL_FROM) {
  console.warn('[contact] Missing envs: SENDGRID_API_KEY/CONTACT_TO/CONTACT_FROM')
}

sgMail.setApiKey(SENDGRID_API_KEY || '')

// ちょい便利ユーティリティ
const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

const sanitizeLine = (s: string) =>
  s.replace(/[\r\n\t]+/g, ' ').trim() // ヘッダインジェクション対策

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
    // フォーム項目
    const email = String(form.get('email') || '')
    const subject = String(form.get('subject') || '')
    const message = String(form.get('message') || '')
    // 任意: ハニーポット（bot用ダミー項目）
    const hp = String(form.get('company') || '') // フォームに非表示で追加しておく

    // 入力検証
    if (!email || !subject || !message)
      return json({ error: 'すべての項目を入力してください' }, 400)
    if (!emailRegex.test(email) || email.length > 254)
      return json({ error: 'メールアドレスの形式が正しくありません' }, 400)
    if (hp) // ハニーポットに値が入っていたら弾く
      return json({ error: 'Bad request' }, 400)

    const safeSubject = clamp(sanitizeLine(subject), 120)
    const safeEmail = sanitizeLine(email)
    const safeText = clamp(message.replace(/\r\n/g, '\n').trim(), 5000) // サイズ上限

    // HTMLは必ずエスケープ（リンク化したいならサーバー側で制御）
    const htmlBody = `
      <p><strong>送信元メールアドレス:</strong> ${escapeHtml(safeEmail)}</p>
      <p><strong>内容:</strong></p>
      <pre style="white-space:pre-wrap;font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
${escapeHtml(safeText)}
      </pre>
    `.trim()

    const msg: MailDataRequired = {
      to: MAIL_TO!,
      from: MAIL_FROM!, // SendGridで認証済みの送信元ドメイン/アドレスを必ず使う
      subject: `ウェブサイトからのお問い合わせ: ${safeSubject}`,
      text: `送信元: ${safeEmail}\n\n${safeText}`,
      html: htmlBody,
      replyTo: safeEmail, // 文字列でOK。名前も渡すなら { email, name }
    }

    const [res] = await sgMail.send(msg)
    // 2xx系なら成功扱い
    if (res.statusCode >= 200 && res.statusCode < 300) {
      return redirect('/contact-success')
    } else {
      console.error('[contact] SendGrid non-2xx:', res.statusCode, res.body)
      return json({ error: 'メールの送信に失敗しました。' }, 502)
    }
  } catch (error: any) {
    // SendGridの詳細エラーを拾う
    const detail = error?.response?.body || error?.message || String(error)
    console.error('[contact] error:', detail)
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
