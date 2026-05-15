import type { BusinessTaskSummary } from './google-tasks'

export type OpsLead = {
  id: string | number
  created_at: string
  updated_at?: string | null
  status?: string | null
  plan?: string | null
  amount_jpy?: number | null
  paid_at?: string | null
  company_name?: string | null
  person_name?: string | null
  application_id?: string | null
  last_error?: string | null
}

export type OpsAiApiEvent = {
  id: number
  created_at: string
  workflow?: string | null
  provider?: string | null
  operation?: string | null
  status?: string | null
  error_type?: string | null
  error_message?: string | null
}

export type TodayAction = {
  id: string
  category: 'task' | 'lead' | 'api' | 'payment' | 'report' | 'sales'
  title: string
  detail: string
  owner: string
  due: string
  tone: 'critical' | 'high' | 'medium' | 'low'
  score: number
  href?: string
  source?: string
}

const oneHour = 60 * 60 * 1000
const oneDay = 24 * oneHour

function parseTime(iso?: string | null) {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isFinite(t) ? t : 0
}

function ageHours(iso?: string | null, now = Date.now()) {
  const t = parseTime(iso)
  return t ? Math.max(0, Math.floor((now - t) / oneHour)) : 0
}

function ageDays(iso?: string | null, now = Date.now()) {
  const t = parseTime(iso)
  return t ? Math.max(0, Math.floor((now - t) / oneDay)) : 0
}

function normalizeStatus(status?: string | null) {
  return status || 'new'
}

function leadTitle(lead: OpsLead) {
  return lead.company_name || lead.person_name || lead.application_id || `Lead ${lead.id}`
}

function leadHref(lead: OpsLead) {
  return `/admin/leads/${lead.id}`
}

export function buildTodayActions(input: {
  leads: OpsLead[]
  events: OpsAiApiEvent[]
  tasks?: BusinessTaskSummary | null
  now?: Date
}): TodayAction[] {
  const nowMs = (input.now || new Date()).getTime()
  const actions: TodayAction[] = []

  for (const task of input.tasks?.overdue || []) {
    actions.push({
      id: `task-overdue-${task.listId}-${task.id}`,
      category: 'task',
      title: task.title,
      detail: `${task.listName} / 期限 ${task.dueKey}`,
      owner: 'CEO',
      due: '期限超過',
      tone: 'critical',
      score: 110,
      source: 'Google Tasks',
    })
  }

  for (const task of input.tasks?.today || []) {
    actions.push({
      id: `task-today-${task.listId}-${task.id}`,
      category: 'task',
      title: task.title,
      detail: `${task.listName} / 今日が期限`,
      owner: 'CEO',
      due: '今日',
      tone: 'high',
      score: 94,
      source: 'Google Tasks',
    })
  }

  for (const task of (input.tasks?.upcoming || []).slice(0, 6)) {
    actions.push({
      id: `task-upcoming-${task.listId}-${task.id}`,
      category: 'task',
      title: task.title,
      detail: `${task.listName} / 期限 ${task.dueKey}`,
      owner: 'CEO',
      due: '7日以内',
      tone: 'medium',
      score: 62,
      source: 'Google Tasks',
    })
  }

  for (const event of input.events) {
    if (!['error', 'retry'].includes(event.status || '')) continue
    if (parseTime(event.created_at) < nowMs - oneDay) continue
    actions.push({
      id: `api-${event.id}`,
      category: 'api',
      title: `${event.provider || 'API'} ${event.operation || ''}`.trim(),
      detail: event.error_message || event.error_type || 'API通信のエラー/再試行が発生しています',
      owner: 'CTO',
      due: '今日',
      tone: event.status === 'error' ? 'critical' : 'high',
      score: event.status === 'error' ? 102 : 88,
      href: '/admin/api-status',
      source: 'ai_api_events',
    })
  }

  for (const lead of input.leads) {
    const status = normalizeStatus(lead.status)
    const updatedAge = ageHours(lead.updated_at || lead.created_at, nowMs)
    const createdAge = ageDays(lead.created_at, nowMs)

    if (lead.last_error || ['manual_review', 'limit_exceeded'].includes(status)) {
      actions.push({
        id: `lead-ai-${lead.id}`,
        category: 'lead',
        title: leadTitle(lead),
        detail: lead.last_error || `ステータス: ${status}`,
        owner: 'CEO / CTO',
        due: '今日',
        tone: 'critical',
        score: 100,
        href: leadHref(lead),
        source: 'diagnosis_leads',
      })
      continue
    }

    if (status === 'quota_retry_pending' && updatedAge >= 8) {
      actions.push({
        id: `lead-retry-${lead.id}`,
        category: 'api',
        title: leadTitle(lead),
        detail: '再試行待ちが長く残っています。手動再実行または原因確認が必要です。',
        owner: 'CEO / CTO',
        due: '今日',
        tone: 'high',
        score: 86,
        href: leadHref(lead),
        source: 'diagnosis_leads',
      })
      continue
    }

    if (['verified', 'processing'].includes(status) && updatedAge >= 2) {
      actions.push({
        id: `lead-processing-${lead.id}`,
        category: 'api',
        title: leadTitle(lead),
        detail: 'AI診断生成が停滞している可能性があります。',
        owner: 'CEO / CTO',
        due: '今日',
        tone: 'high',
        score: 84,
        href: leadHref(lead),
        source: 'diagnosis_leads',
      })
      continue
    }

    if (status === 'pending_payment') {
      actions.push({
        id: `lead-payment-${lead.id}`,
        category: 'payment',
        title: leadTitle(lead),
        detail: `入金待ち ${lead.amount_jpy ? `¥${lead.amount_jpy.toLocaleString('ja-JP')}` : ''}`.trim(),
        owner: 'CEO',
        due: createdAge >= 3 ? '今日' : '確認',
        tone: createdAge >= 3 ? 'high' : 'medium',
        score: createdAge >= 3 ? 82 : 68,
        href: leadHref(lead),
        source: 'diagnosis_leads',
      })
      continue
    }

    if (status === 'paid') {
      actions.push({
        id: `lead-report-create-${lead.id}`,
        category: 'report',
        title: leadTitle(lead),
        detail: '詳細レポート作成に進めます。',
        owner: 'CEO',
        due: '5営業日以内',
        tone: createdAge >= 1 ? 'high' : 'medium',
        score: createdAge >= 1 ? 80 : 66,
        href: leadHref(lead),
        source: 'diagnosis_leads',
      })
      continue
    }

    if (status === 'report_created') {
      actions.push({
        id: `lead-report-send-${lead.id}`,
        category: 'report',
        title: leadTitle(lead),
        detail: '詳細レポートのGoogle Slides URLを送付してください。',
        owner: 'CEO',
        due: '今日',
        tone: 'high',
        score: 78,
        href: leadHref(lead),
        source: 'diagnosis_leads',
      })
      continue
    }

    if (['sent', 'report_sent'].includes(status) && createdAge >= 2) {
      actions.push({
        id: `lead-mtg-follow-${lead.id}`,
        category: 'sales',
        title: leadTitle(lead),
        detail: '詳細レポート送付後のレビュー面談・導入支援フォロー対象です。',
        owner: 'CEO',
        due: '今週',
        tone: 'medium',
        score: 58,
        href: leadHref(lead),
        source: 'diagnosis_leads',
      })
    }
  }

  return actions
    .sort((a, b) => b.score - a.score)
    .slice(0, 16)
}
