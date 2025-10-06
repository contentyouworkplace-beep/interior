/**
 * Script to add demo line items to an existing invoice
 * Run: node add-invoice-items.js
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('   Looking for: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('🔑 Using key type:', supabaseKey.substring(0, 20) + '...')
const supabase = createClient(supabaseUrl, supabaseKey)

async function addItemsToInvoice() {
  try {
    console.log('🔍 Finding invoices...')
    
    // Get the most recent invoice
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id, invoice_number, subtotal, tax_amount, total_amount')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (fetchError) {
      console.error('❌ Error fetching invoices:', fetchError)
      return
    }
    
    if (!invoices || invoices.length === 0) {
      console.log('❌ No invoices found!')
      return
    }
    
    console.log('\n📋 Found invoices:')
    invoices.forEach((inv, idx) => {
      console.log(`${idx + 1}. ${inv.invoice_number} - Total: ₹${inv.total_amount || 0}`)
    })
    
    // Use the first invoice (INV-2025-10-001)
    const invoice = invoices[0]
    console.log(`\n✅ Selected invoice: ${invoice.invoice_number}`)
    
    // Check if items already exist
    const { data: existingItems } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoice.id)
    
    if (existingItems && existingItems.length > 0) {
      console.log(`\n⚠️  Invoice already has ${existingItems.length} items. Deleting them first...`)
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoice.id)
      
      if (deleteError) {
        console.error('❌ Error deleting old items:', deleteError)
        return
      }
      console.log('✅ Old items deleted')
    }
    
    // Demo items for interior design invoice
    const demoItems = [
      {
        invoice_id: invoice.id,
        description: 'Living Room Interior Design - Consultation & Planning',
        quantity: 1,
        unit_price: 25000.00,
        amount: 25000.00,
        item_order: 1
      },
      {
        invoice_id: invoice.id,
        description: 'Modular Kitchen with Premium Fittings',
        quantity: 1,
        unit_price: 150000.00,
        amount: 150000.00,
        item_order: 2
      },
      {
        invoice_id: invoice.id,
        description: 'Master Bedroom Wardrobe (8ft x 10ft)',
        quantity: 1,
        unit_price: 85000.00,
        amount: 85000.00,
        item_order: 3
      },
      {
        invoice_id: invoice.id,
        description: 'False Ceiling with LED Lighting',
        quantity: 350,
        unit_price: 180.00,
        amount: 63000.00,
        item_order: 4
      },
      {
        invoice_id: invoice.id,
        description: 'Wallpaper & Paint Work',
        quantity: 1,
        unit_price: 45000.00,
        amount: 45000.00,
        item_order: 5
      }
    ]
    
    console.log('\n📦 Adding demo items...')
    const { data: insertedItems, error: insertError } = await supabase
      .from('invoice_items')
      .insert(demoItems)
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting items:', insertError)
      return
    }
    
    console.log(`✅ Added ${insertedItems.length} items successfully!`)
    
    // Calculate totals
    const subtotal = demoItems.reduce((sum, item) => sum + item.amount, 0)
    const taxRate = 18 // 18% GST
    const taxAmount = (subtotal * taxRate) / 100
    const totalAmount = subtotal + taxAmount
    
    console.log('\n💰 Updating invoice totals...')
    console.log(`   Subtotal: ₹${subtotal.toLocaleString('en-IN')}`)
    console.log(`   GST (${taxRate}%): ₹${taxAmount.toLocaleString('en-IN')}`)
    console.log(`   Total: ₹${totalAmount.toLocaleString('en-IN')}`)
    
    // Update invoice with calculated totals
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        subtotal: subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)
    
    if (updateError) {
      console.error('❌ Error updating invoice:', updateError)
      return
    }
    
    console.log('✅ Invoice totals updated!')
    
    console.log('\n🎉 All done! You can now:')
    console.log('   1. Refresh the invoices page')
    console.log('   2. Click Edit on invoice ' + invoice.invoice_number)
    console.log('   3. See all the items and totals populated correctly')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
addItemsToInvoice()
