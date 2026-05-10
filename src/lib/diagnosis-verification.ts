/**
 * 【簡易版】AI 活用診断 のメール認証（ダブルオプトイン）ヘルパー
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
<p>合同会社Optiensです。<br/>【簡易版】AI活用診断のお申し込みありがとうございます。</p>
<div style="margin:18px 0;padding:14px 18px;background:#FEF3C7;border-left:4px solid #F59E0B;border-radius:4px;">
  <p style="margin:0;font-weight:600;color:#92400E;">⚠️ お申し込みはまだ完了していません</p>
  <p style="margin:6px 0 0;font-size:14px;color:#78350F;">下のボタンをクリックしてメールアドレスをご確認いただいた時点で、お申し込みが完了します。</p>
</div>
<p>確認が完了すると、自動でレポート作成が開始され、<strong>数分以内に Google Slides のリンクをメール</strong>でお送りします。</p>
<p style="margin:24px 0;text-align:center;">
  <a href="${verificationUrl}" style="display:inline-block;padding:14px 32px;background:#1F3A93;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">認証する</a>
</p>
<p style="font-size:13px;color:#666;">
  ※ このリンクは <strong>24時間有効</strong> です。<br/>
  ※ ボタンを押せない場合は、以下の URL をブラウザに直接貼り付けてください：<br/>
  <span style="word-break:break-all;color:#1F3A93;">${verificationUrl}</span><br/>
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
 * 認証ボタン確認ページ（GET時のランディング）
 *
 * 目的: メールセキュリティスキャナ（SafeLinks/Mimecast/Proofpoint等）が
 * リンクを先読みアクセスしてもtokenを消費しないよう、
 * 人間のブラウザでのみ JavaScript で自動 POST して認証を完了させる。
 *
 * 動作:
 * - JS 有効環境: ページ表示と同時に自動 POST → 同一画面で結果を表示（画面遷移なし）
 * - JS 無効環境: <noscript> フォーム submit ボタンを表示（フォールバック）
 * - メールスキャナ: JS 実行しないため token は消費されない
 */
export function buildVerificationConfirmPage(token: string): string {
  const safeToken = escapeHtml(token)
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>認証中… | Optiens</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<style>
  body { font-family: 'Noto Sans JP', sans-serif; padding: 40px 20px; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.8; }
  h1 { color: #1F3A93; font-size: 22px; margin-top: 0; }
  .center { text-align: center; }
  .spinner {
    display: inline-block;
    width: 48px;
    height: 48px;
    border: 4px solid rgba(31, 58, 147, .15);
    border-top-color: #1F3A93;
    border-radius: 50%;
    animation: optiens-spin 0.9s linear infinite;
    margin: 32px 0 16px;
  }
  @keyframes optiens-spin { to { transform: rotate(360deg); } }
  .check { display: inline-block; width: 64px; height: 64px; background: #1F3A93; color: #fff; border-radius: 50%; text-align: center; line-height: 64px; font-size: 32px; margin: 24px 0 8px; }
  .btn { display: inline-block; padding: 14px 32px; background: #1F3A93; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; border: 0; cursor: pointer; font-size: 16px; }
  .note { margin-top: 18px; font-size: 13px; color: #666; }
  .err { color: #C76A77; }
  #fallback { display: none; }
  .noscript-card { margin-top: 24px; padding: 18px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px; color: #78350F; }
</style>
</head>
<body>
<div id="auto-state" class="center">
  <div class="spinner" aria-hidden="true"></div>
  <h1>メールアドレスを認証中…</h1>
  <p class="note">数秒お待ちください。完了すると AI 活用診断レポートの作成が自動で開始されます。</p>
</div>

<noscript>
  <h1>あと一歩で申込完了です</h1>
  <p>JavaScript が無効化されています。下のボタンを押すと申込が完了します。</p>
  <div class="noscript-card">
    <strong>⚠️ 注意</strong><br/>
    このボタンを押した時点でお申込が完了します。
  </div>
  <form method="POST" action="/api/verify-diagnosis" class="center">
    <input type="hidden" name="token" value="${safeToken}"/>
    <button type="submit" class="btn">申込を完了する</button>
  </form>
</noscript>

<div id="fallback" class="center">
  <h1 class="err">認証に失敗しました</h1>
  <p id="err-msg">通信エラーが発生しました。下のボタンで再試行してください。</p>
  <form method="POST" action="/api/verify-diagnosis">
    <input type="hidden" name="token" value="${safeToken}"/>
    <button type="submit" class="btn">手動で認証する</button>
  </form>
</div>

<script>
(function() {
  var token = ${JSON.stringify(token)};
  var stateEl = document.getElementById('auto-state');
  var fallbackEl = document.getElementById('fallback');
  var errMsgEl = document.getElementById('err-msg');

  function showError(msg) {
    if (stateEl) stateEl.style.display = 'none';
    if (errMsgEl && msg) errMsgEl.textContent = msg;
    if (fallbackEl) fallbackEl.style.display = 'block';
  }

  function renderResult(html) {
    // POST が返した HTML を body に差し替えて画面遷移なしで結果表示
    document.open();
    document.write(html);
    document.close();
  }

  var body = new URLSearchParams();
  body.set('token', token);

  fetch('/api/verify-diagnosis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    credentials: 'same-origin'
  }).then(function(res) {
    return res.text().then(function(text) {
      // 認証完了 / 既に認証済み / 期限切れ / 失敗 いずれも HTML が返る → そのまま表示
      renderResult(text);
    });
  }).catch(function(err) {
    showError('通信エラーが発生しました（' + (err && err.message ? err.message : 'unknown') + '）');
  });
})();
</script>
</body>
</html>`
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
<h1 style="text-align:center;">お申し込みが完了しました</h1>
<p>メールアドレスの確認が取れたため、AI 活用診断レポートの作成を自動で開始しました。<br/>
<strong>数分以内に Google Slides のリンク</strong>を、ご登録のメールアドレスへお送りします。</p>
<p style="font-size:14px;color:#666;">※ 万一 30 分経ってもメールが届かない場合は、迷惑メールフォルダをご確認のうえ、<a href="mailto:info@optiens.com">info@optiens.com</a> までお知らせください。</p>
<p style="text-align:center;"><a class="btn" href="https://optiens.com">トップページへ戻る</a></p>
</body>
</html>`
}

/**
 * 認証エラー（無効・期限切れ）HTML
 */
export function buildVerificationErrorPage(
  reason: 'invalid' | 'expired' | 'already' | 'server',
  detail?: string,
): string {
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
    server: {
      title: 'サーバー側で問題が発生しました',
      body: '一時的な不具合の可能性があります。少し時間をおいて再度お試しいただくか、下記までご連絡ください。',
    },
  }
  const m = messages[reason]
  const detailBlock = detail
    ? `<details style="margin-top:18px;font-size:13px;color:#888;"><summary style="cursor:pointer;">技術情報（お問い合わせ時にお伝えください）</summary><pre style="margin-top:8px;padding:10px;background:#f5f5f5;border-radius:4px;overflow:auto;">${escapeHtml(detail)}</pre></details>`
    : ''
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
  .contact { margin-top: 24px; padding: 14px 18px; background: #F8FAFD; border: 1px solid #E2E8F0; border-radius: 8px; font-size: 14px; }
  .contact a { color: #1F3A93; font-weight: 600; }
</style>
</head>
<body>
<h1>${m.title}</h1>
<p>${m.body}</p>
${detailBlock}
<div class="contact">
  解決しない場合は <a href="mailto:info@optiens.com">info@optiens.com</a> までお問い合わせください。
</div>
<p style="text-align:center;"><a class="btn" href="https://optiens.com/free-diagnosis">フォームへ戻る</a></p>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
