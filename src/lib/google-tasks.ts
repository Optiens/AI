const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = import.meta.env.GOOGLE_CLIENT_SECRET
const GOOGLE_REFRESH_TOKEN = import.meta.env.GOOGLE_REFRESH_TOKEN

export type BusinessTaskListId = 'ai-support' | 'hydroponics' | 'ai-novel'

export type BusinessTask = {
  id: string
  title: string
  notes?: string
  due?: string
  dueKey?: string
  listId: BusinessTaskListId
  listName: string
  url?: string
  status?: string
}

export type BusinessTaskSummary = {
  configured: boolean
  error?: string
  lists: Array<{ id: BusinessTaskListId; name: string; taskCount: number }>
  overdue: BusinessTask[]
  today: BusinessTask[]
  upcoming: BusinessTask[]
  noDue: BusinessTask[]
  all: BusinessTask[]
}

const BUSINESS_TASK_LISTS: Array<{ id: BusinessTaskListId; name: string; googleId: string }> = [
  { id: 'ai-support', name: 'AI支援事業', googleId: 'cE9hVHhKNGJFTDY2bGJHWQ' },
  { id: 'hydroponics', name: '水耕栽培事業', googleId: 'bkRfOFVIT0hpaVZpZ0dBeA' },
  { id: 'ai-novel', name: 'AI小説事業', googleId: 'VHV0bERpeTJBaURZV192aQ' },
]

const tokyoDateKeyFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function tokyoDateKey(date: Date) {
  return tokyoDateKeyFormatter.format(date)
}

function addDaysKey(base: Date, days: number) {
  const date = new Date(base)
  date.setDate(date.getDate() + days)
  return tokyoDateKey(date)
}

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
  const data = await res.json().catch(() => ({}))
  return typeof data.access_token === 'string' ? data.access_token : null
}

function normalizeGoogleTask(task: any, list: (typeof BUSINESS_TASK_LISTS)[number]): BusinessTask {
  const due = typeof task.due === 'string' ? task.due : ''
  return {
    id: String(task.id || ''),
    title: String(task.title || '無題タスク'),
    notes: typeof task.notes === 'string' ? task.notes : '',
    due: due || undefined,
    dueKey: due ? due.slice(0, 10) : undefined,
    listId: list.id,
    listName: list.name,
    url: typeof task.webViewLink === 'string' ? task.webViewLink : undefined,
    status: typeof task.status === 'string' ? task.status : undefined,
  }
}

function emptySummary(configured: boolean, error?: string): BusinessTaskSummary {
  return {
    configured,
    error,
    lists: BUSINESS_TASK_LISTS.map((list) => ({ id: list.id, name: list.name, taskCount: 0 })),
    overdue: [],
    today: [],
    upcoming: [],
    noDue: [],
    all: [],
  }
}

export async function getBusinessTaskSummary(now = new Date(), horizonDays = 7): Promise<BusinessTaskSummary> {
  const token = await getGoogleAccessToken()
  if (!token) {
    return emptySummary(false, 'Google Tasks の認証情報が設定されていません')
  }

  const todayKey = tokyoDateKey(now)
  const horizonKey = addDaysKey(now, horizonDays)
  const all: BusinessTask[] = []
  const listCounts = new Map<BusinessTaskListId, number>()

  for (const list of BUSINESS_TASK_LISTS) {
    const url = new URL(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(list.googleId)}/tasks`)
    url.searchParams.set('showCompleted', 'false')
    url.searchParams.set('showHidden', 'false')
    url.searchParams.set('maxResults', '100')

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!res.ok) {
      const message = await res.text().catch(() => '')
      return emptySummary(true, `Google Tasks 取得失敗: ${list.name} / HTTP ${res.status} ${message.slice(0, 160)}`)
    }

    const data = await res.json().catch(() => ({}))
    const tasks = Array.isArray(data.items) ? data.items.map((task) => normalizeGoogleTask(task, list)) : []
    listCounts.set(list.id, tasks.length)
    all.push(...tasks)
  }

  const byDue = (a: BusinessTask, b: BusinessTask) => String(a.dueKey || '9999').localeCompare(String(b.dueKey || '9999'))
  const overdue = all.filter((task) => task.dueKey && task.dueKey < todayKey).sort(byDue)
  const today = all.filter((task) => task.dueKey === todayKey).sort((a, b) => a.title.localeCompare(b.title, 'ja'))
  const upcoming = all.filter((task) => task.dueKey && task.dueKey > todayKey && task.dueKey <= horizonKey).sort(byDue)
  const noDue = all.filter((task) => !task.dueKey).sort((a, b) => a.title.localeCompare(b.title, 'ja')).slice(0, 12)

  return {
    configured: true,
    lists: BUSINESS_TASK_LISTS.map((list) => ({
      id: list.id,
      name: list.name,
      taskCount: listCounts.get(list.id) || 0,
    })),
    overdue,
    today,
    upcoming,
    noDue,
    all,
  }
}

