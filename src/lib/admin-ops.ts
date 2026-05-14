import { supabase } from './supabase'
import type { KnowledgeDoc } from './optiens-knowledge'

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

