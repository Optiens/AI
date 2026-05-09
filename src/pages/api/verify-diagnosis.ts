/**
 * 無料診断のメール認証エンドポイント
 * URL: /api/verify-diagnosis?token=xxx
 *
 * フロー:
 * 1. token を Supabase で検索
 * 2. 該当 lead を verified に更新（verified_at = now）
 * 3. token を NULL（再利用防止）
 * 4. ユーザーに認証完了ページを表示
 * 5. Database Webhook が process-diagnosis Edge Function を発火
 */
import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import {
  buildVerificationSuccessPage,
  buildVerificationErrorPage,
} from '../../lib/diagnosis-verification'

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  const htmlResponse = (body: string, status = 200) =>
    new Response(body, {
      status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })

  // 環境変数チェック
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[verify-diagnosis] Missing env vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return htmlResponse(
      buildVerificationErrorPage('server', 'env: SUPABASE_URL/SERVICE_KEY not configured'),
      500,
    )
  }

  // token チェック
  if (!token) {
    return htmlResponse(buildVerificationErrorPage('invalid', 'no_token_param'), 400)
  }

  let supabase
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  } catch (err: any) {
    console.error('[verify-diagnosis] supabase client init failed:', err)
    return htmlResponse(
      buildVerificationErrorPage('server', `client_init: ${err?.message || String(err)}`),
      500,
    )
  }

  // token で検索
  let lead: { id: string; status: string | null; created_at: string; verified_at: string | null } | null = null
  try {
    const { data, error } = await supabase
      .from('diagnosis_leads')
      .select('id, status, created_at, verified_at')
      .eq('verification_token', token)
      .maybeSingle()

    if (error) {
      console.error('[verify-diagnosis] select error:', error)
      return htmlResponse(
        buildVerificationErrorPage('server', `select: ${error.message} (code=${error.code})`),
        500,
      )
    }
    lead = data as typeof lead
  } catch (err: any) {
    console.error('[verify-diagnosis] select threw:', err)
    return htmlResponse(
      buildVerificationErrorPage('server', `select_throw: ${err?.message || String(err)}`),
      500,
    )
  }

  if (!lead) {
    return htmlResponse(buildVerificationErrorPage('invalid', 'token_not_found_or_used'), 404)
  }

  // 既に認証済み
  if (lead.verified_at) {
    return htmlResponse(buildVerificationErrorPage('already'), 200)
  }

  // 期限切れ（作成から24時間）
  const createdAt = new Date(lead.created_at)
  const now = Date.now()
  if (now - createdAt.getTime() > 24 * 60 * 60 * 1000) {
    return htmlResponse(buildVerificationErrorPage('expired'), 410)
  }

  // 認証完了処理
  try {
    const { error: updateErr } = await supabase
      .from('diagnosis_leads')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        verification_token: null, // 再利用防止
      })
      .eq('id', lead.id)

    if (updateErr) {
      console.error('[verify-diagnosis] update failed:', updateErr)
      return htmlResponse(
        buildVerificationErrorPage('server', `update: ${updateErr.message} (code=${updateErr.code})`),
        500,
      )
    }
  } catch (err: any) {
    console.error('[verify-diagnosis] update threw:', err)
    return htmlResponse(
      buildVerificationErrorPage('server', `update_throw: ${err?.message || String(err)}`),
      500,
    )
  }

  return htmlResponse(buildVerificationSuccessPage(), 200)
}
