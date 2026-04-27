import type { APIRoute } from 'astro'

const ANTHROPIC_API_KEY = import.meta.env.ANTHROPIC_API_KEY
const ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

// 入力サイズ制限（API コスト抑制）
const MAX_INPUT_CHARS = 8000

// 簡易レート制限（IPベース、メモリ内）
// 本番運用では Supabase 等への移行を推奨
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_PER_HOUR = 10
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(ip: string): { ok: boolean; remaining: number } {
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

interface EditNote {
  severity: 'high' | 'medium' | 'low'
  location: string
  comment: string
}

interface EditResult {
  revised: string
  notes: EditNote[]
  mock?: boolean
}

// API 未設定時のフォールバック（モック応答）
function buildMockResult(text: string): EditResult {
  const lines = text.split('\n').filter(l => l.trim().length > 0)
  const firstLine = lines[0] || ''
  const notes: EditNote[] = []

  // 簡易チェック（キーワードベース）
  if (/(圧倒的|革命|劇的|衝撃|最強|絶対|必ず)/.test(text)) {
    notes.push({
      severity: 'high',
      location: '本文中の強調表現',
      comment: '「圧倒的」「革命」等の煽り表現は受け手の信頼を下げる傾向があります。事実と数値で裏付ける表現への置き換えをご検討ください。',
    })
  }
  if (/(別途協議|追って|順次|改めて)/.test(text)) {
    notes.push({
      severity: 'medium',
      location: '期日・範囲が曖昧な表現',
      comment: '「別途協議」「追って連絡」等は相手の業務を止めます。具体的な期日・条件を明示することで、認識ズレと再連絡を減らせます。',
    })
  }
  if (firstLine.length > 0 && firstLine.length < 8 && !/件名|お知らせ|について/.test(firstLine)) {
    notes.push({
      severity: 'low',
      location: `1行目: ${firstLine}`,
      comment: '件名・タイトルとして結論が読み取りにくい可能性があります。「何を」「誰に」「いつまでに」が一目でわかる構成をご検討ください。',
    })
  }
  if (notes.length === 0) {
    notes.push({
      severity: 'low',
      location: '全体',
      comment: '簡易チェックでは目立った問題は検出されませんでした。本デモはAPI未設定時の簡易応答のため、本格的な添削は環境変数設定後にご利用ください。',
    })
  }

  return {
    revised: text, // モック時は本文をそのまま返す
    notes,
    mock: true,
  }
}

const SYSTEM_PROMPT = `あなたは経営者向けの書類添削AIです。日本語のビジネス文書（メール・契約書ドラフト・社内通達・プレスリリース・求人票・挨拶文など）を添削します。

添削方針:
- 煽り口調（「圧倒的」「革命」「劇的」等）は事実ベースの表現に修正
- 期日・範囲・金額等が曖昧な箇所は具体化を提案
- 敬語の重複・冗長表現は簡潔に整理
- 法的リスク（賠償上限なし・反社条項なし等）に気付いたら指摘
- 修正後の文章は元の意図を保ち、自然な日本語にする
- コメントは丁寧かつ具体的に。指摘の理由と代替表現を示す

必ず以下のJSON形式のみで返答してください。マークダウンコードブロックや前置き説明は不要です。

{
  "revised": "（修正後の全文。元の改行構造を保持）",
  "notes": [
    {
      "severity": "high" | "medium" | "low",
      "location": "（該当箇所の説明。例: 第3条の業務範囲、リード3行目）",
      "comment": "（指摘内容と代替案）"
    }
  ]
}

severity の基準:
- high: 法的リスク・期日不明・金額不明・致命的な誤解を招く表現
- medium: 内容が伝わりにくい・根拠不足・読み手への配慮不足
- low: 冗長表現・敬語重複・表記ゆれ等の軽微な修正`

async function callAnthropicAPI(text: string): Promise<EditResult> {
  if (!ANTHROPIC_API_KEY) {
    return buildMockResult(text)
  }

  const userMessage = `以下の書類を添削してください。\n\n---\n${text}\n---`

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    console.error('[document-edit] Anthropic API error:', res.status, errBody)
    throw new Error(`AI APIエラー (${res.status})`)
  }

  const data = await res.json()
  const content = data?.content?.[0]?.text || ''

  // JSON抽出（```json ブロックや前置きが混入する場合に備える）
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
    console.error('[document-edit] JSON parse error:', e, 'raw:', content)
    throw new Error('AI応答の解析に失敗しました')
  }

  const revised = typeof parsed.revised === 'string' ? parsed.revised : text
  const notesRaw = Array.isArray(parsed.notes) ? parsed.notes : []
  const notes: EditNote[] = notesRaw
    .filter((n: any) => n && typeof n === 'object')
    .map((n: any) => ({
      severity: ['high', 'medium', 'low'].includes(n.severity) ? n.severity : 'low',
      location: typeof n.location === 'string' ? n.location : '',
      comment: typeof n.comment === 'string' ? n.comment : '',
    }))

  return { revised, notes }
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    // レート制限
    const ip = clientAddress || 'unknown'
    const rl = checkRateLimit(ip)
    if (!rl.ok) {
      return json(
        { error: '一定時間内のご利用回数上限に達しました。しばらく時間をおいてからお試しください。' },
        429,
      )
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body.text !== 'string') {
      return json({ error: 'リクエスト形式が正しくありません。' }, 400)
    }

    let text = body.text as string
    text = text.replace(/\r\n/g, '\n').trim()

    if (text.length === 0) {
      return json({ error: '本文が空です。' }, 400)
    }

    let truncated = false
    if (text.length > MAX_INPUT_CHARS) {
      text = text.slice(0, MAX_INPUT_CHARS)
      truncated = true
    }

    const result = await callAnthropicAPI(text)

    return json({
      revised: result.revised,
      notes: result.notes,
      mock: result.mock || false,
      truncated,
      remaining: rl.remaining,
    })
  } catch (error: any) {
    console.error('[document-edit] error:', error?.message ?? String(error))
    return json(
      { error: error?.message || '添削処理に失敗しました。時間をおいて再度お試しください。' },
      500,
    )
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
