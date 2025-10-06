import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id
  
  console.log('Reports API - User ID:', userId)
  
  // Parse query parameters for date filtering
  const { searchParams } = new URL(request.url)
  const allTime = searchParams.get('allTime') === 'true'
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  try {
    // Build base queries with optional date filtering
    // For clients and vendors, use simple count query (same as Dashboard)
    let clientsQuery = supabase.from('clients').select('id', { count: 'exact' }).eq('user_id', userId)
    let vendorsQuery = supabase.from('vendors').select('id', { count: 'exact' }).eq('user_id', userId)
    
    // For other entities, fetch data for calculations
    let projectsQuery = supabase.from('projects').select('id, status, budget, created_at').eq('user_id', userId)
    let quotationsQuery = supabase.from('quotations').select('id, status, total_amount, created_at').eq('user_id', userId)
    let invoicesQuery = supabase.from('invoices').select('id, status, total_amount, created_at').eq('user_id', userId)
    let expensesQuery = supabase.from('expenses').select('id, amount, category, created_at').eq('user_id', userId)
    let paymentsQuery = supabase.from('payments').select('id, amount, created_at').eq('user_id', userId)
    let teamQuery = supabase.from('team_members').select('id, status, created_at').eq('user_id', userId)
    
    // Apply date filters if not all time
    if (!allTime && from && to) {
      clientsQuery = clientsQuery.gte('created_at', from).lte('created_at', to)
      projectsQuery = projectsQuery.gte('created_at', from).lte('created_at', to)
      quotationsQuery = quotationsQuery.gte('created_at', from).lte('created_at', to)
      invoicesQuery = invoicesQuery.gte('created_at', from).lte('created_at', to)
      expensesQuery = expensesQuery.gte('created_at', from).lte('created_at', to)
      paymentsQuery = paymentsQuery.gte('created_at', from).lte('created_at', to)
      teamQuery = teamQuery.gte('created_at', from).lte('created_at', to)
      vendorsQuery = vendorsQuery.gte('created_at', from).lte('created_at', to)
    }
    
    // Fetch all counts in parallel
    const [
      clientsData,
      projectsData,
      quotationsData,
      invoicesData,
      expensesData,
      paymentsData,
      teamData,
      vendorsData
    ] = await Promise.all([
      clientsQuery,
      projectsQuery,
      quotationsQuery,
      invoicesQuery,
      expensesQuery,
      paymentsQuery,
      teamQuery,
      vendorsQuery
    ])

    // Debug logging
    console.log('Clients query result:', { 
      count: clientsData.count, 
      error: clientsData.error
    })
    console.log('Vendors query result:', { 
      count: vendorsData.count,
      error: vendorsData.error
    })
    console.log('Query params:', { allTime, from, to, userId })

    // Calculate breakdowns with fallback (same pattern as Dashboard)
    let totalClients = clientsData.count ?? 0
    if (clientsData.error || clientsData.count == null) {
      // Fallback: fetch data and count
      const { data: clientsFallback } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', userId)
      totalClients = clientsFallback?.length || 0
    }
    
    let totalVendors = vendorsData.count ?? 0
    if (vendorsData.error || vendorsData.count == null) {
      // Fallback: fetch data and count
      const { data: vendorsFallback } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', userId)
      totalVendors = vendorsFallback?.length || 0
    }

    const totalProjects = projectsData.data?.length || 0
    const activeProjects = projectsData.data?.filter(p => p.status && ['planning', 'in_progress', 'active'].includes(p.status)).length || 0
    const completedProjects = projectsData.data?.filter(p => p.status === 'completed').length || 0
    const totalBudget = projectsData.data?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) || 0

    const totalQuotations = quotationsData.data?.length || 0
    const draftQuotations = quotationsData.data?.filter(q => q.status === 'draft').length || 0
    const sentQuotations = quotationsData.data?.filter(q => q.status && ['sent', 'pending'].includes(q.status)).length || 0
    const approvedQuotations = quotationsData.data?.filter(q => q.status && ['approved', 'accepted'].includes(q.status)).length || 0
    const totalQuotationValue = quotationsData.data?.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0) || 0

    const totalInvoices = invoicesData.data?.length || 0
    const paidInvoices = invoicesData.data?.filter(i => i.status === 'paid').length || 0
    const pendingInvoices = invoicesData.data?.filter(i => i.status && ['draft', 'sent', 'pending'].includes(i.status)).length || 0
    const totalInvoiceValue = invoicesData.data?.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0) || 0
    
    // Calculate paid invoice value safely
    const paidInvoicesArray = invoicesData.data?.filter(i => i.status === 'paid') || []
    const paidInvoiceValue = paidInvoicesArray.length > 0 
      ? paidInvoicesArray.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0) 
      : 0
    
    // Calculate pending invoice value safely
    const pendingInvoicesArray = invoicesData.data?.filter(i => i.status && ['draft', 'sent', 'pending'].includes(i.status)) || []
    const pendingInvoiceValue = pendingInvoicesArray.length > 0
      ? pendingInvoicesArray.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0)
      : 0

    // Calculate expenses summary
    const totalExpenses = expensesData.data?.length || 0
    const totalExpensesAmount = expensesData.data?.reduce((sum, e) => sum + (Number(e.amount) || 0), 0) || 0

    // Calculate payments summary - Include paid invoices in payments received
    const totalPayments = paymentsData.data?.length || 0
    const totalPaymentsAmount = paymentsData.data?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0
    // Add paid invoice amounts to payments received
    const totalPaymentsReceived = (totalPaymentsAmount || 0) + (paidInvoiceValue || 0)

    // Team
    const totalTeam = teamData.data?.length || 0

    console.log('Reports Summary Debug:', {
      totalClients,
      totalVendors,
      totalTeam,
      totalProjects,
      totalQuotations,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      paidInvoiceValue,
      pendingInvoiceValue
    })

    return NextResponse.json({
      clients: {
        total: totalClients
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        totalBudget
      },
      quotations: {
        total: totalQuotations,
        draft: draftQuotations,
        sent: sentQuotations,
        approved: approvedQuotations,
        totalValue: totalQuotationValue
      },
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        pending: pendingInvoices,
        totalValue: totalInvoiceValue,
        paidValue: paidInvoiceValue,
        pendingValue: pendingInvoiceValue
      },
      expenses: {
        total: totalExpenses,
        totalAmount: totalExpensesAmount
      },
      payments: {
        total: totalPayments,
        totalAmount: totalPaymentsReceived // Now includes paid invoices
      },
      team: {
        total: totalTeam
      },
      vendors: {
        total: totalVendors
      }
    })
  } catch (error: any) {
    console.error('Reports summary error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch reports' }, { status: 500 })
  }
}
