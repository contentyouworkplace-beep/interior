/**
 * Debug script to check invoice items in database
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkInvoiceItems() {
  try {
    console.log('\n🔍 Checking invoice: INV-2025-10-003')
    
    // Get the invoice
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', 'INV-2025-10-003')
      .single()
    
    if (invError) {
      console.error('❌ Error fetching invoice:', invError)
      return
    }
    
    console.log('\n✅ Invoice found:')
    console.log('   ID:', invoice.id)
    console.log('   Number:', invoice.invoice_number)
    console.log('   Title:', invoice.title)
    console.log('   Subtotal:', invoice.subtotal)
    console.log('   Total:', invoice.total_amount)
    
    // Get the items
    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('item_order', { ascending: true })
    
    if (itemsError) {
      console.error('❌ Error fetching items:', itemsError)
      return
    }
    
    console.log(`\n📦 Found ${items?.length || 0} items:`)
    if (items && items.length > 0) {
      items.forEach((item, idx) => {
        console.log(`\n   Item ${idx + 1}:`)
        console.log('      ID:', item.id)
        console.log('      Description:', item.description)
        console.log('      Quantity:', item.quantity)
        console.log('      Unit Price:', item.unit_price)
        console.log('      Amount:', item.amount)
        console.log('      Item Order:', item.item_order)
      })
    } else {
      console.log('   ⚠️  NO ITEMS FOUND! This invoice has no line items in the database.')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkInvoiceItems()
