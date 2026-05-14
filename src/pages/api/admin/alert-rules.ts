import type { APIRoute } from 'astro'
import { isAdminRequest, json } from '../../../lib/admin-auth'
import { getAlertRulesWithDefaults, saveAlertRule } from '../../../lib/admin-ops'

export const GET: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) return json({ error: 'Unauthorized' }, 401)
  const result = await getAlertRulesWithDefaults()
  return json(result, result.error ? 500 : 200)
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) return json({ error: 'Unauthorized' }, 401)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const result = await saveAlertRule({
    id: String(body.id || ''),
    title: String(body.title || ''),
    area: String(body.area || ''),
    condition_key: String(body.condition_key || ''),
    threshold: Number(body.threshold || 1),
    severity: String(body.severity || 'warn') as any,
    enabled: Boolean(body.enabled),
    notify_email: body.notify_email ? String(body.notify_email) : null,
    description: body.description ? String(body.description) : null,
  }, 'admin', request)

  return json(result, result.ok ? 200 : 400)
}

export const PUT = POST
