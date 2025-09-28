import { NextRequest } from 'next/server'
import { fetchComprehensiveReports } from '@/lib/services/supabase/reports'

function parsePeriod(search: URLSearchParams) {
  const period = (search.get('period') || 'month') as any
  const from = search.get('from') || undefined
  const to = search.get('to') || undefined
  return { period, from, to }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = parsePeriod(searchParams)
    const data = await fetchComprehensiveReports(params)
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
