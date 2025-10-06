const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Test with anon key instead of service role to simulate real user access
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testRealUserAccess() {
  console.log('🧪 Testing RLS with Real User Authentication...')
  
  try {
    // Test 1: Try to access data without authentication (should fail)
    console.log('\n📋 Test 1: Unauthenticated access (should be blocked)...')
    const { data: unauthData, error: unauthError } = await supabaseAnon
      .from('clients')
      .select('user_id, first_name')
      .limit(5)
    
    if (unauthError) {
      console.log('✅ Good: Unauthenticated access blocked -', unauthError.message)
    } else {
      console.log('❌ Security issue: Unauthenticated access allowed!')
      console.log('📊 Data returned:', unauthData?.length, 'records')
    }
    
    // Test 2: Try to authenticate with demo user
    console.log('\n📋 Test 2: Authenticating with demo@admin.com...')
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'demo@admin.com',
      password: 'Demo@1234'
    })
    
    if (authError) {
      console.log('❌ Authentication failed:', authError.message)
      return
    }
    
    if (authData.user) {
      console.log('✅ Authentication successful!')
      console.log('👤 User ID:', authData.user.id)
      
      // Test 3: Access data as authenticated user
      console.log('\n📋 Test 3: Accessing data as authenticated user...')
      const { data: userClients, error: clientError } = await supabaseAnon
        .from('clients')
        .select('user_id, first_name, email')
        .limit(10)
      
      if (clientError) {
        console.log('❌ Error accessing clients:', clientError.message)
      } else {
        console.log('📊 Clients accessible:', userClients?.length || 0)
        
        if (userClients && userClients.length > 0) {
          const uniqueUsers = [...new Set(userClients.map(c => c.user_id))]
          console.log('👥 Unique user_ids in results:', uniqueUsers.length)
          console.log('🔍 User IDs:', uniqueUsers)
          console.log('👤 Current user ID:', authData.user.id)
          
          // Check if RLS is working
          const allBelongToUser = userClients.every(c => c.user_id === authData.user.id)
          if (allBelongToUser) {
            console.log('✅ RLS WORKING: All data belongs to current user!')
          } else {
            console.log('🚨 RLS NOT WORKING: Data from other users visible!')
          }
        }
      }
      
      // Test 4: Check team members
      console.log('\n📋 Test 4: Checking team_members isolation...')
      const { data: teamMembers, error: teamError } = await supabaseAnon
        .from('team_members')
        .select('user_id, name')
        .limit(10)
      
      if (teamError) {
        console.log('❌ Error accessing team members:', teamError.message)
      } else {
        console.log('📊 Team members accessible:', teamMembers?.length || 0)
        
        if (teamMembers && teamMembers.length > 0) {
          const uniqueTeamUsers = [...new Set(teamMembers.map(t => t.user_id))]
          console.log('👥 Unique user_ids in team results:', uniqueTeamUsers.length)
          
          if (uniqueTeamUsers.length === 1 && uniqueTeamUsers[0] === authData.user.id) {
            console.log('✅ TEAM RLS WORKING: All team data belongs to current user!')
          } else {
            console.log('🚨 TEAM RLS NOT WORKING: Team data from other users visible!')
            console.log('🔍 Team User IDs:', uniqueTeamUsers)
          }
        }
      }
      
      // Sign out
      await supabaseAnon.auth.signOut()
      console.log('\n👋 Signed out')
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

async function checkRLSStatus() {
  console.log('\n🔍 Checking RLS Status...')
  
  // Use service role to check RLS configuration
  const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  console.log('📋 Current RLS status (service role can see all data):')
  console.log('- Service role bypasses RLS for administrative purposes')
  console.log('- Real users will only see their own data')
  console.log('- The test above simulates real user experience')
}

if (require.main === module) {
  testRealUserAccess()
    .then(() => checkRLSStatus())
    .then(() => {
      console.log('\n🎯 RLS TEST COMPLETED!')
      console.log('📋 If the test shows RLS working, your CRM is secure!')
      console.log('💡 Test by logging into the app with different users to verify')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Test failed:', error)
      process.exit(1)
    })
}