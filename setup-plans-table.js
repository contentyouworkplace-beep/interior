const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function ensurePlansTable() {
  try {
    console.log('🔧 Ensuring plans table exists...\n');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to query the plans table
    const { data: testData, error: testError } = await supabase
      .from('plans')
      .select('id')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.log('❌ Plans table does not exist. Creating it now...\n');
      
      // Create the table using a direct SQL query
      const createTableSQL = `
        -- Create plans table
        CREATE TABLE IF NOT EXISTS plans (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NOT NULL DEFAULT '',
            price DECIMAL(10,2) DEFAULT 0,
            duration_days INTEGER DEFAULT 30,
            features JSONB DEFAULT '[]'::jsonb,
            max_projects INTEGER DEFAULT 10,
            max_users INTEGER DEFAULT 1,
            support_level VARCHAR(50) DEFAULT 'email',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
        
        -- Create policies (drop first to avoid conflicts)
        DROP POLICY IF EXISTS "Admins can manage plans" ON plans;
        CREATE POLICY "Admins can manage plans" ON plans FOR ALL USING (true);
        
        DROP POLICY IF EXISTS "Users can view active plans" ON plans;
        CREATE POLICY "Users can view active plans" ON plans FOR SELECT USING (is_active = true);
      `;
      
      // Execute SQL using the auth admin API workaround
      try {
        // Split the SQL into individual statements
        const statements = [
          `CREATE TABLE IF NOT EXISTS plans (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT NOT NULL DEFAULT '',
            price DECIMAL(10,2) DEFAULT 0,
            duration_days INTEGER DEFAULT 30,
            features JSONB DEFAULT '[]'::jsonb,
            max_projects INTEGER DEFAULT 10,
            max_users INTEGER DEFAULT 1,
            support_level VARCHAR(50) DEFAULT 'email',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )`,
          `ALTER TABLE plans ENABLE ROW LEVEL SECURITY`,
          `DROP POLICY IF EXISTS "Admins can manage plans" ON plans`,
          `CREATE POLICY "Admins can manage plans" ON plans FOR ALL USING (true)`,
          `DROP POLICY IF EXISTS "Users can view active plans" ON plans`,
          `CREATE POLICY "Users can view active plans" ON plans FOR SELECT USING (is_active = true)`
        ];
        
        // Execute each statement
        for (const sql of statements) {
          try {
            await supabase.rpc('exec', { sql });
          } catch (rpcError) {
            console.log('Note: RPC method not available, using direct table creation...');
            break;
          }
        }
        
        console.log('✅ Plans table creation attempted');
        
        // Test the table again
        const { data: testData2, error: testError2 } = await supabase
          .from('plans')
          .select('id')
          .limit(1);
        
        if (testError2) {
          console.log('\n❌ Table still not accessible. Please create manually in Supabase dashboard:');
          console.log('\n📋 SQL to run in Supabase Dashboard → SQL Editor:');
          console.log(createTableSQL);
          return false;
        } else {
          console.log('✅ Plans table is now accessible!');
        }
        
      } catch (sqlError) {
        console.log('\n❌ Could not create table automatically.');
        console.log('\n📋 Please run this SQL manually in your Supabase Dashboard → SQL Editor:');
        console.log(createTableSQL);
        return false;
      }
      
    } else if (testError) {
      console.log('❌ Error accessing plans table:', testError);
      return false;
    } else {
      console.log('✅ Plans table exists and is accessible');
    }
    
    // Insert default plans if table is empty
    const { data: existingPlans, error: countError } = await supabase
      .from('plans')
      .select('id');
    
    if (!countError && existingPlans.length === 0) {
      console.log('\n📝 Adding default plans...');
      
      const defaultPlans = [
        {
          name: 'Basic Plan',
          description: 'Perfect for small interior design businesses',
          price: 999,
          duration_days: 30,
          features: ['Project Management', 'Client Portal', 'Basic Templates', 'Email Support'],
          max_projects: 10,
          max_users: 1,
          support_level: 'email',
          is_active: true
        },
        {
          name: 'Pro Plan',
          description: 'Ideal for growing design firms',
          price: 2499,
          duration_days: 30,
          features: ['Unlimited Projects', 'Team Collaboration', 'Advanced Templates', 'Priority Support', 'Custom Branding'],
          max_projects: -1,
          max_users: 5,
          support_level: 'priority',
          is_active: true
        },
        {
          name: 'Enterprise Plan',
          description: 'Complete solution for large design companies',
          price: 4999,
          duration_days: 30,
          features: ['Everything in Pro', 'Unlimited Users', 'API Access', 'Custom Integrations', 'Dedicated Support', 'White Label'],
          max_projects: -1,
          max_users: -1,
          support_level: 'dedicated',
          is_active: true
        }
      ];
      
      const { data, error } = await supabase
        .from('plans')
        .insert(defaultPlans);
      
      if (error) {
        console.log('❌ Error inserting default plans:', error);
      } else {
        console.log('✅ Default plans added successfully');
      }
    } else {
      console.log(`✅ Found ${existingPlans?.length || 0} existing plans`);
    }
    
    console.log('\n🎉 Database setup complete! You can now test plan creation.');
    return true;
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    return false;
  }
}

ensurePlansTable();