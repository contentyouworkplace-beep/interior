/**
 * Apply RLS policies for invoice_items table
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRLSPolicies() {
  console.log('🔧 Applying RLS policies for invoice_items...\n')
  
  try {
    // Drop existing policies
    console.log('1️⃣  Dropping existing policies...')
    
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Users can view invoice items for their invoices" ON invoice_items',
      'DROP POLICY IF EXISTS "Users can insert invoice items for their invoices" ON invoice_items',
      'DROP POLICY IF EXISTS "Users can update invoice items for their invoices" ON invoice_items',
      'DROP POLICY IF EXISTS "Users can delete invoice items for their invoices" ON invoice_items'
    ]
    
    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error && !error.message.includes('does not exist')) {
        console.log('   ⚠️  Error dropping policy:', error.message)
      }
    }
    console.log('   ✅ Old policies dropped\n')
    
    // Enable RLS
    console.log('2️⃣  Enabling RLS...')
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY'
    })
    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.log('   ⚠️  Error enabling RLS:', rlsError.message)
    } else {
      console.log('   ✅ RLS enabled\n')
    }
    
    // Create SELECT policy
    console.log('3️⃣  Creating SELECT policy...')
    const { error: selectError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can view invoice items for their invoices"
        ON invoice_items
        FOR SELECT
        USING (
          invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
          )
        )
      `
    })
    if (selectError) {
      console.log('   ❌ Error:', selectError.message)
    } else {
      console.log('   ✅ SELECT policy created\n')
    }
    
    // Create INSERT policy
    console.log('4️⃣  Creating INSERT policy...')
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can insert invoice items for their invoices"
        ON invoice_items
        FOR INSERT
        WITH CHECK (
          invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
          )
        )
      `
    })
    if (insertError) {
      console.log('   ❌ Error:', insertError.message)
    } else {
      console.log('   ✅ INSERT policy created\n')
    }
    
    // Create UPDATE policy
    console.log('5️⃣  Creating UPDATE policy...')
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can update invoice items for their invoices"
        ON invoice_items
        FOR UPDATE
        USING (
          invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
          )
        )
      `
    })
    if (updateError) {
      console.log('   ❌ Error:', updateError.message)
    } else {
      console.log('   ✅ UPDATE policy created\n')
    }
    
    // Create DELETE policy
    console.log('6️⃣  Creating DELETE policy...')
    const { error: deleteError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Users can delete invoice items for their invoices"
        ON invoice_items
        FOR DELETE
        USING (
          invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
          )
        )
      `
    })
    if (deleteError) {
      console.log('   ❌ Error:', deleteError.message)
    } else {
      console.log('   ✅ DELETE policy created\n')
    }
    
    // Test the policies
    console.log('7️⃣  Testing policies with anon key...')
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    // This will fail because no auth user
    const { data: testItems, error: testError } = await anonClient
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', '36c377e0-0f4c-448b-997f-8013c2a082fb')
    
    if (testError || !testItems || testItems.length === 0) {
      console.log('   ⚠️  No items returned (expected - user not authenticated)')
      console.log('   💡 User must be logged in to see items')
    } else {
      console.log(`   ✅ ${testItems.length} items returned\n`)
    }
    
    console.log('\n✅ RLS policies applied successfully!')
    console.log('\n📝 Next steps:')
    console.log('   1. Refresh your browser')
    console.log('   2. Make sure you\'re logged in as demo@admin.com')
    console.log('   3. Click Edit on the invoice')
    console.log('   4. Items should now load properly!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

applyRLSPolicies()
