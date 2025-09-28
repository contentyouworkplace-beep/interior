import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import type { Database } from '@/types/supabase'

// Minimal server-side seeding replicating existing invoice/payment logic.
type InvoiceRow = Database['public']['Tables']['invoices']['Row']
type PaymentRow = Database['public']['Tables']['payments']['Row']

export async function POST() {
  // server helper not generically typed; treat as any for seeding
  const supabase: any = createClient()

  // Ensure at least one client
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select('id,user_id')
    .limit(1)
    .maybeSingle()
  if (clientErr || !client) {
    return NextResponse.json({ error: 'No client found. Seed clients first.' }, { status: 400 })
  }

  const baseUserId = client.user_id
  const clientId = client.id

  // Invoices
  const demoInvoices = [
    { number: 'DEMO-INV-001', title: 'Initial Design Consultation', total: 15000 },
    { number: 'DEMO-INV-002', title: 'Concept Development Phase', total: 32000 },
    { number: 'DEMO-INV-003', title: 'Site Visit & Measurements', total: 8000 },
  ]

  const { data: existing, error: existingErr } = await supabase
    .from('invoices')
    .select('invoice_number')
    .ilike('invoice_number', 'DEMO-INV-%')

  if (existingErr && !/could not find the table/i.test(existingErr.message)) {
    return NextResponse.json({ error: existingErr.message }, { status: 500 })
  }
  const existingSet = new Set((existing || []).map((i: any) => i.invoice_number))

  const newInvoices: InvoiceRow[] = demoInvoices.filter(i => !existingSet.has(i.number)).map(inv => ({
    id: uuidv4(),
    user_id: baseUserId,
    client_id: clientId,
    project_id: null,
    invoice_number: inv.number,
    title: inv.title,
    status: 'sent',
    issue_date: new Date().toISOString().slice(0,10) as any,
    due_date: new Date(Date.now() + 7*86400000).toISOString().slice(0,10) as any,
    subtotal: inv.total,
    gst_type: 'none',
    gstin: null,
    pan: null,
    hsn_sac_code: null,
    tax_rate: 0,
    tax_amount: 0,
    total_amount: inv.total,
    discount_type: null,
    discount_value: null,
    currency: 'INR',
    notes: null,
    payment_terms: null,
    logo_url: null,
    signature_url: null,
    template: 'modern',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  if (newInvoices.length) {
    const { error: insErr } = await supabase.from('invoices').insert(newInvoices)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  // Payments
  const { data: seededInvoices, error: seededErr } = await supabase
    .from('invoices')
    .select('id,invoice_number,user_id,client_id,total_amount')
    .in('invoice_number', ['DEMO-INV-001','DEMO-INV-002'])
  if (seededErr) return NextResponse.json({ error: seededErr.message }, { status: 500 })

  const { data: existingPays } = await supabase
    .from('payments')
    .select('reference_number')
    .ilike('reference_number', 'DEMO-PAY-%')
  const paySet = new Set((existingPays||[]).map((p: any)=>p.reference_number))

  const payments: PaymentRow[] = (seededInvoices||[]).flatMap((inv: any) => {
    const plan = [
      { ref: `DEMO-PAY-${inv.invoice_number}-A`, amount: Math.round((inv.total_amount||0)*0.3) },
      { ref: `DEMO-PAY-${inv.invoice_number}-B`, amount: Math.round((inv.total_amount||0)*0.2) }
    ]
    return plan.filter(p=>!paySet.has(p.ref)).map(p => ({
      id: uuidv4(), user_id: inv.user_id, client_id: inv.client_id, invoice_id: inv.id, project_id: null,
      amount: p.amount, payment_date: new Date().toISOString().slice(0,10) as any, payment_mode: 'upi', reference_number: p.ref, notes: 'Demo payment',
      created_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }))
  })

  if (payments.length) {
    const { error: payErr } = await supabase.from('payments').insert(payments)
    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 })
  }

  return NextResponse.json({ addedInvoices: newInvoices.length, addedPayments: payments.length })
}
