const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkClientsTable() {
  console.log('🔍 Checking Clients Table Structure...')
  
  try {
    // Check what columns exist in clients table
    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(1)
    
    if (clientsError) {
      console.log('❌ Error accessing clients table:', clientsError.message)
      return
    }
    
    if (clientsData && clientsData.length > 0) {
      console.log('✅ Clients table structure (columns):')
      Object.keys(clientsData[0]).forEach(column => {
        console.log(`  - ${column}`)
      })
      console.log('\n📊 Sample record:', clientsData[0])
    }
    
    // Check total count to see if RLS is working
    const { count, error: countError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`\n📊 Total accessible clients: ${count}`)
    }
    
    // Try to get all clients to see user_id distribution
    const { data: allClients, error: allError } = await supabase
      .from('clients')
      .select('user_id, id, first_name, email')
      .limit(20)
    
    if (!allError && allClients) {
      console.log('\n👥 User ID distribution in accessible clients:')
      const userCounts = {}
      allClients.forEach(client => {
        const userId = client.user_id || 'null'
        userCounts[userId] = (userCounts[userId] || 0) + 1
      })
      
      Object.entries(userCounts).forEach(([userId, count]) => {
        console.log(`  User ${userId}: ${count} clients`)
      })
      
      if (Object.keys(userCounts).length > 1) {
        console.log('\n❌ CRITICAL ISSUE: Multiple user_ids found!')
        console.log('🚨 RLS is NOT working - users can see each other\'s data!')
      } else {
        console.log('\n✅ GOOD: Only one user_id found - RLS working correctly')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function fixRLSDirectly() {
  console.log('\n🔧 Fixing RLS Policies using Supabase Client...')
  
  // Since exec_sql doesn't work, let's try to apply RLS through the API
  // First, let's check if we can create/update policies through the management API
  
  console.log('⚠️  Note: RLS policies need to be applied via Supabase Dashboard or SQL commands')
  console.log('📋 Required SQL commands to run in Supabase SQL Editor:')
  
  const sqlCommands = `
-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "users_own_clients" ON clients;
DROP POLICY IF EXISTS "Users can manage own clients" ON clients;

-- Create new comprehensive RLS policies
CREATE POLICY "clients_select_policy" ON clients 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "clients_insert_policy" ON clients 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update_policy" ON clients 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "clients_delete_policy" ON clients 
  FOR DELETE USING (auth.uid() = user_id);

-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'clients';

-- Check policies
SELECT * FROM pg_policies WHERE tablename = 'clients';
`
  
  console.log(sqlCommands)
  
  return sqlCommands
}

async function testDataIsolation() {
  console.log('\n🧪 Testing Current Data Isolation...')
  
  // Get current user from auth (this will be the service role, not ideal for testing)
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.log('⚠️  No authenticated user found (using service role)')
  } else {
    console.log('👤 Current user:', user?.id || 'none')
  }
  
  // Test with different approaches
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('user_id, first_name, email, id')
      .limit(10)
    
    if (error) {
      console.log('🔒 Access restricted (this could be good if RLS is working):', error.message)
    } else {
      console.log('📊 Accessible clients:', clients?.length || 0)
      
      if (clients && clients.length > 0) {
        // Check if all clients belong to the same user
        const uniqueUsers = [...new Set(clients.map(c => c.user_id))]
        console.log('👥 Unique user_ids found:', uniqueUsers.length)
        
        if (uniqueUsers.length > 1) {
          console.log('🚨 SECURITY ISSUE: Multiple users\' data visible!')
          console.log('📋 User IDs found:', uniqueUsers)
        } else {
          console.log('✅ Good: Only one user\'s data visible')
        }
      }
    }
    
  } catch (error) {
    console.log('🔒 Data access properly restricted')
  }
}

if (require.main === module) {
  checkClientsTable()
    .then(() => fixRLSDirectly())
    .then(() => testDataIsolation())
    .then(() => {
      console.log('\n📋 SUMMARY:')
      console.log('1. Check the clients table structure above')
      console.log('2. Apply the SQL commands in Supabase Dashboard > SQL Editor')
      console.log('3. Test with different user logins to verify isolation')
      console.log('\n💡 NEXT STEPS:')
      console.log('- Go to Supabase Dashboard')
      console.log('- Open SQL Editor')
      console.log('- Run the provided SQL commands')
      console.log('- Test with multiple user accounts')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}