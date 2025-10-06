#!/usr/bin/env node

/**
 * Apply RLS SELECT policies for quotations and quotation_items tables
 * This script uses Supabase REST API to execute SQL statements
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const policies = [
  {
    name: 'Drop existing permissive policies',
    sql: `DROP POLICY IF EXISTS "Allow all operations on quotations" ON quotations;`
  },
  {
    name: 'Drop quotations_user_isolation policy',
    sql: `DROP POLICY IF EXISTS "quotations_user_isolation" ON quotations;`
  },
  {
    name: 'Drop Users can manage own quotations policy',
    sql: `DROP POLICY IF EXISTS "Users can manage own quotations" ON quotations;`
  },
  {
    name: 'Drop existing SELECT policy',
    sql: `DROP POLICY IF EXISTS "Users can view own quotations" ON quotations;`
  },
  {
    name: 'Drop existing INSERT policy',
    sql: `DROP POLICY IF EXISTS "Users can insert own quotations" ON quotations;`
  },
  {
    name: 'Drop existing UPDATE policy',
    sql: `DROP POLICY IF EXISTS "Users can update own quotations" ON quotations;`
  },
  {
    name: 'Drop existing DELETE policy',
    sql: `DROP POLICY IF EXISTS "Users can delete own quotations" ON quotations;`
  },
  {
    name: 'Create SELECT policy for quotations',
    sql: `CREATE POLICY "Users can view own quotations" ON quotations FOR SELECT USING (auth.uid() = user_id);`
  },
  {
    name: 'Create INSERT policy for quotations',
    sql: `CREATE POLICY "Users can insert own quotations" ON quotations FOR INSERT WITH CHECK (auth.uid() = user_id);`
  },
  {
    name: 'Create UPDATE policy for quotations',
    sql: `CREATE POLICY "Users can update own quotations" ON quotations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`
  },
  {
    name: 'Create DELETE policy for quotations',
    sql: `CREATE POLICY "Users can delete own quotations" ON quotations FOR DELETE USING (auth.uid() = user_id);`
  }
];

async function applyPolicies() {
  console.log('🔧 Applying RLS policies for quotations table...\n');

  for (const policy of policies) {
    console.log(`📝 ${policy.name}`);
    
    try {
      // Use fetch API to execute raw SQL via PostgREST
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ sql: policy.sql })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Failed: ${errorText}\n`);
      } else {
        console.log(`   ✅ Success\n`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('\n🔍 Verifying quotations table access...');
  
  // Test if SELECT policy works
  const { data, error, count } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: false });

  if (error) {
    console.log(`❌ SELECT test failed: ${error.message}`);
  } else {
    console.log(`✅ SELECT test passed: ${count} quotations found`);
    if (data && data.length > 0) {
      console.log(`   Sample: ${data[0].quotation_number} - ${data[0].title}`);
    }
  }
}

applyPolicies().catch(console.error);
