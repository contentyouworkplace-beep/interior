require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixVendorsTable() {
  try {
    console.log('Creating vendors table and policies...');
    
    // Create vendors table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS vendors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users NOT NULL,
        name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        address TEXT,
        category TEXT NOT NULL,
        gstin TEXT,
        rating DECIMAL(2,1) DEFAULT 5.0,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
      );
    `;
    
    // Enable RLS
    const enableRLSSQL = `
      ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
    `;
    
    // Create policies
    const policiesSQL = `
      DROP POLICY IF EXISTS "Users can manage own vendors" ON vendors;
      CREATE POLICY "Users can manage own vendors" ON vendors FOR ALL USING (auth.uid() = user_id);
    `;
    
    // Execute SQL commands
    const { error: tableError } = await supabase.rpc('query', { 
      query: createTableSQL 
    });
    
    if (tableError && !tableError.message.includes('already exists')) {
      console.error('Error creating table:', tableError);
      return;
    }
    
    const { error: rlsError } = await supabase.rpc('query', { 
      query: enableRLSSQL 
    });
    
    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    }
    
    const { error: policyError } = await supabase.rpc('query', { 
      query: policiesSQL 
    });
    
    if (policyError) {
      console.error('Error creating policies:', policyError);
    }
    
    console.log('Vendors table setup completed!');
    
    // Test access
    const { data: testData, error: testError } = await supabase
      .from('vendors')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('Test access failed:', testError);
    } else {
      console.log('✅ Vendors table is accessible!');
    }
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

fixVendorsTable();