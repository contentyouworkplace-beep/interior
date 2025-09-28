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

async function createPaymentRecordsTable() {
  console.log('Creating payment_records table...')

  try {
    // Create payment_records table
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

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_payment_records_team_member_id ON payment_records(team_member_id);
        CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
        CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date);
        CREATE INDEX IF NOT EXISTS idx_payment_records_payment_type ON payment_records(payment_type);

        -- Enable RLS (Row Level Security)
        ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

        -- Create RLS policy for payment_records
        DROP POLICY IF EXISTS "Users can only see their own payment records" ON payment_records;
        CREATE POLICY "Users can only see their own payment records" ON payment_records
          FOR ALL USING (user_id = auth.uid());

        -- Add trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_payment_records_updated_at ON payment_records;
        CREATE TRIGGER update_payment_records_updated_at 
          BEFORE UPDATE ON payment_records 
          FOR EACH ROW 
          EXECUTE PROCEDURE update_updated_at_column();
      `
    })

    if (createError) {
      console.error('Error creating payment_records table:', createError)
      return
    }

    console.log('✅ payment_records table created successfully!')

    // Insert some sample payment records
    const { data: teamMembers, error: fetchError } = await supabase
      .from('team_members')
      .select('id, user_id, name')
      .limit(3)

    if (fetchError) {
      console.error('Error fetching team members:', fetchError)
      return
    }

    if (teamMembers && teamMembers.length > 0) {
      console.log('Adding sample payment records...')
      
      const samplePayments = teamMembers.flatMap(member => [
        {
          team_member_id: member.id,
          user_id: member.user_id,
          payment_type: 'monthly_salary',
          amount: 50000,
          description: 'September 2025 Salary',
          payment_date: '2025-09-15',
          notes: 'Regular monthly payment'
        },
        {
          team_member_id: member.id,
          user_id: member.user_id,
          payment_type: 'advance',
          amount: 15000,
          description: 'Festival Advance',
          payment_date: '2025-08-25',
          notes: 'Advance for festival expenses'
        }
      ])

      const { error: insertError } = await supabase
        .from('payment_records')
        .insert(samplePayments)

      if (insertError) {
        console.error('Error inserting sample payments:', insertError)
      } else {
        console.log('✅ Sample payment records added successfully!')
      }
    }

    console.log('\n🎉 Payment records table setup completed!')

  } catch (error) {
    console.error('Error in createPaymentRecordsTable:', error)
  }
}

createPaymentRecordsTable()