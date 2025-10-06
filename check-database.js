const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkDatabase() {
  try {
    console.log('🔍 Checking database schema...\n');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to access different tables to see what exists
    const tables = ['plans', 'subscriptions', 'organizations', 'profiles'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' not found:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists (${data?.length || 0} records)`);
        }
      } catch (e) {
        console.log(`❌ Error checking table '${table}':`, e.message);
      }
    }
    
    console.log('\n📋 Please create the plans table manually in Supabase:');
    console.log(`
Go to your Supabase dashboard → SQL Editor → Run this query:

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

-- Create policies
CREATE POLICY "Admins can manage plans" ON plans FOR ALL USING (true);
CREATE POLICY "Users can view active plans" ON plans FOR SELECT USING (is_active = true);

-- Insert default plans
INSERT INTO plans (name, description, price, duration_days, features, max_projects, max_users, support_level, is_active) VALUES
('Basic Plan', 'Perfect for small interior design businesses', 999, 30, '["Project Management", "Client Portal", "Basic Templates", "Email Support"]', 10, 1, 'email', true),
('Pro Plan', 'Ideal for growing design firms', 2499, 30, '["Unlimited Projects", "Team Collaboration", "Advanced Templates", "Priority Support", "Custom Branding"]', -1, 5, 'priority', true),
('Enterprise Plan', 'Complete solution for large design companies', 4999, 30, '["Everything in Pro", "Unlimited Users", "API Access", "Custom Integrations", "Dedicated Support", "White Label"]', -1, -1, 'dedicated', true);
    `);
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabase();