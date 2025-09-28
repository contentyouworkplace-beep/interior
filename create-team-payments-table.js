require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

async function createTeamPaymentsTable() {
  try {
    console.log('Creating team_payments table...')
    
    // First, let's try to create the table using direct SQL execution
    // Since exec_sql doesn't work, we'll use a different approach
    
    // Check if team_members table exists first
    const { data: teamMembersTest, error: teamMembersError } = await supabase
      .from('team_members')
      .select('id')
      .limit(1)

    if (teamMembersError) {
      console.log('❌ team_members table not accessible:', teamMembersError.message)
      return
    }

    console.log('✅ team_members table exists')

    // Try creating a minimal structure first using Supabase's schema reflection
    // We'll create it with just the basic structure and let Supabase handle it

    // First test: try to query team_payments to see if it exists
    const { data: existing, error: existingError } = await supabase
      .from('team_payments')
      .select('count')
      .limit(1)

    if (!existingError) {
      console.log('✅ team_payments table already exists!')
      return
    }

    console.log('team_payments table does not exist, need to create it manually in Supabase dashboard')
    console.log('Use this SQL in the Supabase SQL Editor:')
    console.log(`
-- Create team_payments table for team member salary and payment tracking
CREATE TABLE IF NOT EXISTS team_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('monthly_salary', 'freelance_payment', 'advance', 'bonus')),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_payments_team_member_id ON team_payments(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_payments_user_id ON team_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_team_payments_payment_date ON team_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_team_payments_payment_type ON team_payments(payment_type);

-- Enable RLS (Row Level Security)
ALTER TABLE team_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for team_payments
CREATE POLICY "Users can manage their own team payments" ON team_payments
  FOR ALL USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_team_payments_updated_at 
  BEFORE UPDATE ON team_payments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
`)

    console.log('\nAfter running the SQL, test the table:')
    console.log('Run: node test-team-payments-table.js')

  } catch (error) {
    console.error('Error:', error)
  }
}

createTeamPaymentsTable()