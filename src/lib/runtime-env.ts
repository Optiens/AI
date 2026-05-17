export function getRuntimeEnv(name: string): string | undefined {
  return process.env[name] ?? (import.meta.env as Record<string, string | undefined>)[name]
}

export function isRuntimeProd(): boolean {
  return Boolean(import.meta.env.PROD || process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production')
}

export function isRuntimeDev(): boolean {
  return Boolean(import.meta.env.DEV || (!isRuntimeProd() && process.env.NODE_ENV !== 'production'))
}

export function getSiteUrl(): string {
  return (getRuntimeEnv('SITE_URL') || 'https://optiens.com').replace(/\/$/, '')
}
