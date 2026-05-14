import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { makeToken, COOKIE_NAME, getAdminPassword } from '../../../middleware'
import { getBusinessTaskSummary, type BusinessTaskSummary } from '../../../lib/google-tasks'
import { buildTodayActions, type TodayAction } from '../../../lib/ops-today'

const CRON_SECRET = import.meta.env.CRON_SECRET
const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const MAIL_FROM = import.meta.env.CONTACT_FROM ?? 'no-reply@optiens.com'
const MAIL_TO = import.meta.env.ADMIN_ALERT_EMAIL ?? import.meta.env.CONTACT_TO ?? import.meta.env.GMAIL_USER
const SITE_URL = import.meta.env.SITE_URL ?? 'https://optiens.com'

const OPENAI_INPUT_USD_PER_1M = Number(import.meta.env.OPENAI_INPUT_USD_PER_1M || '0') || 0
const OPENAI_OUTPUT_USD_PER_1M = Number(import.meta.env.OPENAI_OUTPUT_USD_PER_1M || '0') || 0
const ANTHROPIC_INPUT_USD_PER_1M = Number(import.meta.env.ANTHROPIC_INPUT_USD_PER_1M || '0') || 0
const ANTHROPIC_OUTPUT_USD_PER_1M = Number(import.meta.env.ANTHROPIC_OUTPUT_USD_PER_1M || '0') || 0
const USD_JPY_RATE = Number(import.meta.env.USD_JPY_RATE || '0') || 0
const OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS = Number(import.meta.env.OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS || '0') || 0
const OPENAI_LONG_CONTEXT_INPUT_MULTIPLIER = Number(import.meta.env.OPENAI_LONG_CONTEXT_INPUT_MULTIPLIER || '1') || 1
const OPENAI_LONG_CONTEXT_OUTPUT_MULTIPLIER = Number(import.meta.env.OPENAI_LONG_CONTEXT_OUTPUT_MULTIPLIER || '1') || 1

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

type Lead = {
  id: string | number
  created_at: string
  updated_at?: string | null
  status?: string | null
  plan?: string | null
  amount_jpy?: number | null
  paid_at?: string | null
  verified_at?: string | null
  company_name?: string | null
  person_name?: string | null
  application_id?: string | null
  last_error?: string | null
}

type AiApiEvent = {
  id: number
  created_at: string
  workflow?: string | null
  provider?: string | null
  model?: string | null
  operation?: string | null
  status?: string | null
  input_tokens?: number | null
  output_tokens?: number | null
  total_tokens?: number | null
  latency_ms?: number | null
  error_type?: string | null
  error_message?: string | null
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function isAdminCookie(req: Request): boolean {
  const adminPassword = getAdminPassword()
  if (!adminPassword) return false
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  if (!match) return false
  return match[1] === makeToken(adminPassword)
}

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('authorization') || ''
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true
  return isAdminCookie(req)
}

function parseTime(iso?: string | null) {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

function esc(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const yen = new Intl.NumberFormat('ja-JP')
const tokyoDateTime = new Intl.DateTimeFormat('ja-JP', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

function estimateCostJpy(events: AiApiEvent[]) {
  if (!USD_JPY_RATE) return null

  let usd = 0
  for (const event of events) {
    const input = event.input_tokens || 0
    const output = event.output_tokens || 0
    if (event.provider === 'openai' && (OPENAI_INPUT_USD_PER_1M || OPENAI_OUTPUT_USD_PER_1M)) {
      const isLongContext = Boolean(OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS && input > OPENAI_LONG_CONTEXT_THRESHOLD_TOKENS)
      const inputRate = OPENAI_INPUT_USD_PER_1M * (isLongContext ? OPENAI_LONG_CONTEXT_INPUT_MULTIPLIER : 1)
      const outputRate = OPENAI_OUTPUT_USD_PER_1M * (isLongContext ? OPENAI_LONG_CONTEXT_OUTPUT_MULTIPLIER : 1)
      usd += (input / 1_000_000) * inputRate
      usd += (output / 1_000_000) * outputRate
    }
    if (event.provider === 'anthropic' && (ANTHROPIC_INPUT_USD_PER_1M || ANTHROPIC_OUTPUT_USD_PER_1M)) {
      usd += (input / 1_000_000) * ANTHROPIC_INPUT_USD_PER_1M
      usd += (output / 1_000_000) * ANTHROPIC_OUTPUT_USD_PER_1M
    }
  }

  return Math.round(usd * USD_JPY_RATE)
}

async function logEmailEvent(status: 'success' | 'error', message?: string) {
  if (!supabase) return
  await supabase.from('ai_api_events').insert({
    workflow: 'daily_ops_email',
    provider: 'resend',
    operation: 'emails.send',
    status,
    error_type: status === 'error' ? 'email' : null,
    error_message: message ? String(message).slice(0, 1000) : null,
    metadata: { to: MAIL_TO },
  }).catch((error) => {
    console.warn('[daily-ops-email] log skipped:', error?.message || error)
  })
}

async function loadData() {
  if (!supabase) throw new Error('Supabase not configured')

  const { data: leadsData, error: leadsError } = await supabase
    .from('diagnosis_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  if (leadsError) throw new Error(`diagnosis_leads query failed: ${leadsError.message}`)

  const { data: eventsData, error: eventsError } = await supabase
    .from('ai_api_events')
    .select('id, created_at, workflow, provider, model, operation, status, input_tokens, output_tokens, total_tokens, latency_ms, error_type, error_message')
    .order('created_at', { ascending: false })
    .limit(500)

  const tasks = await getBusinessTaskSummary(new Date(), 7)

  return {
    leads: (leadsData || []) as Lead[],
    events: ((eventsError ? [] : eventsData) || []) as AiApiEvent[],
    eventsError: eventsError?.message || '',
    tasks,
  }
}

function buildSummary(leads: Lead[], events: AiApiEvent[], eventsError: string, tasks: BusinessTaskSummary) {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  const oneDay = 24 * oneHour
  const last24h = leads.filter((lead) => parseTime(lead.created_at) > now - oneDay)
  const last7d = leads.filter((lead) => parseTime(lead.created_at) > now - 7 * oneDay)
  const confirmedRevenue = leads
    .filter((lead) => lead.paid_at && (lead.amount_jpy || 0) > 0)
    .reduce((sum, lead) => sum + (lead.amount_jpy || 0), 0)
  const pendingRevenue = leads
    .filter((lead) => lead.status === 'pending_payment')
    .reduce((sum, lead) => sum + (lead.amount_jpy || 0), 0)
  const aiIssueLeads = leads.filter((lead) =>
    Boolean(lead.last_error)
    || ['manual_review', 'quota_retry_pending', 'limit_exceeded'].includes(lead.status || '')
    || (['verified', 'processing'].includes(lead.status || '') && parseTime(lead.updated_at || lead.created_at) < now - 2 * oneHour)
  )
  const apiIssues24h = events.filter((event) =>
    parseTime(event.created_at) > now - oneDay
    && ['error', 'retry'].includes(event.status || '')
  )
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthEvents = events.filter((event) => parseTime(event.created_at) >= monthStart.getTime())
  const monthlyTokens = monthEvents.reduce((sum, event) => sum + (event.total_tokens || 0), 0)
  const estimatedCostJpy = estimateCostJpy(monthEvents)
  const todayActions = buildTodayActions({ leads, events, tasks, now: new Date() })

  return {
    total: leads.length,
    new24h: last24h.length,
    new7d: last7d.length,
    pendingPayment: leads.filter((lead) => lead.status === 'pending_payment').length,
    pendingRevenue,
    paidCount: leads.filter((lead) => Boolean(lead.paid_at) && (lead.amount_jpy || 0) > 0).length,
    confirmedRevenue,
    aiIssueLeads,
    apiIssues24h,
    monthlyTokens,
    estimatedCostJpy,
    eventsError,
    tasks,
    todayActions,
  }
}

function actionLine(action: TodayAction) {
  return `- [${action.due}] ${action.title}: ${action.detail}（${action.owner}）`
}

function buildEmail(summary: ReturnType<typeof buildSummary>) {
  const title = `【Optiens日次アラート】${tokyoDateTime.format(new Date())}`
  const costText = summary.estimatedCostJpy === null
    ? '単価未設定'
    : `約 ¥${yen.format(summary.estimatedCostJpy)}`
  const overall = summary.todayActions.some((action) => action.tone === 'critical')
    || summary.aiIssueLeads.length > 0
    || summary.apiIssues24h.length > 0
    || summary.tasks.overdue.length > 0
    || summary.eventsError
    || summary.tasks.error
    ? '要確認あり'
    : '異常なし'
  const actionText = summary.todayActions.length
    ? summary.todayActions.slice(0, 10).map(actionLine).join('\n')
    : '- 今日すぐ対応すべき項目はありません'

  const text = `${title}

総合判定: ${overall}

今日の対応:
${actionText}

Google Tasks:
- 期限超過: ${summary.tasks.overdue.length}件
- 今日が期限: ${summary.tasks.today.length}件
- 7日以内: ${summary.tasks.upcoming.length}件
${summary.tasks.error ? `- Google Tasks: ${summary.tasks.error}` : ''}

案件:
- 24時間以内の新規: ${summary.new24h}件
- 7日以内の新規: ${summary.new7d}件
- 入金待ち: ${summary.pendingPayment}件 / ¥${yen.format(summary.pendingRevenue)}
- 入金済売上: ${summary.paidCount}件 / ¥${yen.format(summary.confirmedRevenue)}

AI/API:
- AI要確認リード: ${summary.aiIssueLeads.length}件
- 24時間以内のAPIエラー/再試行: ${summary.apiIssues24h.length}件
- 当月トークン: ${yen.format(summary.monthlyTokens)}
- 当月API費用推定: ${costText}
${summary.eventsError ? `- AI通信ログDB: ${summary.eventsError}` : ''}

管理画面: ${SITE_URL}/admin/leads
`

  const actionRows = summary.todayActions.slice(0, 10).map((action) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(action.due)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(action.title)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(action.detail.slice(0, 160))}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(action.owner)}</td>
    </tr>
  `).join('')

  const issueRows = summary.aiIssueLeads.slice(0, 8).map((lead) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(lead.company_name || lead.application_id || lead.id)}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(lead.status || '-')}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc((lead.last_error || '').slice(0, 120))}</td>
    </tr>
  `).join('')

  const apiRows = summary.apiIssues24h.slice(0, 8).map((event) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(event.provider || '-')}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(event.status || '-')}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc(event.error_type || '')}</td>
      <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${esc((event.error_message || '').slice(0, 120))}</td>
    </tr>
  `).join('')

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Noto Sans JP',sans-serif;line-height:1.7;color:#172033;max-width:720px;">
    <h1 style="font-size:20px;margin:0 0 12px;">${esc(title)}</h1>
    <p style="margin:0 0 18px;padding:10px 12px;border-radius:8px;background:${overall === '異常なし' ? '#ecfdf5' : '#fff7ed'};border:1px solid ${overall === '異常なし' ? '#a7f3d0' : '#fed7aa'};">
      総合判定: <strong>${esc(overall)}</strong>
    </p>

    <h2 style="font-size:15px;margin:20px 0 8px;">今日の対応</h2>
    ${summary.todayActions.length ? `<table style="border-collapse:collapse;width:100%;font-size:13px;"><thead><tr><th align="left">期限</th><th align="left">項目</th><th align="left">内容</th><th align="left">担当</th></tr></thead><tbody>${actionRows}</tbody></table>` : '<p>今日すぐ対応すべき項目はありません。</p>'}

    <h2 style="font-size:15px;margin:20px 0 8px;">Google Tasks</h2>
    <ul>
      <li>期限超過: <strong>${summary.tasks.overdue.length}</strong>件</li>
      <li>今日が期限: <strong>${summary.tasks.today.length}</strong>件</li>
      <li>7日以内: <strong>${summary.tasks.upcoming.length}</strong>件</li>
      ${summary.tasks.error ? `<li>取得状況: <strong>${esc(summary.tasks.error)}</strong></li>` : ''}
    </ul>

    <h2 style="font-size:15px;margin:20px 0 8px;">案件</h2>
    <ul>
      <li>24時間以内の新規: <strong>${summary.new24h}</strong>件</li>
      <li>7日以内の新規: <strong>${summary.new7d}</strong>件</li>
      <li>入金待ち: <strong>${summary.pendingPayment}</strong>件 / ¥${yen.format(summary.pendingRevenue)}</li>
      <li>入金済売上: <strong>${summary.paidCount}</strong>件 / ¥${yen.format(summary.confirmedRevenue)}</li>
    </ul>

    <h2 style="font-size:15px;margin:20px 0 8px;">AI/API</h2>
    <ul>
      <li>AI要確認リード: <strong>${summary.aiIssueLeads.length}</strong>件</li>
      <li>24時間以内のAPIエラー/再試行: <strong>${summary.apiIssues24h.length}</strong>件</li>
      <li>当月トークン: <strong>${yen.format(summary.monthlyTokens)}</strong></li>
      <li>当月API費用推定: <strong>${esc(costText)}</strong></li>
      ${summary.eventsError ? `<li>AI通信ログDB: <strong>${esc(summary.eventsError)}</strong></li>` : ''}
    </ul>

    ${summary.aiIssueLeads.length ? `<h2 style="font-size:15px;margin:20px 0 8px;">AI要確認リード</h2>
    <table style="border-collapse:collapse;width:100%;font-size:13px;"><thead><tr><th align="left">案件</th><th align="left">状態</th><th align="left">エラー</th></tr></thead><tbody>${issueRows}</tbody></table>` : ''}

    ${summary.apiIssues24h.length ? `<h2 style="font-size:15px;margin:20px 0 8px;">APIエラー/再試行</h2>
    <table style="border-collapse:collapse;width:100%;font-size:13px;"><thead><tr><th align="left">Provider</th><th align="left">状態</th><th align="left">種別</th><th align="left">内容</th></tr></thead><tbody>${apiRows}</tbody></table>` : ''}

    <p style="margin-top:24px;">
      <a href="${SITE_URL}/admin/reports" style="display:inline-block;background:#1F3A93;color:#fff;text-decoration:none;padding:10px 16px;border-radius:7px;">今日の対応を開く</a>
    </p>
  </div>`

  return { subject: title, text, html }
}

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return new Response('Unauthorized', { status: 401 })
  }
  if (!resend) {
    return json({ error: 'RESEND_API_KEY not configured' }, 500)
  }
  if (!MAIL_TO) {
    return json({ error: 'ADMIN_ALERT_EMAIL / CONTACT_TO / GMAIL_USER is not configured' }, 500)
  }

  try {
    const { leads, events, eventsError, tasks } = await loadData()
    const summary = buildSummary(leads, events, eventsError, tasks)
    const email = buildEmail(summary)
    const result = await resend.emails.send({
      from: MAIL_FROM,
      to: MAIL_TO,
      subject: email.subject,
      text: email.text,
      html: email.html,
    })
    await logEmailEvent('success')
    return json({
      ok: true,
      to: MAIL_TO,
      result,
      summary: {
        ...summary,
        aiIssueLeads: summary.aiIssueLeads.length,
        apiIssues24h: summary.apiIssues24h.length,
        todayActions: summary.todayActions.length,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logEmailEvent('error', message)
    return json({ error: message }, 500)
  }
}

export const POST: APIRoute = (ctx) => GET(ctx)
