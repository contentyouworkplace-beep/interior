require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupPaymentTable() {
  try {
    console.log('Creating payment_records table...')
    
    // First, let's check if the table exists
    const { data: tables, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'payment_records';
        `
      })

    if (tableError) {
      console.log('Checking table existence failed, proceeding with creation...')
    } else {
      console.log('Table check result:', tables)
    }

    // Create the table and related objects
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create payment_records table
        CREATE TABLE IF NOT EXISTS payment_records (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('monthly_salary', 'freelance_payment', 'advance', 'bonus')),
          amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
          description TEXT NOT NULL,
          payment_date DATE NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (createError) {
      console.error('Error creating table:', createError)
    } else {
      console.log('✅ Table created successfully')
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_payment_records_team_member_id ON payment_records(team_member_id);
        CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
        CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date);
        CREATE INDEX IF NOT EXISTS idx_payment_records_payment_type ON payment_records(payment_type);
      `
    })

    if (indexError) {
      console.error('Error creating indexes:', indexError)
    } else {
      console.log('✅ Indexes created successfully')
    }

    // Enable RLS and create policies
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS
        ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policy if it exists
        DROP POLICY IF EXISTS "Users can only see their own payment records" ON payment_records;
        
        -- Create RLS policy
        CREATE POLICY "Users can only see their own payment records" ON payment_records
          FOR ALL USING (user_id = auth.uid());
      `
    })

    if (rlsError) {
      console.error('Error setting up RLS:', rlsError)
    } else {
      console.log('✅ RLS policies created successfully')
    }

    // Test the table by trying a simple query
    const { data: testData, error: testError } = await supabase
      .from('payment_records')
      .select('count', { count: 'exact' })
      .limit(0)

    if (testError) {
      console.error('❌ Table test failed:', testError)
    } else {
      console.log('✅ Table is working! Current count:', testData)
    }

    console.log('Payment records table setup complete!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

setupPaymentTable()