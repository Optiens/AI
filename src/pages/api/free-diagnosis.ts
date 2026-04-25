import type { APIRoute } from 'astro'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

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
        status: 'new',
      })
      if (dbError) {
        console.error('[free-diagnosis] Supabase error:', dbError)
      }
    } else {
      console.warn('[free-diagnosis] Supabase not configured, skipping DB insert')
    }

    // ---- メール通知（CEOに届く） ----
    if (resend && MAIL_TO) {
      const htmlBody = `
<h2>🔍 無料AI診断 申し込み</h2>
<table style="border-collapse:collapse;font-family:system-ui,sans-serif;">
  <tr><td style="padding:6px 12px;font-weight:bold;">企業・団体名</td><td style="padding:6px 12px;">${escapeHtml(companyName)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">ご担当者名</td><td style="padding:6px 12px;">${escapeHtml(personName)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">メール</td><td style="padding:6px 12px;">${escapeHtml(email)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">業種</td><td style="padding:6px 12px;">${escapeHtml(industryName)}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">従業員数</td><td style="padding:6px 12px;">${escapeHtml(employeeName || '未回答')}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">AI活用度</td><td style="padding:6px 12px;">${escapeHtml(aiLevelName || '未回答')}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">課題</td><td style="padding:6px 12px;">${escapeHtml(challengesText || '未選択')}</td></tr>
  <tr><td style="padding:6px 12px;font-weight:bold;">興味のある領域</td><td style="padding:6px 12px;">${escapeHtml(interestsText || '未選択')}</td></tr>
</table>
${businessDescription ? `<h3 style="margin:16px 0 4px;">事業内容</h3><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(businessDescription)}</pre>` : ''}
${dailyTasks ? `<h3 style="margin:16px 0 4px;">時間がかかっている作業</h3><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(dailyTasks)}</pre>` : ''}
${currentTools ? `<h3 style="margin:16px 0 4px;">使用中のツール</h3><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(currentTools)}</pre>` : ''}
${freeText ? `<h3 style="margin:16px 0 4px;">自由記述</h3><pre style="white-space:pre-wrap;font-family:system-ui,sans-serif;">${escapeHtml(freeText)}</pre>` : ''}
      `.trim()

      const textBody = [
        `【無料AI診断 申し込み】`,
        `企業名: ${companyName}`,
        `担当者: ${personName}`,
        `メール: ${email}`,
        `業種: ${industryName}`,
        `従業員数: ${employeeCount || '未回答'}`,
        `AI活用度: ${aiLevelName || '未回答'}`,
        `課題: ${challengesText || '未選択'}`,
        `興味のある領域: ${interestsText || '未選択'}`,
        businessDescription ? `\n【事業内容】\n${businessDescription}` : '',
        dailyTasks ? `\n【時間がかかっている作業】\n${dailyTasks}` : '',
        currentTools ? `\n【使用中のツール】\n${currentTools}` : '',
        freeText ? `\n【自由記述】\n${freeText}` : '',
      ].filter(Boolean).join('\n')

      const { error: mailError } = await resend.emails.send({
        from: MAIL_FROM,
        to: MAIL_TO,
        replyTo: email,
        subject: `【無料AI診断】${companyName}（${industryName}）`,
        text: textBody,
        html: htmlBody,
      })
      if (mailError) {
        console.error('[free-diagnosis] Resend error:', mailError)
      }
    }

    return redirect('/free-diagnosis-thanks')
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
