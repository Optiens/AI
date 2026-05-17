import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { getRuntimeEnv } from '../../lib/runtime-env'
import {
  estimateRealtimeCost,
  normalizeRealtimeUsage,
  safeSessionId,
  safeTicketNumber,
} from '../../lib/ai-diagnosis-officer-usage'

const SUPABASE_URL = getRuntimeEnv('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = getRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_PER_HOUR = 180

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function checkRateLimit(ip: string) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_PER_HOUR) return false
  entry.count += 1
  return true
}

function truncate(value: unknown, max = 200) {
  const text = String(value || '')
  return text.length > max ? text.slice(0, max) : text
}

async function upsertSession(input: {
  sessionId: string
  mode: string
  ticketNumber: string
  model: string
  responseId: string
  usage: ReturnType<typeof normalizeRealtimeUsage>
  cost: ReturnType<typeof estimateRealtimeCost>
  startedAt?: string | null
}) {
  if (!supabase) return { ok: false, error: 'Supabase is not configured' }

  const now = new Date().toISOString()
  const { data: existing, error: selectError } = await supabase
    .from('ai_diagnosis_officer_sessions')
    .select('*')
    .eq('session_id', input.sessionId)
    .maybeSingle()

  if (selectError) return { ok: false, error: selectError.message }

  const responseCount = Number(existing?.response_count || 0) + 1
  const payload = {
    session_id: input.sessionId,
    mode: input.mode,
    ticket_number: input.ticketNumber || null,
    model: input.model || null,
    status: 'active',
    started_at: existing?.started_at || input.startedAt || now,
    ended_at: now,
    response_count: responseCount,
    input_tokens: Number(existing?.input_tokens || 0) + input.usage.input_tokens,
    output_tokens: Number(existing?.output_tokens || 0) + input.usage.output_tokens,
    total_tokens: Number(existing?.total_tokens || 0) + input.usage.total_tokens,
    text_input_tokens: Number(existing?.text_input_tokens || 0) + input.usage.text_input_tokens,
    text_output_tokens: Number(existing?.text_output_tokens || 0) + input.usage.text_output_tokens,
    audio_input_tokens: Number(existing?.audio_input_tokens || 0) + input.usage.audio_input_tokens,
    audio_output_tokens: Number(existing?.audio_output_tokens || 0) + input.usage.audio_output_tokens,
    cached_input_tokens: Number(existing?.cached_input_tokens || 0) + input.usage.cached_input_tokens,
    cached_text_input_tokens: Number(existing?.cached_text_input_tokens || 0) + input.usage.cached_text_input_tokens,
    cached_audio_input_tokens: Number(existing?.cached_audio_input_tokens || 0) + input.usage.cached_audio_input_tokens,
    estimated_cost_usd: Number(existing?.estimated_cost_usd || 0) + input.cost.estimated_cost_usd,
    estimated_cost_jpy: input.cost.estimated_cost_jpy === null
      ? existing?.estimated_cost_jpy ?? null
      : Number(existing?.estimated_cost_jpy || 0) + input.cost.estimated_cost_jpy,
    updated_at: now,
    metadata: {
      ...(existing?.metadata || {}),
      last_response_id: input.responseId || null,
    },
  }

  const { error } = existing
    ? await supabase.from('ai_diagnosis_officer_sessions').update(payload).eq('session_id', input.sessionId)
    : await supabase.from('ai_diagnosis_officer_sessions').insert(payload)

  return { ok: !error, error: error?.message || null }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return json({ error: 'usage log rate limit exceeded' }, 429)
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return json({ error: 'invalid payload' }, 400)
  }

  const sessionId = safeSessionId((body as any).session_id)
  if (!sessionId) return json({ error: 'invalid session_id' }, 400)

  const mode = (body as any).mode === 'review' ? 'review' : 'demo'
  const ticketNumber = safeTicketNumber((body as any).ticket_number)
  const model = truncate((body as any).model || getRuntimeEnv('OPENAI_REALTIME_MODEL') || 'gpt-realtime', 80)
  const responseId = truncate((body as any).response_id, 160)
  const usage = normalizeRealtimeUsage((body as any).usage)
  const cost = estimateRealtimeCost(usage, model)

  const sessionResult = await upsertSession({
    sessionId,
    mode,
    ticketNumber,
    model,
    responseId,
    usage,
    cost,
    startedAt: typeof (body as any).started_at === 'string' ? (body as any).started_at : null,
  })

  if (supabase) {
    const { error } = await supabase.from('ai_api_events').insert({
      workflow: 'ai_diagnosis_officer',
      provider: 'openai',
      model,
      operation: 'realtime.response.done',
      status: 'success',
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      total_tokens: usage.total_tokens,
      request_id: responseId || null,
      lead_id: ticketNumber || null,
      metadata: {
        session_id: sessionId,
        mode,
        ticket_number: ticketNumber || null,
        text_input_tokens: usage.text_input_tokens,
        text_output_tokens: usage.text_output_tokens,
        audio_input_tokens: usage.audio_input_tokens,
        audio_output_tokens: usage.audio_output_tokens,
        cached_input_tokens: usage.cached_input_tokens,
        cached_text_input_tokens: usage.cached_text_input_tokens,
        cached_audio_input_tokens: usage.cached_audio_input_tokens,
        estimated_cost_usd: cost.estimated_cost_usd,
        estimated_cost_jpy: cost.estimated_cost_jpy,
        session_log_ok: sessionResult.ok,
        session_log_error: sessionResult.error,
      },
    })
    if (error) console.warn('[ai-diagnosis-officer-usage] ai_api_events log skipped:', error.message)
  }

  return json({ ok: true, usage, cost, session_log_ok: sessionResult.ok })
}
