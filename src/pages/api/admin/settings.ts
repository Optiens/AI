import type { APIRoute } from 'astro'
import { isAdminRequest, json } from '../../../lib/admin-auth'
import { getAdminSettings, saveAdminSettings } from '../../../lib/admin-ops'

export const GET: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) return json({ error: 'Unauthorized' }, 401)
  const state = await getAdminSettings()
  return json(state, state.error && !state.configured ? 500 : 200)
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) return json({ error: 'Unauthorized' }, 401)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const result = await saveAdminSettings(body, 'admin', request)
  return json(result, result.ok ? 200 : 400)
}

