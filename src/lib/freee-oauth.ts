import type { SupabaseClient } from '@supabase/supabase-js'

const FREEE_API_BASE = 'https://api.freee.co.jp'
const FREEE_TOKEN_URL = 'https://accounts.secure.freee.co.jp/public_api/token'
const FREEE_OAUTH_SETTING_KEY = 'freee_oauth'

let cachedAccessToken: string | null = null
let cachedTokenExpiresAt = 0

export interface FreeeWalletTxn {
  id: number
  amount: number
  description?: string
  date: string
  entry_side: 'income' | 'expense'
}

interface FreeeOAuthOptions {
  supabase: SupabaseClient | null
  clientId?: string
  clientSecret?: string
  envRefreshToken?: string
  source: string
}

interface FreeeTxnOptions extends FreeeOAuthOptions {
  companyId: number
  daysBack: number
}

interface FreeeTokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
}

interface FreeeOAuthSettingValue {
  refresh_token?: string
  provider?: string
  rotated_at?: string
  last_refresh_at?: string
  last_source?: string
}

class FreeeTokenRefreshError extends Error {
  status: number
  body: string

  constructor(status: number, body: string) {
    super(`freee token refresh failed (${status}): ${body.slice(0, 200)}`)
    this.name = 'FreeeTokenRefreshError'
    this.status = status
    this.body = body
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asSettingValue(value: unknown): FreeeOAuthSettingValue {
  return isRecord(value) ? value as FreeeOAuthSettingValue : {}
}

async function loadStoredRefreshToken(
  supabase: SupabaseClient | null,
): Promise<{ token?: string; value: FreeeOAuthSettingValue }> {
  if (!supabase) return { value: {} }

  const { data, error } = await supabase
    .from('admin_settings')
    .select('value')
    .eq('key', FREEE_OAUTH_SETTING_KEY)
    .maybeSingle()

  if (error) {
    console.warn('[freee-oauth] failed to read stored refresh token:', error.message)
    return { value: {} }
  }

  const value = asSettingValue(data?.value)
  const token = typeof value.refresh_token === 'string' && value.refresh_token.trim()
    ? value.refresh_token.trim()
    : undefined

  return { token, value }
}

async function saveRefreshToken(
  supabase: SupabaseClient | null,
  refreshToken: string,
  existingValue: FreeeOAuthSettingValue,
  source: string,
) {
  if (!supabase) {
    throw new Error('Supabase is required to persist the rotated freee refresh token')
  }

  const now = new Date().toISOString()
  const nextValue: FreeeOAuthSettingValue = {
    ...existingValue,
    provider: 'freee',
    refresh_token: refreshToken,
    rotated_at: now,
    last_refresh_at: now,
    last_source: source,
  }

  const { error } = await supabase
    .from('admin_settings')
    .upsert({
      key: FREEE_OAUTH_SETTING_KEY,
      value: nextValue,
      description: 'freee OAuth refresh token. Updated automatically when freee rotates tokens.',
      updated_at: now,
      updated_by: 'system:freee-oauth',
    }, { onConflict: 'key' })

  if (error) {
    throw new Error(`Failed to save rotated freee refresh token: ${error.message}`)
  }

  await supabase.from('admin_audit_logs').insert({
    actor: 'system:freee-oauth',
    action: 'freee.refresh_token.rotate',
    target_table: 'admin_settings',
    target_id: FREEE_OAUTH_SETTING_KEY,
    summary: 'freee refresh token was rotated and stored',
    metadata: { source, rotated_at: now },
  })
}

async function requestFreeeToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<FreeeTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  })

  const res = await fetch(FREEE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new FreeeTokenRefreshError(res.status, text)
  }

  return await res.json() as FreeeTokenResponse
}

async function exchangeAndPersistRefreshToken(
  options: FreeeOAuthOptions,
  refreshToken: string,
  existingValue: FreeeOAuthSettingValue,
): Promise<string> {
  const data = await requestFreeeToken(options.clientId!, options.clientSecret!, refreshToken)

  if (!data.access_token) {
    throw new Error('freee token refresh succeeded but access_token was missing')
  }

  if (data.refresh_token && data.refresh_token !== refreshToken) {
    await saveRefreshToken(options.supabase, data.refresh_token, existingValue, options.source)
  } else if (options.supabase) {
    const now = new Date().toISOString()
    const { error } = await options.supabase
      .from('admin_settings')
      .upsert({
        key: FREEE_OAUTH_SETTING_KEY,
        value: {
          ...existingValue,
          provider: 'freee',
          refresh_token: refreshToken,
          last_refresh_at: now,
          last_source: options.source,
        },
        description: 'freee OAuth refresh token. Updated automatically when freee rotates tokens.',
        updated_at: now,
        updated_by: 'system:freee-oauth',
      }, { onConflict: 'key' })

    if (error) {
      throw new Error(`Failed to save freee refresh token: ${error.message}`)
    }
  }

  cachedAccessToken = data.access_token
  cachedTokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000
  return cachedAccessToken
}

export async function getFreeeAccessToken(options: FreeeOAuthOptions): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedTokenExpiresAt - 60_000) {
    return cachedAccessToken
  }

  if (!options.clientId || !options.clientSecret) {
    throw new Error('FREEE_CLIENT_ID / FREEE_CLIENT_SECRET is not configured')
  }

  const stored = await loadStoredRefreshToken(options.supabase)
  const refreshToken = stored.token || options.envRefreshToken?.trim()
  if (!refreshToken) {
    throw new Error('freee refresh token is not configured in Supabase admin_settings or FREEE_REFRESH_TOKEN')
  }

  try {
    return await exchangeAndPersistRefreshToken(options, refreshToken, stored.value)
  } catch (error) {
    if (!(error instanceof FreeeTokenRefreshError) || !options.supabase) {
      throw error
    }

    const latest = await loadStoredRefreshToken(options.supabase)
    const envRefreshToken = options.envRefreshToken?.trim()
    if (latest.token && latest.token !== refreshToken) {
      try {
        return await exchangeAndPersistRefreshToken(options, latest.token, latest.value)
      } catch (latestError) {
        if (
          !(latestError instanceof FreeeTokenRefreshError) ||
          !envRefreshToken ||
          envRefreshToken === refreshToken ||
          envRefreshToken === latest.token
        ) {
          throw latestError
        }

        return await exchangeAndPersistRefreshToken(options, envRefreshToken, latest.value)
      }
    }

    if (!envRefreshToken || envRefreshToken === refreshToken) {
      throw error
    }

    return await exchangeAndPersistRefreshToken(options, envRefreshToken, latest.value)
  }
}

export async function fetchFreeeIncomingTxns(options: FreeeTxnOptions): Promise<FreeeWalletTxn[]> {
  const token = await getFreeeAccessToken(options)
  const since = new Date(Date.now() - options.daysBack * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const params = new URLSearchParams({
    company_id: String(options.companyId),
    entry_side: 'income',
    start_date: since,
    limit: '100',
  })

  const res = await fetch(`${FREEE_API_BASE}/api/1/wallet_txns?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Api-Version': '2020-06-15',
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`freee wallet_txns failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = await res.json() as { wallet_txns?: FreeeWalletTxn[] }
  return data.wallet_txns || []
}
