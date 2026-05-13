/**
 * 無料診断のレート制限ヘルパー
 * Supabase の submission_log テーブルを使用
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type RateLimitConfig = {
  perHour?: number   // 1時間あたり同一IPからの上限（既定: 3）
  perDay?: number    // 24時間あたり同一IPからの上限（既定: 10）
}

const DEFAULTS: Required<RateLimitConfig> = {
  perHour: 3,
  perDay: 10,
}

export type RateLimitResult = {
  allowed: boolean
  reason?: 'per_hour_exceeded' | 'per_day_exceeded'
  retryAfterSeconds?: number
}

/**
 * IP からの送信頻度をチェック
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  ip: string,
  config: RateLimitConfig = {},
): Promise<RateLimitResult> {
  const conf = { ...DEFAULTS, ...config }

  // 1時間以内
  const { data: hourCount, error: hourErr } = await supabase
    .rpc('submission_count_by_ip', { p_ip: ip, p_hours: 1 })

  if (hourErr) {
    console.error('[rate-limit] hourly check failed:', hourErr)
    // 安全側に倒す: チェック失敗時は許可（DB問題で全送信を止めない）
    return { allowed: true }
  }

  if (typeof hourCount === 'number' && hourCount >= conf.perHour) {
    return {
      allowed: false,
      reason: 'per_hour_exceeded',
      retryAfterSeconds: 3600,
    }
  }

  // 24時間以内
  const { data: dayCount, error: dayErr } = await supabase
    .rpc('submission_count_by_ip', { p_ip: ip, p_hours: 24 })

  if (dayErr) {
    console.error('[rate-limit] daily check failed:', dayErr)
    return { allowed: true }
  }

  if (typeof dayCount === 'number' && dayCount >= conf.perDay) {
    return {
      allowed: false,
      reason: 'per_day_exceeded',
      retryAfterSeconds: 86400,
    }
  }

  return { allowed: true }
}

/**
 * 送信ログ記録
 */
export async function logSubmission(
  supabase: SupabaseClient,
  params: {
    ip: string
    email?: string
    userAgent?: string
    result: 'success' | 'spam_honeypot' | 'spam_timing' | 'spam_turnstile' | 'rate_limited'
  },
): Promise<void> {
  try {
    await supabase.from('submission_log').insert({
      ip: params.ip,
      email: params.email ?? null,
      user_agent: params.userAgent ?? null,
      result: params.result,
    })
  } catch (err) {
    console.error('[rate-limit] log insertion failed:', err)
    // ログ失敗は処理を止めない
  }
}

/**
 * 月次完了件数（実需）取得
 */
export async function getMonthlyVerifiedCount(
  supabase: SupabaseClient,
): Promise<number> {
  const { data, error } = await supabase.rpc('monthly_verified_count')
  if (error) {
    console.error('[rate-limit] monthly count failed:', error)
    return 0
  }
  return typeof data === 'number' ? data : 0
}
