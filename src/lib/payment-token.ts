/**
 * 申込ごとに固有の「振込完了通知URL」用 HMAC トークン生成・検証。
 *
 * 用途:
 *   - 申込時に applicationId からトークンを生成し、メール本文に
 *     /payment-notify?id={applicationId}&t={token} の形で埋め込む
 *   - お客様がリンクをクリックしたら、サーバ側で同じ HMAC を計算して照合
 *   - 一致したら申込番号に紐づく入金確認のみを実行
 *
 * セキュリティ:
 *   - シークレット PAYMENT_NOTIFY_SECRET は Vercel 環境変数で管理
 *   - timingSafeEqual でタイミング攻撃を防止
 *   - トークンは申込番号ごとに固有・再利用可（複数回クリックしても安全）
 */

import crypto from 'node:crypto'

const SECRET = import.meta.env.PAYMENT_NOTIFY_SECRET

function getSecret(): string {
  if (!SECRET) {
    // 開発時のフォールバック。本番では必ず環境変数で上書きすること。
    console.warn('[payment-token] PAYMENT_NOTIFY_SECRET is not set — using insecure fallback. Set it in Vercel env vars.')
    return 'dev-only-insecure-fallback-do-not-use-in-prod'
  }
  return SECRET
}

export function generatePaymentToken(applicationId: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(applicationId)
    .digest('base64url')
}

export function verifyPaymentToken(applicationId: string, token: string): boolean {
  if (!applicationId || !token) return false
  let expected: string
  try {
    expected = generatePaymentToken(applicationId)
  } catch {
    return false
  }
  if (token.length !== expected.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}
