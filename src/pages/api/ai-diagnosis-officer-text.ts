import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { verifyAiDiagnosisReviewToken } from '../../lib/ai-diagnosis-review'
import { getRuntimeEnv, isRuntimeDev } from '../../lib/runtime-env'
import {
  estimateTextCost,
  normalizeChatUsage,
  safeSessionId,
  safeTicketNumber,
} from '../../lib/ai-diagnosis-officer-usage'

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_TEXT_MODEL = 'gpt-4o-mini'
const SUPABASE_URL = getRuntimeEnv('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = getRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

type TextMessage = {
  role: 'user' | 'assistant'
  content: string
}

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function isFeatureEnabled() {
  return isRuntimeDev() || getRuntimeEnv('AI_DIAGNOSIS_OFFICER_ENABLED') === 'true'
}

function clampText(value: unknown, max = 1600) {
  const text = String(value || '').trim()
  return text.length > max ? text.slice(0, max) : text
}

function sanitizeMessages(value: unknown): TextMessage[] {
  if (!Array.isArray(value)) return []
  return value
    .map((message) => ({
      role: message?.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: clampText(message?.content, 1800),
    }))
    .filter((message) => message.content)
    .slice(-12)
}

async function loadReviewContext(ticketNumber: string, token: string) {
  if (!ticketNumber || !verifyAiDiagnosisReviewToken(ticketNumber, token)) {
    throw new Error('AI診断官βレビューURLの確認に失敗しました。')
  }
  if (!supabase) throw new Error('レビュー申請の確認に必要な設定が未完了です。')

  const { data, error } = await supabase
    .from('spot_ticket_orders')
    .select('ticket_number, status, company_name, person_name, email, redeem_company_name, redeem_person_name, redeem_email, redeem_service_type, request_detail, preferred_schedule, redeem_notes')
    .eq('ticket_number', ticketNumber)
    .maybeSingle()

  if (error || !data) throw new Error('チケット番号に紐づくレビュー申請が見つかりません。')
  if (data.redeem_service_type !== 'review' || data.status !== 'redeemed') {
    throw new Error('AI診断官βレビューとして受付済みのチケットではありません。')
  }

  return [
    `チケット番号: ${data.ticket_number}`,
    `会社・団体名: ${data.redeem_company_name || data.company_name || '未入力'}`,
    `担当者: ${data.redeem_person_name || data.person_name || '未入力'}`,
    `メール: ${data.redeem_email || data.email || '未入力'}`,
    data.request_detail ? `申請内容:\n${data.request_detail}` : '',
    data.preferred_schedule ? `希望日程・条件:\n${data.preferred_schedule}` : '',
    data.redeem_notes ? `補足:\n${data.redeem_notes}` : '',
  ].filter(Boolean).join('\n')
}

function buildSystemPrompt(contextText: string, summaryRequested: boolean) {
  return [
    'あなたは合同会社Optiensの「AI診断官」です。日本語で、落ち着いた業務ヒアリングを行います。',
    '汎用AIへの自由相談ではなく、AI活用診断の次工程へ渡すための情報収集と構造化が目的です。',
    '一度に質問するのは1つだけにしてください。顧客が答えた内容を短く要約してから次の質問へ進んでください。',
    '正式な見積、契約条件、法務・税務・医療判断は確定しないでください。',
    '機密情報、個人情報、APIキー、顧客名簿の詳細を入力しないよう、必要に応じて注意してください。',
    '声の種類や音色の切り替えはこのテキストモードでは扱わないでください。',
    contextText ? `事前申請情報:\n${contextText}` : 'これは公開デモまたは詳細版の補足ヒアリングです。個社名などの機密情報は求めすぎないでください。',
    summaryRequested
      ? '今回は診断メモ生成です。形式は「1. 業務概要 / 2. AI化候補 / 3. AI化しない方がよい範囲 / 4. 制約条件・確認不足 / 5. 次アクション」。未確認は未確認と明記してください。'
      : '今回はヒアリングです。十分な情報がない場合は、業種、困っている業務、頻度、例外処理、利用中ツール、人が判断すべき範囲の順で確認してください。',
  ].join('\n')
}

async function logSession(input: {
  sessionId: string
  mode: string
  ticketNumber: string
  model: string
  usage: ReturnType<typeof normalizeChatUsage>
  cost: ReturnType<typeof estimateTextCost>
}) {
  if (!supabase) return
  const now = new Date().toISOString()
  const { data: existing } = await supabase
    .from('ai_diagnosis_officer_sessions')
    .select('*')
    .eq('session_id', input.sessionId)
    .maybeSingle()

  const payload = {
    session_id: input.sessionId,
    mode: input.mode,
    ticket_number: input.ticketNumber || null,
    model: input.model,
    status: 'active',
    started_at: existing?.started_at || now,
    ended_at: now,
    response_count: Number(existing?.response_count || 0) + 1,
    input_tokens: Number(existing?.input_tokens || 0) + input.usage.input_tokens,
    output_tokens: Number(existing?.output_tokens || 0) + input.usage.output_tokens,
    total_tokens: Number(existing?.total_tokens || 0) + input.usage.total_tokens,
    text_input_tokens: Number(existing?.text_input_tokens || 0) + input.usage.text_input_tokens,
    text_output_tokens: Number(existing?.text_output_tokens || 0) + input.usage.text_output_tokens,
    audio_input_tokens: Number(existing?.audio_input_tokens || 0),
    audio_output_tokens: Number(existing?.audio_output_tokens || 0),
    cached_input_tokens: Number(existing?.cached_input_tokens || 0),
    cached_text_input_tokens: Number(existing?.cached_text_input_tokens || 0),
    cached_audio_input_tokens: Number(existing?.cached_audio_input_tokens || 0),
    estimated_cost_usd: Number(existing?.estimated_cost_usd || 0) + input.cost.estimated_cost_usd,
    estimated_cost_jpy: input.cost.estimated_cost_jpy === null
      ? existing?.estimated_cost_jpy ?? null
      : Number(existing?.estimated_cost_jpy || 0) + input.cost.estimated_cost_jpy,
    updated_at: now,
    metadata: {
      ...(existing?.metadata || {}),
      text_mode: true,
    },
  }

  const { error } = existing
    ? await supabase.from('ai_diagnosis_officer_sessions').update(payload).eq('session_id', input.sessionId)
    : await supabase.from('ai_diagnosis_officer_sessions').insert(payload)

  if (error) console.warn('[ai-diagnosis-officer-text] session log skipped:', error.message)
}

export const POST: APIRoute = async ({ request }) => {
  if (!isFeatureEnabled()) {
    return json({ error: 'AI診断官β版は現在有効化されていません。' }, 503)
  }
  const apiKey = getRuntimeEnv('OPENAI_API_KEY')
  if (!apiKey) return json({ error: 'OpenAI API キーが設定されていません。' }, 503)

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return json({ error: '入力形式が正しくありません。' }, 400)

  const mode = (body as any).mode === 'review' ? 'review' : 'demo'
  const ticketNumber = safeTicketNumber((body as any).ticket_number)
  const token = String((body as any).token || '').trim()
  const sessionId = safeSessionId((body as any).session_id)
  const messages = sanitizeMessages((body as any).messages)
  const summaryRequested = Boolean((body as any).summary)

  if (!sessionId) return json({ error: 'セッションIDが正しくありません。' }, 400)
  if (messages.length === 0 && !summaryRequested) {
    messages.push({ role: 'user', content: 'AI診断官として最初の質問を始めてください。' })
  }

  let contextText = ''
  try {
    contextText = mode === 'review' ? await loadReviewContext(ticketNumber, token) : ''
  } catch (error: any) {
    return json({ error: error?.message || 'レビュー情報の確認に失敗しました。' }, 403)
  }

  const model = String(getRuntimeEnv('AI_DIAGNOSIS_OFFICER_TEXT_MODEL') || DEFAULT_TEXT_MODEL)
  const startedAt = Date.now()
  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: buildSystemPrompt(contextText, summaryRequested) },
        ...messages,
      ],
    }),
  })

  const payload = await response.json().catch(() => null)
  const usage = normalizeChatUsage(payload?.usage)
  const cost = estimateTextCost(usage, model)
  const reply = String(payload?.choices?.[0]?.message?.content || '').trim()

  if (supabase) {
    await logSession({ sessionId, mode, ticketNumber, model, usage, cost })
    const { error } = await supabase.from('ai_api_events').insert({
      workflow: 'ai_diagnosis_officer',
      provider: 'openai',
      model,
      operation: summaryRequested ? 'text.summary' : 'text.chat',
      status: response.ok ? 'success' : 'error',
      http_status: response.status,
      latency_ms: Date.now() - startedAt,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      total_tokens: usage.total_tokens,
      lead_id: ticketNumber || null,
      error_type: response.ok ? null : payload?.error?.type || 'openai_error',
      error_message: response.ok ? null : String(payload?.error?.message || 'OpenAI text response failed').slice(0, 700),
      metadata: {
        session_id: sessionId,
        mode,
        summary_requested: summaryRequested,
        estimated_cost_usd: cost.estimated_cost_usd,
        estimated_cost_jpy: cost.estimated_cost_jpy,
      },
    })
    if (error) console.warn('[ai-diagnosis-officer-text] ai_api_events log skipped:', error.message)
  }

  if (!response.ok || !reply) {
    return json({ error: payload?.error?.message || 'テキスト応答を生成できませんでした。' }, response.ok ? 502 : response.status)
  }

  return json({ ok: true, reply, usage, cost })
}
