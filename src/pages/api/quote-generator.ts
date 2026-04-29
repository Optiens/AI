import type { APIRoute } from 'astro'

const ANTHROPIC_API_KEY = import.meta.env.ANTHROPIC_API_KEY
const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

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

interface QuoteInput {
  customer: string
  project: string
  amount: string
  deadline: string
  notes?: string
}

interface QuoteResult {
  quote: string
  mock?: boolean
}

function buildMockResult(input: QuoteInput): QuoteResult {
  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const validUntil = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const validStr = `${validUntil.getFullYear()}年${validUntil.getMonth() + 1}月${validUntil.getDate()}日`

  const quote = `# 御 見 積 書

**宛先**: ${input.customer} 御中
**作成日**: ${dateStr}
**見積番号**: Q-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-001

---

下記の通りお見積もり申し上げます。

## 件名
${input.project}

## 見積金額
**${input.amount}**（税別）

## 納期
${input.deadline}

## 有効期限
${validStr}（作成日より30日間）

## 支払条件
納品後30日以内、銀行振込

## 特記事項
${input.notes || '本見積に含まれない項目（追加要件・大幅な仕様変更等）が発生した場合は、別途協議の上見積を提示いたします。'}

---

合同会社Optiens
〒407-0301 山梨県北杜市高根町清里3545番地2483
Email: info@optiens.com

※本見積はモック応答です（API未設定時）。本番環境では御社情報・案件履歴・過去取引を参照したカスタム見積書を生成します。`

  return { quote, mock: true }
}

const SYSTEM_PROMPT = `あなたは中小企業向けの見積書作成AIです。提供された案件情報をもとに、ビジネス文書として通用する見積書のドラフトをMarkdown形式で生成してください。

要件:
- Markdown見出し（# ## 等）で構造化
- 必須項目: 件名、宛先、作成日、見積番号、見積金額（税別と明記）、納期、有効期限（作成日より30日間）、支払条件、特記事項
- 弊社情報（合同会社Optiens、住所: 山梨県北杜市高根町清里3545番地2483、Email: info@optiens.com）を末尾に記載
- 金額は税別と明示。消費税の表記は別途扱いとする
- 特記事項には「変更時は別途協議」「成果物の知的財産権の帰属」「秘密保持」等、必要に応じて記載
- 煽り語・断定表現は避け、事実ベースで記述
- 修正時の参考になるよう、必要に応じて[要確認]マークを付ける

返答は見積書本文のみ（Markdown形式）。前置き説明は不要。コードブロックで囲まないでください。`

async function callAnthropic(input: QuoteInput): Promise<QuoteResult> {
  if (!ANTHROPIC_API_KEY) {
    return buildMockResult(input)
  }

  const userMessage = `以下の案件情報をもとに、見積書のドラフトを作成してください。

顧客名: ${input.customer}
案件概要: ${input.project}
金額: ${input.amount}
納期: ${input.deadline}
特記事項: ${input.notes || '（特になし）'}`

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[quote-generator] Anthropic API error:', res.status, errBody)
    throw new Error(`AI APIエラー (${res.status})`)
  }

  const data = await res.json()
  const content = data?.content?.[0]?.text || ''

  // コードブロックで囲まれていたら剥がす
  let quote = content.trim()
  const codeBlockMatch = quote.match(/```(?:markdown)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) quote = codeBlockMatch[1].trim()

  return { quote }
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
    if (!body) {
      return json({ error: 'リクエスト形式が正しくありません。' }, 400)
    }

    const input: QuoteInput = {
      customer: String(body.customer || '').trim(),
      project: String(body.project || '').trim(),
      amount: String(body.amount || '').trim(),
      deadline: String(body.deadline || '').trim(),
      notes: String(body.notes || '').trim(),
    }

    if (!input.customer || !input.project || !input.amount || !input.deadline) {
      return json({ error: '顧客名・案件概要・金額・納期は必須です。' }, 400)
    }

    const result = await callAnthropic(input)
    return json({ ...result, remaining: rl.remaining })
  } catch (e: any) {
    console.error('[quote-generator] error:', e)
    return json({ error: e?.message || '予期しないエラーが発生しました。' }, 500)
  }
}
