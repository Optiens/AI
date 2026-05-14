export const PAID_DIAGNOSIS_TOTAL_JPY = 5500
export const PAID_DIAGNOSIS_NET_JPY = 5000
export const PAID_DIAGNOSIS_TAX_JPY = 500
export const PAID_DIAGNOSIS_TAX_RATE = '10%'
export const INVOICE_REGISTRATION_NUMBER = 'T9090003003025'

const COMPANY_NAME = '合同会社Optiens'
const COMPANY_ADDRESS = '〒407-0301 山梨県北杜市高根町清里3545番地2483'
const COMPANY_EMAIL = 'info@optiens.com'
const SERVICE_NAME = '【詳細版】AI活用診断（詳細レポート + 60分オンラインMTG）'

type BillingInput = {
  customerName: string
  applicationId: string
  issueDate?: Date
  dueDate?: Date
  paymentDate?: Date
}

export function formatYen(value: number): string {
  return `¥${Math.round(value).toLocaleString('ja-JP')}`
}

export function formatJapaneseDate(date = new Date()): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export function buildPaidDiagnosisInvoiceText(input: BillingInput): string {
  const issueDate = input.issueDate || new Date()
  const dueDate = input.dueDate || issueDate
  return `━━━ 電子請求書（適格請求書）情報 ━━━
請求番号: INV-${input.applicationId}
発行日: ${formatJapaneseDate(issueDate)}
支払期限: ${formatJapaneseDate(dueDate)}
宛先: ${input.customerName} 御中
取引内容: ${SERVICE_NAME}
税抜金額: ${formatYen(PAID_DIAGNOSIS_NET_JPY)}
消費税額（${PAID_DIAGNOSIS_TAX_RATE}）: ${formatYen(PAID_DIAGNOSIS_TAX_JPY)}
合計（税込）: ${formatYen(PAID_DIAGNOSIS_TOTAL_JPY)}
発行者: ${COMPANY_NAME}
所在地: ${COMPANY_ADDRESS}
メール: ${COMPANY_EMAIL}
適格請求書発行事業者登録番号: ${INVOICE_REGISTRATION_NUMBER}
※ 本メールを電子請求書として保存できます。必要に応じてPDF版も発行します。`
}

export function buildPaidDiagnosisReceiptText(input: BillingInput): string {
  const paymentDate = input.paymentDate || new Date()
  return `━━━ 電子領収書情報 ━━━
領収書番号: R-${input.applicationId}
対応請求番号: INV-${input.applicationId}
領収日: ${formatJapaneseDate(paymentDate)}
宛先: ${input.customerName} 御中
但し書き: ${SERVICE_NAME} として
支払方法: 銀行振込
税抜金額: ${formatYen(PAID_DIAGNOSIS_NET_JPY)}
消費税額（${PAID_DIAGNOSIS_TAX_RATE}）: ${formatYen(PAID_DIAGNOSIS_TAX_JPY)}
領収金額（税込）: ${formatYen(PAID_DIAGNOSIS_TOTAL_JPY)}
発行者: ${COMPANY_NAME}
所在地: ${COMPANY_ADDRESS}
メール: ${COMPANY_EMAIL}
適格請求書発行事業者登録番号: ${INVOICE_REGISTRATION_NUMBER}
※ 本メールを電子領収書として保存できます。必要に応じてPDF版も発行します。`
}

export function buildPaidDiagnosisInvoiceHtml(input: BillingInput): string {
  const issueDate = input.issueDate || new Date()
  const dueDate = input.dueDate || issueDate
  return billingTableHtml('電子請求書（適格請求書）情報', [
    ['請求番号', `INV-${input.applicationId}`],
    ['発行日', formatJapaneseDate(issueDate)],
    ['支払期限', formatJapaneseDate(dueDate)],
    ['宛先', `${input.customerName} 御中`],
    ['取引内容', SERVICE_NAME],
    ['税抜金額', formatYen(PAID_DIAGNOSIS_NET_JPY)],
    [`消費税額（${PAID_DIAGNOSIS_TAX_RATE}）`, formatYen(PAID_DIAGNOSIS_TAX_JPY)],
    ['合計（税込）', formatYen(PAID_DIAGNOSIS_TOTAL_JPY)],
    ['発行者', COMPANY_NAME],
    ['所在地', COMPANY_ADDRESS],
    ['メール', COMPANY_EMAIL],
    ['登録番号', INVOICE_REGISTRATION_NUMBER],
  ], '本メールを電子請求書として保存できます。必要に応じてPDF版も発行します。')
}

export function buildPaidDiagnosisReceiptHtml(input: BillingInput): string {
  const paymentDate = input.paymentDate || new Date()
  return billingTableHtml('電子領収書情報', [
    ['領収書番号', `R-${input.applicationId}`],
    ['対応請求番号', `INV-${input.applicationId}`],
    ['領収日', formatJapaneseDate(paymentDate)],
    ['宛先', `${input.customerName} 御中`],
    ['但し書き', `${SERVICE_NAME} として`],
    ['支払方法', '銀行振込'],
    ['税抜金額', formatYen(PAID_DIAGNOSIS_NET_JPY)],
    [`消費税額（${PAID_DIAGNOSIS_TAX_RATE}）`, formatYen(PAID_DIAGNOSIS_TAX_JPY)],
    ['領収金額（税込）', formatYen(PAID_DIAGNOSIS_TOTAL_JPY)],
    ['発行者', COMPANY_NAME],
    ['所在地', COMPANY_ADDRESS],
    ['メール', COMPANY_EMAIL],
    ['登録番号', INVOICE_REGISTRATION_NUMBER],
  ], '本メールを電子領収書として保存できます。必要に応じてPDF版も発行します。')
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
