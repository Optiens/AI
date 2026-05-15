import type { APIRoute } from 'astro'
import { supabase } from '../../lib/supabase'
import { verifyTurnstile } from '../../lib/turnstile'

const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY
// gpt-4o は Vision 対応・日本語精度の高いコスパ良モデル
// （gpt-4o-mini より約 16x 高いが、フォーム自動入力の精度向上による
//  ユーザー体験改善を優先。1 リクエスト約 ¥1〜3 の見込み）
const OPENAI_MODEL = 'gpt-4o'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_CONTEXT_WINDOW_TOKENS = Number(import.meta.env.OPENAI_CONTEXT_WINDOW_TOKENS || '0') || null

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_PER_HOUR = 10
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_ERROR_MESSAGE = '時間内の利用制限に達しました。少し時間をおいてから再度お試しください。'
const TURNSTILE_ERROR_MESSAGE = 'スパム対策の確認に失敗しました。チェックを完了してから再度お試しください。'

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

interface FileInput {
  fileBase64: string
  mediaType: string
  fileName?: string
}

interface UrlInput {
  url: string
}

// 自動入力する free-diagnosis フォームのフィールド
interface DiagnosisFields {
  // 必須・基本
  company_name?: string
  person_name?: string
  email?: string
  industry?: string
  employee_count?: string
  // 業務の詳細（任意）
  business_description?: string
  daily_tasks?: string
  current_tools?: string
  // 詳細レポート向け追加項目
  business_age?: string
  service_area?: string
  target_customer?: string
  annual_revenue_range?: string
  decision_timeline?: string
  past_it_experience?: string
}

interface FactCheckNote {
  field?: string // 該当フィールドID（指定なければ全体への注記）
  level: 'info' | 'warn'
  message: string
}

interface ExtractResult {
  fields: DiagnosisFields
  // AIが抽出したが、フォーム欄には反映していない補助情報
  extracted_extras?: {
    representative_name?: string
    phone?: string
    address?: string
    fax?: string
    website?: string
  }
  notes?: FactCheckNote[]
  source_type?: 'file' | 'url'
  mock?: boolean
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const MAX_URL_BYTES = 1 * 1024 * 1024 // 1MB
const URL_FETCH_TIMEOUT_MS = 10_000

function truncateText(value: unknown, max = 1000) {
  if (value === null || value === undefined) return null
  const text = typeof value === 'string' ? value : String(value)
  return text.length > max ? `${text.slice(0, max)}...` : text
}

function classifyOpenAIError(status?: number | null, body = '') {
  const text = body.toLowerCase()
  if (status === 401 || status === 403 || /api key|auth|permission/.test(text)) return 'auth'
  if (status === 429 || /quota|insufficient_quota/.test(text)) return 'quota'
  if (/rate[\s_-]?limit|too many requests/.test(text)) return 'rate_limit'
  if (/timeout|network|fetch failed/.test(text)) return 'network'
  if (/json|parse|schema/.test(text)) return 'response_format'
  return 'exception'
}

async function logAiApiEvent(event: {
  provider: string
  model?: string | null
  operation: string
  status: 'success' | 'error' | 'retry' | 'skipped'
  http_status?: number | null
  latency_ms?: number | null
  input_tokens?: number | null
  output_tokens?: number | null
  total_tokens?: number | null
  context_window_tokens?: number | null
  context_remaining_tokens?: number | null
  request_id?: string | null
  error_type?: string | null
  error_message?: string | null
  metadata?: Record<string, unknown>
}) {
  if (!supabase) return
  const { error } = await supabase.from('ai_api_events').insert({
    workflow: 'file_extract',
    provider: event.provider,
    model: event.model || null,
    operation: event.operation,
    status: event.status,
    http_status: event.http_status ?? null,
    latency_ms: event.latency_ms ?? null,
    input_tokens: event.input_tokens ?? null,
    output_tokens: event.output_tokens ?? null,
    total_tokens: event.total_tokens ?? null,
    context_window_tokens: event.context_window_tokens ?? null,
    context_remaining_tokens: event.context_remaining_tokens ?? null,
    request_id: truncateText(event.request_id, 200),
    error_type: truncateText(event.error_type, 120),
    error_message: truncateText(event.error_message, 1000),
    metadata: event.metadata || {},
  })
  if (error) console.warn('[file-extract][ai_api_events] log skipped:', error.message)
}

function buildMockResult(sourceType: 'file' | 'url'): ExtractResult {
  return {
    fields: {
      company_name: '株式会社サンプル商事',
      person_name: '',
      email: '',
      industry: 'service',
      employee_count: '6-20',
      business_description: '法人向けITサポート・社内システム開発を行うサービス事業者（モック応答）',
      daily_tasks: '',
      current_tools: '',
      business_age: '',
      service_area: '',
      target_customer: '',
      annual_revenue_range: '',
      decision_timeline: '',
      past_it_experience: '',
    },
    extracted_extras: {
      representative_name: '山田 太郎',
    },
    notes: [
      { level: 'info', message: 'モック応答（API未設定時）です。本番環境では実データから抽出されます。' },
      { level: 'warn', field: 'person_name', message: '代表者名（山田 太郎）が見つかりましたが、ご担当者欄には反映していません。実際のご担当者名をご記入ください。' },
    ],
    source_type: sourceType,
    mock: true,
  }
}

const SYSTEM_PROMPT = `あなたは中小企業向けAI活用診断のフォーム自動入力を支援するAIです。
提供された情報源（書類画像 / 企業ウェブページのテキスト）から情報を読み取り、以下の構造化されたJSON形式で返してください。

# fields（フォームに自動反映される項目）

- company_name: 企業・団体名（例: 株式会社○○）
- person_name: **ご担当者の氏名のみ**。書類に「お問い合わせ窓口」「担当者」「ご担当」と明記されている場合のみ抽出する。代表者・社長・経営陣の名前はここには入れず、空文字にする。書類が会社案内・コーポレートページ等で担当者の特定がつかない場合は **空文字** を返す
- email: 担当者・お問い合わせ窓口のメールアドレス。代表メール（info@等）でも可
- industry: 業種。以下のキーから最も近いものを選ぶ（推定不能なら空文字）
    * accommodation / restaurant / construction / winery / outdoor / bakery / agriculture / retail / service / manufacturing / municipality / other
- employee_count: 従業員数。以下のキーから選ぶ（不明なら空文字）
    * "1" / "2-5" / "6-20" / "21-50" / "51-100" / "101+"
- business_description: 事業内容・主なサービス（情報源から読み取れる範囲で簡潔に。1〜3文）
- daily_tasks: 日常業務で時間がかかっている作業（情報源に記述がある場合のみ）
- current_tools: 現在使用中のITツール・ソフトウェア（記述がある場合のみ）
- business_age: 創業年・設立年・事業年数（例: "1666年創業" "設立2010年" "事業歴14年"）
- service_area: 主な営業エリア・拠点所在地（例: "東京都中心" "全国対応" "関東エリア"）
- target_customer: 主要顧客層（例: "法人向け" "30〜50代女性" "建設業界"）
- annual_revenue_range: 売上規模感。以下のキーから選ぶ（情報源で明示または推定可能な場合のみ。不明なら空文字）
    * "under-10m" / "10-30m" / "30-50m" / "50-100m" / "100-300m" / "300-1000m" / "over-1000m"
- decision_timeline: AI導入のご検討時期（情報源に記述があれば。なければ空文字）
- past_it_experience: 過去のIT導入経験・課題（記述があれば）

# extracted_extras（フォームには直接反映しない、参考情報として返却）

- representative_name: 代表者・社長・経営者の氏名（書類に記載があれば）
- phone: 電話番号
- address: 住所
- fax: FAX番号
- website: ウェブサイトURL

# notes（ファクトチェック用の注記。配列）

各要素の形式: { "field": "<該当フィールドID or 省略>", "level": "info" | "warn", "message": "<日本語の注記>" }

以下のケースで必ず注記を入れてください：
- 代表者名を見つけたが person_name には反映しなかった場合 → field=person_name, level=warn, 「代表者名（〇〇）が見つかりましたが、ご担当者欄には反映していません。実際のご担当者名をご記入ください」
- industry を選択肢から推定した場合 → field=industry, level=info, 「業種は『〇〇』と記載があり、選択肢から最も近い『〇〇』を選んでいます。事実と異なる場合は修正してください」
- 推定で値を埋めた場合（例: 業種、従業員数の概算） → field=該当, level=info, 推定根拠を簡潔に
- 情報源が JavaScript で描画されているなどで本文が薄い場合 → field 省略, level=warn, 「ページから取得できる情報が限られていました。手動で追記をお願いします」

# 厳守ルール

- 推測で埋めない。情報源に該当情報がない項目は **空文字** にする
- person_name と representative_name を **明確に区別** する
- annual_revenue_range は明確な根拠がある場合のみ。不確実なら空文字
- 個人情報（電話番号、住所、FAX等）は extracted_extras に置く（フォーム反映はしない）

# 返答フォーマット

純粋なJSONオブジェクト1つのみ：
{
  "fields": { ... 上記fields ... },
  "extracted_extras": { ... 上記extras ... },
  "notes": [ ... 上記notes ... ]
}`

function isPrivateOrUnsafeUrl(urlObj: URL): boolean {
  if (!['http:', 'https:'].includes(urlObj.protocol)) return true
  const host = urlObj.hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return true
  const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (ipv4) {
    const a = Number(ipv4[1])
    const b = Number(ipv4[2])
    if (a === 10) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
    if (a === 127) return true
    if (a === 0) return true
  }
  return false
}

async function fetchUrlText(url: string): Promise<string> {
  let urlObj: URL
  try {
    urlObj = new URL(url)
  } catch {
    throw new Error('URLの形式が正しくありません。')
  }
  if (isPrivateOrUnsafeUrl(urlObj)) {
    throw new Error('このURLにはアクセスできません。公開されている http:// または https:// のURLをご指定ください。')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), URL_FETCH_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(urlObj.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'OptiensFileExtract/1.0 (+https://optiens.com)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
      redirect: 'follow',
    })
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('URLの読み込みがタイムアウトしました。別のURLでお試しください。')
    }
    throw new Error('URLにアクセスできませんでした。URLが正しいか、公開ページかをご確認ください。')
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    throw new Error(`URLにアクセスできませんでした（HTTP ${res.status}）。`)
  }

  const contentLength = res.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_URL_BYTES) {
    throw new Error(`ページサイズが大きすぎます（上限 ${Math.round(MAX_URL_BYTES / 1024 / 1024)}MB）。`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('URLの本文を取得できませんでした。')
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue
    total += value.byteLength
    if (total > MAX_URL_BYTES) {
      reader.cancel().catch(() => {})
      break
    }
    chunks.push(value)
  }
  const buf = new Uint8Array(total > MAX_URL_BYTES ? MAX_URL_BYTES : total)
  let offset = 0
  for (const c of chunks) {
    if (offset + c.byteLength > buf.byteLength) {
      buf.set(c.subarray(0, buf.byteLength - offset), offset)
      offset = buf.byteLength
      break
    }
    buf.set(c, offset)
    offset += c.byteLength
  }
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const html = decoder.decode(buf)

  let text = html
  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  text = text.replace(/<!--[\s\S]*?-->/g, ' ')
  text = text.replace(/<[^>]+>/g, ' ')
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  text = text.replace(/\s+/g, ' ').trim()
  const MAX_TEXT_CHARS = 20000
  if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS)
  if (!text) {
    throw new Error('ページから本文テキストを取得できませんでした。サーバー側でJavaScriptで描画されるサイトはご利用いただけません。')
  }
  return text
}

async function callOpenAIWithFile(input: FileInput): Promise<ExtractResult> {
  if (!OPENAI_API_KEY) {
    await logAiApiEvent({
      provider: 'openai',
      model: OPENAI_MODEL,
      operation: 'env.check',
      status: 'skipped',
      error_type: 'env_missing',
      error_message: 'OPENAI_API_KEY is not configured',
      metadata: { source_type: 'file' },
    }).catch(() => {})
    return buildMockResult('file')
  }

  if (!ALLOWED_IMAGE_TYPES.includes(input.mediaType)) {
    throw new Error('対応していないファイル形式です。JPG/PNG/GIF/WebPの画像をご利用ください。')
  }

  const dataUrl = `data:${input.mediaType};base64,${input.fileBase64}`
  const userMessage = [
    { type: 'text', text: '添付の書類からAI活用診断フォームに必要な情報を抽出し、指定のJSON形式で返してください。' },
    { type: 'image_url', image_url: { url: dataUrl } },
  ]
  const result = await callOpenAI(userMessage, 'file')
  result.source_type = 'file'
  return result
}

async function callOpenAIWithUrl(input: UrlInput): Promise<ExtractResult> {
  if (!OPENAI_API_KEY) {
    await logAiApiEvent({
      provider: 'openai',
      model: OPENAI_MODEL,
      operation: 'env.check',
      status: 'skipped',
      error_type: 'env_missing',
      error_message: 'OPENAI_API_KEY is not configured',
      metadata: { source_type: 'url' },
    }).catch(() => {})
    return buildMockResult('url')
  }

  let pageText = ''
  const fetchStartedAt = Date.now()
  try {
    pageText = await fetchUrlText(input.url)
  } catch (err) {
    await logAiApiEvent({
      provider: 'external_url',
      operation: 'fetch_url_text',
      status: 'error',
      latency_ms: Date.now() - fetchStartedAt,
      error_type: 'url_fetch',
      error_message: err instanceof Error ? err.message : String(err),
      metadata: { source_type: 'url' },
    }).catch(() => {})
    throw err
  }
  const userText = `以下は ${input.url} から取得したページ本文です。AI活用診断フォームに必要な情報を抽出し、指定のJSON形式で返してください。

---ページ本文ここから---
${pageText}
---ページ本文ここまで---`
  const userMessage = [{ type: 'text', text: userText }]
  const result = await callOpenAI(userMessage, 'url')
  result.source_type = 'url'
  return result
}

async function callOpenAI(userContent: any[], sourceType: 'file' | 'url'): Promise<ExtractResult> {
  const startedAt = Date.now()
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
      max_tokens: 1500,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[file-extract] OpenAI API error:', res.status, errBody)
    const errorType = classifyOpenAIError(res.status, errBody)
    await logAiApiEvent({
      provider: 'openai',
      model: OPENAI_MODEL,
      operation: 'chat.completions.create',
      status: errorType === 'quota' || errorType === 'rate_limit' ? 'retry' : 'error',
      http_status: res.status,
      latency_ms: Date.now() - startedAt,
      error_type: errorType,
      error_message: errBody || `HTTP ${res.status}`,
      metadata: { source_type: sourceType },
    }).catch(() => {})
    if (errBody && /insufficient_quota|exceeded your current quota/i.test(errBody)) {
      throw new Error('AIサービスの利用残高が不足しています。サイト管理者にお問い合わせください。')
    }
    if (res.status === 429) {
      throw new Error('AIサービスのレート制限に達しました。少し時間をおいてから再度お試しください。')
    }
    if (res.status === 401) {
      throw new Error('AIサービスの認証に失敗しました。サイト管理者にお問い合わせください。')
    }
    throw new Error(`AIサービスでエラーが発生しました（${res.status}）。時間をおいて再度お試しください。`)
  }

  const data = await res.json()
  const usage = data?.usage || {}
  const totalTokens = typeof usage.total_tokens === 'number' ? usage.total_tokens : null
  await logAiApiEvent({
    provider: 'openai',
    model: OPENAI_MODEL,
    operation: 'chat.completions.create',
    status: 'success',
    http_status: res.status,
    latency_ms: Date.now() - startedAt,
    input_tokens: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : null,
    output_tokens: typeof usage.completion_tokens === 'number' ? usage.completion_tokens : null,
    total_tokens: totalTokens,
    context_window_tokens: OPENAI_CONTEXT_WINDOW_TOKENS,
    context_remaining_tokens: OPENAI_CONTEXT_WINDOW_TOKENS && totalTokens
      ? Math.max(0, OPENAI_CONTEXT_WINDOW_TOKENS - totalTokens)
      : null,
    request_id: data?.id || null,
    metadata: {
      source_type: sourceType,
      finish_reason: data?.choices?.[0]?.finish_reason || null,
    },
  }).catch(() => {})

  const content = data?.choices?.[0]?.message?.content || ''

  let jsonText = String(content).trim()
  const codeBlockMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch?.[1]) jsonText = codeBlockMatch[1].trim()

  const jsonStart = jsonText.indexOf('{')
  const jsonEnd = jsonText.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    await logAiApiEvent({
      provider: 'internal',
      model: OPENAI_MODEL,
      operation: 'file_extract.parse',
      status: 'error',
      latency_ms: Date.now() - startedAt,
      request_id: data?.id || null,
      error_type: 'response_format',
      error_message: 'No JSON object found in OpenAI response',
      metadata: { source_type: sourceType },
    }).catch(() => {})
    throw new Error('AIの応答形式が想定外でした。情報源を変更して再度お試しください。')
  }
  const cleanJson = jsonText.substring(jsonStart, jsonEnd + 1)

  let parsed: any
  try {
    parsed = JSON.parse(cleanJson)
  } catch (err) {
    console.error('[file-extract] JSON parse error:', err, cleanJson)
    await logAiApiEvent({
      provider: 'internal',
      model: OPENAI_MODEL,
      operation: 'file_extract.parse',
      status: 'error',
      latency_ms: Date.now() - startedAt,
      request_id: data?.id || null,
      error_type: 'response_format',
      error_message: err instanceof Error ? err.message : String(err),
      metadata: { source_type: sourceType },
    }).catch(() => {})
    throw new Error('AIの応答をJSONに変換できませんでした。')
  }

  // フィールドの正規化
  const fields: DiagnosisFields = parsed.fields || {}
  const extras = parsed.extracted_extras || {}
  const notes: FactCheckNote[] = Array.isArray(parsed.notes) ? parsed.notes : []

  const validIndustries = [
    'accommodation', 'restaurant', 'construction', 'winery', 'outdoor',
    'bakery', 'agriculture', 'retail', 'service', 'manufacturing',
    'municipality', 'other',
  ]
  const validEmployeeCounts = ['1', '2-5', '6-20', '21-50', '51-100', '101+']
  const validRevenueRanges = ['under-10m', '10-30m', '30-50m', '50-100m', '100-300m', '300-1000m', 'over-1000m']

  if (fields.industry && !validIndustries.includes(fields.industry)) fields.industry = ''
  if (fields.employee_count && !validEmployeeCounts.includes(fields.employee_count)) fields.employee_count = ''
  if (fields.annual_revenue_range && !validRevenueRanges.includes(fields.annual_revenue_range)) fields.annual_revenue_range = ''

  return { fields, extracted_extras: extras, notes }
}

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ip = clientAddress || 'unknown'
    const body = await request.json().catch(() => null)
    if (!body) return json({ error: 'リクエスト形式が正しくありません。' }, 400)

    const turnstileToken = String(body.turnstileToken || body['cf-turnstile-response'] || '').trim()
    const tsResult = await verifyTurnstile(turnstileToken, ip)
    if (!tsResult.success) {
      await logAiApiEvent({
        provider: 'cloudflare',
        operation: 'turnstile.siteverify',
        status: 'error',
        error_type: 'turnstile',
        error_message: tsResult.errorCodes?.join(',') || 'verification-failed',
        metadata: { error_codes: tsResult.errorCodes || [] },
      }).catch(() => {})
      return json({ error: TURNSTILE_ERROR_MESSAGE }, 400)
    }

    const rl = checkRateLimit(ip)
    if (!rl.ok) {
      return json({ error: RATE_LIMIT_ERROR_MESSAGE }, 429)
    }

    const url = String(body.url || '').trim()
    const fileBase64 = String(body.fileBase64 || '').trim()
    const mediaType = String(body.mediaType || '').trim()
    const fileName = String(body.fileName || '').trim()

    let result: ExtractResult
    if (url) {
      result = await callOpenAIWithUrl({ url })
    } else if (fileBase64) {
      const approxBytes = Math.ceil((fileBase64.length * 3) / 4)
      if (approxBytes > MAX_FILE_SIZE_BYTES) {
        return json({ error: `ファイルサイズが上限（${Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024)}MB）を超えています。` }, 413)
      }
      if (!ALLOWED_IMAGE_TYPES.includes(mediaType)) {
        return json({ error: '対応していないファイル形式です。JPG/PNG/GIF/WebPの画像をご利用ください（PDFは現在非対応）。' }, 400)
      }
      result = await callOpenAIWithFile({ fileBase64, mediaType, fileName })
    } else {
      return json({ error: 'ファイルまたはURLを指定してください。' }, 400)
    }

    return json({ ...result, remaining: rl.remaining })
  } catch (e: any) {
    console.error('[file-extract] error:', e)
    return json({ error: e?.message || '予期しないエラーが発生しました。' }, 500)
  }
}
