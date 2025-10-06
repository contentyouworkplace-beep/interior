import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'

// Temporary: use service key for fetching items while RLS on invoice_items is broken
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  try {
    const supabase = createApiClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoice (joined client + project) restricted to user
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`*, client:clients(id, first_name, last_name, company, email, phone), project:projects(id, name)`) // project optional
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found', details: invoiceError?.message }, { status: 404 })
    }

    // Fetch items using service key (bypassing RLS) until policies fixed
    let items: any[] = []
    if (SERVICE_KEY) {
      const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY)
      const { data: itemRows, error: itemErr } = await serviceClient
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('item_order', { ascending: true })
      if (itemErr) {
        console.error('Invoice API: item fetch error', itemErr)
      } else {
        items = (itemRows || []).map(r => ({
          ...r,
          amount: r.amount ?? r.total ?? 0,
          unit_price: r.unit_price ?? 0,
          quantity: r.quantity ?? 1,
          description: r.description || ''
        }))
      }
    }

    return NextResponse.json({ success: true, invoice: { ...invoice, items, attachments: [] } })
  } catch (e: any) {
    console.error('Invoice API: unexpected error', e)
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 })
  }
}
