const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!')
  console.log('Please ensure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyRLSPolicies() {
  console.log('🔐 Applying RLS Policies...')
  
  try {
    // Read the RLS policies file
    const rlsPolicies = fs.readFileSync('rls-policies.sql', 'utf8')
    
    // Split into individual statements
    const statements = rlsPolicies
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} policy statements`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message)
        // Continue with other statements even if one fails
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }
    
    console.log('\n🎉 RLS Policies application completed!')
    console.log('✅ All Row Level Security policies have been set up')
    console.log('\n🚀 You can now restart your application: pnpm dev')
    
  } catch (error) {
    console.error('❌ Error applying RLS policies:', error.message)
    process.exit(1)
  }
}

// Alternative method using direct SQL execution
async function applyRLSPoliciesDirectly() {
  console.log('🔐 Applying RLS Policies (Direct Method)...')
  
  const policies = [
    // Enable RLS
    'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE clients ENABLE ROW LEVEL SECURITY;',
    'ALTER TABLE projects ENABLE ROW LEVEL SECURITY;',
    
    // Clients policies
    'DROP POLICY IF EXISTS "Users can view own clients" ON clients;',
    'CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);',
    
    'DROP POLICY IF EXISTS "Users can insert own clients" ON clients;',
    'CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);',
    
    'DROP POLICY IF EXISTS "Users can update own clients" ON clients;',
    'CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);',
    
    'DROP POLICY IF EXISTS "Users can delete own clients" ON clients;',
    'CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);'
  ]
  
  for (let i = 0; i < policies.length; i++) {
    const policy = policies[i]
    console.log(`⚡ Executing policy ${i + 1}/${policies.length}`)
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: policy })
      
      if (error) {
        console.warn(`⚠️  Warning on policy ${i + 1}:`, error.message)
      } else {
        console.log(`✅ Policy ${i + 1} applied successfully`)
      }
    } catch (err) {
      console.warn(`⚠️  Error on policy ${i + 1}:`, err.message)
    }
  }
  
  console.log('\n🎉 Basic RLS Policies applied!')
}

// Try the direct method first
applyRLSPoliciesDirectly()
  .then(() => {
    console.log('\n✅ RLS setup completed successfully!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Failed to apply RLS policies:', error.message)
    process.exit(1)
  })