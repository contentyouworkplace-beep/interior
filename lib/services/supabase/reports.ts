import { supabase } from '@/lib/supabase'

// ---- Period Utilities & Caching ----
export type ReportPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom'

export interface PeriodRange {
  from: Date
  to: Date
}

function computePeriodRange(period: ReportPeriod, custom?: { from: string; to: string }): PeriodRange {
  const now = new Date()
  let from: Date
  const to = new Date(now)
  switch (period) {
    case 'week':
      from = new Date(now)
      from.setDate(from.getDate() - 7)
      break
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3)
      from = new Date(now.getFullYear(), q * 3, 1)
      break
    }
    case 'year':
      from = new Date(now.getFullYear(), 0, 1)
      break
    case 'custom':
      if (!custom) throw new Error('Custom period requires from/to')
      from = new Date(custom.from)
      return { from, to: new Date(custom.to) }
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return { from, to }
}

interface CacheEntry<T> { data: T; expires: number }
const cache: Record<string, CacheEntry<any>> = {}
const CACHE_TTL_MS = 60 * 1000 // 1 minute simple cache for aggregation

function cacheGet<T>(key: string): T | null {
  const entry = cache[key]
  if (entry && entry.expires > Date.now()) return entry.data as T
  return null
}

function cacheSet<T>(key: string, data: T) {
  cache[key] = { data, expires: Date.now() + CACHE_TTL_MS }
}

export interface ProjectProfitabilityRow {
  project_id: string
  project_name: string
  client_id: string
  total_invoiced: number
  total_paid: number
  total_expenses: number
  gross_margin: number // invoiced - expenses
  collected_margin: number // paid - expenses
  margin_percent: number // (gross_margin / total_invoiced) * 100
}

export interface PendingPaymentRow {
  client_id: string
  total_invoiced: number
  total_paid: number
  balance_due: number
}

export interface LeadConversionSummary {
  total_leads: number
  won: number
  lost: number
  conversion_rate_percent: number
  active_pipeline: number // leads not closed (won/lost)
}

function safeSum<T>(arr: T[] | null | undefined, map: (t: T) => number): number {
  if (!arr || !arr.length) return 0
  return arr.reduce((s, x) => s + (map(x) || 0), 0)
}

export async function fetchProjectProfitability(params?: { period?: ReportPeriod; from?: string; to?: string }): Promise<ProjectProfitabilityRow[]> {
  const period = params?.period || 'month'
  const { from, to } = computePeriodRange(period, params?.period === 'custom' ? { from: params!.from!, to: params!.to! } : undefined)
  const cacheKey = `profitability:${period}:${params?.from || ''}:${params?.to || ''}`
  const cached = cacheGet<ProjectProfitabilityRow[]>(cacheKey)
  if (cached) return cached

  // fetch invoices, payments, expenses, projects within period filters (issue/payment/expense dates)
  const dateFromISO = from.toISOString()
  const dateToISO = to.toISOString()
  const [{ data: projects, error: projErr }, { data: invoices, error: invErr }, { data: payments, error: payErr }, { data: expenses, error: expErr }, { data: clients, error: clientErr }] = await Promise.all([
    supabase.from('projects').select('id,name,client_id'),
    supabase.from('invoices').select('id,project_id,total_amount,issue_date').gte('issue_date', dateFromISO).lte('issue_date', dateToISO),
    supabase.from('payments').select('id,project_id,amount,payment_date').gte('payment_date', dateFromISO).lte('payment_date', dateToISO),
    supabase.from('expenses').select('id,project_id,amount,expense_date').gte('expense_date', dateFromISO).lte('expense_date', dateToISO),
    supabase.from('clients').select('id,first_name,last_name,company'),
  ])
  if (projErr) throw projErr
  if (invErr) throw invErr
  if (payErr) throw payErr
  if (expErr) throw expErr
  if (clientErr) throw clientErr

  const rows: ProjectProfitabilityRow[] = (projects || []).map(p => {
    const projectInvoices = (invoices || []).filter(i => i.project_id === p.id)
    const projectPayments = (payments || []).filter(i => i.project_id === p.id)
    const projectExpenses = (expenses || []).filter(i => i.project_id === p.id)
    const total_invoiced = safeSum(projectInvoices, i => i.total_amount as number)
    const total_paid = safeSum(projectPayments, i => i.amount as number)
    const total_expenses = safeSum(projectExpenses, e => e.amount as number)
    const gross_margin = total_invoiced - total_expenses
    const collected_margin = total_paid - total_expenses
    const margin_percent = total_invoiced > 0 ? (gross_margin / total_invoiced) * 100 : 0
    return {
      project_id: p.id,
      project_name: p.name,
      client_id: p.client_id,
      total_invoiced,
      total_paid,
      total_expenses,
      gross_margin,
      collected_margin,
      margin_percent: Number(margin_percent.toFixed(2)),
    }
  })
  cacheSet(cacheKey, rows)
  return rows
}

export async function fetchPendingPayments(params?: { period?: ReportPeriod; from?: string; to?: string }): Promise<PendingPaymentRow[]> {
  const period = params?.period || 'month'
  const { from, to } = computePeriodRange(period, params?.period === 'custom' ? { from: params!.from!, to: params!.to! } : undefined)
  const cacheKey = `pending:${period}:${params?.from || ''}:${params?.to || ''}`
  const cached = cacheGet<PendingPaymentRow[]>(cacheKey)
  if (cached) return cached

  const dateFromISO = from.toISOString()
  const dateToISO = to.toISOString()
  const [{ data: invoices, error: invErr }, { data: payments, error: payErr }, { data: clients, error: clientErr }] = await Promise.all([
    supabase.from('invoices').select('id,client_id,total_amount,issue_date,due_date').gte('issue_date', dateFromISO).lte('issue_date', dateToISO),
    supabase.from('payments').select('id,client_id,amount,payment_date').gte('payment_date', dateFromISO).lte('payment_date', dateToISO),
    supabase.from('clients').select('id,first_name,last_name,company'),
  ])
  if (invErr) throw invErr
  if (payErr) throw payErr
  if (clientErr) throw clientErr

  const byClient: Record<string, PendingPaymentRow> = {}
  for (const inv of invoices || []) {
    if (!byClient[inv.client_id]) {
      byClient[inv.client_id] = { client_id: inv.client_id, total_invoiced: 0, total_paid: 0, balance_due: 0 }
    }
    byClient[inv.client_id].total_invoiced += inv.total_amount || 0
  }
  for (const pay of payments || []) {
    if (!byClient[pay.client_id]) {
      byClient[pay.client_id] = { client_id: pay.client_id, total_invoiced: 0, total_paid: 0, balance_due: 0 }
    }
    byClient[pay.client_id].total_paid += pay.amount || 0
  }
  const rows = Object.values(byClient).map(row => ({
      ...row,
      balance_due: Math.max(row.total_invoiced - row.total_paid, 0),
    }))
  cacheSet(cacheKey, rows)
  return rows
}

export async function fetchLeadConversionSummary(params?: { period?: ReportPeriod; from?: string; to?: string }): Promise<LeadConversionSummary> {
  const period = params?.period || 'month'
  const { from, to } = computePeriodRange(period, params?.period === 'custom' ? { from: params!.from!, to: params!.to! } : undefined)
  const cacheKey = `leads:${period}:${params?.from || ''}:${params?.to || ''}`
  const cached = cacheGet<LeadConversionSummary>(cacheKey)
  if (cached) return cached

  const dateFromISO = from.toISOString()
  const dateToISO = to.toISOString()
  const { data: leads, error } = await supabase.from('leads').select('id,stage,created_at').gte('created_at', dateFromISO).lte('created_at', dateToISO)
  if (error) throw error
  const total = leads?.length || 0
  const won = leads?.filter(l => l.stage === 'won').length || 0
  const lost = leads?.filter(l => l.stage === 'lost').length || 0
  const active_pipeline = leads?.filter(l => !['won','lost'].includes(l.stage)).length || 0
  const conversion_rate_percent = total > 0 ? (won / total) * 100 : 0
  const summary = {
    total_leads: total,
    won,
    lost,
    conversion_rate_percent: Number(conversion_rate_percent.toFixed(2)),
    active_pipeline,
  }
  cacheSet(cacheKey, summary)
  return summary
}

export interface ComprehensiveReportsBundle {
  profitability: ProjectProfitabilityRow[]
  pendingPayments: PendingPaymentRow[]
  leadConversion: LeadConversionSummary
}

export async function fetchComprehensiveReports(params?: { period?: ReportPeriod; from?: string; to?: string }): Promise<ComprehensiveReportsBundle> {
  const [profitability, pendingPayments, leadConversion] = await Promise.all([
    fetchProjectProfitability(params),
    fetchPendingPayments(params),
    fetchLeadConversionSummary(params),
  ])
  return { profitability, pendingPayments, leadConversion }
}
