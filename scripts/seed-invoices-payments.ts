#!/usr/bin/env ts-node
/**
 * Seed demo invoices and payments.
 * Idempotent: skips creating duplicates based on invoice_number existence.
 */
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

async function main() {
  const supabase = createClient()

  // Fetch any existing demo invoices
  const { data: existing, error: existingErr } = await supabase
    .from('invoices')
    .select('invoice_number')
    .ilike('invoice_number', 'DEMO-%')

  if (existingErr) {
    console.error('Failed checking existing invoices:', existingErr.message)
    process.exit(1)
  }
  const existingSet = new Set((existing || []).map(i => i.invoice_number))

  // Choose a user & client for seeding (pick first available)
  const { data: firstClient, error: clientErr } = await supabase
    .from('clients')
    .select('id,user_id')
    .limit(1)
    .maybeSingle()
  if (clientErr) {
    console.error('Need at least one client to seed invoices:', clientErr.message)
    process.exit(1)
  }
  if (!firstClient) {
    console.error('No clients found. Seed clients first.')
    process.exit(1)
  }

  const baseUserId = firstClient.user_id
  const clientId = firstClient.id

  const demoInvoices = [
    { number: 'DEMO-INV-001', title: 'Initial Design Consultation', total: 15000 },
    { number: 'DEMO-INV-002', title: 'Concept Development Phase', total: 32000 },
    { number: 'DEMO-INV-003', title: 'Site Visit & Measurements', total: 8000 },
  ].filter(i => !existingSet.has(i.number))

  if (demoInvoices.length === 0) {
    console.log('Demo invoices already present. Skipping creation.')
  } else {
    const inserts = demoInvoices.map(inv => ({
      id: uuidv4(),
      user_id: baseUserId,
      client_id: clientId,
      invoice_number: inv.number,
      title: inv.title,
      status: 'sent',
      issue_date: new Date().toISOString().slice(0,10),
      due_date: new Date(Date.now() + 7*86400000).toISOString().slice(0,10),
      subtotal: inv.total,
      tax_rate: 0,
      tax_amount: 0,
      total_amount: inv.total,
      currency: 'INR'
    }))
    const { error: invErr } = await supabase.from('invoices').insert(inserts)
    if (invErr) {
      console.error('Invoice insert failed:', invErr.message)
      process.exit(1)
    }
    console.log(`Inserted ${inserts.length} demo invoices.`)
  }

  // Payments (apply partial payments to first two invoices)
  const { data: seededInvoices, error: seededErr } = await supabase
    .from('invoices')
    .select('id,invoice_number,user_id,client_id,total_amount')
    .in('invoice_number', ['DEMO-INV-001','DEMO-INV-002'])
  if (seededErr) {
    console.error('Fetch seeded invoices failed:', seededErr.message)
    process.exit(1)
  }
  if (seededInvoices && seededInvoices.length) {
    // Check existing payments to avoid duplicates
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('reference_number')
      .ilike('reference_number', 'DEMO-PAY-%')
    const existingPaySet = new Set((existingPayments||[]).map(p=>p.reference_number))

    const paymentRows = seededInvoices.flatMap(inv => {
      const paymentsPlan = [
        { ref: `DEMO-PAY-${inv.invoice_number}-A`, amount: Math.round((inv.total_amount||0)*0.3) },
        { ref: `DEMO-PAY-${inv.invoice_number}-B`, amount: Math.round((inv.total_amount||0)*0.2) }
      ]
      return paymentsPlan
        .filter(p => !existingPaySet.has(p.ref))
        .map(p => ({
          id: uuidv4(),
          user_id: inv.user_id,
          client_id: inv.client_id,
          invoice_id: inv.id,
          project_id: null,
            amount: p.amount,
          payment_date: new Date().toISOString().slice(0,10),
          payment_mode: 'upi',
          reference_number: p.ref,
          notes: 'Demo payment'
        }))
    })

    if (paymentRows.length) {
      const { error: payInsertErr } = await supabase.from('payments').insert(paymentRows)
      if (payInsertErr) {
        console.error('Payment insert failed:', payInsertErr.message)
        process.exit(1)
      }
      console.log(`Inserted ${paymentRows.length} demo payments.`)
    } else {
      console.log('Demo payments already present. Skipping.')
    }
  }

  console.log('Seeding complete.')
}

main().catch(e => { console.error(e); process.exit(1) })
