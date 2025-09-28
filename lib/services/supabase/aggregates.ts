import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

// Helper for month boundaries (UTC simple)
function monthRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1))
  return { start: start.toISOString(), end: end.toISOString() }
}

export interface DashboardMetrics {
  leadsThisMonth: number
  pendingPaymentsTotal: number
  upcomingFollowUps: number
  quotationsThisMonth: number
  expensesThisMonth: number
  demoDataPresent: boolean
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { start, end } = monthRange()

  // Leads created this month
  const { count: leadsCount, error: leadsErr } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start)
    .lt('created_at', end)
  if (leadsErr) throw leadsErr

  // Sum invoices & payments with graceful fallback if tables not yet created
  let invoices: { id: string; total_amount: number | null; status: string | null }[] = []
  let payments: { id: string; amount: number | null }[] = []
  try {
    const invRes = await supabase
      .from('invoices')
      .select('id,total_amount,status')
    if (invRes.error) {
      // If table missing, ignore; else rethrow
      if (!/could not find the table/i.test(invRes.error.message)) throw invRes.error
    } else {
      invoices = invRes.data || []
    }
  } catch (e) {
    // swallow only table-not-found patterns
    if (!(e instanceof Error && /could not find the table/i.test(e.message))) throw e
  }
  try {
    const payRes = await supabase
      .from('payments')
      .select('id,amount')
    if (payRes.error) {
      if (!/could not find the table/i.test(payRes.error.message)) throw payRes.error
    } else {
      payments = payRes.data || []
    }
  } catch (e) {
    if (!(e instanceof Error && /could not find the table/i.test(e.message))) throw e
  }

  const totalInvoiced = (invoices || []).reduce((sum, i) => sum + (i.total_amount || 0), 0)
  const totalPaid = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0)
  const pendingPaymentsTotal = Math.max(totalInvoiced - totalPaid, 0)

  // Quotations this month (graceful)
  let quotationsCount = 0
  try {
    const { count: qCount, error: qErr } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start)
      .lt('created_at', end)
    if (qErr) {
      if (!/could not find the table/i.test(qErr.message)) throw qErr
    } else {
      quotationsCount = qCount || 0
    }
  } catch (e) {
    if (!(e instanceof Error && /could not find the table/i.test(e.message))) throw e
  }

  // Expenses this month (graceful sum)
  let expensesTotal = 0
  try {
    const expRes = await supabase
      .from('expenses')
      .select('amount,created_at')
      .gte('created_at', start)
      .lt('created_at', end)
    if (expRes.error) {
      if (!/could not find the table/i.test(expRes.error.message)) throw expRes.error
    } else {
      expensesTotal = (expRes.data || []).reduce((s, e: any) => s + (e.amount || 0), 0)
    }
  } catch (e) {
    if (!(e instanceof Error && /could not find the table/i.test(e.message))) throw e
  }

  // Follow-ups in next 7 days (leads with next_follow_up)
  const now = new Date()
  const seven = new Date(now.getTime() + 7 * 86400000).toISOString()
  const today = now.toISOString()
  const { count: followUps, error: fuErr } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('next_follow_up', today)
    .lte('next_follow_up', seven)
  if (fuErr) throw fuErr

  return {
    leadsThisMonth: leadsCount || 0,
    pendingPaymentsTotal,
    upcomingFollowUps: followUps || 0,
    quotationsThisMonth: quotationsCount,
    expensesThisMonth: expensesTotal,
    demoDataPresent: (invoices || []).some(i => i.status?.toLowerCase().includes('demo')) || (payments||[]).length > 0
  }
}
