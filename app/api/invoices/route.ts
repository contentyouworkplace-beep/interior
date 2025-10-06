import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')

    let query = supabase
      .from('invoices')
      .select(`*, client:clients(id, first_name, last_name, company, email, phone)`) // could add project later
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)

    const { data: invoices, error: invoicesError } = await query
    if (invoicesError) {
      return NextResponse.json({ error: 'Failed to fetch invoices', details: invoicesError.message }, { status: 500 })
    }

    // Fetch all items for these invoices via service key (temporary RLS bypass)
    let itemsByInvoice: Record<string, any[]> = {}
    if (SERVICE_KEY && invoices && invoices.length) {
      const serviceClient = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, SERVICE_KEY)
      const invoiceIds = invoices.map(i => i.id)
      const { data: rows, error: itemsErr } = await serviceClient
        .from('invoice_items')
        .select('*')
        .in('invoice_id', invoiceIds)
      if (itemsErr) {
        console.error('Invoice list API: item fetch error', itemsErr)
      } else {
        for (const r of rows || []) {
          if (!itemsByInvoice[r.invoice_id]) itemsByInvoice[r.invoice_id] = []
          itemsByInvoice[r.invoice_id].push({
            ...r,
            amount: r.amount ?? r.total ?? 0,
            unit_price: r.unit_price ?? 0,
            quantity: r.quantity ?? 1,
            description: r.description || ''
          })
        }
        // sort each list by item_order
        Object.values(itemsByInvoice).forEach(arr => arr.sort((a: any,b: any)=> (a.item_order||0)-(b.item_order||0)))
      }
    }

    const enriched = (invoices || []).map(inv => ({ ...inv, items: itemsByInvoice[inv.id] || [], attachments: [] }))

    return NextResponse.json({ success: true, invoices: enriched })
  } catch (e: any) {
    console.error('Invoice list API: unexpected', e)
    return NextResponse.json({ error: 'Server error', details: e.message }, { status: 500 })
  }
}
