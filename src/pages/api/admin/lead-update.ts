/**
 * リード（申込）更新API（CEO管理画面用）
 *
 * 用途:
 * - /admin/leads/[id] 編集画面からの更新
 * - フィールド変更・ステータス変更・「紹介経由・無料化」アクション
 * - 必要に応じて自動メール送信（無料化・入金確認・レポート送付済み等）
 *
 * 認証:
 * - middleware.ts で /api/admin/* も protected されることを想定（ない場合は token チェック追加）
 *
 * 対応アクション:
 *   - action: "update_fields" — 任意フィールドを編集
 *   - action: "mark_referral_free" — 紹介経由・無料化（status=paid, amount=0, 顧客メール送信）
 *   - action: "mark_paid" — お振込確認済みに変更（顧客メール送信）
 *   - action: "mark_report_sent" — レポート送付済みに変更
 *   - action: "change_status" — ステータスのみ変更（メールなし）
 */

import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { makeToken, COOKIE_NAME, ADMIN_PASSWORD } from '../../../middleware'

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const MAIL_FROM = import.meta.env.CONTACT_FROM ?? 'no-reply@optiens.com'

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const escapeHtml = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function isAuthed(req: Request): boolean {
  if (!ADMIN_PASSWORD) return false
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  if (!match) return false
  return match[1] === makeToken(ADMIN_PASSWORD)
}

const ALLOWED_FIELDS = [
  'company_name', 'person_name', 'email', 'industry', 'employee_count',
  'business_description', 'daily_tasks', 'current_tools',
  'business_age', 'service_area', 'target_customer',
  'annual_revenue_range', 'decision_timeline', 'past_it_experience',
  'admin_notes',
]

const ALLOWED_STATUSES = [
  'new', 'pending_payment', 'paid', 'report_created', 'sent',
  'mtg_scheduled', 'paid_report', 'implementation', 'maintenance',
  'cancelled',
]

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return json({ error: 'Unauthorized' }, 401)
  }
  if (!supabase) {
    return json({ error: 'Supabase not configured' }, 500)
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const id = Number(body?.id)
  if (!id || !Number.isFinite(id)) {
    return json({ error: 'id is required' }, 400)
  }

  const action = String(body?.action || 'update_fields')

  // 既存レコード取得
  const { data: lead, error: fetchErr } = await supabase
    .from('diagnosis_leads')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !lead) {
    return json({ error: 'Lead not found' }, 404)
  }

  // ---- アクション分岐 ----
  if (action === 'update_fields') {
    const updates: Record<string, any> = {}
    if (body.fields && typeof body.fields === 'object') {
      for (const key of ALLOWED_FIELDS) {
        if (key in body.fields) {
          const val = body.fields[key]
          updates[key] = (val === '' || val === undefined) ? null : val
        }
      }
    }
    if (body.status && ALLOWED_STATUSES.includes(body.status)) {
      updates.status = body.status
    }
    if (Object.keys(updates).length === 0) {
      return json({ error: 'No fields to update' }, 400)
    }
    const { error: updErr } = await supabase
      .from('diagnosis_leads').update(updates).eq('id', id)
    if (updErr) {
      console.error('[lead-update] update_fields error:', updErr)
      return json({ error: 'Update failed' }, 500)
    }
    return json({ ok: true, updated: Object.keys(updates) })
  }

  if (action === 'mark_referral_free') {
    const referralFrom = String(body?.referral_from || '').trim()
    const updates: Record<string, any> = {
      status: 'paid',
      amount_jpy: 0,
      paid_at: new Date().toISOString(),
      voucher_note: referralFrom ? `紹介経由・無料化（紹介元: ${referralFrom}）` : '紹介経由・無料化',
    }
    const { error: updErr } = await supabase
      .from('diagnosis_leads').update(updates).eq('id', id)
    if (updErr) {
      console.error('[lead-update] mark_referral_free error:', updErr)
      return json({ error: 'Update failed' }, 500)
    }

    // 顧客メール送信
    if (resend && lead.email) {
      try {
        await resend.emails.send({
          from: MAIL_FROM,
          to: lead.email,
          subject: `【Optiens】【詳細版】AI活用診断のご案内（申込番号: ${lead.application_id}）`,
          text: buildReferralFreeEmail(lead, referralFrom),
          html: buildReferralFreeEmailHtml(lead, referralFrom),
        })
      } catch (e) {
        console.error('[lead-update] referral_free email error:', e)
      }
    }
    return json({ ok: true, action: 'mark_referral_free' })
  }

  if (action === 'mark_paid') {
    const updates: Record<string, any> = {
      status: 'paid',
      paid_at: new Date().toISOString(),
    }
    const { error: updErr } = await supabase
      .from('diagnosis_leads').update(updates).eq('id', id)
    if (updErr) {
      console.error('[lead-update] mark_paid error:', updErr)
      return json({ error: 'Update failed' }, 500)
    }
    if (resend && lead.email) {
      try {
        await resend.emails.send({
          from: MAIL_FROM,
          to: lead.email,
          subject: `【Optiens】お振込を確認しました（申込番号: ${lead.application_id}）`,
          text: buildPaymentConfirmedEmail(lead),
          html: buildPaymentConfirmedEmailHtml(lead),
        })
      } catch (e) {
        console.error('[lead-update] mark_paid email error:', e)
      }
    }
    return json({ ok: true, action: 'mark_paid' })
  }

  if (action === 'mark_report_sent') {
    const updates: Record<string, any> = {
      status: 'sent',
      report_sent_at: new Date().toISOString(),
    }
    const { error: updErr } = await supabase
      .from('diagnosis_leads').update(updates).eq('id', id)
    if (updErr) {
      console.error('[lead-update] mark_report_sent error:', updErr)
      return json({ error: 'Update failed' }, 500)
    }
    return json({ ok: true, action: 'mark_report_sent' })
  }

  if (action === 'change_status') {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      return json({ error: 'Invalid status' }, 400)
    }
    const { error: updErr } = await supabase
      .from('diagnosis_leads').update({ status: body.status }).eq('id', id)
    if (updErr) {
      console.error('[lead-update] change_status error:', updErr)
      return json({ error: 'Update failed' }, 500)
    }
    return json({ ok: true, action: 'change_status', status: body.status })
  }

  return json({ error: 'Unknown action' }, 400)
}

// ===== 顧客向けメール本文 =====

function buildReferralFreeEmail(lead: any, referralFrom: string): string {
  const fromLine = referralFrom ? `（${referralFrom} よりご紹介）` : ''
  return `${lead.company_name} ${lead.person_name} 様

合同会社Optiensです。
【詳細版】AI活用診断のお申込ありがとうございます${fromLine}。

ご紹介経由のお申込のため、お支払いは不要です。
これより詳細レポートの作成プロセスへ進みます。

━━━━━━━━━━━━━━━━━━━━━━
■ 申込番号: ${lead.application_id}
■ ご利用プラン: 詳細レポート + 60分オンラインMTG
■ ご請求金額: ¥0（紹介経由・無料化）
━━━━━━━━━━━━━━━━━━━━━━

━━━ この後の流れ ━━━
1. 5営業日以内に詳細レポート（PDF）をメールでお届け
2. 同じメールで60分オンラインMTGの日程調整リンクをご案内

レポート作成中、追加でヒアリングが必要な場合は別途ご連絡いたします。

合同会社Optiens
〒407-0301 山梨県北杜市高根町清里3545番地2483
https://optiens.com
`
}

function buildReferralFreeEmailHtml(lead: any, referralFrom: string): string {
  const safeCompany = escapeHtml(lead.company_name || '')
  const safePerson = escapeHtml(lead.person_name || '')
  const fromTag = referralFrom ? `<span style="color:#C76A77;">（${escapeHtml(referralFrom)} よりご紹介）</span>` : ''
  return `<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.8;color:#333;max-width:560px;">
<p>${safeCompany} ${safePerson} 様</p>
<p>合同会社Optiensです。<br/>【詳細版】AI活用診断のお申込ありがとうございます${fromTag}。</p>
<p>ご紹介経由のお申込のため、<strong>お支払いは不要</strong>です。これより詳細レポートの作成プロセスへ進みます。</p>

<table style="border-collapse:collapse;width:100%;margin:16px 0;background:#D1FAE5;border:1px solid #6EE7B7;border-radius:8px;">
  <tr><td style="padding:8px 14px;font-weight:bold;width:140px;background:#A7F3D0;">申込番号</td><td style="padding:8px 14px;font-family:monospace;color:#065F46;font-weight:bold;">${escapeHtml(lead.application_id || '')}</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;background:#A7F3D0;">プラン</td><td style="padding:8px 14px;">詳細レポート + 60分オンラインMTG</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;background:#A7F3D0;">ご請求金額</td><td style="padding:8px 14px;color:#065F46;font-weight:bold;">¥0（紹介経由・無料化）</td></tr>
</table>

<h3 style="margin:24px 0 8px;font-size:14px;color:#0f172a;">この後の流れ</h3>
<ol style="margin:0 0 16px;padding-left:20px;font-size:14px;">
  <li>5営業日以内に<strong>詳細レポート（PDF）</strong>をメールでお届け</li>
  <li>同じメールで<strong>60分オンラインMTGの日程調整リンク</strong>をご案内</li>
</ol>

<p style="margin-top:24px;font-size:12px;color:#64748b;">
合同会社Optiens<br/>
〒407-0301 山梨県北杜市高根町清里3545番地2483<br/>
<a href="https://optiens.com">https://optiens.com</a>
</p>
</div>`
}

function buildPaymentConfirmedEmail(lead: any): string {
  return `${lead.company_name} ${lead.person_name} 様

合同会社Optiensです。
【詳細版】AI活用診断のお振込を確認いたしました。
ありがとうございます。

申込番号: ${lead.application_id}
ご請求金額: ¥${(lead.amount_jpy || 5500).toLocaleString()}（税込）

これより詳細レポートの作成プロセスに入ります。
5営業日以内に下記をお届けします。
- 詳細レポート（PDF）
- 60分オンラインMTGの日程調整リンク

合同会社Optiens
https://optiens.com
`
}

function buildPaymentConfirmedEmailHtml(lead: any): string {
  const safeCompany = escapeHtml(lead.company_name || '')
  const safePerson = escapeHtml(lead.person_name || '')
  return `<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.8;color:#333;max-width:560px;">
<p>${safeCompany} ${safePerson} 様</p>
<p>合同会社Optiensです。<br/>【詳細版】AI活用診断のお振込を確認いたしました。ありがとうございます。</p>
<table style="border-collapse:collapse;width:100%;margin:16px 0;background:#D1FAE5;border:1px solid #6EE7B7;border-radius:8px;">
  <tr><td style="padding:8px 14px;font-weight:bold;width:140px;">申込番号</td><td style="padding:8px 14px;font-family:monospace;color:#065F46;font-weight:bold;">${escapeHtml(lead.application_id || '')}</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;">ご請求金額</td><td style="padding:8px 14px;">¥${(lead.amount_jpy || 5500).toLocaleString()}（税込）</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;">ステータス</td><td style="padding:8px 14px;color:#065F46;font-weight:bold;">✅ お振込確認済み</td></tr>
</table>
<p>これより詳細レポートの作成プロセスに入ります。<br/>5営業日以内に詳細レポート＋60分MTG日程調整リンクをお届けします。</p>
<p style="margin-top:24px;font-size:12px;color:#64748b;">
合同会社Optiens<br/>
<a href="https://optiens.com">https://optiens.com</a>
</p>
</div>`
}
