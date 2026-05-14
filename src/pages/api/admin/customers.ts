import type { APIRoute } from 'astro'
import { isAdminRequest, json } from '../../../lib/admin-auth'
import {
  addCustomerEvent,
  listCustomersWithProjects,
  upsertCustomer,
  upsertCustomerProject,
} from '../../../lib/admin-ops'

export const GET: APIRoute = async ({ request }) => {
  if (!isAdminRequest(request)) return json({ error: 'Unauthorized' }, 401)
  const result = await listCustomersWithProjects()
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

  const action = String(body.action || 'create_customer_with_project')

  if (action === 'upsert_customer') {
    const result = await upsertCustomer(body, 'admin', request)
    return json(result, result.ok ? 200 : 400)
  }

  if (action === 'upsert_project') {
    const result = await upsertCustomerProject(body, 'admin', request)
    return json(result, result.ok ? 200 : 400)
  }

  if (action === 'add_event') {
    const result = await addCustomerEvent(body, 'admin', request)
    return json(result, result.ok ? 200 : 400)
  }

  if (action === 'create_customer_with_project') {
    const customerResult = await upsertCustomer(body, 'admin', request)
    if (!customerResult.ok || !customerResult.customer) {
      return json(customerResult, 400)
    }

    const projectTitle = String(body.project_title || '').trim()
    if (!projectTitle) return json(customerResult, 200)

    const projectResult = await upsertCustomerProject({
      customer_id: customerResult.customer.id,
      lead_id: body.lead_id ? String(body.lead_id) : null,
      title: projectTitle,
      project_type: String(body.project_type || 'diagnosis') as any,
      status: String(body.project_status || 'lead') as any,
      priority: String(body.priority || 'medium') as any,
      contract_amount_jpy: Number(body.contract_amount_jpy || 0),
      monthly_amount_jpy: Number(body.monthly_amount_jpy || 0),
      owner: String(body.owner || 'CEO'),
      next_action: body.next_action ? String(body.next_action) : null,
      due_date: body.due_date ? String(body.due_date) : null,
      notes: body.project_notes ? String(body.project_notes) : null,
    }, 'admin', request)

    return json({
      ok: projectResult.ok,
      customer: customerResult.customer,
      project: projectResult.ok ? projectResult.project : null,
      error: projectResult.ok ? undefined : projectResult.error,
    }, projectResult.ok ? 200 : 400)
  }

  return json({ error: 'Unknown action' }, 400)
}

export const PUT = POST
