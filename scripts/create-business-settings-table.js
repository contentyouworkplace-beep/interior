const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Required variables:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBusinessSettingsTable() {
  try {
    console.log('🚀 Creating business_settings table...')

    const createTableSQL = `
      -- Create business_settings table
      CREATE TABLE IF NOT EXISTS public.business_settings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          tagline VARCHAR(500),
          logo_url TEXT,
          address TEXT NOT NULL,
          city VARCHAR(100) NOT NULL,
          state VARCHAR(100) NOT NULL,
          pincode VARCHAR(10) NOT NULL,
          country VARCHAR(100) DEFAULT 'India',
          phone VARCHAR(20) NOT NULL,
          email VARCHAR(255) NOT NULL,
          website VARCHAR(255),
          gstin VARCHAR(15),
          pan VARCHAR(10),
          cin VARCHAR(21),
          bank_name VARCHAR(255),
          bank_account VARCHAR(50),
          ifsc_code VARCHAR(11),
          primary_color VARCHAR(7) DEFAULT '#3B82F6',
          secondary_color VARCHAR(7) DEFAULT '#1E40AF',
          quotation_template VARCHAR(50) DEFAULT 'modern',
          invoice_template VARCHAR(50) DEFAULT 'modern',
          signature_url TEXT,
          terms_conditions TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
      );

      -- Create index for better performance
      CREATE INDEX IF NOT EXISTS idx_business_settings_user_id ON public.business_settings(user_id);

      -- Enable RLS (Row Level Security)
      ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

      -- Create RLS policy to allow users to manage their own business settings
      DROP POLICY IF EXISTS "Users can manage their own business settings" ON public.business_settings;
      CREATE POLICY "Users can manage their own business settings" 
      ON public.business_settings 
      FOR ALL 
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    `

    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL })

    if (error) {
      console.error('❌ Error creating table with RPC:', error.message)
      
      // Try direct SQL execution
      console.log('📝 Trying direct SQL execution...')
      const { error: directError } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_name', 'business_settings')
        .limit(1)

      if (directError) {
        console.log('❌ Direct SQL also failed')
        console.log('\n🛠️  MANUAL SETUP REQUIRED:')
        console.log('1. Go to your Supabase dashboard')
        console.log('2. Navigate to SQL Editor')
        console.log('3. Copy and paste this SQL:')
        console.log('\n--- SQL TO EXECUTE ---')
        console.log(createTableSQL)
        console.log('--- END SQL ---\n')
        return
      }
    }

    console.log('✅ business_settings table creation attempted')

    // Verify table exists
    const { data, error: checkError } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)

    if (checkError) {
      console.log('❌ Table verification failed:', checkError.message)
      console.log('\n🛠️  MANUAL SETUP REQUIRED:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste this SQL:')
      console.log('\n--- SQL TO EXECUTE ---')
      console.log(createTableSQL)
      console.log('--- END SQL ---\n')
    } else {
      console.log('✅ business_settings table verified and ready!')
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
    console.log('\n🛠️  MANUAL SETUP REQUIRED - See SQL above')
  }
}

createBusinessSettingsTable()