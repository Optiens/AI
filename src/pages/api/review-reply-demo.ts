import type { APIRoute } from 'astro'
import { getMockReply, type ToneStyle, type ReplyLang } from '../../lib/review-mock-replies'

/**
 * /review-monitor デモ用エンドポイント
 *
 * 実装方針:
 * - 本デモは OpenAI API を呼ばず、事前用意したサンプル応答を返す
 * - 本番運用時は OpenAI gpt-4o-mini 等で動的生成する想定（参考実装は Git 履歴）
 * - レート制限のみ維持（同一 IP からの過剰アクセス防止）
 */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_PER_HOUR = 60
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

interface ReviewInput {
  id?: string
  source: 'tabelog' | 'google_map' | 'instagram'
  rating: number
  title?: string
  body: string
  reviewer?: string
  shop_name?: string
}

function json(payload: any, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// 軽い「生成中」感を演出するための疑似ディレイ（300〜700ms ランダム）
function fakeLatencyMs() {
  return 300 + Math.floor(Math.random() * 400)
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ip = clientAddress || 'unknown'
    const rl = checkRateLimit(ip)
    if (!rl.ok) {
      return json({ error: '時間内の利用制限に達しました。少し時間をおいてから再度お試しください。' }, 429)
    }

    const body = (await request.json().catch(() => null)) as {
      review?: ReviewInput
      tone?: ToneStyle
      language?: 'auto' | ReplyLang
    } | null
    const review = body?.review
    const tone: ToneStyle = body?.tone && ['polite', 'standard', 'friendly'].includes(body.tone) ? body.tone : 'standard'
    const language: 'auto' | ReplyLang =
      body?.language && ['auto', 'ja', 'en'].includes(body.language) ? body.language : 'auto'

    if (!review || !review.body || typeof review.rating !== 'number') {
      return json({ error: 'リクエスト形式が正しくありません。' }, 400)
    }

    // 疑似ディレイ（生成中表示を活かすため）
    await new Promise((r) => setTimeout(r, fakeLatencyMs()))

    const replyId = review.id || ''
    const stored = getMockReply(replyId, review.body, tone, language)

    if (!stored) {
      return json({
        error: '事前用意の応答が見つかりません。本番運用時は AI が動的生成します。',
      }, 404)
    }

    return json({
      reply_text: stored.reply_text,
      tone: stored.tone,
      key_points: stored.key_points,
      alert_priority: stored.alert_priority,
      remaining: rl.remaining,
      mock: true,
      _note: 'デモのため事前用意のサンプル応答を表示しています。本番運用時は OpenAI API 等で動的生成します。',
    })
  } catch (e: any) {
    console.error('[review-reply-demo] error:', e)
    return json({ error: e?.message || '予期しないエラーが発生しました。' }, 500)
  }
}
