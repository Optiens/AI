import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { generatePaymentToken } from '../../lib/payment-token'

const SITE_URL = (import.meta.env.SITE_URL || 'https://optiens.com').replace(/\/$/, '')

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY
const MAIL_TO = import.meta.env.CONTACT_TO ?? import.meta.env.GMAIL_USER
const MAIL_FROM = import.meta.env.CONTACT_FROM ?? 'no-reply@optiens.com'

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
const sanitize = (s: string) => s.replace(/[\r\n\t]+/g, ' ').trim()
const escapeHtml = (s: string) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
const clamp = (s: string, max: number) =>
  s.length > max ? s.slice(0, max) + '…' : s

// 業種ラベル
const industryLabels: Record<string, string> = {
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

const aiLevelLabels: Record<string, string> = {
  none: 'まったく使っていない',
  interest: '興味はあるが未導入',
  trial: '個人的に試している程度',
  partial: '一部業務で活用中',
  active: '組織的に活用中',
}

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    const form = await request.formData()

    // ---- ハニーポット（botが自動入力するhidden field）----
    const hp = String(form.get('website') || '')
    if (hp) return json({ error: 'Bad request' }, 400)

    // ---- タイムスタンプチェック（フォーム表示から3秒未満は bot 判定）----
    const loadedAt = Number(form.get('_t') || 0)
    if (loadedAt > 0 && Date.now() - loadedAt < 3000) {
      return json({ error: 'Bad request' }, 400)
    }

    // ---- フィールド取得 ----
    const companyName = sanitize(String(form.get('company_name') || ''))
    const personName = sanitize(String(form.get('person_name') || ''))
    const email = sanitize(String(form.get('email') || ''))
    const industry = sanitize(String(form.get('industry') || ''))
    const employeeCount = sanitize(String(form.get('employee_count') || ''))
    const aiLevel = sanitize(String(form.get('ai_level') || ''))
    const challenges = form.getAll('challenges').map(c => String(c))
    const businessDescription = clamp(String(form.get('business_description') || '').replace(/\r\n/g, '\n').trim(), 3000)
    const dailyTasks = clamp(String(form.get('daily_tasks') || '').replace(/\r\n/g, '\n').trim(), 3000)
    const currentTools = clamp(String(form.get('current_tools') || '').replace(/\r\n/g, '\n').trim(), 1000)
    const interests = form.getAll('interests').map(i => String(i))
    const freeText = clamp(String(form.get('free_text') || '').replace(/\r\n/g, '\n').trim(), 3000)

    // ---- 詳細レポート向け追加項目（任意） ----
    const businessAge = clamp(String(form.get('business_age') || '').trim(), 200)
    const serviceArea = clamp(String(form.get('service_area') || '').trim(), 200)
    const targetCustomer = clamp(String(form.get('target_customer') || '').trim(), 500)
    const annualRevenueRange = sanitize(String(form.get('annual_revenue_range') || ''))
    const decisionTimeline = sanitize(String(form.get('decision_timeline') || ''))
    const pastItExperience = clamp(String(form.get('past_it_experience') || '').replace(/\r\n/g, '\n').trim(), 2000)

    // ---- プラン（free / paid） ----
    const planRaw = sanitize(String(form.get('plan') || 'free'))
    const plan: 'free' | 'paid' = planRaw === 'paid' ? 'paid' : 'free'

    // ---- 申込番号の自動採番（8桁ランダム英数字・一意性保証） ----
    const applicationId = await generateUniqueApplicationId()

    // ---- バリデーション ----
    if (!companyName || !personName || !email || !industry)
      return json({ error: '必須項目を入力してください' }, 400)
    if (!emailRegex.test(email) || email.length > 254)
      return json({ error: 'メールアドレスの形式が正しくありません' }, 400)

    const industryName = industryLabels[industry] || industry
    const aiLevelName = aiLevelLabels[aiLevel] || aiLevel
    const challengeLabels: Record<string, string> = {
      'what-to-use': '何に使えるかわからない',
      cost: 'コストが心配',
      security: 'セキュリティが不安',
      skill: '社内にスキルがない',
      time: '導入する時間がない',
      effect: '効果が見えない',
    }
    const employeeLabels: Record<string, string> = {
      '1': '1名（個人事業）',
      '2-5': '2〜5名',
      '6-20': '6〜20名',
      '21-50': '21〜50名',
      '51-100': '51〜100名',
      '101+': '101名以上',
    }
    const employeeName = employeeLabels[employeeCount] || employeeCount
    const challengesText = challenges.map(c => challengeLabels[c] || c).join('、')

    const interestLabels: Record<string, string> = {
      'customer-support': '顧客対応・問い合わせ',
      marketing: '集客・マーケティング',
      accounting: '経理・事務作業',
      content: 'SNS・コンテンツ作成',
      inventory: '在庫・仕入れ管理',
      scheduling: '予約・スケジュール管理',
      analysis: 'データ分析・レポート',
      training: '社員教育・マニュアル',
    }
    const interestsText = interests.map(i => interestLabels[i] || i).join('、')

    // ---- Supabase にリード保存 ----
    if (supabase) {
      const { error: dbError } = await supabase.from('diagnosis_leads').insert({
        application_id: applicationId,
        company_name: companyName,
        person_name: personName,
        email,
        industry,
        employee_count: employeeCount || null,
        ai_level: aiLevel || null,
        challenges: challenges.length > 0 ? challenges : null,
        business_description: businessDescription || null,
        daily_tasks: dailyTasks || null,
        current_tools: currentTools || null,
        interests: interests.length > 0 ? interests : null,
        free_text: freeText || null,
        // 詳細レポート向け追加項目
        business_age: businessAge || null,
        service_area: serviceArea || null,
        target_customer: targetCustomer || null,
        annual_revenue_range: annualRevenueRange || null,
        decision_timeline: decisionTimeline || null,
        past_it_experience: pastItExperience || null,
        // プラン
        plan,
        amount_jpy: plan === 'paid' ? 5500 : 0,
        status: plan === 'paid' ? 'pending_payment' : 'new',
      })
      if (dbError) {
        console.error('[free-diagnosis] Supabase error:', dbError)
      }
    } else {
      console.warn('[free-diagnosis] Supabase not configured, skipping DB insert')
    }

    // ---- 追加項目ラベル ----
    const revenueLabels: Record<string, string> = {
      'under-10m': '〜1,000万円',
      '10-30m': '1,000万〜3,000万円',
      '30-50m': '3,000万〜5,000万円',
      '50-100m': '5,000万〜1億円',
      '100-300m': '1億〜3億円',
      '300-1000m': '3億〜10億円',
      'over-1000m': '10億円以上',
    }
    const timelineLabels: Record<string, string> = {
      'asap': 'できるだけ早く',
      '3m': '3ヶ月以内',
      '6m': '半年以内',
      '12m': '1年以内',
      'undecided': '未定（情報収集中）',
    }
    const planLabel = plan === 'paid' ? '【有償・詳細版 ¥5,500税込】' : '【無料・簡易版】'

    // ---- メール通知（CEOに届く） ----
    if (resend && MAIL_TO) {
      const htmlBody = `
<h2>🔍 ${planLabel} AI診断 申し込み</h2>
<p style="color:${plan === 'paid' ? '#0E2A47' : '#475569'};font-weight:bold;font-size:14px;">プラン: ${planLabel}${plan === 'paid' ? ' ／ ステータス: 入金待ち（自動検知）' : ''}</p>
<p style="background:#EEF2FF;padding:8px 14px;border-radius:6px;font-family:monospace;font-size:14px;">申込番号: <strong style="color:#0E2A47;font-size:16px;">${applicationId}</strong></p>
<table style="border-collapse:collapse;font-family:system-ui,sans-serif;">
  <tr><td style="padding:6px 12px;font-weight:bold;">企業・団体名</td><td style="padding:6px 12px;">${escapeHtml(companyName)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">ご担当者名</td><td style="padding:6px 12px;">${escapeHtml(personName)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">メール</td><td style="padding:6px 12px;">${escapeHtml(email)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">業種</td><td style="padding:6px 12px;">${escapeHtml(industryName)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">従業員数</td><td style="padding:6px 12px;">${escapeHtml(employeeName || '未回答')}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">AI活用度</td><td style="padding:6px 12px;">${escapeHtml(aiLevelName || '未回答')}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">課題</td><td style="padding:6px 12px;">${escapeHtml(challengesText || '未選択')}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">興味のある領域</td><td style="padding:6px 12px;">${escapeHtml(interestsText || '未選択')}</td></tr>
  ${businessAge ? `<tr><td style="padding:6px 12px;font-weight:bold;">創業・設立</td><td style="padding:6px 12px;">${escapeHtml(businessAge)}</td></tr>` : ''}
  ${serviceArea ? `<tr><td style="padding:6px 12px;font-weight:bold;">営業エリア</td><td style="padding:6px 12px;">${escapeHtml(serviceArea)}</td></tr>` : ''}
  ${targetCustomer ? `<tr><td style="padding:6px 12px;font-weight:bold;">主要顧客層</td><td style="padding:6px 12px;">${escapeHtml(targetCustomer)}</td></tr>` : ''}
  ${annualRevenueRange ? `<tr><td style="padding:6px 12px;font-weight:bold;">売上規模感</td><td style="padding:6px 12px;">${escapeHtml(revenueLabels[annualRevenueRange] || annualRevenueRange)}</td></tr>` : ''}
  ${decisionTimeline ? `<tr><td style="padding:6px 12px;font-weight:bold;">検討時期</td><td style="padding:6px 12px;">${escapeHtml(timelineLabels[decisionTimeline] || decisionTimeline)}</td></tr>` : ''}
</table>
${businessDescription ? `<h3 style="margin:16px 0 4px;">事業内容</h3><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(businessDescription)}</pre>` : ''}
${dailyTasks ? `<h3 style="margin:16px 0 4px;">時間がかかっている作業</h3><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(dailyTasks)}</pre>` : ''}
${currentTools ? `<h3 style="margin:16px 0 4px;">使用中のツール</h3><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(currentTools)}</pre>` : ''}
${pastItExperience ? `<h3 style="margin:16px 0 4px;">過去のIT導入経験</h3><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(pastItExperience)}</pre>` : ''}
${freeText ? `<h3 style="margin:16px 0 4px;">自由記述</h3><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(freeText)}</pre>` : ''}
${plan === 'paid' ? `<hr style="margin:20px 0;"/><p style="background:#D1FAE5;padding:10px 14px;border-radius:6px;font-size:14px;"><strong>✅ 自動化済み:</strong> 振込先案内メールはお客様へ自動送信済み。入金検知も自動（freee API連携・要セットアップ）。入金確認後、5営業日以内に詳細レポート + MTG日程調整を実施してください。</p>` : ''}
      `.trim()

      const textBody = [
        `${planLabel} AI診断 申し込み`,
        `申込番号: ${applicationId}`,
        plan === 'paid' ? '✅ 振込先案内メールは自動送信済み。入金検知後にレポート作成へ進んでください' : '',
        `企業名: ${companyName}`,
        `担当者: ${personName}`,
        `メール: ${email}`,
        `業種: ${industryName}`,
        `従業員数: ${employeeCount || '未回答'}`,
        `AI活用度: ${aiLevelName || '未回答'}`,
        `課題: ${challengesText || '未選択'}`,
        `興味のある領域: ${interestsText || '未選択'}`,
        businessAge ? `創業・設立: ${businessAge}` : '',
        serviceArea ? `営業エリア: ${serviceArea}` : '',
        targetCustomer ? `主要顧客層: ${targetCustomer}` : '',
        annualRevenueRange ? `売上規模感: ${revenueLabels[annualRevenueRange] || annualRevenueRange}` : '',
        decisionTimeline ? `検討時期: ${timelineLabels[decisionTimeline] || decisionTimeline}` : '',
        businessDescription ? `\n【事業内容】\n${businessDescription}` : '',
        dailyTasks ? `\n【時間がかかっている作業】\n${dailyTasks}` : '',
        currentTools ? `\n【使用中のツール】\n${currentTools}` : '',
        pastItExperience ? `\n【過去のIT導入経験】\n${pastItExperience}` : '',
        freeText ? `\n【自由記述】\n${freeText}` : '',
      ].filter(Boolean).join('\n')

      const subjectPrefix = plan === 'paid' ? '【有償・詳細版 ¥5,500】' : '【無料AI診断】'

      const { error: mailError } = await resend.emails.send({
        from: MAIL_FROM,
        to: MAIL_TO,
        replyTo: email,
        subject: `${subjectPrefix}${applicationId} ${companyName}（${industryName}）`,
        text: textBody,
        html: htmlBody,
      })
      if (mailError) {
        console.error('[free-diagnosis] Resend error:', mailError)
      }
    }

    // ---- お客様への自動返信メール ----
    if (resend && MAIL_FROM) {
      try {
        await resend.emails.send({
          from: MAIL_FROM,
          to: email,
          subject: plan === 'paid'
            ? `【Optiens】詳細AI診断のお申込ありがとうございます（申込番号: ${applicationId}）`
            : `【Optiens】無料AI診断のお申込ありがとうございます（申込番号: ${applicationId}）`,
          text: plan === 'paid' ? buildPaidCustomerEmail(companyName, personName, applicationId, buildNotifyUrl(applicationId)) : buildFreeCustomerEmail(companyName, personName, applicationId),
          html: plan === 'paid' ? buildPaidCustomerEmailHtml(companyName, personName, applicationId, buildNotifyUrl(applicationId)) : buildFreeCustomerEmailHtml(companyName, personName, applicationId),
        })
      } catch (mailErr) {
        console.error('[free-diagnosis] Customer auto-reply error:', mailErr)
      }
    }

    return redirect(plan === 'paid' ? `/free-diagnosis-thanks?plan=paid&id=${encodeURIComponent(applicationId)}` : `/free-diagnosis-thanks?id=${encodeURIComponent(applicationId)}`)
  } catch (error: any) {
    console.error('[free-diagnosis] error:', error?.message ?? String(error))
    return json({ error: '送信に失敗しました。' }, 500)
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

// ===== 申込番号の自動採番（8桁ランダム英数字）=====
// 紛らわしい文字（0,1,I,O）を除外した32字。32^8 = 約1.1兆通り
// 入金照合は freee API + 会社名ファジーマッチで行うため、申込番号は識別ID用途のみ
function generateRandomApplicationId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

// Supabaseで一意性を確認しながら採番（衝突時は最大5回リトライ）
async function generateUniqueApplicationId(): Promise<string> {
  const MAX_RETRIES = 5
  for (let i = 0; i < MAX_RETRIES; i++) {
    const candidate = generateRandomApplicationId()
    if (!supabase) {
      // Supabase未設定時は確認できないのでそのまま返す
      return candidate
    }
    const { data, error } = await supabase
      .from('diagnosis_leads')
      .select('id')
      .eq('application_id', candidate)
      .limit(1)
      .maybeSingle()
    if (error) {
      console.warn('[free-diagnosis] uniqueness check error:', error)
      // Supabaseエラー時はそのまま返す（運用上は衝突確率極小）
      return candidate
    }
    if (!data) {
      return candidate
    }
    console.warn(`[free-diagnosis] application_id collision detected, retrying (${i + 1}/${MAX_RETRIES})`)
  }
  // 5回連続衝突（事実上ありえない）→ タイムスタンプ付与でフォールバック
  return `${generateRandomApplicationId().slice(0, 6)}${Date.now().toString(36).slice(-2).toUpperCase()}`
}

// 振込完了通知URLの組み立て（HMAC署名付き）
function buildNotifyUrl(applicationId: string): string {
  const token = generatePaymentToken(applicationId)
  return `${SITE_URL}/payment-notify?id=${encodeURIComponent(applicationId)}&t=${token}`
}

// ===== お客様向けメール本文 =====
function buildPaidCustomerEmail(companyName: string, personName: string, appId: string, notifyUrl: string): string {
  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const deadlineStr = `${deadline.getFullYear()}年${deadline.getMonth() + 1}月${deadline.getDate()}日`
  return `${companyName} ${personName} 様

合同会社Optiensです。
詳細AI診断（¥5,500・税込）のお申込を受け付けました。

━━━━━━━━━━━━━━━━━━━━━━
■ 申込番号: ${appId}
■ ご利用プラン: 詳細レポート ＋ 60分オンラインMTG
■ ご請求金額: ¥5,500（税込）
━━━━━━━━━━━━━━━━━━━━━━

下記口座へお振込をお願いいたします。

━━━ お振込先 ━━━
金融機関  : GMOあおぞらネット銀行（金融機関コード 0310）
支店    : フリー支店（支店コード 101）
預金種別  : 普通
口座番号  : 1211110
口座名義  : ゴウドウガイシャオプティエンス
振込金額  : ¥5,500（税込）
振込期限  : ${deadlineStr}（お申込から7日以内）

━━━ お振込時のお願い ━━━
振込人名義は、お申込時にご入力いただいた【${companyName}】でお振込ください。
お振込確認後、自動で入金検知し、迅速にレポート作成プロセスへ進みます。

━━━ この後の流れ ━━━
1. 上記口座へお振込（手数料はお客様ご負担）
2. お振込み後、下記URLをクリックいただくと即座に入金確認を試みます
   ${notifyUrl}
   （クリックを忘れた場合も、毎朝9時に自動で入金確認しますのでご安心ください）
3. 入金確認後「入金を確認しました」メールを自動送信
4. 5営業日以内に詳細レポート + 60分MTG日程調整リンクをお届け

━━━━━━━━━━━━━━━━━━━━━━
※ 領収書・適格請求書（インボイス）の発行に対応しています
※ 導入支援契約に進まれた場合、本費用は初期費用に全額充当します
━━━━━━━━━━━━━━━━━━━━━━

ご不明な点は info@optiens.com までお気軽にお問い合わせください。

合同会社Optiens
〒407-0301 山梨県北杜市高根町清里3545番地2483
https://optiens.com
`
}

function buildPaidCustomerEmailHtml(companyName: string, personName: string, appId: string, notifyUrl: string): string {
  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const deadlineStr = `${deadline.getFullYear()}年${deadline.getMonth() + 1}月${deadline.getDate()}日`
  const safeCompany = escapeHtml(companyName)
  const safePerson = escapeHtml(personName)
  return `<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.8;color:#333;max-width:560px;">
<p>${safeCompany} ${safePerson} 様</p>
<p>合同会社Optiensです。<br/>詳細AI診断（¥5,500・税込）のお申込を受け付けました。</p>

<table style="border-collapse:collapse;width:100%;margin:16px 0;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
  <tr><td style="padding:8px 14px;font-weight:bold;background:#EEF2FF;">申込番号</td><td style="padding:8px 14px;font-family:monospace;font-size:1.1em;color:#0E2A47;font-weight:bold;">${appId}</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;background:#EEF2FF;">プラン</td><td style="padding:8px 14px;">詳細レポート + 60分オンラインMTG</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;background:#EEF2FF;">ご請求金額</td><td style="padding:8px 14px;"><strong>¥5,500（税込）</strong></td></tr>
</table>

<h3 style="margin:24px 0 8px;font-size:14px;color:#0f172a;">お振込先</h3>
<table style="border-collapse:collapse;width:100%;font-size:14px;">
  <tr><td style="padding:6px 12px;color:#64748b;width:120px;">金融機関</td><td style="padding:6px 12px;">GMOあおぞらネット銀行（金融機関コード 0310）</td></tr>
  <tr><td style="padding:6px 12px;color:#64748b;">支店</td><td style="padding:6px 12px;">フリー支店（支店コード 101）</td></tr>
  <tr><td style="padding:6px 12px;color:#64748b;">預金種別</td><td style="padding:6px 12px;">普通</td></tr>
  <tr><td style="padding:6px 12px;color:#64748b;">口座番号</td><td style="padding:6px 12px;font-family:monospace;font-size:1.1em;">1211110</td></tr>
  <tr><td style="padding:6px 12px;color:#64748b;">口座名義</td><td style="padding:6px 12px;">ゴウドウガイシャオプティエンス</td></tr>
  <tr><td style="padding:6px 12px;color:#64748b;">振込金額</td><td style="padding:6px 12px;"><strong>¥5,500（税込）</strong></td></tr>
  <tr><td style="padding:6px 12px;color:#64748b;">振込期限</td><td style="padding:6px 12px;">${deadlineStr}（お申込から7日以内）</td></tr>
</table>

<div style="margin:20px 0;padding:14px 16px;background:#EEF2FF;border-left:4px solid #5B7FFF;border-radius:4px;">
<p style="margin:0 0 6px;font-weight:bold;color:#1e3a8a;">お振込時のお願い</p>
<p style="margin:0;font-size:14px;color:#1e40af;">振込人名義は、お申込時にご入力いただいた <strong>${escapeHtml(companyName)}</strong> でお振込ください。<br/>
お振込確認後、自動で入金検知し、迅速にレポート作成プロセスへ進みます。</p>
</div>

<h3 style="margin:24px 0 8px;font-size:14px;color:#0f172a;">この後の流れ</h3>
<ol style="margin:0 0 16px;padding-left:20px;font-size:14px;">
  <li>上記口座へお振込</li>
  <li>お振込み後、下記ボタンをクリックいただくと即座に入金確認を試みます<br/>
    <a href="${notifyUrl}" style="display:inline-block;margin:10px 0 6px;padding:12px 24px;background:#5B7FFF;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:14px;">▶ 振込完了を通知する</a><br/>
    <span style="font-size:12px;color:#64748b;">クリックを忘れた場合も、毎朝9時に自動で入金確認します</span>
  </li>
  <li>入金確認後「入金を確認しました」メールを自動送信</li>
  <li>5営業日以内に<strong>詳細レポート + 60分MTG日程調整リンク</strong>をお届け</li>
</ol>

<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #E2E8F0;font-size:12px;color:#64748b;">
※ 領収書・適格請求書（インボイス）の発行に対応しています<br/>
※ 導入支援契約に進まれた場合、本費用は初期費用に全額充当します<br/>
※ お振込手数料はお客様ご負担となります<br/><br/>
ご不明な点は <a href="mailto:info@optiens.com">info@optiens.com</a> までお気軽にお問い合わせください。
</p>

<p style="margin-top:24px;font-size:12px;color:#64748b;">
合同会社Optiens<br/>
〒407-0301 山梨県北杜市高根町清里3545番地2483<br/>
<a href="https://optiens.com">https://optiens.com</a>
</p>
</div>`
}

function buildFreeCustomerEmail(companyName: string, personName: string, appId: string): string {
  return `${companyName} ${personName} 様

合同会社Optiensです。
無料AI診断のお申込を受け付けました。

━━━━━━━━━━━━━━━━━━━━━━
■ 申込番号: ${appId}
■ ご利用プラン: 無料・簡易版
■ レポートお届け: 1〜2営業日以内
━━━━━━━━━━━━━━━━━━━━━━

ご入力いただいた業務情報をもとに、
あなたの事業に合ったAI活用ポイントをまとめた簡易レポート（2〜3ページ）を
1〜2営業日以内にメールでお届けします。

ご不明な点や、より詳しい提案（詳細レポート + 60分MTG ¥5,500税込）をご希望の場合は、
お気軽に info@optiens.com までご連絡ください。

合同会社Optiens
〒407-0301 山梨県北杜市高根町清里3545番地2483
https://optiens.com
`
}

function buildFreeCustomerEmailHtml(companyName: string, personName: string, appId: string): string {
  const safeCompany = escapeHtml(companyName)
  const safePerson = escapeHtml(personName)
  return `<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.8;color:#333;max-width:560px;">
<p>${safeCompany} ${safePerson} 様</p>
<p>合同会社Optiensです。<br/>無料AI診断のお申込を受け付けました。</p>

<table style="border-collapse:collapse;width:100%;margin:16px 0;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;">
  <tr><td style="padding:8px 14px;font-weight:bold;background:#EEF2FF;">申込番号</td><td style="padding:8px 14px;font-family:monospace;font-size:1.1em;color:#0E2A47;font-weight:bold;">${appId}</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;background:#EEF2FF;">プラン</td><td style="padding:8px 14px;">無料・簡易版</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;background:#EEF2FF;">レポートお届け</td><td style="padding:8px 14px;">1〜2営業日以内</td></tr>
</table>

<p>ご入力いただいた業務情報をもとに、あなたの事業に合ったAI活用ポイントをまとめた簡易レポート（2〜3ページ）を1〜2営業日以内にメールでお届けします。</p>

<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #E2E8F0;font-size:13px;color:#64748b;">
ご不明な点や、より詳しい提案（詳細レポート + 60分MTG ¥5,500税込）をご希望の場合は、お気軽に <a href="mailto:info@optiens.com">info@optiens.com</a> までご連絡ください。
</p>

<p style="margin-top:24px;font-size:12px;color:#64748b;">
合同会社Optiens<br/>
〒407-0301 山梨県北杜市高根町清里3545番地2483<br/>
<a href="https://optiens.com">https://optiens.com</a>
</p>
</div>`
}
