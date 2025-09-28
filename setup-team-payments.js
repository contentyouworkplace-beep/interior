require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function setupTeamPaymentsTable() {
  const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function createTeamPaymentsTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-team-payments-table.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('Creating team_payments table...')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('Error creating team_payments table:', error)
      
      // Try alternative approach - execute SQL directly via connection
      console.log('Trying alternative approach...')
      const { error: directError } = await supabase
        .from('team_payments')
        .select('count')
        .limit(1)

      if (directError && directError.message.includes('does not exist')) {
        console.log('Table does not exist, creating manually...')
        
        // Split SQL into individual statements and execute
        const statements = sql.split(';').filter(stmt => stmt.trim())
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              const { error: stmtError } = await supabase.rpc('exec_sql', { 
                sql_query: statement.trim() + ';' 
              })
              if (stmtError) {
                console.log('Statement error (may be expected):', stmtError.message)
              }
            } catch (e) {
              console.log('Statement execution error (may be expected):', e.message)
            }
          }
        }
      }
    } else {
      console.log('Team payments table created successfully!')
      console.log('Result:', data)
    }

    // Test the table by checking if it exists
    console.log('Testing table existence...')
    const { data: testData, error: testError } = await supabase
      .from('team_payments')
      .select('count')
      .limit(1)

    if (!testError) {
      console.log('✅ Team payments table is working!')
    } else {
      console.log('❌ Table test failed:', testError.message)
    }

  } catch (error) {
    console.error('Script error:', error)
  }
}

createTeamPaymentsTable()

  try {
    console.log('Creating team_payments table directly...')
    
    // Try to create the table by inserting and letting it fail, then extracting the schema
    // First, check if team_payments exists
    const { data, error } = await supabase
      .from('team_payments')
      .select('id')
      .limit(1)

    if (!error) {
      console.log('✅ team_payments table already exists!')
      
      // Test inserting a record
      const { data: insertTest, error: insertError } = await supabase
        .from('team_payments')
        .insert({
          team_member_id: '00000000-0000-0000-0000-000000000000', // dummy
          user_id: '00000000-0000-0000-0000-000000000000', // dummy
          payment_type: 'monthly_salary',
          amount: 1000,
          description: 'Test payment'
        })
        .select()
      
      if (insertError) {
        console.log('Insert test error:', insertError)
      } else {
        console.log('✅ Table is working! Cleaning up test record...')
        if (insertTest && insertTest[0]) {
          await supabase.from('team_payments').delete().eq('id', insertTest[0].id)
        }
      }
      return
    }

    if (error && error.code === 'PGRST205') {
      console.log('❌ team_payments table does not exist')
      console.log('Please create it manually in Supabase SQL Editor with this SQL:')
      console.log('\n' + '='.repeat(80))
      console.log(`
-- Create team_payments table for team member salary and payment tracking
CREATE TABLE team_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL,
  user_id UUID NOT NULL,
  payment_type VARCHAR(50) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints
ALTER TABLE team_payments 
  ADD CONSTRAINT fk_team_payments_team_member 
  FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE;

ALTER TABLE team_payments 
  ADD CONSTRAINT fk_team_payments_user 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE team_payments 
  ADD CONSTRAINT check_payment_type 
  CHECK (payment_type IN ('monthly_salary', 'freelance_payment', 'advance', 'bonus'));

ALTER TABLE team_payments 
  ADD CONSTRAINT check_amount_positive 
  CHECK (amount > 0);

-- Create indexes
CREATE INDEX idx_team_payments_team_member_id ON team_payments(team_member_id);
CREATE INDEX idx_team_payments_user_id ON team_payments(user_id);
CREATE INDEX idx_team_payments_payment_date ON team_payments(payment_date);

-- Enable RLS
ALTER TABLE team_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage their own team payments" ON team_payments
  FOR ALL USING (user_id = auth.uid());

-- Add updated_at trigger
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
      console.log('='.repeat(80))
      console.log('\nAfter running this SQL, payments will work correctly!')
    } else {
      console.log('Unexpected error:', error)
    }

  } catch (err) {
    console.error('Error:', err)
  }
}

setupTeamPaymentsTable()