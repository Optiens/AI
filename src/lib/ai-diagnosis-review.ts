import crypto from 'node:crypto'
import { getRuntimeEnv } from './runtime-env'

function getReviewSecret(): string {
  const reviewSecret =
    getRuntimeEnv('AI_DIAGNOSIS_OFFICER_REVIEW_SECRET') ||
    getRuntimeEnv('AI_DIAGNOSIS_OFFICER_ACCESS_CODE') ||
    getRuntimeEnv('PAYMENT_NOTIFY_SECRET')

  if (!reviewSecret) {
    console.warn('[ai-diagnosis-review] Review secret is not set; using development fallback.')
    return 'dev-only-ai-diagnosis-review-secret'
  }
  return reviewSecret
}

function normalizeTicketNumber(ticketNumber: string): string {
  return ticketNumber.trim().toUpperCase()
}

export function generateAiDiagnosisReviewToken(ticketNumber: string): string {
  return crypto
    .createHmac('sha256', getReviewSecret())
    .update(normalizeTicketNumber(ticketNumber))
    .digest('base64url')
}

export function verifyAiDiagnosisReviewToken(ticketNumber: string, token: string): boolean {
  if (!ticketNumber || !token) return false
  let expected = ''
  try {
    expected = generateAiDiagnosisReviewToken(ticketNumber)
  } catch {
    return false
  }
  if (token.length !== expected.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  } catch {
    return false
  }
}

export function buildAiDiagnosisReviewUrl(siteUrl: string, ticketNumber: string): string {
  const base = siteUrl.replace(/\/$/, '')
  const normalizedTicketNumber = normalizeTicketNumber(ticketNumber)
  const token = generateAiDiagnosisReviewToken(normalizedTicketNumber)
  const params = new URLSearchParams({
    mode: 'review',
    ticket: normalizedTicketNumber,
    t: token,
  })
  return `${base}/ai-diagnosis-officer?${params.toString()}`
}
