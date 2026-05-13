/**
 * Cloudflare Turnstile 検証ヘルパー
 * https://developers.cloudflare.com/turnstile/
 *
 * 環境変数:
 * - TURNSTILE_SECRET_KEY: サーバー側シークレットキー
 * - PUBLIC_TURNSTILE_SITE_KEY: クライアント側サイトキー（フロントで使用）
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export type TurnstileVerifyResult = {
  success: boolean
  errorCodes?: string[]
  hostname?: string
  challengeTs?: string
}

/**
 * Cloudflare Turnstile トークンを検証
 *
 * @param token フォームから受信した cf-turnstile-response の値
 * @param remoteIp 送信元IP（任意。提供すると検証精度UP）
 */
export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
): Promise<TurnstileVerifyResult> {
  const secretKey = import.meta.env.TURNSTILE_SECRET_KEY
  const allowMissingSecret = import.meta.env.DIAGNOSIS_ALLOW_MISSING_TURNSTILE === 'true'
  if (!secretKey) {
    if (import.meta.env.PROD && !allowMissingSecret) {
      console.error('[turnstile] TURNSTILE_SECRET_KEY is missing in production')
      return { success: false, errorCodes: ['missing-secret-key'] }
    }
    console.warn('[turnstile] TURNSTILE_SECRET_KEY 未設定。検証スキップ（開発/テストモード）')
    return { success: true, errorCodes: ['missing-secret-key-skipped'] }
  }

  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] }
  }

  const formData = new URLSearchParams()
  formData.append('secret', secretKey)
  formData.append('response', token)
  if (remoteIp) formData.append('remoteip', remoteIp)

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData,
    })
    const data = await res.json() as {
      success: boolean
      'error-codes'?: string[]
      hostname?: string
      challenge_ts?: string
    }
    return {
      success: data.success,
      errorCodes: data['error-codes'],
      hostname: data.hostname,
      challengeTs: data.challenge_ts,
    }
  } catch (err) {
    console.error('[turnstile] verify fetch failed:', err)
    return { success: false, errorCodes: ['network-error'] }
  }
}
