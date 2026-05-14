import type { APIRoute } from 'astro'
import { isAdminRequest, json } from '../../../lib/admin-auth'
import {
  createKnowledgeGap,
  listKnowledgeGaps,
  updateKnowledgeGap,
  type KnowledgeGap,
} from '../../../lib/admin-ops'

export const GET: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) return json({ error: 'Unauthorized' }, 401)
  const result = await listKnowledgeGaps()
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

  const action = String(body.action || 'create')

  if (action === 'create') {
    const result = await createKnowledgeGap({
      question: String(body.question || ''),
      source: body.source ? String(body.source) : 'admin',
      suggested_category: body.suggested_category ? String(body.suggested_category) : null,
      priority: String(body.priority || 'medium') as KnowledgeGap['priority'],
      answer_excerpt: body.answer_excerpt ? String(body.answer_excerpt) : null,
      metadata: {},
    }, 'admin', request)
    return json(result, result.ok ? 200 : 400)
  }

  if (action === 'update') {
    const id = Number(body.id || 0)
    const result = await updateKnowledgeGap(id, {
      status: body.status ? String(body.status) as KnowledgeGap['status'] : undefined,
      priority: body.priority ? String(body.priority) as KnowledgeGap['priority'] : undefined,
      suggested_category: body.suggested_category ? String(body.suggested_category) : undefined,
      linked_knowledge_id: body.linked_knowledge_id ? String(body.linked_knowledge_id) : undefined,
      answer_excerpt: body.answer_excerpt ? String(body.answer_excerpt) : undefined,
    }, 'admin', request)
    return json(result, result.ok ? 200 : 400)
  }

  return json({ error: 'Unknown action' }, 400)
}

export const PUT = POST
