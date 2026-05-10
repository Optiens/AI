/**
 * AI 活用診断（簡易版）の月次残枠を返すAPI
 * フォームページから GET 呼び出し → 残り N 件を表示
 *
 * 公開数（ユーザー側に見せる数値）= verified_count（=実需）
 * 月次上限は MONTHLY_DIAGNOSIS_LIMIT（30件）
 */
import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { getMonthlyVerifiedCount } from '../../lib/diagnosis-rate-limit'

const MONTHLY_DIAGNOSIS_LIMIT = 30

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

export const GET: APIRoute = async () => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    // Supabase未設定時は満枠扱い（運用上は表示しない）
    return new Response(
      JSON.stringify({ remaining: MONTHLY_DIAGNOSIS_LIMIT, total: MONTHLY_DIAGNOSIS_LIMIT }),
      { status: 200, headers },
    )
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    const used = await getMonthlyVerifiedCount(supabase)
    const remaining = Math.max(0, MONTHLY_DIAGNOSIS_LIMIT - used)
    return new Response(
      JSON.stringify({ remaining, total: MONTHLY_DIAGNOSIS_LIMIT }),
      { status: 200, headers },
    )
  } catch (err) {
    console.error('[diagnosis-quota] error:', err)
    // 取得失敗時は満枠扱い（フォーム送信を阻害しない）
    return new Response(
      JSON.stringify({ remaining: MONTHLY_DIAGNOSIS_LIMIT, total: MONTHLY_DIAGNOSIS_LIMIT }),
      { status: 200, headers },
    )
  }
}
