import { defineMiddleware } from 'astro:middleware'

/**
 * Vercel の Sensitive 環境変数はビルド時に埋め込まれず、runtime の process.env からのみ
 * 取得可能。import.meta.env と process.env の両方を試す。
 */
function getAdminPassword(): string {
  const fromImportMeta = import.meta.env.ADMIN_PASSWORD
  if (fromImportMeta) return fromImportMeta
  if (typeof process !== 'undefined' && process.env?.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD
  }
  return ''
}

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

  const adminPassword = getAdminPassword()
  if (!adminPassword) {
    // 環境変数未設定でも 500 で止めず、ログイン画面側でエラー表示する
    return redirect('/admin/login?config=missing')
  }

  const token = cookies.get(COOKIE_NAME)?.value
  if (token !== makeToken(adminPassword)) {
    return redirect('/admin/login')
  }

  return next()
})

export { makeToken, COOKIE_NAME, getAdminPassword }
