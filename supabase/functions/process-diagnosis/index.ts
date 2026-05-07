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
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const GOOGLE_SLIDES_TEMPLATE_ID = Deno.env.get('GOOGLE_SLIDES_TEMPLATE_ID')!
const GOOGLE_SERVICE_ACCOUNT_EMAIL = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')!
const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY')!

const ADMIN_EMAIL = 'admin@optiens.com'
const FROM_EMAIL = 'no-reply@optiens.com'
const MONTHLY_LIMIT = 30

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const resend = new Resend(RESEND_API_KEY)
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// ===== JSON Schema =====
const DIAGNOSIS_SCHEMA = {
  type: 'object',
  required: ['current_summary', 'top3', 'automation_direction', 'ai_type_recommendation',
    'mechanism_description', 'roi', 'cost_range', 'subsidies'],
  properties: {
    current_summary: { type: 'string', maxLength: 200 },
    top3: {
      type: 'array', minItems: 3, maxItems: 3,
      items: {
        type: 'object',
        required: ['area', 'reason', 'type'],
        properties: {
          area: { type: 'string', maxLength: 30 },
          reason: { type: 'string', maxLength: 60 },
          type: { type: 'string', enum: ['chat', 'RAG', 'agent'] },
        },
      },
    },
    automation_direction: { type: 'string', maxLength: 300 },
    ai_type_recommendation: { type: 'string', maxLength: 200 },
    mechanism_description: { type: 'string', maxLength: 500 },
    roi: {
      type: 'object',
      required: ['monthly_hours_saved', 'monthly_value_yen'],
      properties: {
        monthly_hours_saved: { type: 'number', minimum: 10, maximum: 200 },
        monthly_value_yen: { type: 'number', minimum: 15000, maximum: 300000 },
      },
    },
    cost_range: {
      type: 'string',
      enum: ['月額数千円程度', '月額1〜3万円程度', '月額3〜10万円程度'],
    },
    subsidies: {
      type: 'array', maxItems: 3,
      items: { type: 'string', maxLength: 50 },
    },
  },
}

// ===== Main Handler =====
Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const lead = payload.record  // Supabase Database Webhook 形式

    if (!lead?.id) {
      return new Response('Invalid payload', { status: 400 })
    }

    // 月次上限チェック
    const { count, error: countErr } = await supabase
      .from('leads')
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
    await supabase.from('leads')
      .update({
        status: 'completed',
        slides_url: slidesUrl,
        sent_at: new Date().toISOString(),
      })
      .eq('id', lead.id)

    return new Response('OK', { status: 200 })
  } catch (err) {
    console.error('process-diagnosis error:', err)
    await notifyAdmin('process-diagnosis 例外', String(err))
    return new Response(`Error: ${err}`, { status: 500 })
  }
})

// ===== Claude API: レポート内容生成 =====
async function generateDiagnosis(lead: any) {
  const systemPrompt = `
あなたは Optiens の AI 活用診断レポート生成アシスタントです。
中小事業者向けの「無料診断レポート」の本文を、提供されるフォーム入力に基づいて生成します。

ルール（厳守）:
- 業種×規模の汎用パターンに基づく方向性のみを示す（個別具体提案は禁止）
- 具体的な AI ツール名（Claude/ChatGPT/Gemini等）は禁止
- アーキテクチャ図は生成しない（仕組みは文章説明のみ）
- 導入支援の具体額は禁止（「月額数千円程度」等のレンジのみ）
- 過度な煽り表現禁止（「淘汰」「乗り遅れる」等）
- 「〜と考えられます」「〜が効きそうです」のような方向性表現を使う
- 補助金は名称のみ（申請支援は業務範囲外と明示）
- 出力は JSON Schema に厳密に従う
`.trim()

  const userPrompt = `
以下のフォーム入力をもとに、JSON 形式で診断レポート内容を生成してください。

【会社情報】
会社名: ${lead.company_name}
業種: ${lead.industry}
従業員数: ${lead.employee_count}
AI活用状況: ${lead.ai_level}

【業務情報】
事業内容: ${lead.business_description || '（未入力）'}
日常業務: ${lead.daily_tasks || '（未入力）'}
使用中ツール: ${lead.current_tools || '（未入力）'}
課題: ${(lead.challenges || []).join(', ')}
関心事: ${(lead.interests || []).join(', ')}
自由記述: ${lead.free_text || '（未入力）'}

JSON Schema:
${JSON.stringify(DIAGNOSIS_SCHEMA, null, 2)}
`.trim()

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',  // コスト重視（高品質が必要なら sonnet)
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const text = response.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  return JSON.parse(jsonMatch[0])
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

  // ROI 整合性
  const expectedYen = diagnosis.roi.monthly_hours_saved * 1500
  const actualYen = diagnosis.roi.monthly_value_yen
  if (Math.abs(expectedYen - actualYen) / expectedYen > 0.1) {
    return `ROI mismatch: ${actualYen} != ${expectedYen} (±10%)`
  }

  // top3 件数
  if (diagnosis.top3.length !== 3) return `top3 must be exactly 3 items`

  return null
}

// ===== Google Slides 生成 =====
async function createSlides(lead: any, diagnosis: any): Promise<string> {
  const accessToken = await getGoogleAccessToken()

  // 1. テンプレをコピー
  const copyRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${GOOGLE_SLIDES_TEMPLATE_ID}/copy`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Optiens AI診断レポート - ${lead.company_name} - ${formatDate(new Date())}`,
      }),
    },
  )
  if (!copyRes.ok) throw new Error(`Slides copy failed: ${await copyRes.text()}`)
  const { id: newSlidesId } = await copyRes.json()

  // 2. プレースホルダー置換（batchUpdate）
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

  // 3. 共有設定: anyone with link / viewer
  await fetch(
    `https://www.googleapis.com/drive/v3/files/${newSlidesId}/permissions`,
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
  const map: Record<string, string> = {
    '{{customer_name}}': lead.company_name,
    '{{diagnosis_date}}': formatDate(new Date()),
    '{{current_summary}}': d.current_summary,
    '{{top3_area_1}}': d.top3[0].area,
    '{{top3_reason_1}}': d.top3[0].reason,
    '{{top3_type_1}}': aiTypeLabel(d.top3[0].type),
    '{{top3_area_2}}': d.top3[1].area,
    '{{top3_reason_2}}': d.top3[1].reason,
    '{{top3_type_2}}': aiTypeLabel(d.top3[1].type),
    '{{top3_area_3}}': d.top3[2].area,
    '{{top3_reason_3}}': d.top3[2].reason,
    '{{top3_type_3}}': aiTypeLabel(d.top3[2].type),
    '{{automation_direction}}': d.automation_direction,
    '{{ai_type_recommendation}}': d.ai_type_recommendation,
    '{{mechanism_description}}': d.mechanism_description,
    '{{monthly_hours_saved}}': String(d.roi.monthly_hours_saved),
    '{{monthly_value_yen}}': String(d.roi.monthly_value_yen.toLocaleString()),
    '{{cost_range}}': d.cost_range,
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
  await resend.emails.send({
    from: `Optiens <${FROM_EMAIL}>`,
    to: [lead.email],
    subject: `【Optiens】無料AI活用診断レポートが完成しました`,
    html: buildReportEmailHtml(lead, slidesUrl),
  })
}

function buildReportEmailHtml(lead: any, slidesUrl: string): string {
  return `
<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.8;color:#333;max-width:560px;">
<p>${escapeHtml(lead.company_name)} ${escapeHtml(lead.person_name)} 様</p>
<p>合同会社Optiensです。<br/>無料AI活用診断のお申し込みありがとうございます。</p>
<p>診断レポートが完成しましたので、下記URLよりご覧ください。</p>
<p style="margin:24px 0;">
  <a href="${slidesUrl}" style="display:inline-block;padding:12px 24px;background:#3D6FA0;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">レポートを開く</a>
</p>
<p style="font-size:13px;color:#666;">
  ※ レポートは Google Slides で表示されます。スマートフォン・PC のブラウザでご覧いただけます。<br/>
  ※ より詳細な分析（アーキテクチャ図・個別自動化提案・導入見積など）をご希望の方は、
  <a href="https://optiens.com/free-diagnosis?paid=1">詳細レポート（¥5,500税込）</a>もご検討ください。
</p>
<hr style="margin:32px 0;border:none;border-top:1px solid #ddd;"/>
<p style="font-size:12px;color:#999;">
  合同会社Optiens<br/>
  〒407-0301 山梨県北杜市高根町清里3545番地2483<br/>
  https://optiens.com
</p>
</div>
`.trim()
}

// ===== ヘルパー =====
async function markStatus(leadId: string, status: string) {
  await supabase.from('leads').update({ status }).eq('id', leadId)
}

async function notifyAdmin(subject: string, body: string) {
  try {
    await resend.emails.send({
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
