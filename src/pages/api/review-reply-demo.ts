import type { APIRoute } from 'astro'

const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY
const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_PER_HOUR = 30
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

const SYSTEM_PROMPT = `あなたは中小カフェ・レストランの広報担当者として、お客様の口コミに対する返信を作成するアシスタントです。

# 返信ルール
1. **店舗トーン**: 丁寧でフレンドリー、過度に堅すぎない口調
2. **長さ**: 3〜5 文（80〜200 字）。短すぎず長すぎない
3. **具体性**: 口コミに書かれた内容に **必ず触れる**（料理名・滞在シーン等）
4. **低評価への対応**:
   - 不満点を真摯に受け止める姿勢を示す
   - 改善するか、現状維持の理由を簡潔に伝える
   - 言い訳や反論はしない
   - 「ご来店感謝 → 不満点への謝意 → 改善・対応の意志 → 再訪のお願い」の順
5. **高評価への対応**:
   - 評価ポイントを具体的に拾う
   - 押し付けがましくない再訪のお願い
   - 「ご来店・口コミ感謝 → 評価点に触れる → 再訪のお願い」の順
6. **禁止表現**: 「絶対」「必ず」のような断定、「もちろん」「当然」のような上から目線、過剰な絵文字

# 出力フォーマット（JSON）
{
  "reply_text": "返信本文（改行は \\n）",
  "tone": "low_rating | mid_rating | high_rating",
  "key_points": ["返信で触れた口コミ内容のキーワード（最大3つ）"],
  "alert_priority": "high | medium | low"  // 低評価で即対応必要なら high
}

純粋な JSON オブジェクトのみで返してください。`

interface Review {
  source: 'tabelog' | 'google_map' | 'instagram'
  rating: number
  title?: string
  body: string
  reviewer?: string
  date?: string
  shop_name?: string
}

function buildMockReply(review: Review) {
  const isLow = review.rating <= 2
  const isMid = review.rating === 3
  const replyText = isLow
    ? `この度はご来店いただき誠にありがとうございました。\nお食事のご提供にお時間をいただいてしまい、大変申し訳ございませんでした。混雑時のオペレーションを改めて見直し、改善に取り組んでまいります。\nまた機会がございましたら、ぜひお越しいただけますと幸いです。`
    : isMid
      ? `ご来店・口コミの投稿をいただきありがとうございました。\nいただいたご意見を励みに、今後もより良いお店づくりに努めてまいります。\nまた近くにお寄りの際は、お気軽にお立ち寄りくださいませ。`
      : `ご来店・温かい口コミをありがとうございました。\nお気に召していただけたとのこと、スタッフ一同大変嬉しく思っております。\nまた季節のメニューもご用意してお待ちしておりますので、ぜひお越しください。`
  return {
    reply_text: replyText,
    tone: isLow ? 'low_rating' : isMid ? 'mid_rating' : 'high_rating',
    key_points: ['ご来店感謝'],
    alert_priority: isLow ? 'high' : isMid ? 'medium' : 'low',
    mock: true,
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
      return json({ error: '時間内の利用制限に達しました。少し時間をおいてから再度お試しください。' }, 429)
    }

    const body = (await request.json().catch(() => null)) as { review?: Review } | null
    const review = body?.review
    if (!review || !review.body || typeof review.rating !== 'number') {
      return json({ error: 'リクエスト形式が正しくありません。' }, 400)
    }

    if (!OPENAI_API_KEY) {
      return json({ ...buildMockReply(review), remaining: rl.remaining })
    }

    const sourceLabel =
      review.source === 'tabelog' ? '食べログ' : review.source === 'google_map' ? 'Googleマップ' : 'Instagram'

    const userMessage = `# 口コミ情報
- ソース: ${sourceLabel}
- 評価: ${review.rating} / 5 ★
${review.title ? `- タイトル: ${review.title}\n` : ''}- 投稿者: ${review.reviewer || '匿名'}
- 投稿日: ${review.date || '不明'}
${review.shop_name ? `- 店舗名: ${review.shop_name}\n` : ''}
# 口コミ本文
${review.body}

上記の口コミに対する返信を、指定の JSON 形式で生成してください。`

    const res = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 800,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[review-reply-demo] OpenAI error:', res.status, errBody)
      if (errBody && /insufficient_quota|exceeded your current quota/i.test(errBody)) {
        return json({ ...buildMockReply(review), remaining: rl.remaining, _fallback: 'quota' })
      }
      if (res.status === 429) {
        return json({ error: 'AIサービスのレート制限に達しました。少し時間をおいてから再度お試しください。' }, 429)
      }
      return json({ error: `AIサービスでエラーが発生しました（${res.status}）。` }, 500)
    }

    const data = await res.json()
    const content = String(data?.choices?.[0]?.message?.content || '').trim()

    let parsed: any = {}
    try {
      const jsonStart = content.indexOf('{')
      const jsonEnd = content.lastIndexOf('}')
      const jsonText = content.substring(jsonStart, jsonEnd + 1)
      parsed = JSON.parse(jsonText)
    } catch (err) {
      console.error('[review-reply-demo] JSON parse error:', err, content)
      parsed = { reply_text: content, tone: 'mid_rating', key_points: [], alert_priority: 'medium' }
    }

    return json({
      reply_text: parsed.reply_text || '',
      tone: parsed.tone || 'mid_rating',
      key_points: Array.isArray(parsed.key_points) ? parsed.key_points : [],
      alert_priority: parsed.alert_priority || 'medium',
      remaining: rl.remaining,
    })
  } catch (e: any) {
    console.error('[review-reply-demo] error:', e)
    return json({ error: e?.message || '予期しないエラーが発生しました。' }, 500)
  }
}
