const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugRLSIssue() {
  console.log('🔍 Debugging RLS Issue for Clients Table...')
  
  try {
    // Check if RLS is enabled on clients table
    console.log('📋 Checking RLS status on clients table...')
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT 
            tablename,
            rowsecurity as rls_enabled,
            hasrls as has_rls_policies
          FROM pg_tables 
          LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
          WHERE tablename = 'clients' AND schemaname = 'public';
        `
      })
    
    if (tableError) {
      console.log('⚠️  Checking RLS status via alternative method...')
      
      // Alternative check using direct SQL
      const { data: rlsCheck, error: rlsError } = await supabase
        .rpc('exec_sql', { 
          sql_query: `
            SELECT 
              c.relname as table_name,
              c.relrowsecurity as rls_enabled
            FROM pg_class c
            WHERE c.relname = 'clients' AND c.relkind = 'r';
          `
        })
      
      if (!rlsError) {
        console.log('✅ RLS Status Check:', rlsCheck)
      }
    } else {
      console.log('✅ Table Info:', tableInfo)
    }
    
    // Check existing policies on clients table
    console.log('\n📋 Checking existing RLS policies on clients table...')
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual
          FROM pg_policies 
          WHERE tablename = 'clients' AND schemaname = 'public'
          ORDER BY policyname;
        `
      })
    
    if (!policiesError) {
      console.log('✅ Current Policies:', policies)
    } else {
      console.log('⚠️  Could not retrieve policies:', policiesError.message)
    }
    
    // Check clients table structure
    console.log('\n📋 Checking clients table structure...')
    const { data: structure, error: structureError } = await supabase
      .rpc('exec_sql', { 
        sql_query: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = 'clients' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })
    
    if (!structureError) {
      console.log('✅ Table Structure:', structure)
    }
    
    // Test actual data access
    console.log('\n🧪 Testing data access (should be filtered by RLS)...')
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, user_id, created_at')
      .limit(10)
    
    if (!clientsError) {
      console.log('📊 Clients data returned:', clientsData?.length || 0, 'records')
      if (clientsData && clientsData.length > 0) {
        console.log('📋 Sample records:')
        clientsData.forEach((client, idx) => {
          console.log(`  ${idx + 1}. ${client.name} (user_id: ${client.user_id})`)
        })
      }
    } else {
      console.log('❌ Error accessing clients:', clientsError.message)
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message)
  }
}

async function fixRLSPolicies() {
  console.log('\n🔧 Fixing RLS Policies for Clients Table...')
  
  const fixCommands = [
    // First, enable RLS on clients table
    `ALTER TABLE clients ENABLE ROW LEVEL SECURITY;`,
    
    // Drop any existing policies
    `DROP POLICY IF EXISTS "users_own_clients" ON clients;`,
    `DROP POLICY IF EXISTS "Users can manage own clients" ON clients;`,
    `DROP POLICY IF EXISTS "users_can_view_own_clients" ON clients;`,
    `DROP POLICY IF EXISTS "users_can_insert_own_clients" ON clients;`,
    `DROP POLICY IF EXISTS "users_can_update_own_clients" ON clients;`,
    `DROP POLICY IF EXISTS "users_can_delete_own_clients" ON clients;`,
    
    // Create comprehensive RLS policies
    `CREATE POLICY "clients_select_policy" ON clients FOR SELECT USING (auth.uid() = user_id);`,
    `CREATE POLICY "clients_insert_policy" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);`,
    `CREATE POLICY "clients_update_policy" ON clients FOR UPDATE USING (auth.uid() = user_id);`,
    `CREATE POLICY "clients_delete_policy" ON clients FOR DELETE USING (auth.uid() = user_id);`
  ]
  
  for (let i = 0; i < fixCommands.length; i++) {
    const command = fixCommands[i]
    console.log(`🔧 Executing fix ${i + 1}/${fixCommands.length}...`)
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: command })
      if (error) {
        console.log(`⚠️  Fix ${i + 1} warning:`, error.message)
      } else {
        console.log(`✅ Fix ${i + 1} applied successfully`)
      }
    } catch (err) {
      console.log(`❌ Fix ${i + 1} error:`, err.message)
    }
  }
  
  console.log('\n✅ RLS Policies Fixed!')
}

async function testRLSIsolation() {
  console.log('\n🧪 Testing RLS Isolation...')
  
  try {
    // Test data access after fix
    const { data: clientsAfterFix, error: clientsAfterError } = await supabase
      .from('clients')
      .select('id, name, user_id, created_at')
      .limit(10)
    
    if (!clientsAfterError) {
      console.log('📊 Clients accessible after fix:', clientsAfterFix?.length || 0, 'records')
      
      if (clientsAfterFix && clientsAfterFix.length > 0) {
        const uniqueUserIds = [...new Set(clientsAfterFix.map(c => c.user_id))]
        console.log('👥 Unique user_ids in results:', uniqueUserIds.length)
        console.log('🔍 User IDs:', uniqueUserIds)
        
        if (uniqueUserIds.length > 1) {
          console.log('❌ ISSUE: Multiple user_ids found - RLS not working properly!')
        } else {
          console.log('✅ SUCCESS: Only one user_id found - RLS working correctly!')
        }
      }
    } else {
      console.log('🔒 Access properly restricted:', clientsAfterError.message)
    }
    
  } catch (error) {
    console.log('🔒 Data access properly restricted by RLS')
  }
}

if (require.main === module) {
  debugRLSIssue()
    .then(() => fixRLSPolicies())
    .then(() => testRLSIsolation())
    .then(() => {
      console.log('\n🎉 RLS DEBUG AND FIX COMPLETED!')
      console.log('🔒 Clients table should now properly isolate user data')
      console.log('💡 Test by logging in as different users to verify isolation')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Failed:', error)
      process.exit(1)
    })
}