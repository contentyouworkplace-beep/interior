import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runSchema() {
  console.log('🚀 Setting up database schema...')

  try {
    // Read the SQL schema file
    const schemaPath = join(process.cwd(), 'supabase', 'database-schema.sql')
    const schemaSql = readFileSync(schemaPath, 'utf8')

    // Split SQL by semicolons to execute statements individually
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Found ${statements.length} SQL statements to execute...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          
          if (error && !error.message.includes('already exists')) {
            console.warn(`⚠️  Warning in statement ${i + 1}:`, error.message)
          }
        } catch (err) {
          console.warn(`⚠️  Statement ${i + 1} skipped:`, err.message)
        }
      }
    }

    console.log('✅ Database schema setup completed!')
    console.log('📋 Next steps:')
    console.log('1. The client_files table should now be available')
    console.log('2. File uploads will now save to real database')
    console.log('3. Test file upload/view functionality in the app')

  } catch (error) {
    console.error('❌ Schema setup failed:', error)
    console.log('💡 You may need to run the SQL manually in your Supabase SQL editor')
    process.exit(1)
  }
}

runSchema()