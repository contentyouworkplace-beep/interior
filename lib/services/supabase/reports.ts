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

// Lightweight name lookup helpers (client/project) for UI enrichment
interface ClientNameMap { [id: string]: { display: string } }
interface ProjectNameMap { [id: string]: { name: string } }

export async function fetchClientNameMap(): Promise<ClientNameMap> {
  const key = 'clientNameMap'
  const cached = cacheGet<ClientNameMap>(key)
  if (cached) return cached
  const { data, error } = await supabase.from('clients').select('id,first_name,last_name,company')
  if (error) throw error
  const map: ClientNameMap = {}
  for (const c of data || []) {
    const parts = [ (c as any).first_name, (c as any).last_name ].filter(Boolean).join(' ').trim()
    const display = parts || (c as any).company || 'Client'
    map[(c as any).id] = { display }
  }
  cacheSet(key, map)
  return map
}

export async function fetchProjectNameMap(): Promise<ProjectNameMap> {
  const key = 'projectNameMap'
  const cached = cacheGet<ProjectNameMap>(key)
  if (cached) return cached
  const { data, error } = await supabase.from('projects').select('id,name')
  if (error) throw error
  const map: ProjectNameMap = {}
  for (const p of data || []) {
    map[(p as any).id] = { name: (p as any).name || 'Project' }
  }
  cacheSet(key, map)
  return map
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

// ---- Invoice Summary (for dashboard card) ----
export interface InvoiceSummary {
  total_invoiced: number
  total_paid: number
  paid_percent: number
  count_total: number
  count_paid: number
}

export interface QuotationSummary {
  total: number
  accepted: number
  pending: number
  rejected: number
  total_amount: number
  accepted_amount: number
  acceptance_rate: number
}

export interface ExpenseSummary {
  total_expenses: number
  by_category: { category: string; total: number }[]
  paid_count: number
  pending_count: number
}

export interface ProjectSummary {
  total_projects: number
  active_projects: number
  completed_projects: number
}

export interface OutstandingRecord {
  invoice_id: string
  client_id: string
  client_name: string
  project_id?: string
  amount: number
  due_date: string
  days_overdue: number
}

export async function fetchQuotationSummary(params: { from: string; to: string; userId?: string; allTime?: boolean }): Promise<QuotationSummary> {
  const { from, to, userId, allTime } = params
  const cacheKey = `quotationSummary:${allTime ? 'ALL' : from}:${allTime ? 'ALL' : to}:${userId || 'all'}`
  const cached = cacheGet<QuotationSummary>(cacheKey)
  if (cached) return cached
  let query = supabase
    .from('quotations')
    // select a wider set to allow legacy schemas
    .select('id,status,total_amount,subtotal,created_at,issue_date,total,amount,grand_total')
  if (!allTime) {
    query = query.gte('created_at', from).lte('created_at', to)
  }
  if (userId) query = query.eq('user_id', userId)
  let { data: quotations, error } = await query
  if (error) throw error
  if (userId && (quotations?.length ?? 0) === 0) {
  let retry = supabase.from('quotations').select('id,status,total_amount,subtotal,created_at,issue_date,total,amount,grand_total')
    if (!allTime) retry = retry.gte('created_at', from).lte('created_at', to)
    const r = await retry
    if (!r.error && (r.data?.length || 0) > 0) quotations = r.data
  }
  let total_amount = 0
  let accepted_amount = 0
  let total = quotations?.length || 0
  let accepted = 0, pending = 0, rejected = 0
  for (const q of quotations || []) {
    const amt = (q as any).total_amount ?? (q as any).grand_total ?? (q as any).subtotal ?? (q as any).total ?? (q as any).amount ?? 0
    total_amount += amt
    let statusRaw = (q as any).status || ''
    const status = statusRaw.toLowerCase()
    if (status === 'accepted' || status === 'approved') { accepted++; accepted_amount += amt }
    else if (status === 'pending' || status === 'sent' || status === 'draft') pending++
    else if (status === 'rejected' || status === 'declined') rejected++
  }
  const acceptance_rate = total > 0 ? (accepted / total) * 100 : 0
  const summary: QuotationSummary = {
    total,
    accepted,
    pending,
    rejected,
    total_amount: Number(total_amount.toFixed(2)),
    accepted_amount: Number(accepted_amount.toFixed(2)),
    acceptance_rate: Number(acceptance_rate.toFixed(2))
  }
  cacheSet(cacheKey, summary)
  if (process.env.NEXT_PUBLIC_REPORTS_DEBUG === '1') console.log('[reports] quotationSummary', { total: summary.total })
  return summary
}

export async function fetchExpenseSummary(params: { from: string; to: string; userId?: string; allTime?: boolean }): Promise<ExpenseSummary> {
  const { from, to, userId, allTime } = params
  const cacheKey = `expenseSummary:${allTime ? 'ALL' : from}:${allTime ? 'ALL' : to}:${userId || 'all'}`
  const cached = cacheGet<ExpenseSummary>(cacheKey)
  if (cached) return cached
  // Attempt primary query including status; fallback if column missing
  let expensesData: any[] | null = null
  let paid_count = 0, pending_count = 0
  let primaryQuery = supabase
    .from('expenses')
    .select('id,amount,category,status,expense_date')
  if (!allTime) primaryQuery = primaryQuery.gte('expense_date', from).lte('expense_date', to)
  if (userId) primaryQuery = primaryQuery.eq('user_id', userId)
  const primary = await primaryQuery
  if (primary.error && (primary.error.message?.includes('status') || primary.error.details?.includes('status'))) {
    let fallbackQuery = supabase
      .from('expenses')
      .select('id,amount,category,expense_date')
    if (!allTime) fallbackQuery = fallbackQuery.gte('expense_date', from).lte('expense_date', to)
    if (userId) fallbackQuery = fallbackQuery.eq('user_id', userId)
    const fallback = await fallbackQuery
    if (fallback.error) throw fallback.error
    expensesData = fallback.data as any[]
    // status counts not available; leave as zero
  } else if (primary.error) {
    throw primary.error
  } else {
    expensesData = primary.data as any[]
    if (userId && (expensesData?.length ?? 0) === 0) {
      // Retry without user scoping (legacy rows may lack user_id) - RLS still applies
      let retry = supabase.from('expenses').select('id,amount,category,status,expense_date')
      if (!allTime) retry = retry.gte('expense_date', from).lte('expense_date', to)
      const r = await retry
      if (!r.error && (r.data?.length || 0) > 0) expensesData = r.data as any[]
    }
  }
  let total_expenses = 0
  const byCat: Record<string, number> = {}
  for (const e of expensesData || []) {
    const amt = (e as any).amount || 0
    total_expenses += amt
    const category = (e as any).category || 'Uncategorized'
    byCat[category] = (byCat[category] || 0) + amt
    if ('status' in (e as any)) {
      const status = ((e as any).status || '').toLowerCase()
      if (status === 'paid') paid_count++
      else if (status === 'pending') pending_count++
    }
  }
  const by_category = Object.entries(byCat).map(([category, total]) => ({ category, total: Number(total.toFixed(2)) }))
  const summary: ExpenseSummary = { total_expenses: Number(total_expenses.toFixed(2)), by_category, paid_count, pending_count }
  cacheSet(cacheKey, summary)
  if (process.env.NEXT_PUBLIC_REPORTS_DEBUG === '1') console.log('[reports] expenseSummary', { total_expenses: summary.total_expenses })
  return summary
}

export async function fetchProjectSummary(params: { from: string; to: string; userId?: string; allTime?: boolean }): Promise<ProjectSummary> {
  const { from, to, userId, allTime } = params
  const cacheKey = `projectSummary:${allTime ? 'ALL' : from}:${allTime ? 'ALL' : to}:${userId || 'all'}`
  const cached = cacheGet<ProjectSummary>(cacheKey)
  if (cached) return cached
  let query = supabase
    .from('projects')
    .select('id,status,created_at')
  if (!allTime) query = query.gte('created_at', from).lte('created_at', to)
  if (userId) query = query.eq('user_id', userId)
  let { data: projects, error } = await query
  if (error) throw error
  if (userId && (projects?.length ?? 0) === 0) {
    let retry = supabase.from('projects').select('id,status,created_at')
    if (!allTime) retry = retry.gte('created_at', from).lte('created_at', to)
    const r = await retry
    if (!r.error && (r.data?.length || 0) > 0) projects = r.data
  }
  let total_projects = projects?.length || 0
  let active_projects = 0
  let completed_projects = 0
  for (const p of projects || []) {
    const status = ((p as any).status || '').toLowerCase()
    if (status.includes('progress') || status === 'active') active_projects++
    else if (status === 'completed') completed_projects++
  }
  const summary: ProjectSummary = { total_projects, active_projects, completed_projects }
  cacheSet(cacheKey, summary)
  if (process.env.NEXT_PUBLIC_REPORTS_DEBUG === '1') console.log('[reports] projectSummary', { total: summary.total_projects })
  return summary
}

export async function fetchOutstandingInvoices(params: { from: string; to: string; userId?: string; allTime?: boolean }): Promise<OutstandingRecord[]> {
  const { from, to, userId, allTime } = params
  const cacheKey = `outstanding:${allTime ? 'ALL' : from}:${allTime ? 'ALL' : to}:${userId || 'all'}`
  const cached = cacheGet<OutstandingRecord[]>(cacheKey)
  if (cached) return cached
  let invQuery = supabase
    .from('invoices')
    .select('id,client_id,project_id,total_amount,status,due_date,issue_date')
  if (!allTime) invQuery = invQuery.gte('issue_date', from).lte('issue_date', to)
  if (userId) invQuery = invQuery.eq('user_id', userId)
  let { data: invoices, error } = await invQuery
  if (error) throw error
  if (userId && (invoices?.length ?? 0) === 0) {
    let retry = supabase.from('invoices').select('id,client_id,project_id,total_amount,status,due_date,issue_date')
    if (!allTime) retry = retry.gte('issue_date', from).lte('issue_date', to)
    const r = await retry
    if (!r.error && (r.data?.length || 0) > 0) invoices = r.data
  }
  let clientsQuery = supabase.from('clients').select('id,first_name,last_name,company')
  if (userId) clientsQuery = clientsQuery.eq('user_id', userId)
  const { data: clients } = await clientsQuery
  const rows: OutstandingRecord[] = []
  const today = new Date()
  for (const inv of invoices || []) {
    if ((inv as any).status !== 'paid') {
      const due = new Date((inv as any).due_date)
      const diffMs = today.getTime() - due.getTime()
      const days_overdue = diffMs > 0 ? Math.floor(diffMs / (1000*60*60*24)) : 0
      const c = (clients || []).find(c => c.id === (inv as any).client_id)
      const client_name = c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() || (c.company || 'Client') : 'Client'
      rows.push({
        invoice_id: (inv as any).id,
        client_id: (inv as any).client_id,
        client_name,
        project_id: (inv as any).project_id || undefined,
        amount: (inv as any).total_amount || 0,
        due_date: (inv as any).due_date,
        days_overdue
      })
    }
  }
  cacheSet(cacheKey, rows)
  if (process.env.NEXT_PUBLIC_REPORTS_DEBUG === '1') console.log('[reports] outstandingInvoices', { count: rows.length })
  return rows
}

// LIST FETCHERS (for reports tab detailed lists)
export interface QuotationListItem {
  id: string
  client_id: string | null
  project_id: string | null
  status: string | null
  total_amount: number
  created_at: string
}

export async function fetchQuotationsList(params: { from: string; to: string; userId?: string; allTime?: boolean }): Promise<QuotationListItem[]> {
  const { from, to, userId, allTime } = params
  const cacheKey = `quotationsList:${allTime ? 'ALL' : from}:${allTime ? 'ALL' : to}:${userId || 'all'}`
  const cached = cacheGet<QuotationListItem[]>(cacheKey)
  if (cached) return cached
  let query = supabase
    .from('quotations')
    .select('id,client_id,project_id,status,total_amount,subtotal,created_at,issue_date,total,amount,grand_total')
  if (!allTime) query = query.gte('created_at', from).lte('created_at', to)
  query = query.order('created_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)
  let { data, error } = await query
  if (error) throw error
  if (userId && (data?.length ?? 0) === 0) {
  let retry = supabase.from('quotations').select('id,client_id,project_id,status,total_amount,subtotal,created_at,issue_date,total,amount,grand_total')
    if (!allTime) retry = retry.gte('created_at', from).lte('created_at', to)
    retry = retry.order('created_at', { ascending: false })
    const r = await retry
    if (!r.error && (r.data?.length || 0) > 0) data = r.data
  }
  const rows: QuotationListItem[] = (data || []).map(q => ({
    id: (q as any).id,
    client_id: (q as any).client_id || null,
    project_id: (q as any).project_id || null,
    status: (q as any).status || null,
    total_amount: (q as any).total_amount ?? (q as any).grand_total ?? (q as any).subtotal ?? (q as any).total ?? (q as any).amount ?? 0,
    created_at: (q as any).created_at || (q as any).issue_date,
  }))
  cacheSet(cacheKey, rows)
  if (process.env.NEXT_PUBLIC_REPORTS_DEBUG === '1') console.log('[reports] quotationsList', { count: rows.length })
  return rows
}

export interface InvoiceListItem {
  id: string
  client_id: string | null
  project_id: string | null
  status: string | null
  total_amount: number
  issue_date: string
  due_date: string | null
}

export async function fetchInvoicesList(params: { from: string; to: string; userId?: string; allTime?: boolean }): Promise<InvoiceListItem[]> {
  const { from, to, userId, allTime } = params
  const cacheKey = `invoicesList:${allTime ? 'ALL' : from}:${allTime ? 'ALL' : to}:${userId || 'all'}`
  const cached = cacheGet<InvoiceListItem[]>(cacheKey)
  if (cached) return cached
  let query = supabase
    .from('invoices')
    .select('id,client_id,project_id,status,total_amount,issue_date,due_date')
  if (!allTime) query = query.gte('issue_date', from).lte('issue_date', to)
  query = query.order('issue_date', { ascending: false })
  if (userId) query = query.eq('user_id', userId)
  let { data, error } = await query
  if (error) throw error
  if (userId && (data?.length ?? 0) === 0) {
    let retry = supabase.from('invoices').select('id,client_id,project_id,status,total_amount,issue_date,due_date')
    if (!allTime) retry = retry.gte('issue_date', from).lte('issue_date', to)
    retry = retry.order('issue_date', { ascending: false })
    const r = await retry
    if (!r.error && (r.data?.length || 0) > 0) data = r.data
  }
  const rows: InvoiceListItem[] = (data || []).map(inv => ({
    id: (inv as any).id,
    client_id: (inv as any).client_id || null,
    project_id: (inv as any).project_id || null,
    status: (inv as any).status || null,
    total_amount: (inv as any).total_amount || 0,
    issue_date: (inv as any).issue_date,
    due_date: (inv as any).due_date || null,
  }))
  cacheSet(cacheKey, rows)
  if (process.env.NEXT_PUBLIC_REPORTS_DEBUG === '1') console.log('[reports] invoicesList', { count: rows.length })
  return rows
}

export interface ProjectListItem {
  id: string
  name: string | null
  client_id: string | null
  status: string | null
  created_at: string | null
  start_date?: string | null
  end_date?: string | null
}

export async function fetchProjectsList(params: { from: string; to: string; userId?: string; allTime?: boolean }): Promise<ProjectListItem[]> {
  const { from, to, userId, allTime } = params
  const cacheKey = `projectsList:${allTime ? 'ALL' : from}:${allTime ? 'ALL' : to}:${userId || 'all'}`
  const cached = cacheGet<ProjectListItem[]>(cacheKey)
  if (cached) return cached
  let query = supabase
    .from('projects')
    .select('id,name,client_id,status,created_at,start_date,end_date')
  if (!allTime) query = query.gte('created_at', from).lte('created_at', to)
  query = query.order('created_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)
  let { data, error } = await query
  if (error) throw error
  if (userId && (data?.length ?? 0) === 0) {
    let retry = supabase.from('projects').select('id,name,client_id,status,created_at,start_date,end_date')
    if (!allTime) retry = retry.gte('created_at', from).lte('created_at', to)
    retry = retry.order('created_at', { ascending: false })
    const r = await retry
    if (!r.error && (r.data?.length || 0) > 0) data = r.data
  }
  const rows: ProjectListItem[] = (data || []).map(p => ({
    id: (p as any).id,
    name: (p as any).name || null,
    client_id: (p as any).client_id || null,
    status: (p as any).status || null,
    created_at: (p as any).created_at || null,
    start_date: (p as any).start_date || null,
    end_date: (p as any).end_date || null,
  }))
  cacheSet(cacheKey, rows)
  if (process.env.NEXT_PUBLIC_REPORTS_DEBUG === '1') console.log('[reports] projectsList', { count: rows.length })
  return rows
}

export interface ExpenseListItem {
  id: string
  amount: number
  category: string | null
  description: string | null
  status: string | null
  expense_date: string | null
}

export async function fetchExpensesList(params: { from: string; to: string; userId?: string; allTime?: boolean }): Promise<ExpenseListItem[]> {
  const { from, to, userId, allTime } = params
  const cacheKey = `expensesList:${allTime ? 'ALL' : from}:${allTime ? 'ALL' : to}:${userId || 'all'}`
  const cached = cacheGet<ExpenseListItem[]>(cacheKey)
  if (cached) return cached
  // Try with status field first for richer UI; fallback without if column missing
  let data: any[] | null = null
  let primaryQuery = supabase
    .from('expenses')
    .select('id,amount,category,description,status,expense_date')
  if (!allTime) primaryQuery = primaryQuery.gte('expense_date', from).lte('expense_date', to)
  primaryQuery = primaryQuery.order('expense_date', { ascending: false })
  if (userId) primaryQuery = primaryQuery.eq('user_id', userId)
  const primary = await primaryQuery
  if (primary.error && (primary.error.message?.includes('status') || primary.error.details?.includes('status'))) {
    let fallbackQuery = supabase
      .from('expenses')
      .select('id,amount,category,description,expense_date')
    if (!allTime) fallbackQuery = fallbackQuery.gte('expense_date', from).lte('expense_date', to)
    fallbackQuery = fallbackQuery.order('expense_date', { ascending: false })
    if (userId) fallbackQuery = fallbackQuery.eq('user_id', userId)
    const fallback = await fallbackQuery
    if (fallback.error) throw fallback.error
    data = fallback.data as any[]
  } else if (primary.error) {
    throw primary.error
  } else {
    data = primary.data as any[]
    if (userId && (data?.length ?? 0) === 0) {
      let retry = supabase.from('expenses').select('id,amount,category,description,status,expense_date')
      if (!allTime) retry = retry.gte('expense_date', from).lte('expense_date', to)
      retry = retry.order('expense_date', { ascending: false })
      const r = await retry
      if (!r.error && (r.data?.length || 0) > 0) data = r.data as any[]
    }
  }
  const rows: ExpenseListItem[] = (data || []).map(e => ({
    id: (e as any).id,
    amount: (e as any).amount || 0,
    category: (e as any).category || null,
    description: (e as any).description || null,
    status: 'status' in (e as any) ? (e as any).status || null : null,
    expense_date: (e as any).expense_date || null,
  }))
  cacheSet(cacheKey, rows)
  if (process.env.NEXT_PUBLIC_REPORTS_DEBUG === '1') console.log('[reports] expensesList', { count: rows.length })
  return rows
}

export async function fetchInvoiceSummary(params: { from: string; to: string; userId?: string; allTime?: boolean }): Promise<InvoiceSummary> {
  const { from, to, userId, allTime } = params
  const cacheKey = `invoiceSummary:${allTime ? 'ALL' : from}:${allTime ? 'ALL' : to}:${userId || 'all'}`
  const cached = cacheGet<InvoiceSummary>(cacheKey)
  if (cached) return cached

  // Fetch necessary invoice fields in date range (issue_date)
  let query = supabase
    .from('invoices')
    .select('id,total_amount,status,issue_date')
  if (!allTime) query = query.gte('issue_date', from).lte('issue_date', to)
  if (userId) query = query.eq('user_id', userId)
  let { data: invoices, error } = await query
  if (error) throw error
  if (userId && (invoices?.length ?? 0) === 0) {
    // Retry without user filter in case legacy records lack user_id; RLS will still enforce access.
    let retry = supabase.from('invoices').select('id,total_amount,status,issue_date')
    if (!allTime) retry = retry.gte('issue_date', from).lte('issue_date', to)
    const r = await retry
    if (!r.error && (r.data?.length || 0) > 0) invoices = r.data
  }

  const count_total = invoices?.length || 0
  let total_invoiced = 0
  let total_paid = 0
  let count_paid = 0
  for (const inv of invoices || []) {
    const amt = (inv as any).total_amount || 0
    total_invoiced += amt
    if ((inv as any).status === 'paid') {
      total_paid += amt
      count_paid += 1
    }
  }
  const paid_percent = total_invoiced > 0 ? (total_paid / total_invoiced) * 100 : 0
  const summary: InvoiceSummary = {
    total_invoiced: Number(total_invoiced.toFixed(2)),
    total_paid: Number(total_paid.toFixed(2)),
    paid_percent: Number(paid_percent.toFixed(2)),
    count_total,
    count_paid,
  }
  cacheSet(cacheKey, summary)
  if (process.env.NEXT_PUBLIC_REPORTS_DEBUG === '1') console.log('[reports] invoiceSummary', { count: summary.count_total })
  return summary
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
  const active_pipeline = leads?.filter(l => !['won','lost'].includes((l as any).stage as string)).length || 0
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
