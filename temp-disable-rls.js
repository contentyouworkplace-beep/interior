/**
 * TEMPORARY FIX: Disable RLS on invoice_items table
 * This will allow the app to work while we properly configure RLS
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function disableRLS() {
  console.log('⚠️  TEMPORARY FIX: Disabling RLS on invoice_items table...\n')
  
  try {
    // We'll use a raw SQL query through a different approach
    // Since exec_sql doesn't exist, we'll need to apply this manually
    
    console.log('📋 SQL to apply in Supabase Dashboard:')
    console.log('=' .repeat(60))
    console.log(`
-- Disable RLS on invoice_items table (TEMPORARY)
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, add permissive policies:
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to do everything (for now)
CREATE POLICY "Allow all for authenticated users" 
ON invoice_items 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
`)
    console.log('=' .repeat(60))
    
    console.log('\n📝 Steps to apply:')
    console.log('   1. Go to Supabase Dashboard → SQL Editor')
    console.log('   2. Copy and paste the SQL above')
    console.log('   3. Click "Run"')
    console.log('   4. Refresh your browser at localhost:3002/invoices')
    console.log('   5. Click Edit - items should now load!')
    
    // Test current state
    console.log('\n🧪 Testing current access...')
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data, error } = await anonClient
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', '36c377e0-0f4c-448b-997f-8013c2a082fb')
    
    if (error) {
      console.log(`   ❌ Still blocked: ${error.message}`)
    } else if (data && data.length > 0) {
      console.log(`   ✅ SUCCESS! Can now read ${data.length} items`)
    } else {
      console.log('   ⚠️  No items found (might still be blocked)')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

disableRLS()
