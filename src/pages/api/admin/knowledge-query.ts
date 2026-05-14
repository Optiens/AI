import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'
import { makeToken, COOKIE_NAME, getAdminPassword } from '../../../middleware'
import {
  buildKnowledgeContextFromDocs,
  knowledgeDocs,
  searchKnowledgeDocs,
} from '../../../lib/optiens-knowledge'
import {
  createKnowledgeGap,
  dbKnowledgeEntryToDoc,
  listKnowledgeEntries,
  logAdminAudit,
} from '../../../lib/admin-ops'

const OPENAI_API_KEY = import.meta.env.OPENAI_API_KEY
const OPENAI_MODEL = import.meta.env.OPENAI_MODEL || 'gpt-5.5'
const SUPABASE_URL = import.meta.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : null

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function isAuthed(req: Request): boolean {
  const adminPassword = getAdminPassword()
  if (!adminPassword) return false
  const cookieHeader = req.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  if (!match) return false
  return match[1] === makeToken(adminPassword)
}

function extractOutputText(data: any) {
  if (typeof data.output_text === 'string') return data.output_text
  const parts: string[] = []
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') parts.push(content.text)
    }
  }
  return parts.join('\n').trim()
}

async function logKnowledgeEvent(input: {
  status: 'success' | 'error'
  startedAt: number
  usage?: any
  error?: string
}) {
  if (!supabase) return
  const { error } = await supabase.from('ai_api_events').insert({
    workflow: 'knowledge_query',
    provider: 'openai',
    model: OPENAI_MODEL,
    operation: 'responses.create',
    status: input.status,
    latency_ms: Date.now() - input.startedAt,
    input_tokens: input.usage?.input_tokens ?? null,
    output_tokens: input.usage?.output_tokens ?? null,
    total_tokens: input.usage?.total_tokens ?? null,
    error_type: input.status === 'error' ? 'knowledge_query' : null,
    error_message: input.error ? input.error.slice(0, 1000) : null,
  })
  if (error) console.warn('[knowledge-query] ai_api_events log skipped:', error.message)
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) return new Response('Unauthorized', { status: 401 })

  const body = await request.json().catch(() => ({}))
  const question = String(body.question || '').trim()
  if (!question) return json({ error: 'question is required' }, 400)

  const { entries } = await listKnowledgeEntries()
  const docs = [...knowledgeDocs, ...entries.map(dbKnowledgeEntryToDoc)]
  const matches = searchKnowledgeDocs(docs, question, 5)
  const sources = matches.map(({ doc }) => ({
    id: doc.id,
    title: doc.title,
    category: doc.category,
    visibility: doc.visibility,
    maturity: doc.maturity,
    updatedAt: doc.updatedAt,
    summary: doc.summary,
  }))

  if (!OPENAI_API_KEY) {
    const answer = sources.length
      ? `OpenAI APIが未設定のため、検索結果だけを返します。\n\n${sources.map((source) => `- ${source.title}: ${source.summary}`).join('\n')}`
      : 'OpenAI APIが未設定で、該当するナレッジも見つかりませんでした。'
    if (!sources.length) {
      await createKnowledgeGap({
        question,
        source: 'knowledge_query',
        priority: 'medium',
        answer_excerpt: answer,
        metadata: { reason: 'openai_not_configured', sources: 0 },
      }, 'admin', request)
    }
    await logAdminAudit({
      action: 'knowledge_query.ask',
      target_table: 'knowledge_entries',
      summary: `ナレッジ質問: ${question.slice(0, 80)}`,
      metadata: { fallback: true, sources: sources.length },
      request,
    })
    return json({ answer, sources, fallback: true })
  }

  const startedAt = Date.now()
  const context = buildKnowledgeContextFromDocs(docs, question)

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_output_tokens: 900,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: [
                  'あなたはOptiensの社内ナレッジ担当です。',
                  '回答は日本語で、社内メンバーがすぐ行動できる粒度にしてください。',
                  '必ず提供されたナレッジに基づいて回答し、不明な点は「現時点のナレッジには不足」と明示してください。',
                  '将来の販売デモに転用できる観点も意識し、社内限定情報とデモ公開可能な説明を混ぜないでください。',
                  '宇宙、宇宙農業、SaaS外販、医療機関、防災拠点、孤立環境、家庭用ガーデニング、食育教室、個人向けEC、ビニールハウス転換、社保スキームは提案しないでください。',
                ].join('\n'),
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `質問:\n${question}\n\n参照ナレッジ:\n${context}`,
              },
            ],
          },
        ],
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const message = data.error?.message || `OpenAI HTTP ${res.status}`
      await logKnowledgeEvent({ status: 'error', startedAt, error: message })
      await createKnowledgeGap({
        question,
        source: 'knowledge_query',
        priority: 'high',
        answer_excerpt: message,
        metadata: { reason: 'openai_http_error', sources: sources.length, status: res.status },
      }, 'admin', request)
      await logAdminAudit({
        action: 'knowledge_query.error',
        target_table: 'knowledge_entries',
        summary: `ナレッジ質問エラー: ${question.slice(0, 80)}`,
        metadata: { error: message, sources: sources.length, status: res.status },
        request,
      })
      return json({ error: message, sources }, 500)
    }

    const answer = extractOutputText(data) || '回答を生成できませんでした。'
    await logKnowledgeEvent({ status: 'success', startedAt, usage: data.usage })
    const hasKnowledgeGap = !sources.length
      || answer.includes('現時点のナレッジには不足')
      || answer.includes('ナレッジには不足')
    if (hasKnowledgeGap) {
      await createKnowledgeGap({
        question,
        source: 'knowledge_query',
        priority: sources.length ? 'medium' : 'high',
        answer_excerpt: answer,
        metadata: { reason: sources.length ? 'insufficient_answer' : 'no_sources', sources: sources.length },
      }, 'admin', request)
    }
    await logAdminAudit({
      action: 'knowledge_query.ask',
      target_table: 'knowledge_entries',
      summary: `ナレッジ質問: ${question.slice(0, 80)}`,
      metadata: { sources: sources.length, gap_created: hasKnowledgeGap, usage: data.usage },
      request,
    })
    return json({ answer, sources })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logKnowledgeEvent({ status: 'error', startedAt, error: message })
    await createKnowledgeGap({
      question,
      source: 'knowledge_query',
      priority: 'high',
      answer_excerpt: message,
      metadata: { reason: 'api_error', sources: sources.length },
    }, 'admin', request)
    await logAdminAudit({
      action: 'knowledge_query.error',
      target_table: 'knowledge_entries',
      summary: `ナレッジ質問エラー: ${question.slice(0, 80)}`,
      metadata: { error: message, sources: sources.length },
      request,
    })
    return json({ error: message, sources }, 500)
  }
}
