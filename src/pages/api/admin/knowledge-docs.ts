import type { APIRoute } from 'astro'
import { isAdminRequest, json } from '../../../lib/admin-auth'
import {
  listKnowledgeEntries,
  upsertKnowledgeEntry,
  type KnowledgeEntry,
} from '../../../lib/admin-ops'

const categories = ['business', 'sales', 'operations', 'ai', 'hydroponics', 'brand', 'governance'] as const
const visibilities = ['internal', 'demo-safe'] as const
const maturities = ['seed', 'operational', 'demo-ready'] as const

function slugify(input: string) {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || `knowledge-${Date.now()}`
}

function toTags(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 12)
  }
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function parseEntry(body: Record<string, unknown>): KnowledgeEntry | { error: string } {
  const title = String(body.title || '').trim()
  const summary = String(body.summary || '').trim()
  const content = String(body.body || '').trim()
  const category = String(body.category || 'operations') as KnowledgeEntry['category']
  const visibility = String(body.visibility || 'internal') as KnowledgeEntry['visibility']
  const maturity = String(body.maturity || 'seed') as KnowledgeEntry['maturity']

  if (!title) return { error: 'title is required' }
  if (!summary) return { error: 'summary is required' }
  if (!content) return { error: 'body is required' }
  if (!categories.includes(category)) return { error: 'invalid category' }
  if (!visibilities.includes(visibility)) return { error: 'invalid visibility' }
  if (!maturities.includes(maturity)) return { error: 'invalid maturity' }

  return {
    id: String(body.id || slugify(title)).trim(),
    title,
    category,
    owner: String(body.owner || 'COO').trim(),
    visibility,
    maturity,
    summary,
    body: content,
    tags: toTags(body.tags),
    source: 'admin',
  }
}

export const GET: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) return json({ error: 'Unauthorized' }, 401)
  const result = await listKnowledgeEntries()
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

  const entry = parseEntry(body)
  if ('error' in entry) return json({ error: entry.error }, 400)

  const result = await upsertKnowledgeEntry(entry, 'admin', request)
  return json(result, result.ok ? 200 : 400)
}

export const PUT = POST

