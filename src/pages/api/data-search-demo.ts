import type { APIRoute } from 'astro'
import { INTERNAL_DOCS, SAMPLE_QA, getInternalDocAnswer } from '../../lib/internal-docs-mock'
import { getSalesAnswer } from '../../lib/sales-search-mock'

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
        answer: `**ご質問「${query.slice(0, 40)}」に該当する事前用意の応答が見つかりませんでした。**\n\n本デモはサンプル質問 8 件に対する事前応答のみ動作します。実運用時は AI が御社の社内ドキュメント全件をベクトル検索して動的に回答します（OpenAI API の<strong>従量課金</strong>が発生）。\n\n左のサンプル質問からお試しください。`,
        matched_ids: [],
        calculation_note: '',
        records: INTERNAL_DOCS,
        category: 'docs',
        remaining: rl.remaining,
        mock: true,
        no_match: true,
      })
    }

    // 販売データ検索: 事前用意の Q&A を返す（API 消費なし）
    await new Promise((r) => setTimeout(r, 400 + Math.floor(Math.random() * 400)))
    const salesQA = getSalesAnswer(query)
    if (salesQA) {
      return json({
        answer: salesQA.answer,
        matched_ids: salesQA.matched_ids,
        calculation_note: salesQA.calculation_note || '',
        records: SAMPLE_DATA,
        category: 'sales',
        remaining: rl.remaining,
        mock: true,
      })
    }
    return json({
      answer: `**ご質問「${query.slice(0, 40)}」に該当する事前用意の応答が見つかりませんでした。**\n\n本デモはサンプル質問 8 件に対する事前応答のみ動作します。**実運用では AI が動的に回答します**（御社の業務データに対し、自由な質問に対応可能）。\n\n左のサンプル質問からお試しください。`,
      matched_ids: [],
      calculation_note: '',
      records: SAMPLE_DATA,
      category: 'sales',
      remaining: rl.remaining,
      mock: true,
      no_match: true,
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
