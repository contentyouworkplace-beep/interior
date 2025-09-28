const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ywcqtmzqsvcobtetunuf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NzM4NCwiZXhwIjoyMDczMzUzMzg0fQ.fUj0lqp_NApqfrpN38ydEqE08Hh2WwL-BoVPqdjp3ac'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createPaymentTable() {
  console.log('🔧 Creating payment_records table...')

  try {
    // First, check if table exists
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'payment_records')
      .eq('table_schema', 'public')

    if (checkError) {
      console.log('❌ Error checking table existence:', checkError.message)
    } else if (tables && tables.length > 0) {
      console.log('✅ payment_records table already exists!')
      
      // Test if we can query it
      const { data: testData, error: testError } = await supabase
        .from('payment_records')
        .select('count(*)')
        .limit(1)
        
      if (testError) {
        console.log('❌ Table exists but can\'t be queried:', testError.message)
      } else {
        console.log('✅ Table is working properly!')
        return
      }
    } else {
      console.log('⚠️ payment_records table does not exist. Manual creation needed.')
    }

    // Try to create the table using raw SQL (this may not work with RLS)
    console.log('📝 Attempting to create table using direct query...')
    
    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .limit(1)

    if (error && error.code === '42P01') {
      console.log('❌ Confirmed: payment_records table does not exist')
      console.log('🔨 You need to run the SQL manually in Supabase dashboard:')
      console.log(`
-- Copy and paste this SQL into your Supabase SQL editor:
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

CREATE INDEX IF NOT EXISTS idx_payment_records_team_member_id ON payment_records(team_member_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_type ON payment_records(payment_type);

ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only see their own payment records" ON payment_records;
CREATE POLICY "Users can only see their own payment records" ON payment_records
  FOR ALL USING (user_id = auth.uid());
      `)
    } else {
      console.log('✅ payment_records table exists and is accessible!')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createPaymentTable()