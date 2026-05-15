/**
 * Supabase Edge Function: process-diagnosis
 *
 * フロー:
 * 1. Database Webhook で leads テーブルの新規 INSERT 検知
 * 2. 月次上限チェック
 * 3. OpenAI API 呼び出し（構造化JSON出力）
 * 4. JSON Schema バリデーション
 * 5. Google Slides API でテンプレコピー → プレースホルダー置換 → 共有設定
 * 6. Resend でレポートメール送信
 * 7. Supabase 更新（status='completed', slides_url, sent_at）
 *
 * 失敗時: status='manual_review' + admin@optiens.com 通知
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3'
import OpenAI from 'https://esm.sh/openai@4'

// LLM モデル（memory: feedback_default-llm-openai.md に準拠、最新モデルを使用）
const OPENAI_MODEL = 'gpt-5.5'

// 環境変数（! を外して空文字を許容、初期化時に検証）
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') || ''
const OPENAI_CONTEXT_WINDOW_TOKENS = Number(Deno.env.get('OPENAI_CONTEXT_WINDOW_TOKENS') || '0') || null

const GOOGLE_SLIDES_TEMPLATE_ID = Deno.env.get('GOOGLE_SLIDES_TEMPLATE_ID') || ''
const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL') || ''
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY') || ''

const ADMIN_EMAIL = 'admin@optiens.com'
const FROM_EMAIL = 'no-reply@optiens.com'
const MONTHLY_LIMIT = 30

/**
 * 環境変数の不足を検出して明示的なエラーを返す。
 * 起動時ではなくリクエスト時に評価することで、
 * 一部の env 不足で他の機能（Resend 経由の admin 通知など）まで死ぬのを防ぐ。
 */
function checkRequiredEnv(): string[] {
  const missing: string[] = []
  if (!SUPABASE_URL) missing.push('SUPABASE_URL')
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  if (!RESEND_API_KEY) missing.push('RESEND_API_KEY')
  if (!OPENAI_API_KEY) missing.push('OPENAI_API_KEY')
  if (!GOOGLE_SLIDES_TEMPLATE_ID) missing.push('GOOGLE_SLIDES_TEMPLATE_ID')
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  if (!GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) missing.push('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')
  return missing
}

// クライアントは env が揃っている場合のみ初期化（不足時は null）
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null

type AiApiEventInput = {
  workflow: string
  provider: string
  model?: string | null
  operation: string
  status: 'success' | 'error' | 'retry' | 'skipped'
  http_status?: number | null
  latency_ms?: number | null
  input_tokens?: number | null
  output_tokens?: number | null
  total_tokens?: number | null
  context_window_tokens?: number | null
  context_remaining_tokens?: number | null
  request_id?: string | null
  lead_id?: string | null
  application_id?: string | null
  error_type?: string | null
  error_message?: string | null
  metadata?: Record<string, unknown>
}

function truncateText(value: unknown, max = 1000): string | null {
  if (value === null || value === undefined) return null
  const text = typeof value === 'string' ? value : String(value)
  return text.length > max ? `${text.slice(0, max)}...` : text
}

function errorToText(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}`
  try {
    return JSON.stringify(err)
  } catch {
    return String(err)
  }
}

function errorHttpStatus(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null
  const maybe = err as Record<string, unknown>
  const status = maybe.status || maybe.statusCode || maybe.code
  if (typeof status === 'number') return status
  if (typeof status === 'string' && /^\d+$/.test(status)) return Number(status)
  return null
}

function classifyAiError(err: unknown): string {
  const status = errorHttpStatus(err)
  const text = errorToText(err).toLowerCase()
  if (status === 401 || status === 403 || /api key|auth|permission/.test(text)) return 'auth'
  if (status === 429 || /quota|insufficient_quota/.test(text)) return 'quota'
  if (/rate[\s_-]?limit|too many requests/.test(text)) return 'rate_limit'
  if (/timeout|network|fetch failed|econnreset|socket/.test(text)) return 'network'
  if (/json|parse|schema|validation/.test(text)) return 'response_format'
  return 'exception'
}

function contextRemaining(totalTokens: number | null | undefined): number | null {
  if (!OPENAI_CONTEXT_WINDOW_TOKENS || !totalTokens) return null
  return Math.max(0, OPENAI_CONTEXT_WINDOW_TOKENS - totalTokens)
}

async function logAiApiEvent(event: AiApiEventInput) {
  if (!supabase) return
  const payload = {
    workflow: event.workflow,
    provider: event.provider,
    model: event.model || null,
    operation: event.operation,
    status: event.status,
    http_status: event.http_status ?? null,
    latency_ms: event.latency_ms ?? null,
    input_tokens: event.input_tokens ?? null,
    output_tokens: event.output_tokens ?? null,
    total_tokens: event.total_tokens ?? null,
    context_window_tokens: event.context_window_tokens ?? null,
    context_remaining_tokens: event.context_remaining_tokens ?? null,
    request_id: truncateText(event.request_id, 200),
    lead_id: truncateText(event.lead_id, 120),
    application_id: truncateText(event.application_id, 120),
    error_type: truncateText(event.error_type, 120),
    error_message: truncateText(event.error_message, 1000),
    metadata: event.metadata || {},
  }

  const { error } = await supabase.from('ai_api_events').insert(payload)
  if (error) {
    console.warn('[ai_api_events] log skipped:', error.message)
  }
}

// ===== JSON Schema（v2.0 テンプレ対応） =====
const DIAGNOSIS_SCHEMA = {
  type: 'object',
  required: ['current_summary', 'summary_points', 'top3', 'automation_direction', 'ai_type_recommendation',
    'mechanism_description', 'automation_bullets', 'automation_reasoning',
    'human_bullets', 'human_reasoning', 'roi', 'cost_total_range', 'cost_breakdown', 'subsidies'],
  properties: {
    // 現状サマリー（本文 + 箇条書きポイントの 2 段構成）
    current_summary: { type: 'string', minLength: 180, maxLength: 360 },
    summary_points: {
      type: 'array', minItems: 3, maxItems: 4,
      items: { type: 'string', minLength: 25, maxLength: 70 },
    },
    top3: {
      type: 'array', minItems: 3, maxItems: 3,
      items: {
        type: 'object',
        required: ['area', 'means', 'staff_level', 'reason', 'hours_per_month', 'basis', 'steps', 'expected_effect'],
        properties: {
          area: { type: 'string', maxLength: 40 },
          // 手段タグ：ai=AIエージェント / integration=システム連携・標準機能 / simple=定型化＋運用
          //   AI を使わなくても解決できる業務は integration / simple を選ぶ
          means: { type: 'string', enum: ['ai', 'integration', 'simple'] },
          // 業務階層タグ：自動化対象が誰の作業を肩代わりするか
          //   part=パート補助業務(¥1,300/h) / staff=一般社員業務(¥2,000/h) / owner=経営者・専門職(¥4,000/h)
          staff_level: { type: 'string', enum: ['part', 'staff', 'owner'] },
          // 簡易版では方向性だけが伝わる程度に留める
          reason: { type: 'string', minLength: 60, maxLength: 130 },
          // 業務規模に応じた現実的な削減時間（小規模事業者では 3-10 時間/月でも価値あり）
          hours_per_month: { type: 'number', minimum: 3, maximum: 80 },
          basis: { type: 'string', maxLength: 50 },
          // 具体的な処理ステップ（カード下部の空白を埋める）
          steps: {
            type: 'array', minItems: 3, maxItems: 4,
            items: { type: 'string', minLength: 12, maxLength: 45 },
          },
          // 時間削減以外の質的効果（属人化解消・対応漏れ防止 等）
          expected_effect: { type: 'string', minLength: 30, maxLength: 80 },
        },
      },
    },
    automation_direction: { type: 'string', maxLength: 300 },
    ai_type_recommendation: { type: 'string', maxLength: 200 },
    mechanism_description: { type: 'string', maxLength: 500 },
    // 業務の仕分け
    automation_bullets: {
      type: 'array', minItems: 3, maxItems: 5,
      items: { type: 'string', maxLength: 50 },
    },
    automation_reasoning: { type: 'string', maxLength: 200 },
    human_bullets: {
      type: 'array', minItems: 3, maxItems: 5,
      items: { type: 'string', maxLength: 50 },
    },
    human_reasoning: { type: 'string', maxLength: 200 },
    // ROI（top3.hours_per_month の合計を validate() で自動補正）
    roi: {
      type: 'object',
      required: ['monthly_hours_saved', 'monthly_value_yen'],
      properties: {
        monthly_hours_saved: { type: 'number', minimum: 5, maximum: 200 },
        // top3 の hours_per_month × staff_level 別時給で validate() が自動補正する
        monthly_value_yen: { type: 'number', minimum: 17500, maximum: 700000 },
      },
    },
    // 想定コスト
    cost_total_range: { type: 'string', maxLength: 50 },
    cost_breakdown: {
      type: 'array', minItems: 3, maxItems: 5,
      items: {
        type: 'object',
        required: ['category', 'amount', 'basis'],
        properties: {
          category: { type: 'string', maxLength: 30 },
          amount: { type: 'string', maxLength: 30 },
          basis: { type: 'string', maxLength: 50 },
        },
      },
    },
    subsidies: {
      type: 'array', maxItems: 3,
      items: { type: 'string', maxLength: 50 },
    },
  },
}

// 階層別時給（2026年厚労省・マイナビ等の公開統計に基づく標準値）
const HOURLY_RATE: Record<string, number> = {
  part: 1300,  // パート・補助業務（在庫チェック・清掃記録等）
  staff: 2000, // 一般社員・スタッフ業務（メール対応・SNS投稿等）
  owner: 4000, // 経営者・専門職業務（戦略判断・メニュー開発等）
}

const HOURLY_RATE_LABEL: Record<string, string> = {
  part: 'パート ¥1,300/h',
  staff: '一般 ¥2,000/h',
  owner: '経営者 ¥4,000/h',
}

function hourlyRate(staffLevel: string): number {
  return HOURLY_RATE[staffLevel] ?? HOURLY_RATE.staff
}

function hourlyRateLabel(staffLevel: string): string {
  return HOURLY_RATE_LABEL[staffLevel] ?? HOURLY_RATE_LABEL.staff
}

function formatYen(value: number): string {
  return Math.round(value).toLocaleString()
}

function implementationFit(monthlyYen: number): {
  judgement: string
  guidanceShort: string
  guidance: string
} {
  if (monthlyYen < 80000) {
    return {
      judgement: '詳細レポートで再選定',
      guidanceShort: 'より効果の大きい業務を探す',
      guidance: '月間効果額が8万円未満のため、現時点で導入支援の見積に進むより、詳細レポートで効果の大きい業務を再選定する段階です。',
    }
  }
  if (monthlyYen < 150000) {
    return {
      judgement: '詳細レポートで見極め',
      guidanceShort: '効果の大きい業務を追加確認',
      guidance: '月間効果額が8万〜15万円のため、いきなり本格導入費を決めず、詳細レポートで対象業務を絞ってから判断するのが妥当です。',
    }
  }
  if (monthlyYen < 300000) {
    return {
      judgement: '個別相談で確認',
      guidanceShort: '範囲と費用対効果の確認が必要',
      guidance: '月間効果額が15万〜30万円のため、導入支援に進む前に対象範囲・連携先・費用対効果を個別相談で確認します。',
    }
  }
  return {
    judgement: '導入支援の候補',
    guidanceShort: '詳細確認後に概算見積へ',
    guidance: '月間効果額が30万円以上見込めるため、導入支援の候補です。詳細ヒアリング後に対象範囲と概算見積を確認します。',
  }
}

// ===== Main Handler =====
Deno.serve(async (req: Request) => {
  // catch 句で lead 情報を参照できるよう、try の外でスコープを宣言
  let leadCache: any = null

  try {
    // 環境変数の事前チェック（早期失敗 + 親切なエラーメッセージ）
    const missing = checkRequiredEnv()
    if (missing.length > 0) {
      const errMsg = `Edge Function 環境変数が未設定: ${missing.join(', ')}\n\n` +
        `修正手順:\n` +
        `1. Supabase Dashboard → Project Settings → Edge Functions → Manage Secrets\n` +
        `2. 上記の名前で値を設定（例: OPENAI_API_KEY=sk-... ）\n` +
        `3. 再デプロイ不要（次回実行から反映）\n\n` +
        `参照: https://supabase.com/docs/guides/functions/secrets`
      console.error('[process-diagnosis] env_missing:', missing.join(','))
      await logAiApiEvent({
        workflow: 'free_diagnosis',
        provider: 'system',
        operation: 'env.check',
        status: 'error',
        error_type: 'env_missing',
        error_message: missing.join(', '),
        metadata: {
          missing,
          anthropic_configured: Boolean(ANTHROPIC_API_KEY),
        },
      }).catch(() => {})
      // resend が使えるなら admin 通知
      if (resend) {
        try {
          await resend!.emails.send({
            from: `Optiens System <${FROM_EMAIL}>`,
            to: [ADMIN_EMAIL],
            subject: '[Optiens Auto-Diagnosis] 環境変数未設定（要対応）',
            text: errMsg,
          })
        } catch {}
      }
      return new Response(errMsg, { status: 500 })
    }

    const payload = await req.json()
    const lead = payload.record  // Supabase Database Webhook 形式
    leadCache = lead  // catch 句で参照可能にする

    if (!lead?.id) {
      return new Response('Invalid payload', { status: 400 })
    }

    // status === 'verified' のみ処理（誤発火防止）
    if (lead.status !== 'verified') {
      return new Response(`Skip: status is "${lead.status}" (only "verified" is processed)`, { status: 200 })
    }

    // processing にロック（再入防止）
    await markStatus(lead.id, 'processing', null)

    // 月次上限チェック
    const { count, error: countErr } = await supabase!
      .from('diagnosis_leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'manual_review'])
      .gte('created_at', getMonthStart())
      .lt('created_at', getMonthEnd())

    if (countErr) throw new Error(`Count error: ${countErr.message}`)
    if ((count ?? 0) >= MONTHLY_LIMIT) {
      await markStatus(lead.id, 'limit_exceeded', 'Monthly limit exceeded')
      await notifyAdmin('月次上限到達', `lead_id=${lead.id} の処理を見送りました。`)
      return new Response('Monthly limit exceeded', { status: 200 })
    }

    // OpenAI API でレポート内容生成
    const diagnosis = await generateDiagnosis(lead)

    // バリデーション
    const validationErr = validate(diagnosis)
    if (validationErr) {
      await logAiApiEvent({
        workflow: 'free_diagnosis',
        provider: 'internal',
        operation: 'diagnosis.validate',
        status: 'error',
        lead_id: String(lead.id),
        application_id: lead.application_id || null,
        error_type: 'validation',
        error_message: validationErr,
      }).catch(() => {})
      await markStatus(lead.id, 'manual_review', `validation: ${validationErr}`)
      await notifyAdmin(
        'バリデーション失敗',
        `lead_id=${lead.id}\n理由: ${validationErr}\n出力:\n${JSON.stringify(diagnosis, null, 2)}`,
      )
      return new Response('Validation failed', { status: 200 })
    }

    // Google Slides 生成
    const slidesUrl = await createSlides(lead, diagnosis)

    // メール送信
    await sendReportEmail(lead, slidesUrl)

    // Supabase 更新
    await supabase!.from('diagnosis_leads')
      .update({
        status: 'completed',
        slides_url: slidesUrl,
        sent_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', lead.id)

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('process-diagnosis error:', err)
    const errStr = String(err)
    // OpenAI クォータ超過（429 / insufficient_quota / rate limit）の検出
    const isQuotaError = /\b429\b|quota|insufficient_quota|rate[\s_-]?limit/i.test(errStr)

    // try 句で保存した lead を使用（req.json() は body 1 度しか読めないため）
    const leadForNotify = leadCache
    if (leadForNotify?.id) {
      await logAiApiEvent({
        workflow: 'free_diagnosis',
        provider: 'system',
        operation: 'process-diagnosis',
        status: isQuotaError ? 'retry' : 'error',
        http_status: errorHttpStatus(err),
        lead_id: String(leadForNotify.id),
        application_id: leadForNotify.application_id || null,
        error_type: classifyAiError(err),
        error_message: errorToText(err),
      }).catch(() => {})
    }

    if (isQuotaError && leadForNotify?.id) {
      // クォータ超過 → 翌朝の自動リトライ対象に変更
      await markStatus(leadForNotify.id, 'quota_retry_pending', `quota: ${errStr}`).catch(() => {})
      // 顧客に遅延通知を自動送信
      try {
        await sendDelayNoticeEmail(leadForNotify)
      } catch (mailErr) {
        console.error('sendDelayNoticeEmail failed:', mailErr)
      }
      await notifyAdmin(
        '[QUOTA] 顧客遅延通知を自動送信＋翌朝リトライ予約',
        `lead_id=${leadForNotify.id}\napplication_id=${leadForNotify.application_id}\n会社名=${leadForNotify.company_name}\n` +
        `顧客への遅延通知メールを送信し、status=quota_retry_pending に変更しました。\n翌朝 7:00 JST の cron で自動的に再処理されます。\n\n元エラー:\n${errStr}`,
      )
      return new Response('Quota error: scheduled for retry', { status: 200 })
    }

    // それ以外の例外
    if (leadForNotify?.id) {
      await markStatus(leadForNotify.id, 'manual_review', `exception: ${errStr}`).catch(() => {})
      await notifyAdmin(
        'process-diagnosis 例外',
        `lead_id=${leadForNotify.id}\napplication_id=${leadForNotify.application_id}\n会社名=${leadForNotify.company_name}\nstatus を manual_review に変更しました。\n\n元エラー:\n${errStr}`,
      )
    } else {
      await notifyAdmin('process-diagnosis 例外（lead 未取得）', errStr)
    }
    return new Response(`Error: ${errStr}`, { status: 500 })
  }
})

// ===== ラベル変換マップ（フォーム値 → 日本語） =====
const AI_LEVEL_LABELS: Record<string, string> = {
  none: 'まだ使っていない',
  interest: '興味はあるが未導入（旧選択肢）',
  trial: '個人的に試している程度',
  partial: '一部業務で活用中',
  active: '組織的に活用中',
}

const INDUSTRY_LABELS: Record<string, string> = {
  accommodation: '宿泊業（ペンション・旅館・ホテル）',
  restaurant: '飲食業（カフェ・レストラン）',
  construction: '建設業（工務店・リフォーム）',
  winery: '醸造所（ワイナリー・ブルワリー）',
  outdoor: 'アウトドア・観光ガイド',
  bakery: 'パン屋・菓子製造',
  agriculture: '農業・畜産業',
  retail: '小売業',
  service: 'サービス業',
  manufacturing: '製造業',
  municipality: '自治体・公共機関',
  other: 'その他',
}

const CHALLENGE_LABELS: Record<string, string> = {
  'what-to-use': '何に使えるかわからない',
  'cost': 'コストが心配',
  'security': 'セキュリティが不安',
  'skill': '社内にスキルがない',
  'time': '導入する時間がない',
  'effect': '効果が見えない',
  'other': 'その他',
}

const INTEREST_LABELS: Record<string, string> = {
  'customer-support': '顧客対応・問い合わせ',
  'marketing': '集客・マーケティング',
  'accounting': '経理・事務作業',
  'content': 'SNS・コンテンツ作成',
  'inventory': '在庫・仕入れ管理',
  'scheduling': '予約・スケジュール管理',
  'analysis': 'データ分析・レポート',
  'training': '社員教育・マニュアル',
  'other': 'その他',
}

const BUDGET_LABELS: Record<string, string> = {
  'under-30': '30万円未満（相談チケットで小さく相談したい）',
  '30-60': '30〜60万円（1業務から導入検討）',
  '60-100': '60〜100万円（1〜2業務の導入検討）',
  '100-plus': '100万円以上（複数業務・経営課題として検討）',
  'undecided': 'まだ分からない・費用帯から相談したい',
}

const LEAD_SOURCE_LABELS: Record<string, string> = {
  'url-file-demo': 'URL・資料からの自動入力デモ',
  'public-demo': '実機デモ・サンプルツール',
  'ai-examples': '業種別AI活用サンプル',
  'role-demo': 'ロール別デモ',
  'blog': 'ブログ記事',
  'search': '検索',
  'referral': '紹介・口コミ',
  'business-group': '商工会・勉強会・地域団体',
  'other': 'その他',
}

// ===== 課題ごとの「必ず触れるべき観点」を返す =====
function challengeGuidance(challenges: string[], challengesOther?: string): string {
  const c = new Set(challenges || [])
  const lines: string[] = []
  if (c.has('what-to-use')) lines.push('- 「何に使えるかわからない」が選択されたため、業種に典型的な AI 活用シーン 2〜3 例を必ず提示してください')
  if (c.has('cost')) lines.push('- 「コストが心配」が選択されたため、無料版では正式見積ではなく、相談チケット・導入支援・月額保守のざっくりした費用帯と、費用が変動する要素に必ず触れてください')
  if (c.has('security')) lines.push('- 「セキュリティが不安」が選択されたため、機密情報の取り扱い指針（クラウド送信回避・ローカル LLM 等の選択肢）に必ず触れてください')
  if (c.has('skill')) lines.push('- 「社内にスキルがない」が選択されたため、初期構築は外部支援前提・運用は伴走で内製化していく段階設計を提示してください')
  if (c.has('time')) lines.push('- 「導入する時間がない」が選択されたため、最初の 1 ヶ月で着手できる小さな単位（1 業務・週 30 分削減等）から始める方針を提示してください')
  if (c.has('effect')) lines.push('- 「効果が見えない」が選択されたため、ROI 試算（時間削減 × 時給換算）と 3 ヶ月後の評価指標を必ず提示してください')
  if (c.has('other') && challengesOther) {
    lines.push(`- 「その他」として次の課題が記載されています: 「${challengesOther}」。この内容に直接応答する観点を冒頭または該当業務の提案で必ず反映してください`)
  } else if (c.has('other')) {
    lines.push('- 「その他」が選択されているが自由記述が空。汎用的な観点で補完してください')
  }
  return lines.length ? lines.join('\n') : '- 課題は未選択。汎用的な観点で構成してください'
}

// ===== 申し込みのきっかけに応じた「見せ方」の指針 =====
function leadSourceGuidance(source?: string, detail?: string, referrer?: string): string {
  const detailText = detail ? ` きっかけ詳細: 「${detail}」。` : ''
  const refText = referrer ? ` 直前参照元URL: ${referrer}。` : ''
  switch (source) {
    case 'url-file-demo':
      return `URL・資料からの自動入力デモを見て申し込んだリードです。current_summary と summary_points では「入力負荷を減らし、既存情報から業務整理できる」体験価値を優先して伝えてください。top3 でも、問い合わせ・資料・台帳・予約情報などの自動読み取り/整理が自然に効く場合は優先候補に入れてください。ただし、業務実態と合わない場合は無理に入れないでください。${detailText}${refText}`
    case 'public-demo':
      return `実機デモ・サンプルツールを見て申し込んだリードです。デモで見た「入力→判定→出力→人の確認」の流れを、顧客の業務に置き換えた説明を優先してください。top3 では、実際に小さく動かせる1業務を最初に示し、デモと導入支援の間にある確認事項も明示してください。${detailText}${refText}`
    case 'ai-examples':
      return `業種別AI活用サンプルを見て申し込んだリードです。業種固有の文脈を厚めにし、「自社にも近い形で使えそう」と感じる表現を優先してください。汎用的なAI説明より、業種・規模・日常業務に近い例を出してください。${detailText}${refText}`
    case 'role-demo':
      return `ロール別デモを見て申し込んだリードです。経営者・管理職・実務担当者など、誰の判断や作業が楽になるかを current_summary / top3 / human_reasoning に反映してください。導入後の画面・通知・確認フローを想像しやすい説明を優先してください。${detailText}${refText}`
    case 'blog':
      return `ブログ記事を読んで申し込んだリードです。detail に記事名や関心テーマがある場合、その論点に1回は応答してください。記事由来の不安や関心を深掘りしすぎず、無料版では次に確認すべき業務へ橋渡ししてください。${detailText}${refText}`
    case 'search':
      return `検索から申し込んだリードです。初見でも分かるように専門用語を抑え、最初に取り組むべき1業務と、相談チケット/詳細レポートに進む判断基準を明確にしてください。${detailText}${refText}`
    case 'referral':
      return `紹介・口コミから申し込んだリードです。信頼関係を損なわないよう、過度な断定や大きな効果額の演出を避け、現実的な小さな一歩と確認ポイントを優先してください。${detailText}${refText}`
    case 'business-group':
      return `商工会・勉強会・地域団体経由のリードです。地域の中小事業者が実行しやすい、低リスク・小さく試せる導入順序を優先してください。補助金は名称や相談先に留め、申請支援を期待させないでください。${detailText}${refText}`
    case 'other':
      return `申し込みのきっかけは「その他」です。detail があれば、その内容を current_summary または top3 の理由に自然に反映してください。${detailText}${refText}`
    default:
      return `申し込みのきっかけは未入力です。業務情報・課題・予算・AI活用段階を優先して構成してください。${detailText}${refText}`
  }
}

// ===== 予算レンジに応じた提案上限の指針 =====
function budgetGuidance(budget?: string): string {
  switch (budget) {
    case 'under-30':
      return '30万円未満を希望しているため、無料版では本格導入ではなく相談チケット・詳細レポート・既存ツール活用の範囲に絞ってください。導入支援の正式見積額は出さず、相談チケットで小さく回収する方針を示してください。'
    case '30-60':
      return '初期費用 30〜60 万円で実現可能な「1〜2 業務の本格導入＋簡易な運用設計」レベルで提案してください。'
    case '60-100':
      return '初期費用 60〜100 万円で実現可能な「複数業務の一括導入＋運用ルール整備」レベルで提案してください。'
    case '100-plus':
      return '初期費用 100 万円以上前提で、業務横断の本格 AI 活用基盤・専用業務システム構築を含めて提案して構いません。'
    case 'undecided':
    case '':
    case undefined:
      return '予算未定のため、3 段階（小さく試す／本格導入／経営課題として取り組む）でレンジ別の提案を併記してください。'
    default:
      return ''
  }
}

// ===== AI 活用段階に応じた解説深度の指針 =====
function aiLevelGuidance(level?: string): string {
  switch (level) {
    case 'none':
    case 'interest':
      return '初心者向けに、AI で何ができるかの基本概念から丁寧に解説してください。専門用語には必ず補足を入れる。'
    case 'trial':
      return '個人試用経験ありの想定で、業務適用にステップアップする際の注意点（情報セキュリティ・運用設計）を厚めに。'
    case 'partial':
      return '既に一部業務で活用中の想定で、組織展開・属人化解消・ROI 可視化の観点を厚めに。'
    case 'active':
      return '組織活用中の想定で、より高度な統合・自動化・社内ガバナンス観点を厚めに。基本概念の解説は最小限に。'
    default:
      return '汎用的な解説深度で構成してください。'
  }
}

// ===== Claude API: レポート内容生成 =====
async function generateDiagnosis(lead: any) {
const systemPrompt = `
あなたは Optiens の AI 活用診断レポート生成アシスタントです。
中小事業者向けの「無料診断レポート」の本文を、提供されるフォーム入力に基づいて生成します。

【無料版の位置づけ（最重要）】
この無料版は、深いコンサルティング資料ではなく「AIによる自動入力・自動分析・Google Slides自動生成」を顧客に体験してもらうデモ兼入口です。
診断内容はあくまで一次診断・方向性提示に留め、顧客が「詳細を確認したい」と思える余白を必ず残してください。
詳細版（¥5,500税込）も利益商品ではなく、導入支援に進む前の有償確認枠・本気度確認・実施範囲整理として扱います。
無料版・詳細版のどちらも最終目的は「導入支援に進むべきかを見極めること」です。

【Optiens の事業ポジション（最重要・厳守）】
Optiens は「業務を最適化する」ことを本業とする事業者です。AI はその手段の 1 つに過ぎません。
そのため、診断は「AI を売りつける診断」ではなく「業務最適化のために AI が効くかを見極める診断」です。
AI が不要・過剰な業務にまで無理やり AI を当てはめてはいけません。
顧客の規模・業務実態を踏まえて、最も適した手段を正直に提案してください。

【提案の手段タグ（必ず付与）】
top3 の各提案には means フィールドを付け、以下のいずれかを選んでください:
- "ai"           = AI エージェント／LLM／OCR／RAG など AI が中核となる仕組み
- "integration"  = 業務システムの標準機能・API 連携・Webhook・Zapier等のノーコード自動化（AI なし）
- "simple"       = 定型メールテンプレ／チェックリスト／フォーム整備／運用ルール整備（AI なし）

判断基準:
- 「定型文・テンプレで済むか？」→ Yes なら simple
- 「既存業務システム（予約・会計・CRM 等）の標準機能や API 連携で済むか？」→ Yes なら integration
- 「分類・要約・自然言語理解・例外判断が必要か？」→ Yes なら ai

AI を使う必要のない業務に AI を提案しないでください（顧客信頼の毀損につながります）。
top3 のうち AI:integration:simple の比率は **業種と課題によって柔軟**に決めて構いません。
（例: 既に予約システムがあるキャンプ場では simple/integration 中心、AI は 0〜1 件でも可）

【業種ごとの現実的な業務規模感（hours_per_month 算出時に参照）】
- accommodation（宿泊・キャンプ場・ペンション）: 問い合わせ 月20-60件 / 予約 月20-80件（平日閑散・週末繁忙）
- restaurant（カフェ・レストラン）: 予約 月50-300件 / 問い合わせ 月20-100件
- construction（工務店）: 見積依頼 月5-30件 / 進行案件 同時 3-10件
- winery（醸造所）: 直販問い合わせ 月10-50件 / 出荷 月50-500件
- outdoor（観光ガイド・アウトドア）: 体験予約 月20-150件（季節差大）
- bakery（パン屋・菓子）: 受注・予約 月30-200件
- agriculture（農業）: 出荷・顧客対応 季節依存（繁忙期 vs 閑散期で 10倍差）
- retail（小売）: 店舗規模依存（個別ヒアリングが必要と明記）
- service（サービス業）: 受注 月10-100件 / 業務内容依存
- manufacturing（製造）: 受発注 月10-200件 / 工程管理依存
- municipality（自治体）: 問い合わせ 月50-500件 / 業務多岐

これら数値はあくまで目安。フォーム入力の「事業内容」「従業員数」「日常業務」から実態を読み取り、
**過大評価しないこと**。月150件など根拠の薄い数値は絶対に使わないでください。
従業員数が少ない（1-5人）場合、各業務量も小さくなる前提で算出してください。

【小さい時間でも価値があるという姿勢】
- 月 3-10 時間の削減でも、それが課題解決につながるなら立派な提案です
- 「月 30 時間以上削減」を無理に作ろうとしないでください
- 顧客が「割に合わない」と感じる過大提案より、現実的な提案の方が信頼を得られます

【表現ルール（厳守）】
- 業種×規模の汎用パターンに基づく方向性のみを示す（個別具体提案は禁止）
- 無料版は「入口デモ兼一次診断」として、詳細すぎる実装手順・正式見積に踏み込まない
- 具体的な AI ツール名（Claude/ChatGPT/Gemini等）は禁止
- アーキテクチャ図は生成しない（仕組みは文章説明のみ）
- 過度な煽り表現禁止（「淘汰」「乗り遅れる」等）
- 「〜と考えられます」「〜が効きそうです」のような方向性表現を使う
- 補助金は名称のみ（申請支援は業務範囲外と明示）
- 提供される【課題別ガイダンス】【予算ガイダンス】【AI活用段階ガイダンス】を必ず反映する

【申し込みのきっかけの扱い（重要）】
- 申し込みのきっかけは、診断の「入口仮説」として使ってください
- current_summary の冒頭、summary_points、top3 の優先順位、automation_direction の説明角度に反映してください
- ただし、きっかけに寄せすぎて、フォーム入力の業務実態・課題・予算と矛盾する提案をしてはいけません
- 「そのデモを見たなら、この業務から見るのが自然」と感じられる程度に、見せ方と順番を調整してください
- きっかけが未入力の場合は、通常通り業種・規模・課題・関心領域を優先してください

【出力フィールド説明（重要）】
- current_summary: 現状の課題サマリー（180〜360文字・本文1〜2段落）
  - フォーム入力から読み取れる事業特性・課題・AI 活用段階を踏まえて、現状認識を具体的に記述
  - 抽象論ではなく、「業種特性 × 規模 × 課題 × 関心領域」のクロスで何が起きているかを描写
- summary_points: 現状サマリーの要点を箇条書きで 3〜4 項目（各25〜70文字）
  - current_summary 本文と重複しないよう、本文を補強する観点・データ・業種特性を出す
- top3: 業務最適化提案 Top3（AI に限らず、最適な手段で提案）
  - area: 提案名（例: 「問い合わせ自動振り分け＋一次返信下書き」「予約システム標準機能の活用と運用整備」）
  - means: 'ai' / 'integration' / 'simple' のいずれか（上記判断基準に従う）
  - staff_level: 自動化対象業務がどの階層を肩代わりするか。'part'（パート補助・¥1,300/h）/ 'staff'（一般社員・¥2,000/h）/ 'owner'（経営者・専門職・¥4,000/h）。
    - 判断基準: 単純反復作業＝part、定型判断を含む事務＝staff、戦略判断・専門知識を要する＝owner。
    - 例: SNS投稿テンプレ運用→staff、メニュー開発・価格設定→owner、清掃記録・在庫チェック→part。
    - ROI 試算は monthly_hours_saved × 階層別時給で算出する（staff_level は加重平均の主要要素）。
  - reason: なぜそれが効きそうか（60〜130文字・方向性が伝わる程度）
    - 現状の業務フローのどこに非効率があるか / そこに AI を入れると何が変わるかを具体的に
    - 抽象表現「効率化される」のみは禁止。属人化解消・対応漏れ防止・夜間対応可能化など具体的論点
  - hours_per_month: 月次削減可能な時間（業種規模感に従い現実的な値で）
  - basis: 時間算出の根拠（例: 「月40件×8分 = 約5時間」「土日のみ予約20件×5分 = 約2時間」）
  - steps: ワークフローの処理ステップを 3〜4 個（各12〜45文字）
    例: ["予約サイトの新着予約を 5 分間隔で取得", "予約内容を AI が分類・カルテ自動作成", "確認メール下書きを担当者に通知", "担当者が承認 → 顧客へ自動送信"]
  - expected_effect: 時間削減以外の質的効果（30〜80文字）
    例: 「夜間・休日も自動応答できる体制になり、機会損失と対応漏れの両方を減らせます」
    AI を使わない提案でも、属人化解消・抜け漏れ防止などの効果を具体的に示してください
- automation_bullets: AI エージェントに任せやすい業務（3〜5項目・各50文字以内）
- automation_reasoning: なぜそれらを AI に任せられるか（200文字以内）
- human_bullets: 人間が担当する業務（3〜5項目・各50文字以内）
- human_reasoning: なぜそれらを人間が担当するか（200文字以内）
- cost_total_range: 無料版では正式見積ではなく、相談チケット〜導入支援までのざっくり費用帯を示す
- cost_breakdown: 無料版で伝えてよい次ステップ費用、導入支援の概算帯、費用が変動する確認項目 3〜5件
  例: { category: "詳細レポート", amount: "¥5,500(税込)", basis: "導入支援前の確認枠" }
  例: { category: "相談チケット", amount: "¥33,000/枚〜(税込)", basis: "30万円未満の相談・小規模作業" }
  例: { category: "導入支援", amount: "¥30万円〜目安", basis: "対象業務・連携先・データ状態で変動" }
- roi.monthly_hours_saved: top3 の hours_per_month 合計（validateで自動補正されるので大まかでOK）
- roi.monthly_value_yen: 各 top3 の hours_per_month × staff_level 別時給の総和（validateで自動補正）

【ROI 計算ルール（業務階層別）】
- top3 の hours_per_month の合計を monthly_hours_saved にする
- monthly_value_yen = 各 top3 について [hours_per_month × 階層別時給] を合算する
  - staff_level='part'  → 時給 ¥1,300（パート・補助業務）
  - staff_level='staff' → 時給 ¥2,000（一般社員・スタッフ業務）
  - staff_level='owner' → 時給 ¥4,000（経営者・専門職業務）
- 階層別時給は厚労省・マイナビ等の公開統計（2025-2026年）に基づく標準値
- 数値が大きすぎる場合（200時間/月以上）は現実的にスケールダウン

【無料版での費用提示ルール】
- 無料版では正式見積・回収期間を断定しない
- ただし、相談チケット・導入支援・月額保守のざっくりした金額帯は提示してよい
- 30万円未満のニーズは導入支援ではなく、相談チケットで回収する導線として扱う
- 低単価の導入支援を期待させる「初期15万円で導入」等の表現は禁止
- 無料版で出すのは、月間効果額、年間効果額、次に詳細確認すべきかの判定、ざっくり費用帯まで
- 導入支援の正式見積は、詳細レポートまたは個別相談で対象業務・連携先・データ状態を確認してから提示する
- 詳細版は単体で利益を出す商品ではなく、導入支援前の確認枠として表現する
`.trim()

  // ラベル変換
  const industryLabel = INDUSTRY_LABELS[lead.industry] || lead.industry || '（未入力）'
  const aiLevelLabel = AI_LEVEL_LABELS[lead.ai_level] || lead.ai_level || '（未入力）'
  const challengesLabeledBase = (lead.challenges || []).map((c: string) => CHALLENGE_LABELS[c] || c).join('、') || '（未選択）'
  const challengesLabeled = lead.challenges_other
    ? `${challengesLabeledBase}（その他自由記述: ${lead.challenges_other}）`
    : challengesLabeledBase
  const interestsLabeled = (lead.interests || []).map((i: string) => INTEREST_LABELS[i] || i).join('、') || '（未選択）'
  const interestsOtherText = lead.interests_other ? `（その他自由記述: ${lead.interests_other}）` : ''
  const budgetLabel = BUDGET_LABELS[lead.budget_range] || '（未入力）'
  const leadSourceLabel = LEAD_SOURCE_LABELS[lead.lead_source] || lead.lead_source || '（未入力）'

  const userPrompt = `
以下のフォーム入力をもとに、JSON 形式で診断レポート内容を生成してください。

【会社情報】
会社名: ${lead.company_name}
業種: ${industryLabel}
従業員数: ${lead.employee_count || '（未入力）'}
AI活用状況: ${aiLevelLabel}
想定予算: ${budgetLabel}

【業務情報】
事業内容: ${lead.business_description || '（未入力）'}
日常業務: ${lead.daily_tasks || '（未入力）'}
使用中ツール: ${lead.current_tools || '（未入力）'}
課題: ${challengesLabeled}
関心事: ${interestsLabeled}${interestsOtherText}
自由記述: ${lead.free_text || '（未入力）'}

【申し込みのきっかけ】
きっかけ: ${leadSourceLabel}
きっかけ詳細: ${lead.lead_source_detail || '（未入力）'}
直前参照元URL: ${lead.entry_referrer || '（未取得）'}

【課題別ガイダンス（必ず反映）】
${challengeGuidance(lead.challenges || [], lead.challenges_other || undefined)}

【予算ガイダンス（必ず反映）】
${budgetGuidance(lead.budget_range)}

【AI活用段階ガイダンス（必ず反映）】
${aiLevelGuidance(lead.ai_level)}

【きっかけ別ガイダンス（必ず反映）】
${leadSourceGuidance(lead.lead_source, lead.lead_source_detail, lead.entry_referrer)}

JSON Schema:
${JSON.stringify(DIAGNOSIS_SCHEMA, null, 2)}
`.trim()

  const startedAt = Date.now()
  let response: any = null

  try {
    response = await openai!.chat.completions.create({
      model: OPENAI_MODEL,
      max_completion_tokens: 2500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    const usage = response.usage || {}
    const totalTokens = typeof usage.total_tokens === 'number' ? usage.total_tokens : null
    await logAiApiEvent({
      workflow: 'free_diagnosis',
      provider: 'openai',
      model: OPENAI_MODEL,
      operation: 'chat.completions.create',
      status: 'success',
      latency_ms: Date.now() - startedAt,
      input_tokens: typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : null,
      output_tokens: typeof usage.completion_tokens === 'number' ? usage.completion_tokens : null,
      total_tokens: totalTokens,
      context_window_tokens: OPENAI_CONTEXT_WINDOW_TOKENS,
      context_remaining_tokens: contextRemaining(totalTokens),
      request_id: response.id || null,
      lead_id: String(lead.id || ''),
      application_id: lead.application_id || null,
      metadata: {
        finish_reason: response.choices?.[0]?.finish_reason || null,
        prompt_tokens_details: usage.prompt_tokens_details || null,
        completion_tokens_details: usage.completion_tokens_details || null,
      },
    }).catch(() => {})

    const text = response.choices[0]?.message?.content || ''
    if (!text) throw new Error('Empty response from OpenAI')

    // response_format=json_object なら基本そのまま JSON 文字列だが、フォールバックで regex 抽出
    try {
      return JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in OpenAI response')
      return JSON.parse(jsonMatch[0])
    }
  } catch (err) {
    const errorType = classifyAiError(err)
    await logAiApiEvent({
      workflow: 'free_diagnosis',
      provider: 'openai',
      model: OPENAI_MODEL,
      operation: 'chat.completions.create',
      status: errorType === 'quota' || errorType === 'rate_limit' ? 'retry' : 'error',
      http_status: errorHttpStatus(err),
      latency_ms: Date.now() - startedAt,
      request_id: response?.id || null,
      lead_id: String(lead.id || ''),
      application_id: lead.application_id || null,
      error_type: errorType,
      error_message: errorToText(err),
    }).catch(() => {})
    throw err
  }
}

// ===== バリデーション =====
function validate(diagnosis: any): string | null {
  // 必須フィールドの存在
  for (const key of DIAGNOSIS_SCHEMA.required) {
    if (!(key in diagnosis)) return `Missing field: ${key}`
  }

  // プレースホルダー残存チェック
  const flat = JSON.stringify(diagnosis)
  if (flat.includes('{{') || flat.includes('[未入力]') || flat.includes('TODO') || flat.includes('XXX')) {
    return 'Placeholder text remains'
  }

  // top3 件数
  if (!Array.isArray(diagnosis.top3) || diagnosis.top3.length !== 3) return `top3 must be exactly 3 items`

  // ROI 自動補正：top3 の hours_per_month 合計 × 階層別時給で再計算
  let totalHours = 0
  let totalValueYen = 0
  for (const t of diagnosis.top3) {
    if (typeof t.hours_per_month !== 'number') return `top3.hours_per_month must be number`
    totalHours += t.hours_per_month
    // 階層別時給で個別計算（staff_level 未指定時は staff レートをデフォルト）
    const rate = hourlyRate(t.staff_level)
    totalValueYen += t.hours_per_month * rate
  }
  // 範囲制約（小規模事業者でも価値ある提案を許容するため下限緩和）
  if (totalHours < 5) totalHours = 5
  if (totalHours > 200) totalHours = 200
  if (!diagnosis.roi) diagnosis.roi = {}
  diagnosis.roi.monthly_hours_saved = Math.round(totalHours)
  // 階層別時給の個別合算と一致させる
  diagnosis.roi.monthly_value_yen = Math.round(totalValueYen)

  // automation_bullets / human_bullets が配列でない場合に備えた防御
  if (!Array.isArray(diagnosis.automation_bullets) || diagnosis.automation_bullets.length < 1) {
    return 'automation_bullets must have at least 1 item'
  }
  if (!Array.isArray(diagnosis.human_bullets) || diagnosis.human_bullets.length < 1) {
    return 'human_bullets must have at least 1 item'
  }
  if (!Array.isArray(diagnosis.cost_breakdown) || diagnosis.cost_breakdown.length < 1) {
    return 'cost_breakdown must have at least 1 item'
  }

  return null
}

// ===== Google Slides 生成 =====
async function createSlides(lead: any, diagnosis: any): Promise<string> {
  const accessToken = await getGoogleAccessToken()

  // 0. テンプレが所属する共有ドライブ ID を取得（コピー先指定に必要）
  const tplMetaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${GOOGLE_SLIDES_TEMPLATE_ID}?fields=driveId&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!tplMetaRes.ok) throw new Error(`Template metadata failed: ${await tplMetaRes.text()}`)
  const { driveId } = await tplMetaRes.json()

  // 1. テンプレをコピー（共有ドライブ対応）
  const copyBody: any = {
    name: `Optiens AI活用診断【簡易版】- ${lead.application_id || 'NO-APPID'} - ${lead.company_name} - ${formatDate(new Date())}`,
  }
  if (driveId) {
    // 共有ドライブ内にコピー（サービスアカウントは My Drive を持たないため必須）
    copyBody.parents = [driveId]
  }
  const copyRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${GOOGLE_SLIDES_TEMPLATE_ID}/copy?supportsAllDrives=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(copyBody),
    },
  )
  if (!copyRes.ok) throw new Error(`Slides copy failed: ${await copyRes.text()}`)
  const { id: newSlidesId } = await copyRes.json()

  // 2. プレースホルダー置換（batchUpdate）— Slides API は supportsAllDrives 不要
  const replacements = buildReplacements(lead, diagnosis)
  await fetch(
    `https://slides.googleapis.com/v1/presentations/${newSlidesId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: replacements }),
    },
  )

  // 3. 共有設定: anyone with link / viewer（共有ドライブ対応）
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${newSlidesId}/permissions?supportsAllDrives=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'anyone', role: 'reader' }),
    },
  )

  return `https://docs.google.com/presentation/d/${newSlidesId}/edit`
}

function buildReplacements(lead: any, d: any) {
  // 業務仕分け（箇条書きを 1 文字列に整形）
  const formatBullets = (arr: string[]) => (arr || []).map(b => '・ ' + b).join('\n')
  // ステップ箇条書き（1. 2. 3. 形式）
  const formatSteps = (arr: string[]) =>
    (arr || []).map((s, i) => `${i + 1}. ${s}`).join('\n')

  // 手段タグ → ラベル付き area 表記
  const meansLabel = (means: string): string => {
    if (means === 'ai') return '[AIエージェント]'
    if (means === 'integration') return '[システム連携]'
    if (means === 'simple') return '[運用整備]'
    return ''
  }
  const decorateArea = (item: any) => {
    const label = meansLabel(item.means || '')
    return label ? `${label} ${item.area}` : item.area
  }

  // ROI 年間・3 年累計（階層別時給で算出）
  const monthlyYen = d.roi.monthly_value_yen
  const annualYen = monthlyYen * 12
  const threeYearYen = monthlyYen * 36
  const monthlyHours = d.roi.monthly_hours_saved
  const annualHours = monthlyHours * 12
  const fit = implementationFit(monthlyYen)
  const freeCostRows = [
    { category: '詳細レポート', amount: '¥5,500(税込)', basis: '導入支援前の確認枠。業務量と導入可否を整理' },
    { category: '相談チケット', amount: '¥33,000/枚〜(税込)', basis: '30万円未満の相談・小規模作業はこちらで対応' },
    { category: '小規模導入支援', amount: '¥30万〜60万円目安', basis: '1業務・既存ツール活用・軽い自動化の範囲' },
    { category: '標準導入支援', amount: '¥60万〜150万円目安', basis: '複数業務・連携・運用設計を含む場合' },
    { category: '月額運用・保守', amount: '¥4.5万円〜目安', basis: 'AI/API/クラウド利用料・保守範囲で変動' },
  ]
  const costFields: Record<string, string> = {}
  for (let i = 1; i <= 5; i++) {
    const item = freeCostRows[i - 1] || { category: '', amount: '', basis: '' }
    costFields[`{{cost_category_${i}}}`] = item.category
    costFields[`{{cost_amount_${i}}}`] = item.amount
    costFields[`{{cost_basis_${i}}}`] = item.basis
  }
  const roiRows = (d.top3 || []).map((t: any) => {
    const hours = Number(t.hours_per_month) || 0
    const rate = hourlyRate(t.staff_level)
    const value = hours * rate
    return {
      hours,
      rate,
      value,
      rateLabel: hourlyRateLabel(t.staff_level),
    }
  })

  // Top3 の総削減時間
  const top3TotalHours = (d.top3 || []).reduce(
    (sum: number, t: any) => sum + (Number(t.hours_per_month) || 0),
    0,
  )

  // サマリー箇条書き
  const summaryPoints = formatBullets(d.summary_points || [])

  const map: Record<string, string> = {
    // 共通
    '{{customer_name}}': lead.company_name,
    '{{diagnosis_date}}': formatDate(new Date()),
    '{{application_id}}': lead.application_id || '',
    '{{current_summary}}': d.current_summary,
    '{{summary_points}}': summaryPoints,

    // Top3 業務最適化提案（手段タグ付き area）
    '{{top3_area_1}}': decorateArea(d.top3[0]),
    '{{top3_reason_1}}': d.top3[0].reason,
    '{{top3_hours_1}}': String(d.top3[0].hours_per_month),
    '{{top3_basis_1}}': d.top3[0].basis,
    '{{top3_rate_label_1}}': roiRows[0]?.rateLabel || '',
    '{{top3_value_yen_1}}': formatYen(roiRows[0]?.value || 0),
    '{{top3_formula_1}}': `${roiRows[0]?.hours || 0}h × ${roiRows[0]?.rateLabel || ''}`,
    '{{top3_steps_1}}': formatSteps(d.top3[0].steps),
    '{{top3_effect_1}}': d.top3[0].expected_effect || '',
    '{{top3_area_2}}': decorateArea(d.top3[1]),
    '{{top3_reason_2}}': d.top3[1].reason,
    '{{top3_hours_2}}': String(d.top3[1].hours_per_month),
    '{{top3_basis_2}}': d.top3[1].basis,
    '{{top3_rate_label_2}}': roiRows[1]?.rateLabel || '',
    '{{top3_value_yen_2}}': formatYen(roiRows[1]?.value || 0),
    '{{top3_formula_2}}': `${roiRows[1]?.hours || 0}h × ${roiRows[1]?.rateLabel || ''}`,
    '{{top3_steps_2}}': formatSteps(d.top3[1].steps),
    '{{top3_effect_2}}': d.top3[1].expected_effect || '',
    '{{top3_area_3}}': decorateArea(d.top3[2]),
    '{{top3_reason_3}}': d.top3[2].reason,
    '{{top3_hours_3}}': String(d.top3[2].hours_per_month),
    '{{top3_basis_3}}': d.top3[2].basis,
    '{{top3_rate_label_3}}': roiRows[2]?.rateLabel || '',
    '{{top3_value_yen_3}}': formatYen(roiRows[2]?.value || 0),
    '{{top3_formula_3}}': `${roiRows[2]?.hours || 0}h × ${roiRows[2]?.rateLabel || ''}`,
    '{{top3_steps_3}}': formatSteps(d.top3[2].steps),
    '{{top3_effect_3}}': d.top3[2].expected_effect || '',
    '{{top3_hours_total}}': String(Math.round(top3TotalHours)),

    // 自動化方針
    '{{automation_direction}}': d.automation_direction,
    '{{ai_type_recommendation}}': d.ai_type_recommendation,
    '{{mechanism_description}}': d.mechanism_description,

    // 業務の仕分け（旧テンプレ「自動化と人間残しの方向性」→「AIと人間の役割分担」想定）
    '{{automation_bullets}}': formatBullets(d.automation_bullets),
    '{{automation_reasoning}}': d.automation_reasoning || '',
    '{{human_bullets}}': formatBullets(d.human_bullets),
    '{{human_reasoning}}': d.human_reasoning || '',

    // ROI（業務階層別時給で算出 / 月次・年間・3 年累計）
    '{{hourly_rate}}': '階層別（パート¥1,300・一般¥2,000・経営者¥4,000）',
    '{{monthly_hours_saved}}': String(monthlyHours),
    '{{monthly_value_yen}}': monthlyYen.toLocaleString(),
    '{{annual_hours_saved}}': String(annualHours),
    '{{annual_value_yen}}': annualYen.toLocaleString(),
    '{{three_year_value_yen}}': threeYearYen.toLocaleString(),
    '{{implementation_judgement}}': fit.judgement,
    '{{implementation_guidance_short}}': fit.guidanceShort,
    '{{implementation_guidance}}': fit.guidance,

    // 業務階層別時給（テンプレ側で内訳表示に使う場合）
    '{{rate_part}}': '1,300',
    '{{rate_staff}}': '2,000',
    '{{rate_owner}}': '4,000',

    // 想定コスト
    '{{cost_total_range}}': '相談チケット¥33,000〜（税込）／導入支援¥30万円〜目安',
    ...costFields,

    // 補助金
    '{{subsidies}}': d.subsidies.length > 0 ? d.subsidies.join(' / ') : '該当なし',
  }

  return Object.entries(map).map(([placeholder, replacement]) => ({
    replaceAllText: {
      containsText: { text: placeholder, matchCase: true },
      replaceText: replacement,
    },
  }))
}

function aiTypeLabel(t: string): string {
  return t === 'chat' ? '💬 チャット型' : t === 'RAG' ? '🔍 RAG' : '🤖 エージェント'
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '/')
}

// ===== Google JWT 認証 =====
async function getGoogleAccessToken(): Promise<string> {
  const jwt = await createJWT()

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  if (!res.ok) throw new Error(`OAuth failed: ${await res.text()}`)
  const { access_token } = await res.json()
  return access_token
}

async function createJWT(): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: 'https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encode = (obj: any) => btoa(JSON.stringify(obj))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const signingInput = `${encode(header)}.${encode(payload)}`

  // PEM → CryptoKey 変換
  const privateKeyLabel = 'PRIVATE KEY'
  const pemContents = GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    .replace(/\\n/g, '\n')
    .replace(`-----BEGIN ${privateKeyLabel}-----`, '')
    .replace(`-----END ${privateKeyLabel}-----`, '')
    .replace(/\s/g, '')
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  )

  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  return `${signingInput}.${sigB64}`
}

// ===== レポートメール送信 =====
async function sendReportEmail(lead: any, slidesUrl: string) {
  await resend!.emails.send({
    from: `Optiens <${FROM_EMAIL}>`,
    to: [lead.email],
    subject: `【Optiens】AI活用診断【簡易版】レポートが完成しました（申込番号: ${lead.application_id || ''}）`,
    html: buildReportEmailHtml(lead, slidesUrl),
  })
}

function buildReportEmailHtml(lead: any, slidesUrl: string): string {
  const appId = String(lead.application_id || '')
  // Gmail の自動プレビュー添付化を避けるため、リンクはテキスト形式で本文に直接記載
  return `
<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.8;color:#333;max-width:560px;">
<p>${escapeHtml(lead.company_name)}<br/>${escapeHtml(lead.person_name)} 様</p>
<p>合同会社Optiensです。<br/>AI活用診断【簡易版】のお申し込みありがとうございます。</p>
<p>診断レポートが完成しましたので、下記URLよりご覧ください。今回のレポートは、フォーム入力からAI分析、Google Slides自動生成までを行うデモも兼ねています。</p>
<p style="margin:24px 0;">
  <a href="${slidesUrl}" style="display:inline-block;padding:12px 24px;background:#1F3A93;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">レポートを開く</a>
</p>
<p style="font-size:13px;color:#666;">
  ※ レポートは Google Slides で表示されます。スマートフォン・PC のブラウザでご覧いただけます。<br/>
  ※ 申込番号: <strong>${escapeHtml(appId)}</strong><br/>
  ※ 簡易版では方向性のみを提示しています。導入可否・実施範囲・費用前提を確認したい場合は、
  詳細レポート（¥5,500税込）をご利用ください。導入支援に進まれた場合、本費用は初期費用に充当します。
</p>
<hr style="margin:32px 0;border:none;border-top:1px solid #ddd;"/>
<p style="font-size:12px;color:#999;">
  合同会社Optiens<br/>
  〒407-0301 山梨県北杜市高根町清里3545番地2483<br/>
  適格請求書発行事業者登録番号: T9090003003025<br/>
  https://optiens.com
</p>
</div>
`.trim()
}

// ===== ヘルパー =====
async function markStatus(leadId: string, status: string, lastError?: string | null) {
  const updates: Record<string, unknown> = { status }
  if (lastError !== undefined) {
    updates.last_error = lastError ? lastError.slice(0, 4000) : null
  }
  await supabase!.from('diagnosis_leads').update(updates).eq('id', leadId)
}

// 顧客向け遅延通知（OpenAI クォータ超過 等の一時的システム障害時）
async function sendDelayNoticeEmail(lead: any) {
  if (!resend || !lead?.email) return
  const safeCompany = escapeHtml(lead.company_name || '')
  const safePerson = escapeHtml(lead.person_name || '')
  const appId = String(lead.application_id || '')
  const text = `${lead.company_name || ''} ${lead.person_name || ''} 様

平素より大変お世話になっております。
合同会社Optiens でございます。

このたびは AI 活用診断にお申し込みいただきありがとうございます。

当社の自動化処理で一時的なシステム不具合が発生し、
本来 1〜2 営業日以内にお届けすべき診断レポートのお届けが遅れております。
心よりお詫び申し上げます。

━━━━━━━━━━━━━━━━━━━━━━
■ 申込番号: ${appId}
━━━━━━━━━━━━━━━━━━━━━━

問題は既に解消に向けて対応しており、
復旧次第、自動的に再処理を行いレポートをお届けいたします。
追加でご対応いただく必要はございません。

通常、翌営業日の早い時間帯までにはお届けできる見込みです。

ご不明な点がございましたら、本メールへの返信、または
info@optiens.com までお問い合わせください。

このたびはご迷惑をおかけして申し訳ございません。

合同会社Optiens
〒407-0301 山梨県北杜市高根町清里3545番地2483
https://optiens.com
`
  const html = `<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.85;color:#333;max-width:560px;">
<p>${safeCompany} ${safePerson} 様</p>

<p>平素より大変お世話になっております。<br/>合同会社Optiens でございます。</p>

<p>このたびは AI 活用診断にお申し込みいただきありがとうございます。</p>

<p>当社の自動化処理で一時的なシステム不具合が発生し、本来 1〜2 営業日以内にお届けすべき診断レポートのお届けが遅れております。<strong>心よりお詫び申し上げます。</strong></p>

<table style="border-collapse:collapse;width:100%;margin:16px 0;background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;">
  <tr><td style="padding:10px 14px;font-weight:bold;background:#FEF3C7;color:#92400E;">申込番号</td><td style="padding:10px 14px;font-family:monospace;font-size:1.1em;color:#92400E;font-weight:bold;">${escapeHtml(appId)}</td></tr>
</table>

<p>問題は既に解消に向けて対応しており、<strong>復旧次第、自動的に再処理を行いレポートをお届けいたします</strong>。追加でご対応いただく必要はございません。</p>

<p>通常、<strong>翌営業日の早い時間帯までにはお届けできる見込み</strong>です。</p>

<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #E2E8F0;font-size:13px;color:#64748b;">
ご不明な点がございましたら、本メールへの返信、または <a href="mailto:info@optiens.com">info@optiens.com</a> までお問い合わせください。<br/>
このたびはご迷惑をおかけして申し訳ございません。
</p>

<p style="margin-top:24px;font-size:12px;color:#94a3b8;">
合同会社Optiens<br/>
〒407-0301 山梨県北杜市高根町清里3545番地2483<br/>
<a href="https://optiens.com">https://optiens.com</a>
</p>
</div>`
  await resend.emails.send({
    from: `Optiens <${FROM_EMAIL}>`,
    to: [lead.email],
    subject: `【Optiens】AI 活用診断レポート お届け遅延のお詫び（申込番号: ${appId}）`,
    text,
    html,
  })
}

async function notifyAdmin(subject: string, body: string) {
  try {
    await resend!.emails.send({
      from: `Optiens System <${FROM_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: `[Optiens Auto-Diagnosis] ${subject}`,
      text: body,
    })
  } catch (err) {
    console.error('Admin notify failed:', err)
  }
}

function escapeHtml(s: string): string {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function getMonthStart(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function getMonthEnd(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString()
}
