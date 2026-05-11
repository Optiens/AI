/**
 * Supabase Edge Function: process-diagnosis
 *
 * フロー:
 * 1. Database Webhook で leads テーブルの新規 INSERT 検知
 * 2. 月次上限チェック
 * 3. Claude API 呼び出し（構造化JSON出力）
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
        required: ['area', 'reason', 'hours_per_month', 'basis', 'steps', 'expected_effect'],
        properties: {
          area: { type: 'string', maxLength: 40 },
          // カードの空白を埋めるため詳細を増やす（80 → 180）
          reason: { type: 'string', minLength: 80, maxLength: 180 },
          // 経営インパクトのある大規模ワークフロー前提（小さすぎる提案は禁止）
          hours_per_month: { type: 'number', minimum: 15, maximum: 80 },
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
        monthly_hours_saved: { type: 'number', minimum: 10, maximum: 200 },
        // 時給 3,500 円換算（中小事業者の事務系時間単価の上限近辺）
        monthly_value_yen: { type: 'number', minimum: 35000, maximum: 700000 },
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
    await markStatus(lead.id, 'processing')

    // 月次上限チェック
    const { count, error: countErr } = await supabase!
      .from('diagnosis_leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['completed', 'manual_review'])
      .gte('created_at', getMonthStart())
      .lt('created_at', getMonthEnd())

    if (countErr) throw new Error(`Count error: ${countErr.message}`)
    if ((count ?? 0) >= MONTHLY_LIMIT) {
      await markStatus(lead.id, 'limit_exceeded')
      await notifyAdmin('月次上限到達', `lead_id=${lead.id} の処理を見送りました。`)
      return new Response('Monthly limit exceeded', { status: 200 })
    }

    // Claude API でレポート内容生成
    const diagnosis = await generateDiagnosis(lead)

    // バリデーション
    const validationErr = validate(diagnosis)
    if (validationErr) {
      await markStatus(lead.id, 'manual_review')
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

    if (isQuotaError && leadForNotify?.id) {
      // クォータ超過 → 翌朝の自動リトライ対象に変更
      await markStatus(leadForNotify.id, 'quota_retry_pending').catch(() => {})
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
      await markStatus(leadForNotify.id, 'manual_review').catch(() => {})
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
  'no-idea': '何に使えるかわからない',
  'cost': 'コストが心配',
  'security': 'セキュリティが不安',
  'no-skill': '社内にスキルがない',
  'no-time': '導入する時間がない',
  'no-effect': '効果が見えない',
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
  'under-30': '〜30万円（小さく試したい）',
  '30-60': '30〜60万円（本格導入を検討）',
  '60-100': '60〜100万円（複数業務を一括）',
  '100-plus': '100万円以上（経営課題として取り組む）',
  'undecided': 'まだ分からない・相談したい',
}

// ===== 課題ごとの「必ず触れるべき観点」を返す =====
function challengeGuidance(challenges: string[]): string {
  const c = new Set(challenges || [])
  const lines: string[] = []
  if (c.has('no-idea')) lines.push('- 「何に使えるかわからない」が選択されたため、業種に典型的な AI 活用シーン 2〜3 例を必ず提示してください')
  if (c.has('cost')) lines.push('- 「コストが心配」が選択されたため、月額費用のレンジ（数千円〜数万円程度）と無料試用の範囲に必ず触れてください')
  if (c.has('security')) lines.push('- 「セキュリティが不安」が選択されたため、機密情報の取り扱い指針（クラウド送信回避・ローカル LLM 等の選択肢）に必ず触れてください')
  if (c.has('no-skill')) lines.push('- 「社内にスキルがない」が選択されたため、初期構築は外部支援前提・運用は伴走で内製化していく段階設計を提示してください')
  if (c.has('no-time')) lines.push('- 「導入する時間がない」が選択されたため、最初の 1 ヶ月で着手できる小さな単位（1 業務・週 30 分削減等）から始める方針を提示してください')
  if (c.has('no-effect')) lines.push('- 「効果が見えない」が選択されたため、ROI 試算（時間削減 × 時給換算）と 3 ヶ月後の評価指標を必ず提示してください')
  return lines.length ? lines.join('\n') : '- 課題は未選択。汎用的な観点で構成してください'
}

// ===== 予算レンジに応じた提案上限の指針 =====
function budgetGuidance(budget?: string): string {
  switch (budget) {
    case 'under-30':
      return '初期費用 30 万円以内で実現可能な「1 業務 1 ツール導入」レベルの提案に絞ってください。複数業務統合・カスタム業務システムは提案外。'
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

【提案方針（最重要・厳守）】
Optiens は「AI エージェントを組み込んだ自動化ワークフロー」を構築・納品する事業者です。
そのため、提案は必ず以下の性質を満たす自動化ワークフローのみとしてください:

✅ 提案して良いもの（エージェント型自動化）:
- 複数システムを横断する自動化（例: 問い合わせメール → 内容分類 → 担当者振り分け → CRM 記録）
- 定型業務の自動実行＋人間の最終確認の仕組み（例: 請求書 PDF 受領 → OCR → 会計ソフト登録 → 担当者通知）
- 業務トリガー連動の自動化（例: 予約サイト新規予約 → 顧客カルテ作成 → 確認メール送信）
- データ収集 → 分析 → 定例レポート自動生成
- 社内データに対する自然言語問い合わせシステム（RAG）

❌ 提案してはいけないもの（汎用 AI 利用レベル）:
- 「SNS 投稿案を作成」「販促文を作成」「FAQ を整理」のような、ChatGPT で個別タスクを依頼するだけのもの
- 業務との統合がない単発生成タスク
- 「AI に聞いて使う」レベルの提案

【表現ルール（厳守）】
- 業種×規模の汎用パターンに基づく方向性のみを示す（個別具体提案は禁止）
- 具体的な AI ツール名（Claude/ChatGPT/Gemini等）は禁止
- アーキテクチャ図は生成しない（仕組みは文章説明のみ）
- 過度な煽り表現禁止（「淘汰」「乗り遅れる」等）
- 「〜と考えられます」「〜が効きそうです」のような方向性表現を使う
- 補助金は名称のみ（申請支援は業務範囲外と明示）
- 提供される【課題別ガイダンス】【予算ガイダンス】【AI活用段階ガイダンス】を必ず反映する

【提案サイズ（最重要・厳守）】
top3 の各ワークフローは「経営インパクトのある大きな業務単位」で提案してください。
- 各ワークフローの hours_per_month は **15〜30 時間/月以上** を基本とする
- 「1業務 5時間/月削減」のような小規模提案は禁止（顧客が導入コストに対して割に合わないと感じる）
- 業務横断・複数ステップを含むワークフロー単位で構成する
  例: 「予約受付〜顧客カルテ作成〜確認メール送信」を 1 ワークフローで扱う
  悪い例: 「予約メールのテンプレ作成」のような単一タスク提案

【出力フィールド説明（重要）】
- current_summary: 現状の課題サマリー（180〜360文字・本文1〜2段落）
  - フォーム入力から読み取れる事業特性・課題・AI 活用段階を踏まえて、現状認識を具体的に記述
  - 抽象論ではなく、「業種特性 × 規模 × 課題 × 関心領域」のクロスで何が起きているかを描写
- summary_points: 現状サマリーの要点を箇条書きで 3〜4 項目（各25〜70文字）
  - current_summary 本文と重複しないよう、本文を補強する観点・データ・業種特性を出す
- top3: 自動化ワークフロー Top3（経営インパクトのある大きな業務単位）
  - area: ワークフロー名（例: 「問い合わせ自動振り分け＋一次返信下書き＋CRM 記録」）
  - reason: なぜそのワークフローが効くか（80〜180文字・カードを埋める情報量で）
    - 現状の業務フローのどこに非効率があるか / そこに AI を入れると何が変わるかを具体的に
    - 抽象表現「効率化される」のみは禁止。属人化解消・対応漏れ防止・夜間対応可能化など具体的論点
  - hours_per_month: 月次削減可能な時間（**15〜30 時間/月以上**を基本）
  - basis: 時間算出の根拠（例: 「1日10件×8分×22営業日 = 約30時間」）
  - steps: ワークフローの処理ステップを 3〜4 個（各12〜45文字）
    例: ["予約サイトの新着予約を 5 分間隔で取得", "予約内容を AI が分類・カルテ自動作成", "確認メール下書きを担当者に通知", "担当者が承認 → 顧客へ自動送信"]
  - expected_effect: 時間削減以外の質的効果（30〜80文字）
    例: 「夜間・休日も自動応答できる体制になり、機会損失と対応漏れの両方を減らせます」
- automation_bullets: AI エージェントに任せやすい業務（3〜5項目・各50文字以内）
- automation_reasoning: なぜそれらを AI に任せられるか（200文字以内）
- human_bullets: 人間が担当する業務（3〜5項目・各50文字以内）
- human_reasoning: なぜそれらを人間が担当するか（200文字以内）
- cost_total_range: 月額運用コストのレンジ（例: 「¥3,000〜¥15,000」）
- cost_breakdown: コスト内訳 3〜5項目（category/amount/basis を含む）
  例: { category: "AI API 利用料", amount: "¥1,500〜¥5,000", basis: "月100リクエスト想定" }
- roi.monthly_hours_saved: top3 の hours_per_month 合計（validateで自動補正されるので大まかでOK）
- roi.monthly_value_yen: monthly_hours_saved × 3500（validateで自動補正）

【ROI 計算ルール】
- top3 の hours_per_month の合計を monthly_hours_saved にする
- monthly_value_yen = monthly_hours_saved × 3500（時給 3,500 円換算 / 事務職の時間単価＋機会損失）
- 数値が大きすぎる場合（200時間/月以上）は現実的にスケールダウン
`.trim()

  // ラベル変換
  const industryLabel = INDUSTRY_LABELS[lead.industry] || lead.industry || '（未入力）'
  const aiLevelLabel = AI_LEVEL_LABELS[lead.ai_level] || lead.ai_level || '（未入力）'
  const challengesLabeled = (lead.challenges || []).map((c: string) => CHALLENGE_LABELS[c] || c).join('、') || '（未選択）'
  const interestsLabeled = (lead.interests || []).map((i: string) => INTEREST_LABELS[i] || i).join('、') || '（未選択）'
  const interestsOtherText = lead.interests_other ? `（その他自由記述: ${lead.interests_other}）` : ''
  const budgetLabel = BUDGET_LABELS[lead.budget_range] || '（未入力）'

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

【課題別ガイダンス（必ず反映）】
${challengeGuidance(lead.challenges || [])}

【予算ガイダンス（必ず反映）】
${budgetGuidance(lead.budget_range)}

【AI活用段階ガイダンス（必ず反映）】
${aiLevelGuidance(lead.ai_level)}

JSON Schema:
${JSON.stringify(DIAGNOSIS_SCHEMA, null, 2)}
`.trim()

  const response = await openai!.chat.completions.create({
    model: OPENAI_MODEL,
    max_completion_tokens: 2500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })

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

  // ROI 自動補正：top3 の hours_per_month 合計を正として再計算
  let totalHours = 0
  for (const t of diagnosis.top3) {
    if (typeof t.hours_per_month !== 'number') return `top3.hours_per_month must be number`
    totalHours += t.hours_per_month
  }
  // 範囲制約
  if (totalHours < 10) totalHours = 10
  if (totalHours > 200) totalHours = 200
  if (!diagnosis.roi) diagnosis.roi = {}
  diagnosis.roi.monthly_hours_saved = Math.round(totalHours)
  // 時給 3,500 円換算（事務職の時間単価＋機会損失込み）
  diagnosis.roi.monthly_value_yen = diagnosis.roi.monthly_hours_saved * 3500

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

  // コスト内訳（配列の長さに応じて 5 行分まで埋め、足りない分は空文字）
  const breakdown = d.cost_breakdown || []
  const costFields: Record<string, string> = {}
  for (let i = 1; i <= 5; i++) {
    const item = breakdown[i - 1] || { category: '', amount: '', basis: '' }
    costFields[`{{cost_category_${i}}}`] = item.category || ''
    costFields[`{{cost_amount_${i}}}`] = item.amount || ''
    costFields[`{{cost_basis_${i}}}`] = item.basis || ''
  }

  // ROI 年間・3 年累計（時給 3,500 円換算）
  const monthlyYen = d.roi.monthly_value_yen
  const annualYen = monthlyYen * 12
  const threeYearYen = monthlyYen * 36
  const monthlyHours = d.roi.monthly_hours_saved
  const annualHours = monthlyHours * 12

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

    // Top3 自動化ワークフロー
    '{{top3_area_1}}': d.top3[0].area,
    '{{top3_reason_1}}': d.top3[0].reason,
    '{{top3_hours_1}}': String(d.top3[0].hours_per_month),
    '{{top3_basis_1}}': d.top3[0].basis,
    '{{top3_steps_1}}': formatSteps(d.top3[0].steps),
    '{{top3_effect_1}}': d.top3[0].expected_effect || '',
    '{{top3_area_2}}': d.top3[1].area,
    '{{top3_reason_2}}': d.top3[1].reason,
    '{{top3_hours_2}}': String(d.top3[1].hours_per_month),
    '{{top3_basis_2}}': d.top3[1].basis,
    '{{top3_steps_2}}': formatSteps(d.top3[1].steps),
    '{{top3_effect_2}}': d.top3[1].expected_effect || '',
    '{{top3_area_3}}': d.top3[2].area,
    '{{top3_reason_3}}': d.top3[2].reason,
    '{{top3_hours_3}}': String(d.top3[2].hours_per_month),
    '{{top3_basis_3}}': d.top3[2].basis,
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

    // ROI（時給 3,500 円換算 / 月次・年間・3 年累計）
    '{{hourly_rate}}': '3,500',
    '{{monthly_hours_saved}}': String(monthlyHours),
    '{{monthly_value_yen}}': monthlyYen.toLocaleString(),
    '{{annual_hours_saved}}': String(annualHours),
    '{{annual_value_yen}}': annualYen.toLocaleString(),
    '{{three_year_value_yen}}': threeYearYen.toLocaleString(),

    // 想定コスト
    '{{cost_total_range}}': d.cost_total_range || '',
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
  const pemContents = GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
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
<p>診断レポートが完成しましたので、下記URLよりご覧ください。</p>
<p style="margin:24px 0;">
  <a href="${slidesUrl}" style="display:inline-block;padding:12px 24px;background:#1F3A93;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">レポートを開く</a>
</p>
<p style="font-size:13px;color:#666;">
  ※ レポートは Google Slides で表示されます。スマートフォン・PC のブラウザでご覧いただけます。<br/>
  ※ 申込番号: <strong>${escapeHtml(appId)}</strong><br/>
  ※ より詳細な分析（アーキテクチャ図・個別自動化提案・導入見積など）をご希望の方は、
  <a href="https://optiens.com/free-diagnosis?paid=1">【詳細版】AI活用診断（¥5,500税込）</a>もご検討ください。
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
async function markStatus(leadId: string, status: string) {
  await supabase!.from('diagnosis_leads').update({ status }).eq('id', leadId)
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
