import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const MAIL_TO = import.meta.env.CONTACT_TO ?? import.meta.env.GMAIL_USER
const MAIL_FROM = import.meta.env.CONTACT_FROM ?? 'no-reply@optiens.com'

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i

const sanitize = (s: string) =>
  s.replace(/[\r\n\t]+/g, ' ').trim()

const escapeHtml = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

const clamp = (s: string, max: number) =>
  s.length > max ? s.slice(0, max) + '…' : s

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const form = await request.formData()

    // 必須フィールド
    const restaurantName = sanitize(String(form.get('restaurant_name') || ''))
    const personName = sanitize(String(form.get('person_name') || ''))
    const email = sanitize(String(form.get('email') || ''))
    const restaurantType = sanitize(String(form.get('restaurant_type') || ''))

    // 任意フィールド
    const phone = sanitize(String(form.get('phone') || ''))
    const location = sanitize(String(form.get('location') || ''))
    const herbsList = form.getAll('herbs').map(h => String(h))
    const herbs = herbsList.join(', ')
    const volume = sanitize(String(form.get('volume') || ''))
    const message = clamp(String(form.get('message') || '').replace(/\r\n/g, '\n').trim(), 3000)

    // バリデーション
    if (!restaurantName || !personName || !email || !restaurantType)
      return json({ error: '必須項目を入力してください' }, 400)
    if (!emailRegex.test(email) || email.length > 254)
      return json({ error: 'メールアドレスの形式が正しくありません' }, 400)

    const businessTypeMap: Record<string, string> = {
      italian: 'イタリアン',
      french: 'フレンチ',
      japanese: '和食',
      cafe: 'カフェ',
      hotel: 'ホテル・旅館',
      other: 'その他',
    }
    const typeName = businessTypeMap[restaurantType] || restaurantType

    // ---- Supabase にリード保存 ----
    if (supabase) {
      const { error: dbError } = await supabase.from('leads').insert({
        restaurant_name: restaurantName,
        person_name: personName,
        email,
        phone: phone || null,
        restaurant_type: restaurantType,
        location: location || null,
        herbs: herbsList.length > 0 ? herbsList : null,
        weekly_volume: volume || null,
        message: message || null,
        status: 'new',
      })
      if (dbError) {
        console.error('[restaurant-inquiry] Supabase error:', dbError)
        // Supabase失敗してもメール通知で継続
      }
    } else {
      console.warn('[restaurant-inquiry] Supabase not configured, skipping DB insert')
    }

    // ---- メール通知 ----
    if (resend && MAIL_TO) {
      const htmlBody = `
<h2>飲食店サンプル事前登録</h2>
<table style="border-collapse:collapse;font-family:system-ui,sans-serif;">
  <tr><td style="padding:6px 12px;font-weight:bold;">店舗名</td><td style="padding:6px 12px;">${escapeHtml(restaurantName)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">ご担当者</td><td style="padding:6px 12px;">${escapeHtml(personName)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">メール</td><td style="padding:6px 12px;">${escapeHtml(email)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">電話番号</td><td style="padding:6px 12px;">${escapeHtml(phone || '未記入')}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">業態</td><td style="padding:6px 12px;">${escapeHtml(typeName)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">所在地</td><td style="padding:6px 12px;">${escapeHtml(location || '未記入')}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">興味のあるハーブ</td><td style="padding:6px 12px;">${escapeHtml(herbs || '未選択')}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">想定使用量/週</td><td style="padding:6px 12px;">${escapeHtml(volume || '未選択')}</td></tr>
</table>
${message ? `<p style="margin-top:16px;"><strong>ご質問・ご要望:</strong></p><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(message)}</pre>` : ''}
      `.trim()

      const textBody = [
        `【飲食店サンプル事前登録】`,
        `店舗名: ${restaurantName}`,
        `担当者: ${personName}`,
        `メール: ${email}`,
        `電話: ${phone || '未記入'}`,
        `業態: ${typeName}`,
        `所在地: ${location || '未記入'}`,
        `ハーブ: ${herbs || '未選択'}`,
        `使用量/週: ${volume || '未選択'}`,
        message ? `\nご質問・ご要望:\n${message}` : '',
      ].filter(Boolean).join('\n')

      const { error: mailError } = await resend.emails.send({
        from: MAIL_FROM,
        to: MAIL_TO,
        replyTo: email,
        subject: `【飲食店事前登録】${restaurantName}（${typeName}）`,
        text: textBody,
        html: htmlBody,
      })
      if (mailError) {
        console.error('[restaurant-inquiry] Resend error:', mailError)
      }
    }

    return redirect('/restaurant-thanks')
  } catch (error: any) {
    console.error('[restaurant-inquiry] error:', error?.message ?? String(error))
    return json({ error: '送信に失敗しました。' }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
