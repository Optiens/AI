import { supabase } from './supabase'
import type { KnowledgeDoc } from './optiens-knowledge'
import type { BusinessTaskSummary } from './google-tasks'

export type AdminSettingType = 'text' | 'number' | 'email' | 'time' | 'textarea'
export type AdminSettingGroup = 'notification' | 'sla' | 'api-cost' | 'alerts' | 'integrations'

export type AdminSettingDefinition = {
  key: string
  label: string
  group: AdminSettingGroup
  type: AdminSettingType
  defaultValue: string | number
  description: string
  unit?: string
}

export type AdminSettingsState = {
  values: Record<string, string | number>
  rows: Array<{ key: string; value: unknown; updated_at?: string | null; updated_by?: string | null }>
  error?: string
  configured: boolean
}

export type AdminAuditLog = {
  id: number
  created_at: string
  actor: string
  action: string
  target_table?: string | null
  target_id?: string | null
  summary?: string | null
  metadata?: Record<string, unknown> | null
  ip_address?: string | null
  user_agent?: string | null
}

export type KnowledgeEntry = {
  id: string
  title: string
  category: KnowledgeDoc['category']
  owner: string
  visibility: KnowledgeDoc['visibility']
  maturity: KnowledgeDoc['maturity']
  summary: string
  body: string
  tags: string[]
  source?: string | null
  created_at?: string | null
  updated_at?: string | null
  updated_by?: string | null
}

export type CustomerStatus = 'prospect' | 'active' | 'paused' | 'churned' | 'closed'
export type CustomerProjectStatus = 'lead' | 'proposal' | 'active' | 'waiting' | 'done' | 'paused' | 'cancelled'
export type CustomerProjectType = 'diagnosis' | 'implementation' | 'maintenance' | 'support' | 'other'
export type AdminPriority = 'low' | 'medium' | 'high' | 'critical'
export type AlertSeverity = 'info' | 'warn' | 'critical'
export type KnowledgeGapStatus = 'open' | 'converted' | 'dismissed'

export type Customer = {
  id: string
  lead_id?: string | null
  company_name: string
  contact_name?: string | null
  email?: string | null
  industry?: string | null
  status: CustomerStatus
  source?: string | null
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
  updated_by?: string | null
  projects?: CustomerProject[]
  recent_events?: CustomerEvent[]
}

export type CustomerProject = {
  id: string
  customer_id: string
  lead_id?: string | null
  title: string
  project_type: CustomerProjectType
  status: CustomerProjectStatus
  priority: AdminPriority
  contract_amount_jpy: number
  monthly_amount_jpy: number
  owner: string
  next_action?: string | null
  due_date?: string | null
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
  updated_by?: string | null
}

export type CustomerEvent = {
  id: number
  customer_id?: string | null
  project_id?: string | null
  event_type: string
  summary: string
  metadata?: Record<string, unknown> | null
  occurred_at: string
  created_at?: string | null
  created_by?: string | null
}

export type AlertRule = {
  id: string
  title: string
  area: string
  condition_key: string
  threshold: number
  severity: AlertSeverity
  enabled: boolean
  notify_email?: string | null
  description?: string | null
  updated_at?: string | null
  updated_by?: string | null
}

export type EvaluatedAlert = {
  id: string
  rule_id: string
  title: string
  area: string
  condition_key: string
  severity: AlertSeverity
  value: number
  threshold: number
  detail: string
  target_href?: string
  enabled: boolean
  triggered: boolean
}

export type KnowledgeGap = {
  id: number
  question: string
  status: KnowledgeGapStatus
  source: string
  suggested_category?: string | null
  priority: Exclude<AdminPriority, 'critical'>
  answer_excerpt?: string | null
  linked_knowledge_id?: string | null
  created_at?: string | null
  updated_at?: string | null
  resolved_at?: string | null
  resolved_by?: string | null
  metadata?: Record<string, unknown> | null
}

export const adminSettingDefinitions: AdminSettingDefinition[] = [
  {
    key: 'admin_alert_email',
    label: '管理通知先メール',
    group: 'notification',
    type: 'email',
    defaultValue: '',
    description: '日次メール、重大アラート、手動通知の優先送信先。',
  },
  {
    key: 'daily_email_time_jst',
    label: '日次メール時刻',
    group: 'notification',
    type: 'time',
    defaultValue: '09:00',
    description: '管理画面上の運用基準時刻。Vercel Cronの実行時刻もこの値に合わせます。',
  },
  {
    key: 'sla_ai_processing_hours',
    label: 'AI診断停滞判定',
    group: 'sla',
    type: 'number',
    defaultValue: 2,
    unit: '時間',
    description: 'verified / processing のまま更新が止まった時にSLAリスクへ出す時間。',
  },
  {
    key: 'sla_paid_report_business_days',
    label: '有償レポート納期',
    group: 'sla',
    type: 'number',
    defaultValue: 5,
    unit: '営業日',
    description: '入金確認後、詳細レポートを届けるまでの標準納期。',
  },
  {
    key: 'alert_workload_warn_count',
    label: '稼働警告しきい値',
    group: 'alerts',
    type: 'number',
    defaultValue: 6,
    unit: '件',
    description: '今日の対応、期限、納品待ちの合計がこの数を超えたら確認ありにする。',
  },
  {
    key: 'alert_workload_critical_count',
    label: '稼働危険しきい値',
    group: 'alerts',
    type: 'number',
    defaultValue: 12,
    unit: '件',
    description: '代表一人で回すには危険な対応量として表示する件数。',
  },
  {
    key: 'openai_input_usd_per_1m',
    label: 'OpenAI 入力単価',
    group: 'api-cost',
    type: 'number',
    defaultValue: 0,
    unit: 'USD / 100万tokens',
    description: '管理画面のAPI費用推定に使う入力トークン単価。',
  },
  {
    key: 'openai_output_usd_per_1m',
    label: 'OpenAI 出力単価',
    group: 'api-cost',
    type: 'number',
    defaultValue: 0,
    unit: 'USD / 100万tokens',
    description: '管理画面のAPI費用推定に使う出力トークン単価。',
  },
  {
    key: 'anthropic_input_usd_per_1m',
    label: 'Anthropic 入力単価',
    group: 'api-cost',
    type: 'number',
    defaultValue: 0,
    unit: 'USD / 100万tokens',
    description: 'Anthropic APIの入力トークン単価。',
  },
  {
    key: 'anthropic_output_usd_per_1m',
    label: 'Anthropic 出力単価',
    group: 'api-cost',
    type: 'number',
    defaultValue: 0,
    unit: 'USD / 100万tokens',
    description: 'Anthropic APIの出力トークン単価。',
  },
  {
    key: 'usd_jpy_rate',
    label: 'USD/JPY レート',
    group: 'api-cost',
    type: 'number',
    defaultValue: 0,
    unit: '円',
    description: 'API費用の円換算に使う為替レート。',
  },
  {
    key: 'google_task_lists_note',
    label: 'Google Tasks運用メモ',
    group: 'integrations',
    type: 'textarea',
    defaultValue: 'AI支援事業 / 水耕栽培事業 / AI小説事業',
    description: '対象リスト、運用ルール、棚卸メモ。実際のリストID変更はコード側と合わせて行います。',
  },
]

export const adminSettingGroups: Record<AdminSettingGroup, string> = {
  notification: '通知',
  sla: 'SLA',
  'api-cost': 'API費用',
  alerts: 'アラート',
  integrations: '連携',
}

export const defaultAlertRules: AlertRule[] = [
  {
    id: 'api-errors-24h',
    title: '24時間以内のAPIエラー',
    area: 'AI/API',
    condition_key: 'api_errors_24h',
    threshold: 1,
    severity: 'critical',
    enabled: true,
    description: 'OpenAI / Anthropic / 運用APIで error または retry が発生したら確認します。',
  },
  {
    id: 'overdue-tasks',
    title: 'Google Tasksの期限超過',
    area: 'タスク',
    condition_key: 'overdue_tasks',
    threshold: 1,
    severity: 'critical',
    enabled: true,
    description: '事業タスクの期限超過を毎日確認します。',
  },
  {
    id: 'sla-risks',
    title: '診断・納品SLAリスク',
    area: '営業/納品',
    condition_key: 'sla_risks',
    threshold: 1,
    severity: 'warn',
    enabled: true,
    description: 'AI診断停滞、有償レポート納品遅延、手動確認ステータスを拾います。',
  },
  {
    id: 'workload-overload',
    title: '今日の対応量超過',
    area: '稼働',
    condition_key: 'workload',
    threshold: 6,
    severity: 'warn',
    enabled: true,
    description: '代表1人で抱える当日対応が多すぎるときに表示します。',
  },
  {
    id: 'pending-payment',
    title: '入金待ち案件',
    area: '売上',
    condition_key: 'pending_payment',
    threshold: 1,
    severity: 'warn',
    enabled: true,
    description: '未回収または入金確認待ちの案件を追跡します。',
  },
  {
    id: 'project-due-risks',
    title: '顧客案件の期限リスク',
    area: '顧客/案件',
    condition_key: 'project_due_risks',
    threshold: 1,
    severity: 'warn',
    enabled: true,
    description: '顧客案件の次アクション期限切れ、または当日期限を拾います。',
  },
  {
    id: 'knowledge-gaps-open',
    title: '未処理のナレッジ不足',
    area: 'ナレッジ',
    condition_key: 'knowledge_gaps_open',
    threshold: 1,
    severity: 'warn',
    enabled: true,
    description: '質問に答えきれなかった項目をナレッジ化キューに積みます。',
  },
]

function defaultSettings() {
  return Object.fromEntries(adminSettingDefinitions.map((row) => [row.key, row.defaultValue]))
}

function normalizeSettingValue(def: AdminSettingDefinition, value: unknown) {
  if (def.type === 'number') {
    const parsed = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : def.defaultValue
  }
  return typeof value === 'string' ? value : String(value ?? def.defaultValue)
}

export function getSettingNumber(values: Record<string, string | number> | undefined, key: string, fallback = 0) {
  const parsed = Number(values?.[key] ?? fallback)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseTime(iso?: string | null) {
  if (!iso) return 0
  const time = new Date(iso).getTime()
  return Number.isFinite(time) ? time : 0
}

function todayKey(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function cleanString(value: unknown, fallback = '') {
  const text = String(value ?? fallback).trim()
  return text || fallback
}

function cleanNumber(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback)
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback
}

export async function getAdminSettings(): Promise<AdminSettingsState> {
  const defaults = defaultSettings()
  if (!supabase) {
    return { values: defaults, rows: [], configured: false, error: 'Supabase が設定されていません' }
  }

  const { data, error } = await supabase
    .from('admin_settings')
    .select('key, value, updated_at, updated_by')

  if (error) {
    return { values: defaults, rows: [], configured: true, error: error.message }
  }

  const values = { ...defaults }
  for (const row of data || []) {
    const def = adminSettingDefinitions.find((item) => item.key === row.key)
    if (!def) continue
    values[row.key] = normalizeSettingValue(def, row.value)
  }
  return { values, rows: data || [], configured: true }
}

export async function saveAdminSettings(
  input: Record<string, unknown>,
  actor = 'admin',
  request?: Request,
) {
  if (!supabase) return { ok: false, error: 'Supabase が設定されていません' }

  const rows = adminSettingDefinitions
    .filter((def) => Object.prototype.hasOwnProperty.call(input, def.key))
    .map((def) => ({
      key: def.key,
      value: normalizeSettingValue(def, input[def.key]),
      description: def.description,
      updated_at: new Date().toISOString(),
      updated_by: actor,
    }))

  if (!rows.length) return { ok: false, error: '保存対象の設定がありません' }

  const { error } = await supabase
    .from('admin_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) return { ok: false, error: error.message }

  await logAdminAudit({
    actor,
    action: 'admin_settings.update',
    target_table: 'admin_settings',
    summary: `${rows.length}件の管理設定を更新`,
    metadata: { keys: rows.map((row) => row.key) },
    request,
  })

  return { ok: true, updated: rows.map((row) => row.key) }
}

export async function logAdminAudit(input: {
  actor?: string
  action: string
  target_table?: string
  target_id?: string
  summary?: string
  metadata?: Record<string, unknown>
  request?: Request
}) {
  if (!supabase) return

  const forwardedFor = input.request?.headers.get('x-forwarded-for') || ''
  const ipAddress = forwardedFor.split(',')[0]?.trim() || input.request?.headers.get('x-real-ip') || null
  const userAgent = input.request?.headers.get('user-agent') || null

  const { error } = await supabase.from('admin_audit_logs').insert({
    actor: input.actor || 'admin',
    action: input.action,
    target_table: input.target_table || null,
    target_id: input.target_id || null,
    summary: input.summary || null,
    metadata: input.metadata || {},
    ip_address: ipAddress,
    user_agent: userAgent,
  })

  if (error) {
    console.warn('[admin-audit] insert skipped:', error.message)
  }
}

export async function listAdminAuditLogs(limit = 120): Promise<{ logs: AdminAuditLog[]; error?: string }> {
  if (!supabase) return { logs: [], error: 'Supabase が設定されていません' }

  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { logs: [], error: error.message }
  return { logs: (data as AdminAuditLog[]) || [] }
}

export function dbKnowledgeEntryToDoc(entry: KnowledgeEntry): KnowledgeDoc {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    owner: entry.owner,
    updatedAt: (entry.updated_at || new Date().toISOString()).slice(0, 10),
    visibility: entry.visibility,
    maturity: entry.maturity,
    summary: entry.summary,
    body: entry.body,
    tags: entry.tags || [],
  }
}

export async function listKnowledgeEntries(): Promise<{ entries: KnowledgeEntry[]; error?: string }> {
  if (!supabase) return { entries: [], error: 'Supabase が設定されていません' }

  const { data, error } = await supabase
    .from('knowledge_entries')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return { entries: [], error: error.message }
  return { entries: (data as KnowledgeEntry[]) || [] }
}

export async function upsertKnowledgeEntry(
  entry: KnowledgeEntry,
  actor = 'admin',
  request?: Request,
) {
  if (!supabase) return { ok: false, error: 'Supabase が設定されていません' }

  const now = new Date().toISOString()
  const row = {
    ...entry,
    tags: entry.tags || [],
    updated_at: now,
    updated_by: actor,
  }

  const { error } = await supabase
    .from('knowledge_entries')
    .upsert(row, { onConflict: 'id' })

  if (error) return { ok: false, error: error.message }

  await logAdminAudit({
    actor,
    action: 'knowledge_entries.upsert',
    target_table: 'knowledge_entries',
    target_id: entry.id,
    summary: `ナレッジ「${entry.title}」を保存`,
    metadata: {
      title: entry.title,
      visibility: entry.visibility,
      maturity: entry.maturity,
      category: entry.category,
    },
    request,
  })

  return { ok: true, entry: row }
}

export async function listCustomersWithProjects(): Promise<{ customers: Customer[]; error?: string }> {
  if (!supabase) return { customers: [], error: 'Supabase が設定されていません' }

  const { data: customerRows, error } = await supabase
    .from('customers')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(300)

  if (error) return { customers: [], error: error.message }

  const customers = ((customerRows as Customer[]) || []).map((customer) => ({
    ...customer,
    projects: [] as CustomerProject[],
    recent_events: [] as CustomerEvent[],
  }))

  const ids = customers.map((customer) => customer.id)
  if (!ids.length) return { customers }

  const [{ data: projectRows, error: projectError }, { data: eventRows, error: eventError }] = await Promise.all([
    supabase
      .from('customer_projects')
      .select('*')
      .in('customer_id', ids)
      .order('updated_at', { ascending: false })
      .limit(1000),
    supabase
      .from('customer_events')
      .select('*')
      .in('customer_id', ids)
      .order('occurred_at', { ascending: false })
      .limit(500),
  ])

  if (projectError) return { customers, error: projectError.message }
  if (eventError) return { customers, error: eventError.message }

  const byCustomer = new Map(customers.map((customer) => [customer.id, customer]))
  for (const project of (projectRows as CustomerProject[]) || []) {
    byCustomer.get(project.customer_id)?.projects?.push(project)
  }
  for (const event of (eventRows as CustomerEvent[]) || []) {
    if (!event.customer_id) continue
    const customer = byCustomer.get(event.customer_id)
    if (customer && (customer.recent_events?.length || 0) < 6) {
      customer.recent_events?.push(event)
    }
  }

  return { customers }
}

export async function upsertCustomer(
  input: Partial<Customer>,
  actor = 'admin',
  request?: Request,
) {
  if (!supabase) return { ok: false, error: 'Supabase が設定されていません' }

  const companyName = cleanString(input.company_name)
  if (!companyName) return { ok: false, error: 'company_name is required' }

  const now = new Date().toISOString()
  const row = {
    ...(input.id ? { id: input.id } : {}),
    lead_id: cleanString(input.lead_id, '') || null,
    company_name: companyName,
    contact_name: cleanString(input.contact_name, '') || null,
    email: cleanString(input.email, '') || null,
    industry: cleanString(input.industry, '') || null,
    status: (input.status || 'prospect') as CustomerStatus,
    source: cleanString(input.source, 'admin'),
    notes: cleanString(input.notes, '') || null,
    updated_at: now,
    updated_by: actor,
  }

  const { data, error } = await supabase
    .from('customers')
    .upsert(row)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await logAdminAudit({
    actor,
    action: 'customers.upsert',
    target_table: 'customers',
    target_id: data?.id,
    summary: `顧客「${companyName}」を保存`,
    metadata: { status: row.status, lead_id: row.lead_id },
    request,
  })

  return { ok: true, customer: data as Customer }
}

export async function upsertCustomerProject(
  input: Partial<CustomerProject>,
  actor = 'admin',
  request?: Request,
) {
  if (!supabase) return { ok: false, error: 'Supabase が設定されていません' }

  const customerId = cleanString(input.customer_id)
  const title = cleanString(input.title)
  if (!customerId) return { ok: false, error: 'customer_id is required' }
  if (!title) return { ok: false, error: 'title is required' }

  const now = new Date().toISOString()
  const row = {
    ...(input.id ? { id: input.id } : {}),
    customer_id: customerId,
    lead_id: cleanString(input.lead_id, '') || null,
    title,
    project_type: (input.project_type || 'diagnosis') as CustomerProjectType,
    status: (input.status || 'lead') as CustomerProjectStatus,
    priority: (input.priority || 'medium') as AdminPriority,
    contract_amount_jpy: cleanNumber(input.contract_amount_jpy, 0),
    monthly_amount_jpy: cleanNumber(input.monthly_amount_jpy, 0),
    owner: cleanString(input.owner, 'CEO'),
    next_action: cleanString(input.next_action, '') || null,
    due_date: cleanString(input.due_date, '') || null,
    notes: cleanString(input.notes, '') || null,
    updated_at: now,
    updated_by: actor,
  }

  const { data, error } = await supabase
    .from('customer_projects')
    .upsert(row)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await logAdminAudit({
    actor,
    action: 'customer_projects.upsert',
    target_table: 'customer_projects',
    target_id: data?.id,
    summary: `案件「${title}」を保存`,
    metadata: {
      customer_id: customerId,
      status: row.status,
      priority: row.priority,
      due_date: row.due_date,
    },
    request,
  })

  return { ok: true, project: data as CustomerProject }
}

export async function addCustomerEvent(
  input: Partial<CustomerEvent>,
  actor = 'admin',
  request?: Request,
) {
  if (!supabase) return { ok: false, error: 'Supabase が設定されていません' }

  const summary = cleanString(input.summary)
  if (!summary) return { ok: false, error: 'summary is required' }

  const row = {
    customer_id: cleanString(input.customer_id, '') || null,
    project_id: cleanString(input.project_id, '') || null,
    event_type: cleanString(input.event_type, 'note'),
    summary,
    metadata: input.metadata || {},
    occurred_at: cleanString(input.occurred_at, new Date().toISOString()),
    created_by: actor,
  }

  const { data, error } = await supabase
    .from('customer_events')
    .insert(row)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await logAdminAudit({
    actor,
    action: 'customer_events.insert',
    target_table: 'customer_events',
    target_id: data?.id ? String(data.id) : undefined,
    summary: `顧客メモ「${summary.slice(0, 60)}」を追加`,
    metadata: { customer_id: row.customer_id, project_id: row.project_id, event_type: row.event_type },
    request,
  })

  return { ok: true, event: data as CustomerEvent }
}

export async function listAlertRules(): Promise<{ rules: AlertRule[]; error?: string }> {
  if (!supabase) return { rules: defaultAlertRules, error: 'Supabase が設定されていません' }

  const { data, error } = await supabase
    .from('admin_alert_rules')
    .select('*')
    .order('area', { ascending: true })
    .order('title', { ascending: true })

  if (error) return { rules: defaultAlertRules, error: error.message }
  return { rules: ((data as AlertRule[]) || []).map((rule) => ({ ...rule, threshold: Number(rule.threshold) })) }
}

export async function getAlertRulesWithDefaults(): Promise<{ rules: AlertRule[]; error?: string }> {
  const result = await listAlertRules()
  const stored = new Map(result.rules.map((rule) => [rule.id, rule]))
  const merged = defaultAlertRules.map((rule) => ({
    ...rule,
    ...(stored.get(rule.id) || {}),
    threshold: Number(stored.get(rule.id)?.threshold ?? rule.threshold),
  }))
  const extra = result.rules.filter((rule) => !defaultAlertRules.some((item) => item.id === rule.id))
  return { rules: [...merged, ...extra], error: result.error }
}

export async function saveAlertRule(
  input: Partial<AlertRule>,
  actor = 'admin',
  request?: Request,
) {
  if (!supabase) return { ok: false, error: 'Supabase が設定されていません' }

  const base = defaultAlertRules.find((rule) => rule.id === input.id)
  const id = cleanString(input.id || base?.id)
  if (!id) return { ok: false, error: 'id is required' }
  const threshold = Number(input.threshold ?? base?.threshold ?? 1)

  const row = {
    id,
    title: cleanString(input.title, base?.title || id),
    area: cleanString(input.area, base?.area || '運用'),
    condition_key: cleanString(input.condition_key, base?.condition_key || id),
    threshold: Number.isFinite(threshold) ? threshold : Number(base?.threshold ?? 1),
    severity: (input.severity || base?.severity || 'warn') as AlertSeverity,
    enabled: input.enabled === undefined ? Boolean(base?.enabled ?? true) : Boolean(input.enabled),
    notify_email: cleanString(input.notify_email, '') || null,
    description: cleanString(input.description, base?.description || '') || null,
    updated_at: new Date().toISOString(),
    updated_by: actor,
  }

  const { data, error } = await supabase
    .from('admin_alert_rules')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await logAdminAudit({
    actor,
    action: 'admin_alert_rules.upsert',
    target_table: 'admin_alert_rules',
    target_id: id,
    summary: `アラートルール「${row.title}」を保存`,
    metadata: { threshold: row.threshold, severity: row.severity, enabled: row.enabled },
    request,
  })

  return { ok: true, rule: data as AlertRule }
}

type AlertLead = {
  id?: string | number
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  paid_at?: string | null
  report_sent_at?: string | null
  last_error?: string | null
  amount_jpy?: number | null
}

type AlertApiEvent = {
  id?: number
  created_at: string
  status?: string | null
}

export function evaluateAdminAlerts(input: {
  leads?: AlertLead[]
  events?: AlertApiEvent[]
  tasks?: Pick<BusinessTaskSummary, 'overdue' | 'today' | 'upcoming' | 'all'> | null
  knowledgeGaps?: KnowledgeGap[]
  projects?: CustomerProject[]
  settings?: Record<string, string | number>
  rules?: AlertRule[]
  todayActionCount?: number
  now?: Date
}): EvaluatedAlert[] {
  const now = input.now || new Date()
  const nowMs = now.getTime()
  const dayMs = 24 * 60 * 60 * 1000
  const tokyoToday = todayKey(now)
  const leads = input.leads || []
  const events = input.events || []
  const tasks = input.tasks
  const gaps = input.knowledgeGaps || []
  const projects = input.projects || []
  const rules = input.rules?.length ? input.rules : defaultAlertRules
  const slaHours = getSettingNumber(input.settings, 'sla_ai_processing_hours', 2)
  const paidBusinessDays = getSettingNumber(input.settings, 'sla_paid_report_business_days', 5)
  const apiErrors24h = events.filter((event) => (
    parseTime(event.created_at) > nowMs - dayMs
    && ['error', 'retry'].includes(event.status || '')
  )).length
  const slaRisks = leads.filter((lead) => {
    const status = lead.status || ''
    const updated = parseTime(lead.updated_at || lead.created_at)
    const isAiStale = ['verified', 'processing'].includes(status) && updated > 0 && updated < nowMs - slaHours * 60 * 60 * 1000
    const isPaidStale = Boolean(lead.paid_at)
      && !lead.report_sent_at
      && parseTime(lead.paid_at) < nowMs - Math.max(paidBusinessDays - 1, 1) * dayMs
    return Boolean(lead.last_error) || ['manual_review', 'quota_retry_pending', 'limit_exceeded'].includes(status) || isAiStale || isPaidStale
  }).length
  const pendingPayment = leads.filter((lead) => lead.status === 'pending_payment').length
  const projectDueRisks = projects.filter((project) => {
    if (!project.due_date || ['done', 'cancelled'].includes(project.status)) return false
    return project.due_date <= tokyoToday
  }).length
  const openKnowledgeGaps = gaps.filter((gap) => gap.status === 'open').length
  const workload = input.todayActionCount
    ?? ((tasks?.overdue.length || 0) + (tasks?.today.length || 0) + slaRisks + pendingPayment + projectDueRisks)

  const values: Record<string, { value: number; detail: string; target_href: string }> = {
    api_errors_24h: { value: apiErrors24h, detail: '24時間以内のerror/retryログ', target_href: '/admin/api-status' },
    overdue_tasks: { value: tasks?.overdue.length || 0, detail: 'Google Tasksの期限超過', target_href: '/admin/reports#task-deadlines' },
    sla_risks: { value: slaRisks, detail: 'AI診断停滞・手動確認・納品遅延', target_href: '/admin/leads' },
    workload: { value: workload, detail: '今日の対応量', target_href: '/admin/reports#today-actions' },
    pending_payment: { value: pendingPayment, detail: '入金待ちの営業案件', target_href: '/admin/funnel' },
    project_due_risks: { value: projectDueRisks, detail: '期限切れまたは当日期限の顧客案件', target_href: '/admin/customers' },
    knowledge_gaps_open: { value: openKnowledgeGaps, detail: '未処理のナレッジ不足キュー', target_href: '/admin/knowledge-gaps' },
  }

  return rules.map((rule) => {
    const metric = values[rule.condition_key] || { value: 0, detail: '未定義の条件', target_href: '/admin/dashboard' }
    const threshold = Number(rule.threshold || 1)
    return {
      id: `${rule.id}-${rule.condition_key}`,
      rule_id: rule.id,
      title: rule.title,
      area: rule.area,
      condition_key: rule.condition_key,
      severity: rule.severity,
      value: metric.value,
      threshold,
      detail: `${metric.detail}: ${metric.value}件 / しきい値 ${threshold}`,
      target_href: metric.target_href,
      enabled: rule.enabled,
      triggered: Boolean(rule.enabled && metric.value >= threshold),
    }
  })
}

export async function recordTriggeredAlerts(
  alerts: EvaluatedAlert[],
  actor = 'system',
  request?: Request,
) {
  if (!supabase) return { ok: false, error: 'Supabase が設定されていません' }

  const rows = alerts
    .filter((alert) => alert.triggered)
    .map((alert) => ({
      rule_id: alert.rule_id,
      severity: alert.severity,
      title: alert.title,
      detail: alert.detail,
      target_href: alert.target_href || null,
      metadata: {
        value: alert.value,
        threshold: alert.threshold,
        area: alert.area,
        condition_key: alert.condition_key,
      },
    }))

  if (!rows.length) return { ok: true, inserted: 0 }

  const { error } = await supabase.from('admin_alert_events').insert(rows)
  if (error) return { ok: false, error: error.message }

  await logAdminAudit({
    actor,
    action: 'admin_alert_events.insert',
    target_table: 'admin_alert_events',
    summary: `${rows.length}件のアラート発火を記録`,
    metadata: { rule_ids: rows.map((row) => row.rule_id) },
    request,
  })

  return { ok: true, inserted: rows.length }
}

export async function listKnowledgeGaps(limit = 200): Promise<{ gaps: KnowledgeGap[]; error?: string }> {
  if (!supabase) return { gaps: [], error: 'Supabase が設定されていません' }

  const { data, error } = await supabase
    .from('knowledge_gaps')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { gaps: [], error: error.message }
  return { gaps: (data as KnowledgeGap[]) || [] }
}

export async function createKnowledgeGap(
  input: {
    question: string
    source?: string
    suggested_category?: string | null
    priority?: KnowledgeGap['priority']
    answer_excerpt?: string | null
    metadata?: Record<string, unknown>
  },
  actor = 'system',
  request?: Request,
) {
  if (!supabase) return { ok: false, error: 'Supabase が設定されていません' }

  const question = cleanString(input.question)
  if (!question) return { ok: false, error: 'question is required' }

  const { data: existing } = await supabase
    .from('knowledge_gaps')
    .select('*')
    .eq('status', 'open')
    .eq('question', question)
    .maybeSingle()

  if (existing) return { ok: true, gap: existing as KnowledgeGap, duplicate: true }

  const row = {
    question,
    source: cleanString(input.source, 'knowledge_query'),
    suggested_category: cleanString(input.suggested_category, '') || null,
    priority: input.priority || 'medium',
    answer_excerpt: cleanString(input.answer_excerpt, '').slice(0, 1000) || null,
    metadata: input.metadata || {},
  }

  const { data, error } = await supabase
    .from('knowledge_gaps')
    .insert(row)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await logAdminAudit({
    actor,
    action: 'knowledge_gaps.insert',
    target_table: 'knowledge_gaps',
    target_id: data?.id ? String(data.id) : undefined,
    summary: `ナレッジ不足「${question.slice(0, 60)}」を登録`,
    metadata: { source: row.source, priority: row.priority },
    request,
  })

  return { ok: true, gap: data as KnowledgeGap }
}

export async function updateKnowledgeGap(
  id: number,
  input: Partial<KnowledgeGap>,
  actor = 'admin',
  request?: Request,
) {
  if (!supabase) return { ok: false, error: 'Supabase が設定されていません' }
  if (!id) return { ok: false, error: 'id is required' }

  const status = input.status
  const now = new Date().toISOString()
  const row = {
    ...(status ? { status } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
    ...(input.suggested_category !== undefined ? { suggested_category: input.suggested_category || null } : {}),
    ...(input.answer_excerpt !== undefined ? { answer_excerpt: input.answer_excerpt || null } : {}),
    ...(input.linked_knowledge_id !== undefined ? { linked_knowledge_id: input.linked_knowledge_id || null } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
    updated_at: now,
    ...(status && status !== 'open' ? { resolved_at: now, resolved_by: actor } : {}),
  }

  const { data, error } = await supabase
    .from('knowledge_gaps')
    .update(row)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return { ok: false, error: error.message }

  await logAdminAudit({
    actor,
    action: 'knowledge_gaps.update',
    target_table: 'knowledge_gaps',
    target_id: String(id),
    summary: `ナレッジ不足 #${id} を更新`,
    metadata: { status, linked_knowledge_id: input.linked_knowledge_id },
    request,
  })

  return { ok: true, gap: data as KnowledgeGap }
}
