/**
 * Check how quotation_items RLS is configured (since it works!)
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkQuotationRLS() {
  console.log('🔍 Checking quotation_items RLS (which works!)...\n')
  
  try {
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test quotation_items with anon key
    console.log('1️⃣  Testing quotation_items with ANON KEY:')
    const { data: quotationItems, error: quotationError } = await anonClient
      .from('quotation_items')
      .select('*')
      .limit(5)
    
    if (quotationError) {
      console.log('   ❌ Error:', quotationError.message)
    } else {
      console.log(`   ✅ Can read ${quotationItems?.length || 0} quotation items`)
    }
    
    // Test invoice_items with anon key
    console.log('\n2️⃣  Testing invoice_items with ANON KEY:')
    const { data: invoiceItems, error: invoiceError } = await anonClient
      .from('invoice_items')
      .select('*')
      .limit(5)
    
    if (invoiceError) {
      console.log('   ❌ Error:', invoiceError.message)
    } else {
      console.log(`   ✅ Can read ${invoiceItems?.length || 0} invoice items`)
    }
    
    // Check quotation_items schema
    console.log('\n3️⃣  Checking quotation_items columns:')
    const { data: quotItem } = await serviceClient
      .from('quotation_items')
      .select('*')
      .limit(1)
      .single()
    
    if (quotItem) {
      console.log('   Columns:', Object.keys(quotItem).sort().join(', '))
    }
    
    // Check invoice_items schema
    console.log('\n4️⃣  Checking invoice_items columns:')
    const { data: invItem } = await serviceClient
      .from('invoice_items')
      .select('*')
      .limit(1)
      .single()
    
    if (invItem) {
      console.log('   Columns:', Object.keys(invItem).sort().join(', '))
    }
    
    console.log('\n\n💡 COMPARISON:')
    console.log('If quotation_items works but invoice_items doesn\'t,')
    console.log('we need to copy the RLS policies from quotation_items to invoice_items!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkQuotationRLS()
