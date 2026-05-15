import {
  INVOICE_REGISTRATION_NUMBER,
  formatJapaneseDate,
  formatYen,
} from './paid-billing'

export const SPOT_TICKET_NET_JPY = 30000
export const SPOT_TICKET_TAX_JPY = 3000
export const SPOT_TICKET_TOTAL_JPY = 33000
export const SPOT_TICKET_TAX_RATE = '10%'

const COMPANY_NAME = '合同会社Optiens'
const COMPANY_ADDRESS = '〒407-0301 山梨県北杜市高根町清里3545番地2483'
const COMPANY_EMAIL = 'info@optiens.com'
const SERVICE_NAME = 'スポット相談チケット'

export type SpotTicketBillingInput = {
  customerName: string
  orderId: string
  ticketCount: number
  issueDate?: Date
  dueDate?: Date
  paymentDate?: Date
}

export type SpotTicketPaymentEmailInput = {
  companyName: string
  personName: string
  orderId: string
  ticketCount: number
  amountJpy: number
  ticketNumber: string
}

export function spotTicketAmount(ticketCount: number): {
  net: number
  tax: number
  total: number
} {
  return {
    net: SPOT_TICKET_NET_JPY * ticketCount,
    tax: SPOT_TICKET_TAX_JPY * ticketCount,
    total: SPOT_TICKET_TOTAL_JPY * ticketCount,
  }
}

export function buildSpotTicketNumber(orderId: string, issuedAt = new Date()): string {
  const y = issuedAt.getFullYear()
  const m = String(issuedAt.getMonth() + 1).padStart(2, '0')
  const d = String(issuedAt.getDate()).padStart(2, '0')
  const suffix = orderId.replace(/^STO-?/i, '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
  return `ST-${y}${m}${d}-${suffix}`
}

export function buildSpotTicketInvoiceText(input: SpotTicketBillingInput): string {
  const issueDate = input.issueDate || new Date()
  const dueDate = input.dueDate || issueDate
  const amount = spotTicketAmount(input.ticketCount)
  return `━━━ 電子請求書（適格請求書）情報 ━━━
請求番号: INV-${input.orderId}
発行日: ${formatJapaneseDate(issueDate)}
支払期限: ${formatJapaneseDate(dueDate)}
宛先: ${input.customerName} 御中
取引内容: ${SERVICE_NAME} ${input.ticketCount}枚
税抜金額: ${formatYen(amount.net)}
消費税額（${SPOT_TICKET_TAX_RATE}）: ${formatYen(amount.tax)}
合計（税込）: ${formatYen(amount.total)}
発行者: ${COMPANY_NAME}
所在地: ${COMPANY_ADDRESS}
メール: ${COMPANY_EMAIL}
適格請求書発行事業者登録番号: ${INVOICE_REGISTRATION_NUMBER}
※ 本メールを電子請求書として保存できます。必要に応じてPDF版も発行します。`
}

export function buildSpotTicketReceiptText(input: SpotTicketBillingInput): string {
  const paymentDate = input.paymentDate || new Date()
  const amount = spotTicketAmount(input.ticketCount)
  return `━━━ 電子領収書情報 ━━━
領収書番号: R-${input.orderId}
対応請求番号: INV-${input.orderId}
領収日: ${formatJapaneseDate(paymentDate)}
宛先: ${input.customerName} 御中
但し書き: ${SERVICE_NAME} ${input.ticketCount}枚として
支払方法: 銀行振込
税抜金額: ${formatYen(amount.net)}
消費税額（${SPOT_TICKET_TAX_RATE}）: ${formatYen(amount.tax)}
領収金額（税込）: ${formatYen(amount.total)}
発行者: ${COMPANY_NAME}
所在地: ${COMPANY_ADDRESS}
メール: ${COMPANY_EMAIL}
適格請求書発行事業者登録番号: ${INVOICE_REGISTRATION_NUMBER}
※ 本メールを電子領収書として保存できます。必要に応じてPDF版も発行します。`
}

export function buildSpotTicketInvoiceHtml(input: SpotTicketBillingInput): string {
  const issueDate = input.issueDate || new Date()
  const dueDate = input.dueDate || issueDate
  const amount = spotTicketAmount(input.ticketCount)
  return billingTableHtml('電子請求書（適格請求書）情報', [
    ['請求番号', `INV-${input.orderId}`],
    ['発行日', formatJapaneseDate(issueDate)],
    ['支払期限', formatJapaneseDate(dueDate)],
    ['宛先', `${input.customerName} 御中`],
    ['取引内容', `${SERVICE_NAME} ${input.ticketCount}枚`],
    ['税抜金額', formatYen(amount.net)],
    [`消費税額（${SPOT_TICKET_TAX_RATE}）`, formatYen(amount.tax)],
    ['合計（税込）', formatYen(amount.total)],
    ['発行者', COMPANY_NAME],
    ['所在地', COMPANY_ADDRESS],
    ['メール', COMPANY_EMAIL],
    ['登録番号', INVOICE_REGISTRATION_NUMBER],
  ], '本メールを電子請求書として保存できます。必要に応じてPDF版も発行します。')
}

export function buildSpotTicketReceiptHtml(input: SpotTicketBillingInput): string {
  const paymentDate = input.paymentDate || new Date()
  const amount = spotTicketAmount(input.ticketCount)
  return billingTableHtml('電子領収書情報', [
    ['領収書番号', `R-${input.orderId}`],
    ['対応請求番号', `INV-${input.orderId}`],
    ['領収日', formatJapaneseDate(paymentDate)],
    ['宛先', `${input.customerName} 御中`],
    ['但し書き', `${SERVICE_NAME} ${input.ticketCount}枚として`],
    ['支払方法', '銀行振込'],
    ['税抜金額', formatYen(amount.net)],
    [`消費税額（${SPOT_TICKET_TAX_RATE}）`, formatYen(amount.tax)],
    ['領収金額（税込）', formatYen(amount.total)],
    ['発行者', COMPANY_NAME],
    ['所在地', COMPANY_ADDRESS],
    ['メール', COMPANY_EMAIL],
    ['登録番号', INVOICE_REGISTRATION_NUMBER],
  ], '本メールを電子領収書として保存できます。必要に応じてPDF版も発行します。')
}

export function buildSpotTicketPaymentConfirmedEmail(input: SpotTicketPaymentEmailInput): string {
  const receiptText = buildSpotTicketReceiptText({
    customerName: input.companyName,
    orderId: input.orderId,
    ticketCount: input.ticketCount,
  })
  return `${input.companyName} ${input.personName} 様

合同会社Optiensです。
スポット相談チケットのお振込を確認いたしました。
ありがとうございます。

━━━━━━━━━━━━━━━━━━━━━━
■ 申込番号: ${input.orderId}
■ チケット番号: ${input.ticketNumber}
■ 枚数: ${input.ticketCount}枚
■ 領収金額: ${formatYen(input.amountJpy)}（税込）
━━━━━━━━━━━━━━━━━━━━━━

下記ページから、チケット番号と依頼内容を入力して利用申請を行ってください。
https://optiens.com/spot-ticket#redeem

${receiptText}

※ 事前合意のないチケット消化は行いません。
※ 依頼内容が4枚以上相当、外部API連携、本番運用、認証、個人情報を含む場合は、個別見積へ切り替える場合があります。

合同会社Optiens
〒407-0301 山梨県北杜市高根町清里3545番地2483
https://optiens.com
`
}

export function buildSpotTicketPaymentConfirmedEmailHtml(input: SpotTicketPaymentEmailInput): string {
  const safeCompany = escapeHtml(input.companyName)
  const safePerson = escapeHtml(input.personName)
  const receiptHtml = buildSpotTicketReceiptHtml({
    customerName: input.companyName,
    orderId: input.orderId,
    ticketCount: input.ticketCount,
  })
  return `<div style="font-family:'Noto Sans JP',sans-serif;line-height:1.8;color:#333;max-width:560px;">
<p>${safeCompany} ${safePerson} 様</p>
<p>合同会社Optiensです。<br/>スポット相談チケットのお振込を確認いたしました。ありがとうございます。</p>

<table style="border-collapse:collapse;width:100%;margin:16px 0;background:#EEF2FF;border:1px solid #6B85C9;border-radius:8px;">
  <tr><td style="padding:8px 14px;font-weight:bold;width:140px;">申込番号</td><td style="padding:8px 14px;font-family:monospace;color:#1F3A93;font-weight:bold;">${escapeHtml(input.orderId)}</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;">チケット番号</td><td style="padding:8px 14px;font-family:monospace;color:#1F3A93;font-weight:bold;">${escapeHtml(input.ticketNumber)}</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;">枚数</td><td style="padding:8px 14px;">${input.ticketCount}枚</td></tr>
  <tr><td style="padding:8px 14px;font-weight:bold;">領収金額</td><td style="padding:8px 14px;">${formatYen(input.amountJpy)}（税込）</td></tr>
</table>

<p>下記ページから、チケット番号と依頼内容を入力して利用申請を行ってください。</p>
<p><a href="https://optiens.com/spot-ticket#redeem" style="display:inline-block;padding:12px 18px;background:#1F3A93;color:#fff;border-radius:999px;text-decoration:none;font-weight:bold;">利用申請フォームを開く</a></p>
${receiptHtml}
<p style="font-size:13px;color:#64748b;">事前合意のないチケット消化は行いません。依頼内容が大きい場合は個別見積へ切り替える場合があります。</p>

<p style="margin-top:24px;font-size:12px;color:#64748b;">
合同会社Optiens<br/>
〒407-0301 山梨県北杜市高根町清里3545番地2483<br/>
<a href="https://optiens.com">https://optiens.com</a>
</p>
</div>`
}

function billingTableHtml(title: string, rows: [string, string][], note: string): string {
  return `<div style="margin:20px 0;padding:14px 16px;background:#F8FAFC;border:1px solid #D9DEEA;border-radius:8px;">
<h3 style="margin:0 0 10px;font-size:14px;color:#1F3A93;">${escapeHtml(title)}</h3>
<table style="border-collapse:collapse;width:100%;font-size:13px;">
${rows.map(([label, value]) => `<tr><td style="padding:5px 8px;color:#64748b;width:140px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:5px 8px;color:#182033;">${escapeHtml(value)}</td></tr>`).join('')}
</table>
<p style="margin:10px 0 0;font-size:12px;color:#64748b;">${escapeHtml(note)}</p>
</div>`
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
