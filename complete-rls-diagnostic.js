/**
 * COMPLETE RLS DIAGNOSTIC - Shows exact policy state
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function completeDiagnostic() {
  console.log('🔍 COMPLETE RLS DIAGNOSTIC FOR INVOICE_ITEMS\n')
  console.log('=' .repeat(70))
  
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  const anonClient = createClient(supabaseUrl, anonKey)
  
  try {
    // 1. Check if RLS is enabled
    console.log('\n1️⃣  CHECKING IF RLS IS ENABLED:')
    console.log('   ⚠️  Cannot check RLS status programmatically (exec_sql not available)')
    console.log('   Check in Supabase Dashboard → Database → Tables → invoice_items → RLS')
    
    // 2. Check existing policies
    console.log('\n2️⃣  CHECKING EXISTING POLICIES:')
    console.log('   ⚠️  Cannot query policies directly (exec_sql not available)')
    console.log('   Check in Supabase Dashboard → Database → Policies')
    
    // 3. Test SERVICE key access
    console.log('\n3️⃣  TESTING SERVICE KEY ACCESS (bypasses RLS):')
    const { data: serviceItems, error: serviceError } = await serviceClient
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', '36c377e0-0f4c-448b-997f-8013c2a082fb')
    
    if (serviceError) {
      console.log('   ❌ Error:', serviceError.message)
    } else {
      console.log(`   ✅ Found ${serviceItems?.length || 0} items`)
    }
    
    // 4. Test ANON key access (unauthenticated)
    console.log('\n4️⃣  TESTING ANON KEY ACCESS (respects RLS, no auth):')
    const { data: anonItems, error: anonError } = await anonClient
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', '36c377e0-0f4c-448b-997f-8013c2a082fb')
    
    if (anonError) {
      console.log('   ❌ Error:', anonError.message)
      console.log('   Code:', anonError.code)
    } else {
      console.log(`   Result: ${anonItems?.length || 0} items`)
      if (anonItems?.length === 0) {
        console.log('   ⚠️  No items returned (policy might require authentication)')
      }
    }
    
    // 5. Summary
    console.log('\n' + '=' .repeat(70))
    console.log('\n📊 SUMMARY:')
    
    const serviceCount = serviceItems?.length || 0
    const anonCount = anonItems?.length || 0
    
    if (serviceCount > 0 && anonCount === 0) {
      console.log('\n❌ PROBLEM CONFIRMED:')
      console.log('   - Items exist in database')
      console.log('   - Service key can read them')
      console.log('   - But anon/auth key CANNOT read them')
      console.log('   - RLS is blocking access')
      
      console.log('\n🔧 SOLUTION:')
      console.log('   Run this SQL in Supabase Dashboard → SQL Editor:')
      console.log('\n   ' + '-'.repeat(66))
      console.log('   DROP POLICY IF EXISTS "Allow all for authenticated users" ON invoice_items;')
      console.log('   ')
      console.log('   CREATE POLICY "Allow all for authenticated users"')
      console.log('   ON invoice_items')
      console.log('   FOR ALL')
      console.log('   TO authenticated')
      console.log('   USING (true)')
      console.log('   WITH CHECK (true);')
      console.log('   ' + '-'.repeat(66))
      
    } else if (anonCount > 0) {
      console.log('\n✅ POLICY IS WORKING!')
      console.log('   - Anon key can read items')
      console.log('   - The problem might be elsewhere')
      console.log('   - Check browser console logs')
    } else {
      console.log('\n⚠️  UNEXPECTED STATE:')
      console.log('   - No items found with either key')
      console.log('   - Check if items actually exist in database')
    }
    
    console.log('\n' + '=' .repeat(70))
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

completeDiagnostic()
