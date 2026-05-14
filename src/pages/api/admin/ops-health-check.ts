import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { makeToken, COOKIE_NAME, getAdminPassword } from '../../../middleware'
import { logAdminAudit } from '../../../lib/admin-ops'

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY
const ANTHROPIC_API_KEY = import.meta.env.ANTHROPIC_API_KEY
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const GOOGLE_SLIDES_TEMPLATE_ID = import.meta.env.GOOGLE_SLIDES_TEMPLATE_ID
const GOOGLE_SERVICE_ACCOUNT_EMAIL = import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = import.meta.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

type HealthStatus = 'ok' | 'warn' | 'error' | 'skipped'

type HealthCheckRow = {
  id: string
  label: string
  provider: string
  status: HealthStatus
  configured: boolean
  latency_ms?: number | null
  http_status?: number | null
  message: string
}

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

function truncateText(value: unknown, max = 700) {
  if (value === null || value === undefined) return null
  const text = typeof value === 'string' ? value : String(value)
  return text.length > max ? `${text.slice(0, max)}...` : text
}

async function logAiApiEvent(row: HealthCheckRow) {
  if (!supabase) return
  const { error } = await supabase.from('ai_api_events').insert({
    workflow: 'ops_health_check',
    provider: row.provider,
    operation: 'health.check',
    status: row.status === 'ok' ? 'success' : row.status === 'warn' ? 'retry' : row.status,
    http_status: row.http_status ?? null,
    latency_ms: row.latency_ms ?? null,
    error_type: row.status === 'ok' ? null : row.status,
    error_message: row.status === 'ok' ? null : truncateText(row.message),
    metadata: {
      configured: row.configured,
      label: row.label,
    },
  })
  if (error) console.warn('[ops-health-check] ai_api_events log skipped:', error.message)
}

async function checkHttp(
  row: Omit<HealthCheckRow, 'status' | 'latency_ms' | 'http_status' | 'message'>,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<HealthCheckRow> {
  if (!row.configured) {
    return { ...row, status: 'skipped', message: '環境変数が未設定です' }
  }

  const startedAt = Date.now()
  try {
    const res = await fetch(input, init)
    const latency = Date.now() - startedAt
    if (res.ok) {
      return {
        ...row,
        status: 'ok',
        latency_ms: latency,
        http_status: res.status,
        message: '接続成功',
      }
    }
    const body = await res.text().catch(() => '')
    return {
      ...row,
      status: res.status === 429 ? 'warn' : 'error',
      latency_ms: latency,
      http_status: res.status,
      message: body ? `HTTP ${res.status}: ${truncateText(body, 180)}` : `HTTP ${res.status}`,
    }
  } catch (error) {
    return {
      ...row,
      status: 'error',
      latency_ms: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

async function checkSupabase(): Promise<HealthCheckRow[]> {
  const rows: HealthCheckRow[] = []
  const configured = Boolean(supabase)
  const base = {
    id: 'supabase',
    label: 'Supabase',
    provider: 'supabase',
    configured,
  }

  if (!configured) {
    return [{ ...base, status: 'skipped', message: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です' }]
  }

  const startedAt = Date.now()
  const { error } = await supabase!
    .from('diagnosis_leads')
    .select('id', { count: 'exact', head: true })

  rows.push({
    ...base,
    status: error ? 'error' : 'ok',
    latency_ms: Date.now() - startedAt,
    message: error ? error.message : 'diagnosis_leads 接続成功',
  })

  const migrationStartedAt = Date.now()
  const { error: migrationError } = await supabase!
    .from('ai_api_events')
    .select('id', { count: 'exact', head: true })

  rows.push({
    id: 'ai_api_events',
    label: 'AI通信ログDB',
    provider: 'supabase',
    configured,
    status: migrationError ? 'error' : 'ok',
    latency_ms: Date.now() - migrationStartedAt,
    message: migrationError ? migrationError.message : 'ai_api_events 適用済み',
  })

  const adminTables = ['admin_audit_logs', 'customers', 'customer_projects', 'admin_alert_rules', 'admin_alert_events', 'knowledge_gaps']
  for (const table of adminTables) {
    const tableStartedAt = Date.now()
    const { error: tableError } = await supabase!
      .from(table)
      .select('*', { count: 'exact', head: true })

    rows.push({
      id: table,
      label: table,
      provider: 'supabase',
      configured,
      status: tableError ? 'error' : 'ok',
      latency_ms: Date.now() - tableStartedAt,
      message: tableError ? tableError.message : `${table} 適用済み`,
    })
  }

  return rows
}

function configOnlyRow(id: string, label: string, provider: string, configured: boolean, message: string): HealthCheckRow {
  return {
    id,
    label,
    provider,
    configured,
    status: configured ? 'ok' : 'skipped',
    message: configured ? message : '環境変数が未設定です',
  }
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const startedAt = Date.now()
  const rows: HealthCheckRow[] = []

  rows.push(...await checkSupabase())

  rows.push(await checkHttp(
    {
      id: 'openai',
      label: 'OpenAI',
      provider: 'openai',
      configured: Boolean(OPENAI_API_KEY),
    },
    'https://api.openai.com/v1/models',
    {
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    },
  ))

  rows.push(await checkHttp(
    {
      id: 'anthropic',
      label: 'Anthropic',
      provider: 'anthropic',
      configured: Boolean(ANTHROPIC_API_KEY),
    },
    'https://api.anthropic.com/v1/models',
    {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
    },
  ))

  rows.push(await checkHttp(
    {
      id: 'resend',
      label: 'Resend',
      provider: 'resend',
      configured: Boolean(RESEND_API_KEY),
    },
    'https://api.resend.com/domains',
    {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    },
  ))

  rows.push(configOnlyRow(
    'google_slides',
    'Google Slides',
    'google',
    Boolean(GOOGLE_SLIDES_TEMPLATE_ID && GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
    '必要なService Account設定があります',
  ))

  await Promise.all(rows.map(logAiApiEvent))

  const errorCount = rows.filter((row) => row.status === 'error').length
  const warnCount = rows.filter((row) => row.status === 'warn').length
  await logAdminAudit({
    action: 'ops_health_check.run',
    target_table: 'ai_api_events',
    summary: `ヘルスチェック実行: error ${errorCount} / warn ${warnCount}`,
    metadata: { elapsed_ms: Date.now() - startedAt, rows },
    request,
  })

  return json({
    ok: errorCount === 0,
    checked_at: new Date().toISOString(),
    elapsed_ms: Date.now() - startedAt,
    error_count: errorCount,
    warn_count: warnCount,
    rows,
  })
}

export const GET: APIRoute = (ctx) => POST(ctx)
