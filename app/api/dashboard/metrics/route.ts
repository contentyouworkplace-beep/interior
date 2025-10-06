import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date for month calculations
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed
    const firstDayOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]

    // Total Clients Count (same filter as Clients page)
    // Try a direct count; if unavailable due to RLS nuances, fallback to fetching ids and counting
    const { count: totalClients, error: clientsError } = await supabase
      .from('clients')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)

    let totalClientsCount = totalClients ?? 0
    if ((clientsError && !clientsError.message) || totalClients == null) {
      // Fallback: fetch ids and compute length
      const { data: clientIds, error: fallbackErr } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
      if (fallbackErr) {
        console.error('Clients count fallback failed:', fallbackErr)
        totalClientsCount = 0
      } else {
        totalClientsCount = clientIds?.length || 0
      }
    }

    // Quotations Created (all statuses) this month + total overall
    // Some rows may have null issue_date; fallback to created_at for filtering
    // We'll perform two queries: month-filtered and total count (both user scoped)
    let quotationsCreatedMonth = 0
    let quotationsCreatedAllTime = 0
    try {
      // Month filter: use created_at because that's reliably present; if schema lacks created_at, fallback gracefully
      const monthQuery = supabase
        .from('quotations')
        .select('id,created_at,issue_date', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', firstDayOfMonth)
        .lte('created_at', lastDayOfMonth)
      const { count: monthCount, error: monthErr } = await monthQuery
      if (monthErr) {
        console.warn('Month quotations count (created_at) failed, retrying with issue_date:', monthErr.message)
        const { count: monthIssueCount, error: monthIssueErr } = await supabase
          .from('quotations')
          .select('id,issue_date', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('issue_date', firstDayOfMonth)
          .lte('issue_date', lastDayOfMonth)
        if (!monthIssueErr && monthIssueCount != null) quotationsCreatedMonth = monthIssueCount || 0
      } else if (monthCount != null) {
        quotationsCreatedMonth = monthCount || 0
      }

      const { count: allTimeCount, error: allTimeErr } = await supabase
        .from('quotations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
      if (!allTimeErr && allTimeCount != null) quotationsCreatedAllTime = allTimeCount || 0
      if (allTimeErr) console.error('All-time quotations count error:', allTimeErr)
    } catch (qe) {
      console.error('Quotations counting failed:', qe)
    }

    // Pending Payments Total = Invoices (sent/overdue) - Payments received
    // Note: schema uses invoices.total_amount and payments.amount
    let pendingPayments = 0
    try {
      const { data: invData, error: invErr } = await supabase
        .from('invoices')
        .select('total_amount,status')
        .eq('user_id', user.id)
      if (invErr) throw invErr

      const { data: payData, error: payErr } = await supabase
        .from('payments')
        .select('amount')
        .eq('user_id', user.id)
      if (payErr) throw payErr

      const invoiceDue = (invData || [])
        .filter(i => (i.status || '').toLowerCase() !== 'paid')
        .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0)
      const paid = (payData || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      pendingPayments = Math.max(invoiceDue - paid, 0)
    } catch (err) {
      console.error('Error computing pending payments:', err)
      pendingPayments = 0
    }

    // Expenses This Month - real sum by user and expense_date in current month
    let expensesThisMonth = 0
    try {
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user.id)
        .gte('expense_date', firstDayOfMonth)
        .lte('expense_date', lastDayOfMonth)

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError)
        expensesThisMonth = 0
      } else {
        expensesThisMonth = expensesData?.reduce((total, expense) => {
          return total + (expense.amount || 0)
        }, 0) || 0
      }
    } catch (err) {
      console.error('Error with expenses:', err)
      expensesThisMonth = 0
    }

    // Return metrics
    return NextResponse.json({
  totalClients: totalClientsCount,
  quotationsCreated: quotationsCreatedAllTime,
  quotationsSent: quotationsCreatedMonth, // backward compatibility (monthly created count)
      pendingPayments: pendingPayments,
      expensesThisMonth: expensesThisMonth,
      success: true
    })

  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}