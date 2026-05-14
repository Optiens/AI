type InvokeResult = {
  ok: boolean
  status?: number
  skipped?: boolean
  error?: string
  data?: unknown
}

export async function invokePaidReportFunction(
  supabaseUrl: string | undefined,
  serviceRoleKey: string | undefined,
  payload: unknown,
): Promise<InvokeResult> {
  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, skipped: true, error: 'Supabase service credentials are not configured' }
  }

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/process-paid-diagnosis`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const text = await res.text()
    let data: any = {}
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      data = { raw: text }
    }
    return {
      ok: res.ok && !data?.error,
      status: res.status,
      error: data?.error,
      data,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
