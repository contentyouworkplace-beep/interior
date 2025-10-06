/**
 * Check RLS policies on invoice_items table
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies for invoice_items table...\n')
  
  try {
    // Check if RLS is enabled
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled
          FROM pg_tables 
          WHERE tablename = 'invoice_items';
        `
      })
    
    if (tableError) {
      console.log('⚠️  Could not check table info (exec_sql might not exist)')
      console.log('   Trying direct query...\n')
    } else {
      console.log('📊 Table Info:', tableInfo)
    }
    
    // Try to query policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'invoice_items')
    
    if (policiesError) {
      console.log('⚠️  Could not query pg_policies directly')
      console.log('   Error:', policiesError.message)
    } else if (policies && policies.length > 0) {
      console.log('\n📋 RLS Policies on invoice_items:')
      policies.forEach(policy => {
        console.log(`\n  Policy: ${policy.policyname}`)
        console.log(`  Command: ${policy.cmd}`)
        console.log(`  Definition: ${policy.qual || 'N/A'}`)
      })
    } else {
      console.log('⚠️  No RLS policies found on invoice_items table')
    }
    
    // Check if we can read items with service key
    console.log('\n\n🧪 Testing SELECT with SERVICE KEY...')
    const { data: items, error: selectError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', '36c377e0-0f4c-448b-997f-8013c2a082fb')
    
    if (selectError) {
      console.log('❌ SELECT failed with service key:', selectError)
    } else {
      console.log(`✅ SELECT successful with service key: Found ${items?.length || 0} items`)
    }
    
    // Get the invoice to check organization_id
    console.log('\n\n🔍 Checking invoice organization...')
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('id, invoice_number, organization_id')
      .eq('id', '36c377e0-0f4c-448b-997f-8013c2a082fb')
      .single()
    
    if (invError) {
      console.log('❌ Error fetching invoice:', invError)
    } else {
      console.log('✅ Invoice organization_id:', invoice.organization_id)
    }
    
    // Check demo user's organization
    console.log('\n\n🔍 Checking demo user...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, organization_id')
      .eq('email', 'demo@admin.com')
      .single()
    
    if (userError) {
      console.log('❌ Error fetching user:', userError)
    } else {
      console.log('✅ User organization_id:', user.organization_id)
      
      if (invoice && user) {
        if (invoice.organization_id === user.organization_id) {
          console.log('✅ Organization IDs MATCH - User should have access')
        } else {
          console.log('❌ Organization IDs DO NOT MATCH - User will NOT have access!')
          console.log(`   Invoice org: ${invoice.organization_id}`)
          console.log(`   User org:    ${user.organization_id}`)
        }
      }
    }
    
    console.log('\n\n💡 RECOMMENDATION:')
    console.log('If RLS policies exist but user cannot read items, the issue is likely:')
    console.log('1. invoice_items table has RLS enabled BUT no SELECT policy')
    console.log('2. OR the policy checks organization_id but invoice_items has NO organization_id column')
    console.log('3. OR the policy checks a relationship that doesn\'t exist')
    console.log('\nSolution: Add proper RLS policy or add organization_id column to invoice_items')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkRLSPolicies()
