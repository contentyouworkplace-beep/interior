const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function auditAllTables() {
  console.log('🔍 Auditing RLS on All CRM Tables...')
  
  const tables = ['clients', 'projects', 'quotations', 'invoices', 'expenses', 'vendors', 'team_members', 'payments']
  
  for (const table of tables) {
    console.log(`\n📋 Checking ${table} table...`)
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('user_id, id')
        .limit(10)
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
        continue
      }
      
      if (data && data.length > 0) {
        const uniqueUsers = [...new Set(data.map(item => item.user_id))]
        console.log(`📊 ${table}: ${data.length} records, ${uniqueUsers.length} unique user_ids`)
        
        if (uniqueUsers.length > 1) {
          console.log(`🚨 ${table}: RLS NOT WORKING - Multiple users visible!`)
          console.log(`   User IDs: ${uniqueUsers.join(', ')}`)
        } else {
          console.log(`✅ ${table}: RLS working - Only one user visible`)
        }
      } else {
        console.log(`📊 ${table}: No data found`)
      }
      
    } catch (err) {
      console.log(`🔒 ${table}: Access restricted (could be good)`)
    }
  }
}

if (require.main === module) {
  auditAllTables()
    .then(() => {
      console.log('\n🎯 AUDIT COMPLETE!')
      console.log('\n🚨 CRITICAL ACTION REQUIRED:')
      console.log('1. Go to Supabase Dashboard > SQL Editor')
      console.log('2. Run CRITICAL-RLS-FIX-CLIENTS.sql')
      console.log('3. Test with different user logins')
      console.log('4. Verify user isolation is working')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}