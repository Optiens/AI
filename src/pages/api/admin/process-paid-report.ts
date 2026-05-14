import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { makeToken, COOKIE_NAME, getAdminPassword } from '../../../middleware'
import { logAdminAudit } from '../../../lib/admin-ops'

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function isAuthed(req: Request): boolean {
  const adminPassword = getAdminPassword()
  if (!adminPassword) return false
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  if (!match) return false
  return match[1] === makeToken(adminPassword)
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return json({ error: 'Unauthorized' }, 401)
  }
  if (!supabase || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return json({ error: 'Supabase not configured' }, 500)
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const id = String(body?.id || '').trim()
  if (!id) {
    return json({ error: 'id is required' }, 400)
  }
  const force = Boolean(body?.force)

  const { data: lead, error: fetchErr } = await supabase
    .from('diagnosis_leads')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (fetchErr || !lead) {
    return json({ error: 'Lead not found' }, 404)
  }

  const status = String(lead.status || '')
  const isPaidLead = lead.plan === 'paid' || Number(lead.amount_jpy || 0) > 0
  if (!isPaidLead) {
    return json({ error: 'Paid report generation is only available for paid leads' }, 400)
  }
  const readyStatuses = force ? ['paid', 'report_created', 'manual_review'] : ['paid', 'report_created']
  if (!readyStatuses.includes(status)) {
    return json({ error: `Lead status is not ready: ${status}` }, 400)
  }

  const functionUrl = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/process-paid-diagnosis`
  const res = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ record: lead, force }),
  })
  const text = await res.text()
  let payload: any = {}
  try {
    payload = text ? JSON.parse(text) : {}
  } catch {
    payload = { raw: text }
  }

  if (!res.ok || payload?.error) {
    await logAdminAudit({
      action: 'paid_report.process_error',
      target_table: 'diagnosis_leads',
      target_id: id,
      summary: `有償レポート生成に失敗: ${lead.application_id || id}`,
      metadata: { status: res.status, force, payload },
      request,
    })
    return json({
      error: payload?.error || `Paid report function failed with status ${res.status}`,
      detail: payload,
    }, 500)
  }

  await logAdminAudit({
    action: 'paid_report.process',
    target_table: 'diagnosis_leads',
    target_id: id,
    summary: `有償レポート生成を実行: ${lead.application_id || id}`,
    metadata: { force, result: payload },
    request,
  })

  return json({ ok: true, result: payload })
}
