import type { APIRoute } from 'astro'

const ANTHROPIC_API_KEY = import.meta.env.ANTHROPIC_API_KEY
const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const MAX_INPUT_CHARS = 4000

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_PER_HOUR = 10
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

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

interface RoutingResult {
  category: string
  priority: 'high' | 'medium' | 'low'
  priority_reason: string
  assignee: string
  response_template: string
  mock?: boolean
}

function buildMockResult(text: string): RoutingResult {
  let category = 'その他'
  let priority: RoutingResult['priority'] = 'medium'
  let assignee = '営業担当'
  let priority_reason = '一般的な問い合わせとして扱います'

  if (/(料金|見積|価格|金額|費用)/.test(text)) {
    category = '見積・料金'
    assignee = '営業担当'
  }
  if (/(導入|相談|検討|資料)/.test(text)) {
    category = '導入相談'
    assignee = '営業担当'
  }
  if (/(障害|エラー|動かない|ログイン|不具合|止まった|落ちた)/.test(text)) {
    category = '技術サポート'
    priority = 'high'
    priority_reason = '稼働中システムの不具合が想定されるため'
    assignee = 'サポート担当'
  }
  if (/(請求|支払|入金|振込)/.test(text)) {
    category = '請求・経理'
    assignee = '経理担当'
  }
  if (/(契約|解約|更新)/.test(text)) {
    category = '契約・取引'
    assignee = '営業担当'
  }
  if (/(緊急|至急|今すぐ|本日中)/.test(text)) {
    priority = 'high'
    priority_reason = '緊急性の表現が含まれているため'
  }

  return {
    category,
    priority,
    priority_reason,
    assignee,
    response_template: `お問い合わせありがとうございます。\n${assignee}よりご連絡差し上げます。\n2営業日以内のご対応を予定しております。`,
    mock: true,
  }
}

const SYSTEM_PROMPT = `あなたは中小企業の問い合わせ振り分けAIです。受信した問い合わせ文を読み、以下の4観点で構造化してください。

1. 業種カテゴリ: 「見積・料金」「導入相談」「技術サポート」「請求・経理」「契約・取引」「採用」「クレーム」「その他」のいずれか
2. 優先度: high / medium / low
   - high: 稼働障害・緊急表現・大口顧客の不満
   - medium: 通常の問い合わせ
   - low: 一般的な質問・資料請求等
3. 推奨対応者: 「営業担当」「サポート担当」「経理担当」「人事担当」「経営者」のいずれか
4. 推奨応答テンプレート: 一次回答用の短い文面（3〜5行）

必ず以下のJSON形式のみで返答してください。マークダウンコードブロックや前置き説明は不要です。

{
  "category": "（業種カテゴリ）",
  "priority": "high" | "medium" | "low",
  "priority_reason": "（その優先度と判断した根拠を1〜2行で）",
  "assignee": "（推奨対応者）",
  "response_template": "（一次回答テンプレート、改行は\\nで）"
}`

async function callAnthropic(text: string): Promise<RoutingResult> {
  if (!ANTHROPIC_API_KEY) {
    return buildMockResult(text)
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `以下の問い合わせを振り分けてください。\n\n---\n${text}\n---` }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[inquiry-routing] Anthropic API error:', res.status, errBody)
    throw new Error(`AI APIエラー (${res.status})`)
  }

  const data = await res.json()
  const content = data?.content?.[0]?.text || ''

  let jsonStr = content.trim()
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim()
  const firstBrace = jsonStr.indexOf('{')
  const lastBrace = jsonStr.lastIndexOf('}')
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1)
  }

  let parsed: any
  try {
    parsed = JSON.parse(jsonStr)
  } catch (e) {
    console.error('[inquiry-routing] JSON parse error:', e, 'raw:', content)
    throw new Error('AI応答の解析に失敗しました')
  }

  return {
    category: typeof parsed.category === 'string' ? parsed.category : 'その他',
    priority: ['high', 'medium', 'low'].includes(parsed.priority) ? parsed.priority : 'medium',
    priority_reason: typeof parsed.priority_reason === 'string' ? parsed.priority_reason : '',
    assignee: typeof parsed.assignee === 'string' ? parsed.assignee : '営業担当',
    response_template: typeof parsed.response_template === 'string' ? parsed.response_template : '',
  }
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
    const rl = checkRateLimit(ip)
    if (!rl.ok) {
      return json({ error: '一定時間内のご利用回数上限に達しました。しばらく時間をおいてからお試しください。' }, 429)
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body.text !== 'string') {
      return json({ error: 'リクエスト形式が正しくありません。' }, 400)
    }

    let text = body.text.replace(/\r\n/g, '\n').trim()
    if (text.length === 0) {
      return json({ error: '本文が空です。' }, 400)
    }

    let truncated = false
    if (text.length > MAX_INPUT_CHARS) {
      text = text.slice(0, MAX_INPUT_CHARS)
      truncated = true
    }

    const result = await callAnthropic(text)
    return json({ ...result, truncated, remaining: rl.remaining })
  } catch (e: any) {
    console.error('[inquiry-routing] error:', e)
    return json({ error: e?.message || '予期しないエラーが発生しました。' }, 500)
  }
}
