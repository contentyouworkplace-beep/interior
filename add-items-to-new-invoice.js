/**
 * Add demo items to invoice INV-2025-10-003
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function addItemsToInvoice() {
  try {
    // Get the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_number', 'INV-2025-10-003')
      .single()

    if (invoiceError) {
      console.error('❌ Error fetching invoice:', invoiceError)
      return
    }

    console.log(`📄 Found invoice: ${invoice.invoice_number}`)
    console.log(`   ID: ${invoice.id}`)
    console.log(`   Current subtotal: ₹${invoice.subtotal?.toLocaleString() || 0}`)

    // Demo items
    const items = [
      {
        invoice_id: invoice.id,
        description: 'Living Room Interior Design',
        quantity: 1,
        unit_price: 25000,
        amount: 25000,
        item_order: 1
      },
      {
        invoice_id: invoice.id,
        description: 'Modular Kitchen',
        quantity: 1,
        unit_price: 150000,
        amount: 150000,
        item_order: 2
      },
      {
        invoice_id: invoice.id,
        description: 'Master Bedroom Wardrobe',
        quantity: 1,
        unit_price: 85000,
        amount: 85000,
        item_order: 3
      },
      {
        invoice_id: invoice.id,
        description: 'False Ceiling Work',
        quantity: 1,
        unit_price: 63000,
        amount: 63000,
        item_order: 4
      },
      {
        invoice_id: invoice.id,
        description: 'Wallpaper & Painting',
        quantity: 1,
        unit_price: 45000,
        amount: 45000,
        item_order: 5
      }
    ]

    // Insert items
    const { data: insertedItems, error: insertError } = await supabase
      .from('invoice_items')
      .insert(items)
      .select()

    if (insertError) {
      console.error('❌ Error inserting items:', insertError)
      return
    }

    console.log(`\n✅ Added ${insertedItems.length} items successfully!`)

    // Calculate new totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const taxRate = invoice.tax_rate || 18
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount

    // Update invoice totals
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: total
      })
      .eq('id', invoice.id)

    if (updateError) {
      console.error('❌ Error updating invoice totals:', updateError)
      return
    }

    console.log(`\n💰 Updated invoice totals:`)
    console.log(`   Subtotal: ₹${subtotal.toLocaleString()}`)
    console.log(`   GST (${taxRate}%): ₹${taxAmount.toLocaleString()}`)
    console.log(`   Total: ₹${total.toLocaleString()}`)
    console.log(`\n✅ Invoice INV-2025-10-003 is now ready for editing!`)

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

addItemsToInvoice()
