import type { APIRoute } from 'astro'

/**
 * /document-edit デモ用エンドポイント
 *
 * 実装方針:
 * - AI API を呼ばず、キーワードベースの簡易チェックで指摘を返す
 * - 「実運用では AI が動的に回答」のフッタを併記
 */

// 入力サイズ制限
const MAX_INPUT_CHARS = 8000

// 簡易レート制限（IPベース、メモリ内）
// 実運用では Supabase 等への移行を推奨
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
  // 追加チェック
  if (text.length > 600 && !/\n\n/.test(text)) {
    notes.push({
      severity: 'low',
      location: '段落構成',
      comment: '長文ですが段落区切りが少なく、読み手が論点を追いにくい可能性があります。論点ごとに空行で段落を区切ると可読性が上がります。',
    })
  }
  if (/(以上、よろしくお願いいたします|何卒よろしくお願いいたします)/.test(text) === false && /(メール|お知らせ)/.test(text)) {
    notes.push({
      severity: 'low',
      location: '結びの挨拶',
      comment: 'ビジネスメールの結びとして「何卒よろしくお願いいたします」等の定型句を入れることで、読み手が文末を判別しやすくなります。',
    })
  }

  if (notes.length === 0) {
    notes.push({
      severity: 'low',
      location: '全体',
      comment: '簡易チェックでは目立った問題は検出されませんでした。',
    })
  }

  // 末尾に「実運用では AI が動的に回答」の注記を追加
  notes.push({
    severity: 'low',
    location: 'デモについて',
    comment: '本デモはキーワードベースの簡易チェックのみ行います。実運用では AI が文脈・業界慣習・法的リスクを読み取り、文書全体の構造改善まで提案します。',
  })

  return {
    revised: text, // モック時は本文をそのまま返す
    notes,
    mock: true,
  }
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

    // 疑似ディレイ
    await new Promise((r) => setTimeout(r, 350 + Math.floor(Math.random() * 350)))

    const result = buildMockResult(text)

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
