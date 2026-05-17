import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { verifyAiDiagnosisReviewToken } from '../../lib/ai-diagnosis-review'
import { getRuntimeEnv, isRuntimeDev, isRuntimeProd } from '../../lib/runtime-env'

const OPENAI_REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls'
const DEFAULT_REALTIME_MODEL = 'gpt-realtime'
const DEFAULT_REALTIME_VOICE = 'marin'
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_PER_HOUR = 6
const MAX_SDP_LENGTH = 128_000

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const SUPABASE_URL = getRuntimeEnv('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = getRuntimeEnv('SUPABASE_SERVICE_ROLE_KEY')
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

type ReviewContext = {
  ticketNumber: string
  companyName: string
  personName: string
  email: string
  requestDetail: string
  notes: string
  preferredSchedule: string
  diagnosisContext: string
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

function checkRateLimit(ip: string) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { ok: true, remaining: RATE_LIMIT_PER_HOUR - 1 }
  }
  if (entry.count >= RATE_LIMIT_PER_HOUR) {
    return { ok: false, remaining: 0 }
  }
  entry.count += 1
  return { ok: true, remaining: RATE_LIMIT_PER_HOUR - entry.count }
}

function isFeatureEnabled() {
  return isRuntimeDev() || getRuntimeEnv('AI_DIAGNOSIS_OFFICER_ENABLED') === 'true'
}

function isPublicDemoAllowed() {
  return getRuntimeEnv('AI_DIAGNOSIS_OFFICER_PUBLIC_DEMO') === 'true'
}

function accessCodeIsValid(input: string | null) {
  const expected = String(getRuntimeEnv('AI_DIAGNOSIS_OFFICER_ACCESS_CODE') || '').trim()
  if (!expected) return !isRuntimeProd() || isPublicDemoAllowed()
  return String(input || '').trim() === expected
}

function buildReviewContextInstructions(context: ReviewContext | null) {
  if (!context) {
    return [
      'これは購入前の公開デモです。短時間で体験できるよう、質問は3〜5問に絞ってください。',
      '正式なAI診断官レビューではなく、診断メモもデモ用の簡易版であることを必要に応じて伝えてください。',
      '顧客が本番レビューを希望する場合は、スポット相談チケット購入後にAI診断官レビュー申請フォームへ進む流れを案内してください。',
    ].join('\n')
  }

  return [
    'これはスポット相談チケット利用申請後の本番AI診断官レビューです。',
    '顧客はすでに申請フォームを送信済みです。以下の事前情報を把握した状態で開始し、重複質問を減らしてください。',
    `チケット番号: ${context.ticketNumber}`,
    `会社・団体名: ${context.companyName}`,
    `担当者: ${context.personName}`,
    `メール: ${context.email}`,
    `申請時の依頼内容:\n${context.requestDetail || '未入力'}`,
    context.preferredSchedule ? `希望日程・実施条件:\n${context.preferredSchedule}` : '',
    context.notes ? `補足・注意事項:\n${context.notes}` : '',
    context.diagnosisContext ? `簡易版/詳細版AI活用診断から取得できた入力情報:\n${context.diagnosisContext}` : '',
    '冒頭では、事前申請内容を読んでいることを短く伝え、今回最も確認したい点から聞き始めてください。',
    '会話後の診断メモは、文字起こしではなく、業務課題、AI化候補、AI化しない方がよい領域、制約条件、必要データ、次アクションに整理してください。',
  ].filter(Boolean).join('\n')
}

function buildSessionConfig(reviewContext: ReviewContext | null) {
  const model = String(getRuntimeEnv('OPENAI_REALTIME_MODEL') || DEFAULT_REALTIME_MODEL)
  const voice = String(getRuntimeEnv('OPENAI_REALTIME_VOICE') || DEFAULT_REALTIME_VOICE)

  return {
    type: 'realtime',
    model,
    instructions: [
      'あなたは合同会社Optiensの「AI診断官」です。人間の面談者ではなく、AI音声エージェントであることを冒頭で明示してください。',
      '目的は、顧客の業務内容を聞き取り、AI活用診断や導入支援の判断材料へ構造化することです。正式な見積、契約条件、法務・税務・医療判断は確定しないでください。',
      '会話は日本語で行い、1回に1つだけ質問してください。回答が長い場合は短く要約して確認し、次の質問へ進んでください。',
      '聞き取る順番は、業種・提供サービス、困っている業務、業務量と頻度、例外処理、判断基準、利用中ツール、データの形式、人が最終判断すべき範囲、次に試したいことです。',
      '個人情報、秘密情報、APIキー、パスワード、顧客名簿の詳細などは入力しないよう促してください。',
      '十分に聞き取れたら、AI化候補、AI化しない方がよい業務、制約条件、次アクションを短く整理してください。',
      '売り込み口調ではなく、落ち着いた診断官として話してください。断定しすぎず、必要に応じて追加確認が必要と伝えてください。',
      buildReviewContextInstructions(reviewContext),
    ].join('\n'),
    audio: {
      input: {
        transcription: {
          model: 'gpt-realtime-whisper',
          language: 'ja',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.55,
          prefix_padding_ms: 300,
          silence_duration_ms: 650,
          create_response: true,
          interrupt_response: true,
        },
      },
      output: {
        voice,
      },
    },
  }
}

async function loadDiagnosisContext(email: string, requestDetail: string) {
  if (!supabase || !email) return ''
  const referenceCandidates = [
    ...requestDetail.matchAll(/\b(?:AD|PD|FD|APP|DIAG)-?[A-Z0-9]{4,16}\b/gi),
    ...requestDetail.matchAll(/\b[A-Z0-9]{8}\b/g),
  ].map((match) => match[0].replace(/[^A-Z0-9-]/gi, '').toUpperCase())

  const select = 'application_id, company_name, person_name, email, industry, employee_count, ai_level, business_description, daily_tasks, current_tools, free_text, plan, status, created_at'
  const rows: any[] = []

  if (referenceCandidates.length > 0) {
    const { data, error } = await supabase
      .from('diagnosis_leads')
      .select(select)
      .in('application_id', referenceCandidates)
      .limit(3)
    if (!error && data) rows.push(...data)
  }

  if (rows.length === 0) {
    const { data, error } = await supabase
      .from('diagnosis_leads')
      .select(select)
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(3)
    if (!error && data) rows.push(...data)
  }

  return rows.map((row, index) => [
    `診断${index + 1}: ${row.application_id || 'IDなし'} / ${row.plan || 'plan不明'} / ${row.status || 'status不明'}`,
    `業種: ${row.industry || '未入力'}`,
    `従業員規模: ${row.employee_count || '未入力'}`,
    `AI活用状況: ${row.ai_level || '未入力'}`,
    row.business_description ? `事業概要: ${row.business_description}` : '',
    row.daily_tasks ? `日常業務: ${row.daily_tasks}` : '',
    row.current_tools ? `利用中ツール: ${row.current_tools}` : '',
    row.free_text ? `自由記述: ${row.free_text}` : '',
  ].filter(Boolean).join('\n')).join('\n\n')
}

async function loadReviewContext(request: Request): Promise<ReviewContext | null> {
  const mode = request.headers.get('x-diagnosis-session-mode')
  if (mode !== 'review') return null
  if (!supabase) throw new Error('本番レビューの確認に必要なデータベース設定がありません。')

  const ticketNumber = String(request.headers.get('x-diagnosis-ticket-number') || '').trim().toUpperCase()
  const token = String(request.headers.get('x-diagnosis-review-token') || '').trim()
  if (!ticketNumber || !verifyAiDiagnosisReviewToken(ticketNumber, token)) {
    throw new Error('AI診断官レビューURLの確認に失敗しました。申請受付メールのURLから開き直してください。')
  }

  const { data, error } = await supabase
    .from('spot_ticket_orders')
    .select('ticket_number, status, company_name, person_name, email, redeem_company_name, redeem_person_name, redeem_email, redeem_service_type, request_detail, preferred_schedule, redeem_notes')
    .eq('ticket_number', ticketNumber)
    .maybeSingle()

  if (error || !data) {
    throw new Error('チケット番号に紐づくAI診断官レビュー申請が見つかりません。')
  }
  if (data.redeem_service_type !== 'review' || data.status !== 'redeemed') {
    throw new Error('このURLはAI診断官レビューとして受付済みのチケットでのみ利用できます。')
  }

  const requestDetail = String(data.request_detail || '')
  const email = String(data.redeem_email || data.email || '')
  return {
    ticketNumber,
    companyName: String(data.redeem_company_name || data.company_name || ''),
    personName: String(data.redeem_person_name || data.person_name || ''),
    email,
    requestDetail,
    preferredSchedule: String(data.preferred_schedule || ''),
    notes: String(data.redeem_notes || ''),
    diagnosisContext: await loadDiagnosisContext(email, requestDetail),
  }
}

async function createSafetyIdentifier(ip: string) {
  try {
    const data = new TextEncoder().encode(`optiens-ai-diagnosis-officer:${ip}`)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 64)
  } catch {
    return 'optiens-ai-diagnosis-officer'
  }
}

export const GET: APIRoute = async () => {
  const accessCode = String(getRuntimeEnv('AI_DIAGNOSIS_OFFICER_ACCESS_CODE') || '').trim()
  return json({
    enabled: isFeatureEnabled() && Boolean(getRuntimeEnv('OPENAI_API_KEY')),
    requires_access_code: isRuntimeProd() && Boolean(accessCode) && !isPublicDemoAllowed(),
    public_demo_allowed: isPublicDemoAllowed(),
    model: String(getRuntimeEnv('OPENAI_REALTIME_MODEL') || DEFAULT_REALTIME_MODEL),
  })
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    if (!isFeatureEnabled()) {
      return json({
        error: 'AI診断官レビューの音声デモは現在有効化されていません。',
      }, 503)
    }

    const apiKey = getRuntimeEnv('OPENAI_API_KEY')
    if (!apiKey) {
      return json({
        error: 'OpenAI API キーがサーバーに設定されていません。',
      }, 503)
    }

    let reviewContext: ReviewContext | null = null
    try {
      reviewContext = await loadReviewContext(request)
    } catch (error: any) {
      return json({
        error: error?.message || 'AI診断官レビューURLの確認に失敗しました。',
      }, 403)
    }

    const sessionMode = request.headers.get('x-diagnosis-session-mode') || 'demo'
    const accessCode = request.headers.get('x-diagnosis-access-code')
    const canUsePublicDemo = sessionMode === 'demo' && isPublicDemoAllowed()
    if (!reviewContext && !canUsePublicDemo && !accessCodeIsValid(accessCode)) {
      return json({
        error: 'アクセスコードが必要です。公開デモが無効な場合は、案内されたコードまたは本番レビューURLから開いてください。',
      }, 403)
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('application/sdp')) {
      return json({ error: 'リクエスト形式が正しくありません。' }, 415)
    }

    const offerSdp = await request.text()
    if (!offerSdp || offerSdp.length > MAX_SDP_LENGTH) {
      return json({ error: '音声セッションの開始情報が正しくありません。' }, 400)
    }

    const ip = clientAddress || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = checkRateLimit(ip)
    if (!rl.ok) {
      return json({ error: '時間内の利用制限に達しました。少し時間をおいてから再度お試しください。' }, 429)
    }

    const body = new FormData()
    body.set('sdp', offerSdp)
    body.set('session', JSON.stringify(buildSessionConfig(reviewContext)))

    const response = await fetch(OPENAI_REALTIME_CALLS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'OpenAI-Safety-Identifier': await createSafetyIdentifier(ip),
      },
      body,
    })

    const answerSdp = await response.text()
    if (!response.ok) {
      console.error('[ai-diagnosis-officer-session] OpenAI error:', response.status, answerSdp.slice(0, 1000))
      return json({
        error: '音声セッションを開始できませんでした。時間をおいて再度お試しください。',
      }, response.status >= 400 && response.status < 500 ? 400 : 502)
    }

    return new Response(answerSdp, {
      status: 200,
      headers: {
        'Content-Type': 'application/sdp',
        'Cache-Control': 'no-store',
        'X-RateLimit-Remaining': String(rl.remaining),
      },
    })
  } catch (e: any) {
    console.error('[ai-diagnosis-officer-session] error:', e)
    return json({ error: e?.message || '予期しないエラーが発生しました。' }, 500)
  }
}
