/**
 * Check actual schema of invoices and invoice_items tables
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkSchema() {
  console.log('🔍 Checking actual table schemas...\n')
  
  try {
    // Get one invoice to see actual columns
    console.log('📊 INVOICES TABLE:')
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1)
      .single()
    
    if (invError) {
      console.log('❌ Error:', invError)
    } else {
      console.log('Columns:', Object.keys(invoice).sort().join(', '))
    }
    
    // Get one invoice_item to see actual columns
    console.log('\n📊 INVOICE_ITEMS TABLE:')
    const { data: item, error: itemError } = await supabase
      .from('invoice_items')
      .select('*')
      .limit(1)
      .single()
    
    if (itemError) {
      console.log('❌ Error:', itemError)
    } else {
      console.log('Columns:', Object.keys(item).sort().join(', '))
    }
    
    // Check if RLS is blocking reads
    console.log('\n\n🧪 TESTING RLS ACCESS:')
    console.log('\n1. Testing with SERVICE KEY (bypasses RLS):')
    const { data: serviceItems, error: serviceError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', '36c377e0-0f4c-448b-997f-8013c2a082fb')
    
    console.log(`   Result: ${serviceItems?.length || 0} items found`)
    if (serviceError) console.log('   Error:', serviceError)
    
    // Try with anon key (will be blocked by RLS if policies are wrong)
    console.log('\n2. Testing with ANON KEY (respects RLS):')
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: anonItems, error: anonError } = await anonClient
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', '36c377e0-0f4c-448b-997f-8013c2a082fb')
    
    console.log(`   Result: ${anonItems?.length || 0} items found`)
    if (anonError) {
      console.log('   ❌ Error:', anonError.message)
      console.log('   Code:', anonError.code)
    }
    
    console.log('\n\n💡 DIAGNOSIS:')
    if (serviceItems?.length > 0 && (!anonItems || anonItems.length === 0)) {
      console.log('❌ RLS POLICY ISSUE CONFIRMED!')
      console.log('   - Items exist in database (service key can read them)')
      console.log('   - But anon key cannot read them (RLS is blocking)')
      console.log('\n   SOLUTION: Disable RLS on invoice_items OR add proper SELECT policy')
    } else if (anonItems?.length > 0) {
      console.log('✅ RLS is working correctly')
      console.log('   The issue must be with the client-side code')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkSchema()
