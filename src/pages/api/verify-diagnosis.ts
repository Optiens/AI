/**
 * AI 活用診断（無料版）のメール認証エンドポイント
 * URL: /api/verify-diagnosis?token=xxx
 *
 * 2段階フロー（メールセキュリティスキャナ対策）:
 * - GET:  token のみを受け取り、ユーザー向けに「申込を完了する」ボタンを表示。
 *         DB は変更しない（SafeLinks/Mimecast/Proofpoint 等の先読みでも token を消費しない）。
 * - POST: ユーザーがボタンを押した時にのみ token を消費し、verified に更新する。
 *
 * これにより、メール送信直後に発生していた
 * 「セキュリティスキャナがリンクを先読みして token が消費 → ユーザークリック時に invalid」
 * の事故を防止する。
 */
import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import {
  buildVerificationConfirmPage,
  buildVerificationSuccessPage,
  buildVerificationErrorPage,
} from '../../lib/diagnosis-verification'

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

const htmlResponse = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })

/**
 * GET: 確認ボタン付きランディングページを表示するのみ。
 * DB 操作なし。token がない場合のみエラー表示。
 */
export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (!token) {
    return htmlResponse(buildVerificationErrorPage('invalid', 'no_token_param'), 400)
  }
  return htmlResponse(buildVerificationConfirmPage(token), 200)
}

/**
 * POST: 実際の認証処理。token を消費し verified に更新。
 * フォームは GET ランディングページから submit される。
 */
export const POST: APIRoute = async ({ request }) => {
  // token を form-encoded body から取得（フォームsubmit想定）
  let token = ''
  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      token = String(form.get('token') || '')
    } else {
      // JSON フォールバック
      const body = await request.json().catch(() => ({}))
      token = String(body?.token || '')
    }
  } catch (err: any) {
    console.error('[verify-diagnosis][POST] body parse failed:', err)
    return htmlResponse(
      buildVerificationErrorPage('invalid', `body_parse: ${err?.message || String(err)}`),
      400,
    )
  }

  // 環境変数チェック
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[verify-diagnosis][POST] Missing env vars: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return htmlResponse(
      buildVerificationErrorPage('server', 'env: SUPABASE_URL/SERVICE_KEY not configured'),
      500,
    )
  }

  if (!token) {
    return htmlResponse(buildVerificationErrorPage('invalid', 'no_token_in_post'), 400)
  }

  let supabase
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  } catch (err: any) {
    console.error('[verify-diagnosis][POST] supabase client init failed:', err)
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
      console.error('[verify-diagnosis][POST] select error:', error)
      return htmlResponse(
        buildVerificationErrorPage('server', `select: ${error.message} (code=${error.code})`),
        500,
      )
    }
    lead = data as typeof lead
  } catch (err: any) {
    console.error('[verify-diagnosis][POST] select threw:', err)
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
      console.error('[verify-diagnosis][POST] update failed:', updateErr)
      return htmlResponse(
        buildVerificationErrorPage('server', `update: ${updateErr.message} (code=${updateErr.code})`),
        500,
      )
    }
  } catch (err: any) {
    console.error('[verify-diagnosis][POST] update threw:', err)
    return htmlResponse(
      buildVerificationErrorPage('server', `update_throw: ${err?.message || String(err)}`),
      500,
    )
  }

  return htmlResponse(buildVerificationSuccessPage(), 200)
}
