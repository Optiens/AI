/**
 * 無料診断のメール認証（ダブルオプトイン）ヘルパー
 */
import { randomBytes } from 'node:crypto'

const SITE_URL = (import.meta.env.SITE_URL || 'https://optiens.com').replace(/\/$/, '')

/**
 * 認証トークン生成（URL-safe base64）
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * 認証URL構築
 */
export function buildVerificationUrl(token: string): string {
  return `${SITE_URL}/api/verify-diagnosis?token=${encodeURIComponent(token)}`
}

/**
 * メール認証依頼メールのHTML生成
 */
export function buildVerificationEmailHtml(params: {
  companyName: string
  personName: string
  verificationUrl: string
}): string {
  const { companyName, personName, verificationUrl } = params
  return `
<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.8;color:#333;max-width:560px;">
<p>${escapeHtml(companyName)} ${escapeHtml(personName)} 様</p>
<p>合同会社Optiensです。<br/>無料AI活用診断のお申し込みありがとうございます。</p>
<p>以下のボタンをクリックしてメールアドレスをご確認ください。<br/>
   確認後、レポート作成を開始し、1〜2営業日以内にお届けします。</p>
<p style="margin:24px 0;text-align:center;">
  <a href="${verificationUrl}" style="display:inline-block;padding:14px 32px;background:#1F3A93;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">メールアドレスを確認する</a>
</p>
<p style="font-size:13px;color:#666;">
  ※ このリンクは24時間有効です。<br/>
  ※ お心当たりがない場合は本メールを破棄してください。
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

/**
 * 認証完了後の表示HTML（成功）
 */
export function buildVerificationSuccessPage(): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>メール確認完了 | Optiens</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: 'Noto Sans JP', sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.8; }
  h1 { color: #1F3A93; font-size: 24px; }
  .check { display: inline-block; width: 64px; height: 64px; background: #1F3A93; color: #fff; border-radius: 50%; text-align: center; line-height: 64px; font-size: 32px; }
  .btn { display: inline-block; padding: 12px 28px; background: #1F3A93; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px; }
</style>
</head>
<body>
<p style="text-align:center;"><span class="check">✓</span></p>
<h1 style="text-align:center;">メールアドレスの確認が完了しました</h1>
<p>無料AI活用診断レポートの作成を開始しました。<br/>
1〜2営業日以内にメールでレポートをお届けします。</p>
<p style="text-align:center;"><a class="btn" href="https://optiens.com">トップページへ戻る</a></p>
</body>
</html>`
}

/**
 * 認証エラー（無効・期限切れ）HTML
 */
export function buildVerificationErrorPage(reason: 'invalid' | 'expired' | 'already'): string {
  const messages: Record<typeof reason, { title: string; body: string }> = {
    invalid: {
      title: '認証リンクが無効です',
      body: 'リンクが正しくないか、すでに使用済みです。お手数ですが再度フォームからお申し込みください。',
    },
    expired: {
      title: '認証リンクの有効期限が切れています',
      body: 'リンクの有効期限（24時間）を過ぎています。お手数ですが再度フォームからお申し込みください。',
    },
    already: {
      title: 'すでに認証済みです',
      body: 'このメールアドレスはすでに認証済みです。レポートの送付をお待ちください。',
    },
  }
  const m = messages[reason]
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${m.title} | Optiens</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: 'Noto Sans JP', sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.8; }
  h1 { color: #C76A77; font-size: 22px; }
  .btn { display: inline-block; padding: 12px 28px; background: #1F3A93; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px; }
</style>
</head>
<body>
<h1>${m.title}</h1>
<p>${m.body}</p>
<p style="text-align:center;"><a class="btn" href="https://optiens.com/free-diagnosis">フォームへ戻る</a></p>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
