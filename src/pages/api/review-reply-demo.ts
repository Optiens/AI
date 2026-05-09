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

type ToneStyle = 'polite' | 'standard' | 'friendly'
type ReplyLang = 'auto' | 'ja' | 'en'

const TONE_INSTRUCTIONS: Record<ToneStyle, string> = {
  polite: `**最大限丁寧な敬語**で書いてください。
- 「この度は」「誠に」「光栄に存じます」「心より御礼申し上げます」「いただけますと幸甚に存じます」のような格式の高い表現を用いる
- 高級店・伝統ある店舗にふさわしい品格を保つ
- 改行を入れ、4〜6 文程度で、ゆとりのある文章量にする`,
  standard: `**丁寧でフレンドリー**な口調で書いてください。
- 一般的な敬語をベースに、堅すぎず親しみやすい表現を織り交ぜる
- 過度に砕けた表現は避ける
- 3〜5 文程度で、必要十分な文章量にする`,
  friendly: `**親しみやすくカジュアル寄り**の口調で書いてください。
- 敬語は維持しつつ、「！」「ぜひ」「うれしく」など温かみのある表現を多用
- 常連客との会話のような距離感
- 3〜4 文程度で、軽快に書く`,
}

const LANG_INSTRUCTIONS: Record<ReplyLang, string> = {
  auto: '**口コミと同じ言語**で返信してください。日本語の口コミには日本語、英語の口コミには英語、その他は適宜判断してください。',
  ja: '必ず**日本語**で返信してください（口コミが英語等であっても日本語で返信）。',
  en: '必ず**英語**で返信してください（reviews in any language, reply in polite English）。',
}

function buildSystemPrompt(tone: ToneStyle, language: ReplyLang): string {
  return `あなたは中小カフェ・レストランの広報担当者として、お客様の口コミに対する返信を作成するアシスタントです。

# 言語ルール
${LANG_INSTRUCTIONS[language]}

# 口調指定
${TONE_INSTRUCTIONS[tone]}

# 共通の返信ルール
1. **具体性**: 口コミに書かれた内容に **必ず触れる**（料理名・滞在シーン・天候・接客内容等）
2. **低評価への対応**:
   - 不満点を真摯に受け止める姿勢を示す
   - 改善するか、現状維持の理由を簡潔に伝える
   - 言い訳や反論はしない
   - 「ご来店感謝 → 不満点への謝意 → 改善・対応の意志 → 再訪のお願い」の順
3. **高評価への対応**:
   - 評価ポイントを具体的に拾う
   - 押し付けがましくない再訪のお願い
   - 「ご来店・口コミ感謝 → 評価点に触れる → 再訪のお願い」の順
4. **禁止表現**: 「絶対」「必ず」のような断定、「もちろん」「当然」のような上から目線、過剰な絵文字（1〜2 個程度なら可）

# 出力フォーマット（JSON）
{
  "reply_text": "返信本文（改行は \\n）",
  "tone": "low_rating | mid_rating | high_rating",
  "key_points": ["返信で触れた口コミ内容のキーワード（最大3つ）"],
  "alert_priority": "high | medium | low"
}

純粋な JSON オブジェクトのみで返してください。`
}

interface Review {
  source: 'tabelog' | 'google_map' | 'instagram'
  rating: number
  title?: string
  body: string
  reviewer?: string
  date?: string
  shop_name?: string
}

function detectLang(text: string): 'ja' | 'en' {
  const jaChars = (text.match(/[぀-ヿ㐀-鿿]/g) || []).length
  return jaChars > 5 ? 'ja' : 'en'
}

function buildMockReply(review: Review, tone: ToneStyle, language: ReplyLang) {
  const isLow = review.rating <= 2
  const isMid = review.rating === 3
  const targetLang =
    language === 'auto' ? detectLang(review.body) : language

  let replyText: string

  if (targetLang === 'en') {
    replyText = isLow
      ? `Thank you for taking the time to share your feedback with us. We sincerely apologize that the service did not meet your expectations on this occasion. We will review our operations during peak hours and work to ensure a better experience next time. We hope to have the opportunity to welcome you back.`
      : isMid
        ? `Thank you for visiting and for sharing your honest feedback. Your comments help us continue to improve. We hope to see you again on your next visit to the area.`
        : `Thank you so much for the wonderful review and for visiting us. We are delighted to hear that you enjoyed your time at our cafe. We look forward to seeing you again, perhaps to try our seasonal menu.`
  } else {
    if (tone === 'polite') {
      replyText = isLow
        ? `この度はご来店を賜り、誠にありがとうございました。\nお料理のご提供にお時間をいただきましたこと、心よりお詫び申し上げます。混雑時のオペレーションを改めて点検し、改善に努めて参ります。\n何卒ご寛恕賜りますとともに、再びお運びいただけますれば幸甚に存じます。`
        : isMid
          ? `この度はご来店ならびにお口コミの投稿を賜り、誠にありがとうございました。\n頂戴したご意見を真摯に受け止め、今後より一層のお店づくりに精進して参ります。\nお近くへお越しの際は、ぜひお立ち寄りいただけますと幸いに存じます。`
          : `この度はご来店ならびに温かいお言葉を賜り、誠にありがとうございました。\nお気に召していただけましたこと、スタッフ一同心より光栄に存じます。\n季節のメニューを取り揃え、お待ち申し上げております。再びのご来訪を心よりお待ち申し上げております。`
    } else if (tone === 'friendly') {
      replyText = isLow
        ? `ご来店ありがとうございました。\nお食事の提供にお時間をいただいてしまい、本当に申し訳ありません！次回はもっとスムーズにご案内できるよう改善します。\nまたぜひお立ち寄りください。`
        : isMid
          ? `ご来店と口コミありがとうございました！\nいただいたご意見、しっかり受け止めて、もっと良いお店にしていきますね。\n近くにお越しの際はお気軽にお寄りください。`
          : `素敵な口コミ、ありがとうございました！\nお気に召していただけて、私たちもとても嬉しいです。\n季節のメニューもご用意してお待ちしてますので、ぜひまた遊びに来てくださいね。`
    } else {
      replyText = isLow
        ? `この度はご来店いただき誠にありがとうございました。\nお食事のご提供にお時間をいただいてしまい、大変申し訳ございませんでした。混雑時のオペレーションを改めて見直し、改善に取り組んでまいります。\nまた機会がございましたら、ぜひお越しいただけますと幸いです。`
        : isMid
          ? `ご来店・口コミの投稿をいただきありがとうございました。\nいただいたご意見を励みに、今後もより良いお店づくりに努めてまいります。\nまた近くにお寄りの際は、お気軽にお立ち寄りくださいませ。`
          : `ご来店・温かい口コミをありがとうございました。\nお気に召していただけたとのこと、スタッフ一同大変嬉しく思っております。\nまた季節のメニューもご用意してお待ちしておりますので、ぜひお越しください。`
    }
  }

  return {
    reply_text: replyText,
    tone: isLow ? 'low_rating' : isMid ? 'mid_rating' : 'high_rating',
    key_points: targetLang === 'ja' ? ['ご来店感謝'] : ['Thanks for visiting'],
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

    const body = (await request.json().catch(() => null)) as {
      review?: Review
      tone?: ToneStyle
      language?: ReplyLang
    } | null
    const review = body?.review
    const tone: ToneStyle = body?.tone && ['polite', 'standard', 'friendly'].includes(body.tone) ? body.tone : 'standard'
    const language: ReplyLang = body?.language && ['auto', 'ja', 'en'].includes(body.language) ? body.language : 'auto'

    if (!review || !review.body || typeof review.rating !== 'number') {
      return json({ error: 'リクエスト形式が正しくありません。' }, 400)
    }

    if (!OPENAI_API_KEY) {
      return json({ ...buildMockReply(review, tone, language), remaining: rl.remaining })
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
          { role: 'system', content: buildSystemPrompt(tone, language) },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 900,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[review-reply-demo] OpenAI error:', res.status, errBody)
      if (errBody && /insufficient_quota|exceeded your current quota/i.test(errBody)) {
        return json({ ...buildMockReply(review, tone, language), remaining: rl.remaining, _fallback: 'quota' })
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
