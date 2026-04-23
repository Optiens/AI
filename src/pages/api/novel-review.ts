import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = import.meta.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REFRESH_TOKEN = import.meta.env.GOOGLE_REFRESH_TOKEN
const GTASKS_LIST_ID = 'VHV0bERpeTJBaURZV192aQ' // AI小説事業

/** Google OAuth2 アクセストークンを取得 */
async function getGoogleAccessToken(): Promise<string | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token || null
}

/** Google Tasks にタスクを作成 */
async function createGoogleTask(title: string, notes: string) {
  const token = await getGoogleAccessToken()
  if (!token) return

  // 既存の同名タスクがあればスキップ（重複防止）
  const listRes = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${GTASKS_LIST_ID}/tasks?showCompleted=false&maxResults=100`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (listRes.ok) {
    const listData = await listRes.json()
    const existing = (listData.items || []).find((t: any) => t.title === title)
    if (existing) return // 既に同名タスクあり
  }

  await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${GTASKS_LIST_ID}/tasks`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, notes }),
    }
  )
}

// GET: メモを取得
export const GET: APIRoute = async ({ url }) => {
  if (!supabase) return new Response('Supabase not configured', { status: 500 })

  const key = url.searchParams.get('key')
  if (!key) return new Response('key required', { status: 400 })

  const { data, error } = await supabase
    .from('novel_review_notes')
    .select('notes, updated_at')
    .eq('key', key)
    .single()

  if (error && error.code === 'PGRST116') {
    // not found
    return new Response(JSON.stringify({ notes: {} }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (error) return new Response(error.message, { status: 500 })

  return new Response(JSON.stringify({ notes: data.notes, updated_at: data.updated_at }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// POST: メモを保存 + Google Taskを作成
export const POST: APIRoute = async ({ request }) => {
  if (!supabase) return new Response('Supabase not configured', { status: 500 })

  const body = await request.json()
  const { key, title, notes } = body as {
    key: string
    title: string
    notes: Record<string, string>
  }

  if (!key || !title) return new Response('key and title required', { status: 400 })

  const noteCount = Object.keys(notes || {}).length

  // Upsert to Supabase
  const { error } = await supabase
    .from('novel_review_notes')
    .upsert(
      {
        key,
        title,
        notes: notes || {},
        note_count: noteCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

  if (error) return new Response(error.message, { status: 500 })

  // メモがある場合のみ Google Task を作成
  if (noteCount > 0) {
    const taskTitle = `推敲メモ反映: ${title}`
    const taskNotes = `${noteCount}件の修正メモあり\nClaude Codeで「${title}の推敲メモを反映して」と指示`
    await createGoogleTask(taskTitle, taskNotes).catch(() => {})
  }

  return new Response(JSON.stringify({ ok: true, noteCount }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
