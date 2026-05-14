import { makeToken, COOKIE_NAME, getAdminPassword } from '../middleware'

export function isAdminRequest(request: Request) {
  const adminPassword = getAdminPassword()
  if (!adminPassword) return false
  const cookieHeader = request.headers.get('cookie') || ''
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return Boolean(match && match[1] === makeToken(adminPassword))
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

