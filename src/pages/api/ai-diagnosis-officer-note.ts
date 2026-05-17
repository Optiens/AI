import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { verifyAiDiagnosisReviewToken } from '../../lib/ai-diagnosis-review'
import { getRuntimeEnv } from '../../lib/runtime-env'

const RESEND_API_KEY = getRuntimeEnv('RESEND_API_KEY')
const MAIL_TO = getRuntimeEnv('CONTACT_TO') ?? getRuntimeEnv('GMAIL_USER')
const MAIL_FROM = getRuntimeEnv('CONTACT_FROM') ?? 'no-reply@optiens.com'
const SUPABASE_URL = getRuntimeEnv('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = getRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY')

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const clamp = (value: string, max: number) =>
  value.length > max ? value.slice(0, max) + '...' : value

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}))
    const ticketNumber = String(body.ticket_number || '').trim().toUpperCase()
    const token = String(body.token || '').trim()
    const diagnosisMemo = clamp(String(body.diagnosis_memo || '').trim(), 8000)

    if (!ticketNumber || !verifyAiDiagnosisReviewToken(ticketNumber, token)) {
      return json({ error: 'AI診断官レビューURLの確認に失敗しました。' }, 403)
    }
    if (!diagnosisMemo) {
      return json({ error: '送信する診断メモがありません。' }, 400)
    }
    if (!supabase) {
      return json({ error: '保存先の設定が未完了です。' }, 500)
    }

    const { data, error } = await supabase
      .from('spot_ticket_orders')
      .select('id, ticket_number, status, company_name, person_name, email, redeem_company_name, redeem_person_name, redeem_email, redeem_service_type, request_detail, redeem_notes')
      .eq('ticket_number', ticketNumber)
      .maybeSingle()

    if (error || !data) {
      return json({ error: 'チケット番号に紐づくレビュー申請が見つかりません。' }, 404)
    }
    if (data.redeem_service_type !== 'review' || data.status !== 'redeemed') {
      return json({ error: 'AI診断官レビューとして受付済みのチケットではありません。' }, 400)
    }

    const submittedAt = new Date().toISOString()
    const existingNotes = String(data.redeem_notes || '').trim()
    const appendedNotes = [
      existingNotes,
      `--- AI診断官レビュー診断メモ ${submittedAt} ---`,
      diagnosisMemo,
    ].filter(Boolean).join('\n\n')

    const { error: updateError } = await supabase
      .from('spot_ticket_orders')
      .update({
        redeem_notes: appendedNotes,
        updated_at: submittedAt,
      })
      .eq('id', data.id)

    if (updateError) {
      console.error('[ai-diagnosis-officer-note] update error:', updateError)
      return json({ error: '診断メモの保存に失敗しました。' }, 500)
    }

    if (resend && MAIL_TO) {
      const companyName = String(data.redeem_company_name || data.company_name || '')
      const personName = String(data.redeem_person_name || data.person_name || '')
      const email = String(data.redeem_email || data.email || '')
      const text = [
        'AI診断官レビューの診断メモが送信されました。',
        '',
        `チケット番号: ${ticketNumber}`,
        `会社・団体名: ${companyName}`,
        `担当者: ${personName}`,
        `メール: ${email}`,
        '',
        '申請内容:',
        String(data.request_detail || '未入力'),
        '',
        '診断メモ:',
        diagnosisMemo,
      ].join('\n')
      await resend.emails.send({
        from: MAIL_FROM,
        to: MAIL_TO,
        replyTo: email || undefined,
        subject: `【AI診断官レビュー 診断メモ】${ticketNumber} ${companyName}`,
        text,
        html: `<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(text)}</pre>`,
      })
    }

    return json({ ok: true })
  } catch (error: any) {
    console.error('[ai-diagnosis-officer-note] error:', error?.message ?? String(error))
    return json({ error: '診断メモの送信に失敗しました。' }, 500)
  }
}
