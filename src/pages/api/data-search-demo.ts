import type { APIRoute } from 'astro'
import { INTERNAL_DOCS, SAMPLE_QA, getInternalDocAnswer } from '../../lib/internal-docs-mock'

const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY
const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_PER_HOUR = 20
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

// モック販売データ（Optiens事例風）
type SalesRecord = {
  id: string
  date: string
  client: string
  service: string
  industry: string
  region: string
  amount: number
  status: 'completed' | 'in-progress' | 'cancelled'
}

const SAMPLE_DATA: SalesRecord[] = [
  { id: 'S001', date: '2026-01-08', client: '清里高原ペンション緑風', service: 'AI活用診断 詳細レポート', industry: '宿泊業', region: '山梨県', amount: 5500, status: 'completed' },
  { id: 'S002', date: '2026-01-15', client: '北杜市 大泉観光協会', service: 'AI活用診断 詳細レポート', industry: '自治体', region: '山梨県', amount: 5500, status: 'completed' },
  { id: 'S003', date: '2026-01-22', client: '甲府市 田中行政書士事務所', service: '導入支援（カスタムCRM）', industry: '士業', region: '山梨県', amount: 480000, status: 'completed' },
  { id: 'S004', date: '2026-02-03', client: '小淵沢工務店', service: 'AI活用診断 詳細レポート', industry: '工務店', region: '山梨県', amount: 5500, status: 'completed' },
  { id: 'S005', date: '2026-02-09', client: '清里高原ペンション緑風', service: '導入支援（多言語対応サイト）', industry: '宿泊業', region: '山梨県', amount: 320000, status: 'completed' },
  { id: 'S006', date: '2026-02-14', client: '須玉ベーカリー山小屋', service: 'AI活用診断 詳細レポート', industry: 'ベーカリー', region: '山梨県', amount: 5500, status: 'completed' },
  { id: 'S007', date: '2026-02-20', client: '韮崎市 宮田税理士事務所', service: '導入支援（書類自動読み取り）', industry: '士業', region: '山梨県', amount: 380000, status: 'completed' },
  { id: 'S008', date: '2026-02-25', client: '東京 株式会社グリーンビズ', service: 'AI活用診断 詳細レポート', industry: 'EC', region: '東京都', amount: 5500, status: 'completed' },
  { id: 'S009', date: '2026-03-04', client: '清里高原ペンション緑風', service: '保守プラン スタンダード', industry: '宿泊業', region: '山梨県', amount: 50000, status: 'in-progress' },
  { id: 'S010', date: '2026-03-08', client: '甲府市 田中行政書士事務所', service: '保守プラン スタンダード', industry: '士業', region: '山梨県', amount: 50000, status: 'in-progress' },
  { id: 'S011', date: '2026-03-12', client: '長野 八ヶ岳ワイナリー', service: 'AI活用診断 詳細レポート', industry: 'ワイナリー', region: '長野県', amount: 5500, status: 'completed' },
  { id: 'S012', date: '2026-03-15', client: '横浜 山田アウトドア', service: 'AI活用診断 詳細レポート', industry: 'アウトドアガイド', region: '神奈川県', amount: 5500, status: 'completed' },
  { id: 'S013', date: '2026-03-19', client: '小淵沢工務店', service: '導入支援（見積自動生成）', industry: '工務店', region: '山梨県', amount: 520000, status: 'completed' },
  { id: 'S014', date: '2026-03-23', client: '長野 八ヶ岳ワイナリー', service: '導入支援（卸先提案書生成）', industry: 'ワイナリー', region: '長野県', amount: 420000, status: 'in-progress' },
  { id: 'S015', date: '2026-03-28', client: '韮崎市 宮田税理士事務所', service: '保守プラン ライト', industry: '士業', region: '山梨県', amount: 30000, status: 'in-progress' },
  { id: 'S016', date: '2026-04-02', client: '東京 株式会社グリーンビズ', service: '導入支援（カスタムCRM）', industry: 'EC', region: '東京都', amount: 580000, status: 'in-progress' },
  { id: 'S017', date: '2026-04-05', client: '北杜市 大泉観光協会', service: '導入支援（観光SNS自動投稿）', industry: '自治体', region: '山梨県', amount: 450000, status: 'completed' },
  { id: 'S018', date: '2026-04-09', client: '甲府レストラン橙', service: 'AI活用診断 詳細レポート', industry: 'カフェ・レストラン', region: '山梨県', amount: 5500, status: 'completed' },
  { id: 'S019', date: '2026-04-14', client: '須玉ベーカリー山小屋', service: '導入支援（仕込み計画AI）', industry: 'ベーカリー', region: '山梨県', amount: 360000, status: 'in-progress' },
  { id: 'S020', date: '2026-04-18', client: '清里高原ペンション緑風', service: '追加開発（口コミ自動返信）', industry: '宿泊業', region: '山梨県', amount: 180000, status: 'completed' },
  { id: 'S021', date: '2026-04-22', client: '小淵沢工務店', service: '保守プラン スタンダード', industry: '工務店', region: '山梨県', amount: 50000, status: 'in-progress' },
  { id: 'S022', date: '2026-04-25', client: '群馬 高崎酪農組合', service: 'AI活用診断 詳細レポート', industry: '酪農・畜産', region: '群馬県', amount: 5500, status: 'completed' },
  { id: 'S023', date: '2026-04-28', client: '甲府レストラン橙', service: '導入支援（SNS毎日投稿）', industry: 'カフェ・レストラン', region: '山梨県', amount: 280000, status: 'in-progress' },
  { id: 'S024', date: '2026-05-01', client: '東京 株式会社グリーンビズ', service: '保守プラン スタンダード', industry: 'EC', region: '東京都', amount: 50000, status: 'in-progress' },
  { id: 'S025', date: '2026-05-02', client: '北杜市 大泉観光協会', service: '保守プラン ライト', industry: '自治体', region: '山梨県', amount: 30000, status: 'in-progress' },
  { id: 'S026', date: '2026-05-04', client: '韮崎市 宮田税理士事務所', service: '追加開発（電子帳簿対応）', industry: '士業', region: '山梨県', amount: 240000, status: 'in-progress' },
  { id: 'S027', date: '2026-05-05', client: '長野 八ヶ岳ワイナリー', service: '保守プラン スタンダード', industry: 'ワイナリー', region: '長野県', amount: 50000, status: 'in-progress' },
  { id: 'S028', date: '2026-05-06', client: '甲府レストラン橙', service: '保守プラン ライト', industry: 'カフェ・レストラン', region: '山梨県', amount: 30000, status: 'in-progress' },
  { id: 'S029', date: '2026-05-07', client: '富士吉田 田原観光農園', service: 'AI活用診断 詳細レポート', industry: '農業', region: '山梨県', amount: 5500, status: 'completed' },
  { id: 'S030', date: '2026-05-08', client: '群馬 高崎酪農組合', service: '導入支援（飼養記録AI）', industry: '酪農・畜産', region: '群馬県', amount: 480000, status: 'in-progress' },
]

const SYSTEM_PROMPT = `あなたは中小企業向けの社内データ分析アシスタントです。
以下のサンプル販売データに対するユーザーの質問に、日本語で簡潔に回答してください。

# データの説明
- 全 30 件の販売記録（2026年1月〜5月）
- フィールド: id, date(YYYY-MM-DD), client, service, industry, region, amount(円), status

# 回答スタンス
質問は大きく 3 種類あります。それぞれに合わせて回答してください:

**(A) 単純検索・集計**（例: 「3月の売上合計は？」「士業の件数は？」）
- データから直接計算し、必ず計算根拠を示す
- 結果が表形式で見やすい場合は Markdown 表で示す
- 該当件数を明示

**(B) 解釈・分析**（例: 「改善が必要な業種は？」「売上が伸びている領域は？」「リピートしやすい顧客像は？」）
- データから読み取れる傾向・偏り・パターンを分析する
- 「○○の前提なら」と<strong>判断軸を最初に明示</strong>してから結論を出す
- 例: 「『改善が必要』を『取引件数が少ない or 単価が低い』と定義すると…」のように仮置きする
- 数値で裏付け（業種別の件数・平均単価・有償化率など）を示す
- 観察事実と推論を分けて書く（事実→推論の順）
- データだけでは判断できない要素があれば「これだけでは断定できない」「ヒアリングが必要」と明示する

**(C) データに無い情報**（例: 顧客の連絡先・将来予測）
- 「このデータには記載がありません」と伝え、何があれば答えられるかを補足する

# 共通ルール
- 「先月」「今月」のような相対表現はデータの最新日（2026-05-08）を基準に解釈する
- 推測で具体名を作らない（データに無い顧客名・金額をでっち上げない）
- 表形式での集計が分かりやすい場合は **Markdown表** で示す

# 出力フォーマット
{
  "answer": "回答本文（Markdown可、改行は \\n）",
  "matched_ids": ["該当する記録のID配列（例: S001, S005）。最大10件。分析系で全業種に言及する場合は省略可"],
  "calculation_note": "計算・判定の根拠（数値・分析どちらでも、式や定義を文字列で）"
}

純粋な JSON オブジェクトのみで返してください。コードブロックや余分な装飾は不要です。`

function buildMockResult(query: string) {
  return {
    answer: `モック応答（API キー未設定）です。実際の質問「${query.slice(0, 40)}」に対しては、AI がデータを分析して回答します。本デモ環境では OPENAI_API_KEY が必要です。`,
    matched_ids: ['S001', 'S005', 'S009', 'S020'],
    calculation_note: '',
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

    const body = await request.json().catch(() => null) as { query?: string; category?: string } | null
    const query = String(body?.query || '').trim()
    const category = String(body?.category || 'sales')
    if (!query) return json({ error: '質問を入力してください。' }, 400)
    if (query.length > 200) return json({ error: '質問は200文字以内でお願いします。' }, 400)

    // 社内ドキュメント検索: 事前用意の Q&A を返す（API 消費なし）
    if (category === 'docs') {
      // 疑似ディレイ
      await new Promise((r) => setTimeout(r, 350 + Math.floor(Math.random() * 350)))
      const qa = getInternalDocAnswer(query)
      if (qa) {
        return json({
          answer: qa.answer,
          matched_ids: qa.matched_doc_ids,
          calculation_note: '',
          records: INTERNAL_DOCS,
          category: 'docs',
          remaining: rl.remaining,
          mock: true,
        })
      }
      return json({
        answer: `**ご質問「${query.slice(0, 40)}」に該当する事前用意の応答が見つかりませんでした。**\n\n本デモはサンプル質問 8 件に対する事前応答のみ動作します。本番運用時は AI が御社の社内ドキュメント全件をベクトル検索して動的に回答します（OpenAI API の<strong>従量課金</strong>が発生）。\n\n左のサンプル質問からお試しください。`,
        matched_ids: [],
        calculation_note: '',
        records: INTERNAL_DOCS,
        category: 'docs',
        remaining: rl.remaining,
        mock: true,
        no_match: true,
      })
    }

    if (!OPENAI_API_KEY) {
      return json({ ...buildMockResult(query), records: SAMPLE_DATA, remaining: rl.remaining })
    }

    const dataAsCsv = [
      'id,date,client,service,industry,region,amount,status',
      ...SAMPLE_DATA.map(r =>
        `${r.id},${r.date},${r.client},${r.service},${r.industry},${r.region},${r.amount},${r.status}`
      ),
    ].join('\n')

    const userMessage = `# 販売データ（CSV）

${dataAsCsv}

# ユーザーの質問
${query}

上記データに基づいて回答してください。`

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
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1200,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[data-search-demo] OpenAI API error:', res.status, errBody)
      if (errBody && /insufficient_quota|exceeded your current quota/i.test(errBody)) {
        return json({ error: 'AIサービスの利用残高が不足しています。' }, 503)
      }
      if (res.status === 429) return json({ error: 'AIサービスのレート制限に達しました。少し時間をおいてから再度お試しください。' }, 429)
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
      console.error('[data-search-demo] JSON parse error:', err, content)
      parsed = { answer: content, matched_ids: [] }
    }

    return json({
      answer: parsed.answer || '',
      matched_ids: Array.isArray(parsed.matched_ids) ? parsed.matched_ids : [],
      calculation_note: parsed.calculation_note || '',
      records: SAMPLE_DATA,
      remaining: rl.remaining,
    })
  } catch (e: any) {
    console.error('[data-search-demo] error:', e)
    return json({ error: e?.message || '予期しないエラーが発生しました。' }, 500)
  }
}

export const GET: APIRoute = async ({ url }) => {
  const category = url.searchParams.get('category') || 'sales'
  if (category === 'docs') {
    return json({ records: INTERNAL_DOCS, sample_questions: SAMPLE_QA.map((q) => q.question) })
  }
  return json({ records: SAMPLE_DATA })
}
