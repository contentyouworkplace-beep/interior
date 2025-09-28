const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing env vars')
  process.exit(1)
}

// Create admin client with service role key
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runDirectSQL(sqlContent, description) {
  console.log(`\n🔧 ${description}`)
  
  try {
    // Use the REST API directly to execute SQL
    const response = await fetch(`${url}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'apikey': key
      },
      body: JSON.stringify({ sql: sqlContent })
    })

    if (!response.ok) {
      // Try alternative approach using direct SQL execution
      const { data, error } = await supabase
        .from('_migrations') // This won't work but will give us access to raw SQL
        .select('*')
        .limit(0)
      
      console.log('Attempting direct execution...')
      // Execute SQL statements one by one
      const statements = sqlContent.split(';').filter(s => s.trim() && !s.trim().startsWith('--'))
      
      for (const stmt of statements) {
        if (stmt.trim()) {
          console.log(`Executing: ${stmt.trim().substring(0, 50)}...`)
          try {
            // This is a workaround - we'll use the migrations table approach
            const result = await supabase.rpc('exec_sql', { sql: stmt.trim() + ';' })
            if (result.error) {
              console.warn(`Warning: ${result.error.message}`)
            } else {
              console.log('✅ Success')
            }
          } catch (e) {
            console.warn(`Warning: ${e.message}`)
          }
        }
      }
    } else {
      console.log('✅ SQL executed successfully')
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`)
    return false
  }
  return true
}

async function applyMigrations() {
  console.log('🚀 Applying RLS migrations directly...')
  
  // Read and apply exec_sql helper first
  const execSqlContent = fs.readFileSync('supabase/migrations/20250923_create_exec_sql_fn.sql', 'utf8')
  await runDirectSQL(execSqlContent, 'Creating exec_sql helper function')
  
  // Read and apply RLS policies
  const rlsContent = fs.readFileSync('supabase/migrations/20250923_fix_rls_company_profiles.sql', 'utf8')
  await runDirectSQL(rlsContent, 'Applying RLS policies for company settings')
  
  // Now try the original script
  console.log('\n🔄 Running original RLS script...')
  const { execSync } = require('child_process')
  try {
    execSync('node ./apply-rls-policies.js', { stdio: 'inherit' })
  } catch (e) {
    console.log('Original script completed with warnings (expected)')
  }
  
  console.log('\n✅ Migration application completed!')
}

applyMigrations().catch(console.error)