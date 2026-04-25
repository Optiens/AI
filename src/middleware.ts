import { defineMiddleware } from 'astro:middleware'

const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || ''
const COOKIE_NAME = 'optiens_admin'

function makeToken(password: string): string {
  // Simple hash - sufficient for single-user admin behind HTTPS
  let hash = 0
  const str = `optiens:${password}:salt2026`
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

export const onRequest = defineMiddleware(async ({ url, cookies, redirect }, next) => {
  // Only protect /admin routes (except /admin/login)
  if (!url.pathname.startsWith('/admin') || url.pathname === '/admin/login') {
    return next()
  }

  if (!ADMIN_PASSWORD) {
    return new Response('ADMIN_PASSWORD is not configured', { status: 500 })
  }

  const token = cookies.get(COOKIE_NAME)?.value
  if (token !== makeToken(ADMIN_PASSWORD)) {
    return redirect('/admin/login')
  }

  return next()
})

export { makeToken, COOKIE_NAME, ADMIN_PASSWORD }
