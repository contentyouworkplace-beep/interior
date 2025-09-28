import { NextRequest } from 'next/server'
import { fetchComprehensiveReports } from '@/lib/services/supabase/reports'

function toCsvRow(values: (string | number)[]) {
  return values
    .map(v => {
      if (typeof v === 'string' && (v.includes(',') || v.includes('"') || v.includes('\n'))) {
        return '"' + v.replace(/"/g, '""') + '"'
      }
      return v
    })
    .join(',')
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = (searchParams.get('period') || 'month') as any
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    const data = await fetchComprehensiveReports({ period, from, to })

    const sections: string[] = []

    // Profitability
    sections.push('Project Profitability')
    sections.push(toCsvRow(['project_id','project_name','client_id','total_invoiced','total_paid','total_expenses','gross_margin','collected_margin','margin_percent']))
    data.profitability.forEach(r => {
      sections.push(toCsvRow([r.project_id, r.project_name, r.client_id, r.total_invoiced, r.total_paid, r.total_expenses, r.gross_margin, r.collected_margin, r.margin_percent]))
    })
    sections.push('')

    // Pending payments
    sections.push('Pending Payments')
    sections.push(toCsvRow(['client_id','total_invoiced','total_paid','balance_due']))
    data.pendingPayments.forEach(r => {
      sections.push(toCsvRow([r.client_id, r.total_invoiced, r.total_paid, r.balance_due]))
    })
    sections.push('')

    // Lead conversion
    sections.push('Lead Conversion Summary')
    sections.push(toCsvRow(['total_leads','won','lost','active_pipeline','conversion_rate_percent']))
    const lc = data.leadConversion
    sections.push(toCsvRow([lc.total_leads, lc.won, lc.lost, lc.active_pipeline, lc.conversion_rate_percent]))

    const csv = sections.join('\n')
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="reports.csv"',
      },
    })
  } catch (e: any) {
    return new Response(`error,${e.message}`, { status: 500 })
  }
}
