// Centralized messaging & contact link helpers
// These are pure utilities; UI components can import these to build action buttons.

export interface WhatsappOptions {
  text?: string
  phoneCountryCode?: string // default assume number already includes country code
}

// Normalize phone by stripping non-digits; optionally add country code if missing and provided.
function normalizePhone(raw: string, countryCode?: string) {
  const digits = raw.replace(/\D/g, '')
  if (countryCode && !digits.startsWith(countryCode.replace(/\D/g, ''))) {
    return `${countryCode.replace(/\D/g, '')}${digits}`
  }
  return digits
}

export function phoneLink(phone: string) {
  return `tel:${phone.replace(/\s+/g, '')}`
}

export function smsLink(phone: string, body?: string) {
  const enc = body ? `?&body=${encodeURIComponent(body)}` : ''
  return `sms:${phone.replace(/\s+/g, '')}${enc}`
}

export function emailLink(email: string, subject?: string, body?: string) {
  const params: string[] = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  return `mailto:${email}${params.length ? `?${params.join('&')}` : ''}`
}

export function whatsappLink(phone: string, opts: WhatsappOptions = {}) {
  const full = normalizePhone(phone, opts.phoneCountryCode)
  const base = `https://wa.me/${full}`
  if (opts.text) return `${base}?text=${encodeURIComponent(opts.text)}`
  return base
}

export interface ShareProjectUpdateParams {
  projectName: string
  progressPercent?: number
  nextMilestone?: string
  customMessage?: string
}

export function buildProjectUpdateMessage(params: ShareProjectUpdateParams) {
  const parts: string[] = []
  parts.push(`Project: ${params.projectName}`)
  if (params.progressPercent !== undefined) parts.push(`Progress: ${params.progressPercent}%`)
  if (params.nextMilestone) parts.push(`Next Milestone: ${params.nextMilestone}`)
  if (params.customMessage) parts.push(params.customMessage)
  return parts.join('\n')
}

export function whatsappProjectUpdate(phone: string, p: ShareProjectUpdateParams) {
  return whatsappLink(phone, { text: buildProjectUpdateMessage(p) })
}

export interface ShareInvoiceParams {
  invoiceNumber: string
  amount: number
  currency: string
  dueDate?: string
  paymentLink?: string
}

export function buildInvoiceMessage(p: ShareInvoiceParams) {
  const lines = [
    `Invoice #: ${p.invoiceNumber}`,
    `Amount: ${p.currency} ${p.amount.toFixed(2)}`
  ]
  if (p.dueDate) lines.push(`Due: ${p.dueDate}`)
  if (p.paymentLink) lines.push(`Pay: ${p.paymentLink}`)
  lines.push('Thank you!')
  return lines.join('\n')
}

export function whatsappInvoice(phone: string, p: ShareInvoiceParams) {
  return whatsappLink(phone, { text: buildInvoiceMessage(p) })
}

// Generic share text (WhatsApp fallback)
export function whatsappShare(phone: string, text: string) {
  return whatsappLink(phone, { text })
}
