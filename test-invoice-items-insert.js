/**
 * Check RLS policies on invoice_items table
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testInvoiceItemInsert() {
  // Test with anon key (what the app uses)
  const anonClient = createClient(supabaseUrl, supabaseAnonKey)
  
  // First, get a valid user session
  const { data: { user }, error: authError } = await anonClient.auth.getUser()
  
  if (authError || !user) {
    console.log('❌ Not authenticated. Please log in to the app first.')
    return
  }
  
  console.log('✅ Authenticated as:', user.email)
  
  // Get the invoice to test with
  const { data: invoice, error: invError } = await anonClient
    .from('invoices')
    .select('*')
    .eq('invoice_number', 'INV-2025-10-003')
    .single()
  
  if (invError) {
    console.error('❌ Error fetching invoice:', invError)
    return
  }
  
  console.log('✅ Invoice found:', invoice.id)
  console.log('   Organization:', invoice.organization_id)
  
  // Try to insert a test item
  console.log('\n🧪 Testing invoice_items insert with ANON key...')
  const testItem = {
    invoice_id: invoice.id,
    description: 'Test Item',
    quantity: 1,
    unit_price: 100,
    amount: 100,
    item_order: 999
  }
  
  const { data: insertData, error: insertError } = await anonClient
    .from('invoice_items')
    .insert([testItem])
    .select()
  
  if (insertError) {
    console.error('❌ INSERT FAILED with anon key:', insertError)
    console.error('   Code:', insertError.code)
    console.error('   Message:', insertError.message)
    console.error('   Details:', insertError.details)
    console.error('   Hint:', insertError.hint)
  } else {
    console.log('✅ INSERT SUCCESS with anon key:', insertData)
    
    // Clean up - delete the test item
    await anonClient
      .from('invoice_items')
      .delete()
      .eq('id', insertData[0].id)
    console.log('🧹 Cleaned up test item')
  }
  
  // Now test with service key
  console.log('\n🧪 Testing invoice_items insert with SERVICE key...')
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('invoice_items')
    .insert([testItem])
    .select()
  
  if (serviceError) {
    console.error('❌ INSERT FAILED with service key:', serviceError)
  } else {
    console.log('✅ INSERT SUCCESS with service key:', serviceData)
    
    // Clean up
    await serviceClient
      .from('invoice_items')
      .delete()
      .eq('id', serviceData[0].id)
    console.log('🧹 Cleaned up test item')
  }
}

testInvoiceItemInsert()
