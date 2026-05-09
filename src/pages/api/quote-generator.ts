import type { APIRoute } from 'astro'

/**
 * /quote-generator デモ用エンドポイント
 *
 * 実装方針:
 * - AI API を呼ばず、事前用意のテンプレートで見積書を組み立てる
 * - 顧客名・案件・金額・納期・特記事項はユーザー入力を反映
 * - 「実運用では AI が動的に回答」のフッタを併記
 */

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

function buildQuoteFromTemplate(input: QuoteInput): QuoteResult {
  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const validUntil = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const validStr = `${validUntil.getFullYear()}年${validUntil.getMonth() + 1}月${validUntil.getDate()}日`
  const quoteNo = `Q-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}-001`

  // プロジェクト概要から内訳を簡易推測（テンプレートとして提示）
  const breakdown = inferBreakdown(input.project, input.amount)

  const notesBlock = input.notes
    ? input.notes
    : '本見積に含まれない項目（追加要件・大幅な仕様変更等）が発生した場合は、別途協議の上見積を提示いたします。\n成果物の知的財産権は検収完了をもって貴社に帰属します。\n秘密保持に関する条項は別途締結のNDAに準じます。'

  const quote = `# 御 見 積 書

**宛先**: ${input.customer} 御中
**作成日**: ${dateStr}
**見積番号**: ${quoteNo}

---

下記の通りお見積もり申し上げます。

## 件名
${input.project}

## 見積金額
**${input.amount}**（税別）

## 内訳（参考）
${breakdown}

## 納期
${input.deadline}

## 有効期限
${validStr}（作成日より 30 日間）

## 支払条件
納品後 30 日以内、銀行振込（GMO あおぞらネット銀行）

## 特記事項
${notesBlock}

---

合同会社 Optiens
〒407-0301 山梨県北杜市高根町清里 3545 番地 2483
Email: info@optiens.com

――
※ 本デモは事前用意のテンプレートで組み立てた見積書です。**実運用では AI が動的に回答します**（過去取引履歴・案件特性に応じた内訳・特記事項の自動生成・社内承認ワークフロー連携まで対応）。`

  return { quote, mock: true }
}

function inferBreakdown(project: string, amount: string): string {
  const text = project.toLowerCase()
  const amtNum = parseInt(amount.replace(/[^\d]/g, ''), 10) || 0

  if (/(crm|顧客管理|案件管理)/.test(text)) {
    return [
      '- 要件ヒアリング・業務フロー設計（含む）',
      '- 画面・データベース設計（含む）',
      '- 実装・統合テスト（含む）',
      '- 操作研修・引渡し（含む）',
    ].join('\n')
  }
  if (/(承認|稟議|ワークフロー)/.test(text)) {
    return [
      '- 承認フロー設計・要件整理',
      '- 申請者・承認者画面の構築',
      '- 通知・連携設定（チャット・メール等）',
      '- 検証・本番展開・操作研修',
    ].join('\n')
  }
  if (/(ai|機械学習|チャット|エージェント)/.test(text)) {
    return [
      '- 用途分析・プロンプト設計',
      '- AI 連携 API・データ前処理の構築',
      '- ガードレール（誤出力対策）の組込み',
      '- 検証・本番展開・運用引渡し',
    ].join('\n')
  }
  if (amtNum >= 1000000) {
    return [
      '- 要件定義・設計フェーズ',
      '- 開発・実装フェーズ',
      '- テスト・検証フェーズ',
      '- 操作研修・本番展開',
    ].join('\n')
  }
  return [
    '- 要件確認・設計（含む）',
    '- 開発・実装（含む）',
    '- 検証・引渡し（含む）',
  ].join('\n')
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

    // 疑似ディレイ
    await new Promise((r) => setTimeout(r, 400 + Math.floor(Math.random() * 400)))

    const result = buildQuoteFromTemplate(input)
    return json({ ...result, remaining: rl.remaining })
  } catch (e: any) {
    console.error('[quote-generator] error:', e)
    return json({ error: e?.message || '予期しないエラーが発生しました。' }, 500)
  }
}
