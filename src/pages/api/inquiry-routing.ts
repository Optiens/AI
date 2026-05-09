import type { APIRoute } from 'astro'

/**
 * /inquiry-routing デモ用エンドポイント
 *
 * 実装方針:
 * - AI API を呼ばず、事前用意の応答を返す
 * - 4 つのサンプルパターン（見積/障害/請求/契約）には詳細応答を用意
 * - 自由記述には簡易キーワードマッチで近い応答を返し、合わないものには
 *   「実運用では AI が動的に回答」と注記
 */

const MAX_INPUT_CHARS = 4000

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

interface RoutingResult {
  category: string
  priority: 'high' | 'medium' | 'low'
  priority_reason: string
  assignee: string
  response_template: string
  mock?: boolean
  no_match?: boolean
}

// ========== 事前用意の応答（4 サンプルパターン） ==========
type Pattern = {
  matchKey: string
  category: string
  priority: 'high' | 'medium' | 'low'
  priority_reason: string
  assignee: string
  response_template: string
}

const PATTERNS: Pattern[] = [
  {
    matchKey: '見積',
    category: '見積・料金',
    priority: 'medium',
    priority_reason: '購入意思のある新規問い合わせ。営業時間内の返信で十分対応可能。',
    assignee: '営業担当',
    response_template:
      '株式会社○○ △△様\n\nお問い合わせいただき誠にありがとうございます。\n\n業務管理システムのお見積もりについて、ご利用人数（営業3名・事務2名）を踏まえた構成案を準備し、3 営業日以内に書面でご提示いたします。\n\nオンライン打合せにつきましては、以下の候補日時より 30 分ほどお時間を頂戴できれば幸いです。\n　・○月○日（○）10:00-10:30\n　・○月○日（○）14:00-14:30\n　・○月○日（○）16:00-16:30\n\nご都合の良い日時をお知らせいただけますでしょうか。\n\n何卒よろしくお願い申し上げます。',
  },
  {
    matchKey: '障害',
    category: '技術サポート',
    priority: 'high',
    priority_reason: '稼働中システムの障害発生で業務に支障。即時対応が必要。',
    assignee: 'サポート担当',
    response_template:
      'お世話になっております。Optiens サポート担当でございます。\n\n注文管理画面にログインできない状況、ご業務に多大なご支障をおかけし誠に申し訳ございません。\n\n【現状の対応】\n①障害状況の調査を即時開始しました\n②原因特定と暫定対応の連絡を 30 分以内に差し上げます\n\nお手数をおかけしますが、可能であれば下記情報をご返信ください。\n　・発生時刻と頻度（断続/継続）\n　・エラー画面のスクリーンショット\n　・お試しいただいた端末（PC / スマホ等）\n\n復旧まで責任を持って対応させていただきます。',
  },
  {
    matchKey: '請求',
    category: '請求・経理',
    priority: 'medium',
    priority_reason: '振込期日が近く、明細確認の即時性が求められる。',
    assignee: '経理担当',
    response_template:
      'お世話になっております。Optiens 経理担当でございます。\n\n先月分の請求書について、金額のご質問をいただきありがとうございます。本日中に明細をご確認のうえ、ご返答いたします。\n\n【ご確認内容】\n・前月との差額（約 2 万円）の内訳\n・適用された料金プランと利用件数\n・追加発生分の有無\n\n振込期日（来週）にご対応いただけますよう、本日 18:00 までに詳細を別途メールにてお送りいたします。\n\nもし期日変更が必要な場合はお気軽にお申し付けください。',
  },
  {
    matchKey: '契約',
    category: '契約・取引',
    priority: 'medium',
    priority_reason: '契約継続・利用人数追加の前向きな相談。期日に余裕あり。',
    assignee: '営業担当',
    response_template:
      'お世話になっております。Optiens 営業担当でございます。\n\n来年 4 月からの契約継続のご検討、誠にありがとうございます。\n\n料金プランの見直しと利用人数の追加（5 名 → 8 名）について、現状のご利用状況に最適な構成をご提案させていただきたく、打合せのお時間を頂戴できればと存じます。\n\n以下の候補から 1 時間ほどご都合の良い日時をお選びいただけますでしょうか。\n　・○月○日（○）10:00-11:00\n　・○月○日（○）14:00-15:00\n　・○月○日（○）16:00-17:00\n\n打合せ前に現状の利用状況サマリーを共有いたしますので、当日は次年度の最適プランの議論に集中いただけます。',
  },
]

// 自由記述用のキーワード簡易マッチ
function buildResultFromKeywords(text: string): RoutingResult {
  // 4 パターンマッチを優先
  for (const p of PATTERNS) {
    if (text.includes(p.matchKey)) {
      return {
        category: p.category,
        priority: p.priority,
        priority_reason: p.priority_reason,
        assignee: p.assignee,
        response_template: p.response_template,
        mock: true,
      }
    }
  }

  // どれにもマッチしない場合のフォールバック
  let category = 'その他'
  let priority: RoutingResult['priority'] = 'medium'
  let assignee = '営業担当'
  let priority_reason = '一般的な問い合わせとして扱います。'

  if (/(導入|相談|検討|資料)/.test(text)) {
    category = '導入相談'
  } else if (/(料金|価格|金額|費用)/.test(text)) {
    category = '見積・料金'
  } else if (/(エラー|動かない|ログイン|不具合|止まった|落ちた)/.test(text)) {
    category = '技術サポート'
    priority = 'high'
    priority_reason = '稼働中システムの不具合が想定されるため。'
    assignee = 'サポート担当'
  } else if (/(支払|入金|振込)/.test(text)) {
    category = '請求・経理'
    assignee = '経理担当'
  } else if (/(解約|更新)/.test(text)) {
    category = '契約・取引'
  } else if (/(クレーム|苦情|不満|残念)/.test(text)) {
    category = 'クレーム'
    priority = 'high'
    priority_reason = 'ネガティブな反応を含む内容のため、即対応が望ましい。'
  }

  if (/(緊急|至急|今すぐ|本日中)/.test(text)) {
    priority = 'high'
    priority_reason = '緊急性の表現が含まれているため。'
  }

  return {
    category,
    priority,
    priority_reason,
    assignee,
    response_template: `お問い合わせありがとうございます。\n\n${assignee}より、内容を確認のうえ 2 営業日以内にご連絡差し上げます。\n\n――\n※ 本文は事前用意のサンプル応答です。実運用では AI が文脈に応じた個別の応答を動的に生成します。`,
    mock: true,
    no_match: true,
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

    // 疑似ディレイ
    await new Promise((r) => setTimeout(r, 350 + Math.floor(Math.random() * 350)))

    const result = buildResultFromKeywords(text)
    return json({ ...result, truncated, remaining: rl.remaining })
  } catch (e: any) {
    console.error('[inquiry-routing] error:', e)
    return json({ error: e?.message || '予期しないエラーが発生しました。' }, 500)
  }
}
