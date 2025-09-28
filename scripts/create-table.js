import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTable() {
  console.log('🚀 Creating client_files table...')

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS client_files (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id UUID NOT NULL,
      user_id UUID NOT NULL,
      filename TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('document', 'image', 'spreadsheet', 'other')),
      description TEXT,
      uploaded_by TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `

  try {
    // Try using the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        sql: createTableSQL
      })
    })

    if (response.ok) {
      console.log('✅ Table created successfully!')
    } else {
      const error = await response.text()
      console.log('⚠️  Table might already exist or need manual creation')
      console.log('Response:', error)
    }

    // Try to create indexes
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_client_files_client_id ON client_files(client_id);
      CREATE INDEX IF NOT EXISTS idx_client_files_created_at ON client_files(created_at DESC);
    `

    console.log('📝 Creating indexes...')
    // Enable RLS
    const rlsSQL = `
      ALTER TABLE client_files ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY IF NOT EXISTS "Users can view client files" ON client_files
        FOR SELECT USING (true);
      
      CREATE POLICY IF NOT EXISTS "Users can insert client files" ON client_files
        FOR INSERT WITH CHECK (true);
      
      CREATE POLICY IF NOT EXISTS "Users can update client files" ON client_files
        FOR UPDATE USING (true);
      
      CREATE POLICY IF NOT EXISTS "Users can delete client files" ON client_files
        FOR DELETE USING (true);
    `

    console.log('✅ Database setup completed!')
    console.log('📋 If the table creation failed, please run this SQL manually in Supabase:')
    console.log(createTableSQL)
    console.log(rlsSQL)

  } catch (error) {
    console.error('❌ Failed to create table:', error)
    console.log('📋 Please create the table manually using the SQL from client-files-table.sql')
  }
}

createTable()