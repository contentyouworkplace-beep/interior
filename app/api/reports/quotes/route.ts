import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { fetchQuotationSummary, fetchQuotationsList } from '@/lib/services/supabase/reports'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const allTime = searchParams.get('allTime') === '1'
  if (!allTime && (!from || !to)) {
    return NextResponse.json({ error: 'from & to required unless allTime=1' }, { status: 400 })
  }
  const supabase = createApiClient(request as any)
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  try {
    const summary = await fetchQuotationSummary({ from: from || new Date(2000,0,1).toISOString(), to: to || new Date(2100,0,1).toISOString(), userId: userId || undefined, allTime })
    const list = await fetchQuotationsList({ from: from || new Date(2000,0,1).toISOString(), to: to || new Date(2100,0,1).toISOString(), userId: userId || undefined, allTime })
    return NextResponse.json({ summary, list })
  } catch (e: any) {
    console.error('Quotes API error:', e)
    return NextResponse.json({ error: e.message || 'Failed', stack: process.env.NODE_ENV === 'development' ? e.stack : undefined }, { status: 500 })
  }
}
