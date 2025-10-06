const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

async function runAutoOrganizationSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase environment variables')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    console.log('🔧 Setting up auto organization creation...')
    
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('❌ Connection test failed:', testError.message)
      return
    }
    
    console.log('✅ Connected to Supabase successfully')
    
    // Read and execute the setup SQL
    const sql = fs.readFileSync('auto-organization-setup.sql', 'utf8')
    
    // Split into individual queries and execute them
    const queries = sql.split(';').filter(q => q.trim() && !q.trim().startsWith('--'))
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim()
      if (query) {
        console.log(`📝 Executing query ${i + 1}/${queries.length}...`)
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: query })
        
        if (error) {
          console.log(`❌ Error in query ${i + 1}:`, error.message)
          // Continue with other queries
        } else if (data) {
          console.log(`✅ Query ${i + 1} result:`, data)
        }
      }
    }
    
    // Verify the setup
    console.log('\n🔍 Verifying setup...')
    
    const { data: orgData } = await supabase.from('organizations').select('*')
    const { data: memberData } = await supabase.from('organization_members').select('*')
    const { data: profileData } = await supabase.from('company_profiles').select('*')
    
    console.log('📊 Organizations:', orgData?.length || 0)
    console.log('📊 Memberships:', memberData?.length || 0)
    console.log('📊 Company Profiles:', profileData?.length || 0)
    
    if (orgData?.length > 0) {
      console.log('✅ Auto organization setup completed successfully!')
      console.log('🎉 Users will now automatically get added to an organization on signup')
    } else {
      console.log('⚠️ Setup may not have completed fully')
    }
    
  } catch (err) {
    console.log('❌ Script error:', err.message)
  }
}

runAutoOrganizationSetup()