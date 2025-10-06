#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPolicies() {
  console.log('=== Checking RLS policies on quotations table ===\n');
  
  // Try to query pg_policies directly
  const { data: policies, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'quotations');
  
  if (error) {
    console.log('⚠️  Cannot query pg_policies directly:', error.message);
    console.log('\nTrying alternative method...\n');
    
    // Alternative: Check if we can see the policies via a custom query
    // We need to use the SQL editor for this
    console.log('❌ Unable to check policies programmatically.');
    console.log('\n📋 You need to check manually in Supabase Dashboard:');
    console.log('   1. Go to SQL Editor');
    console.log('   2. Run this query:');
    console.log('');
    console.log('   SELECT schemaname, tablename, policyname, cmd');
    console.log('   FROM pg_policies');
    console.log('   WHERE tablename = \'quotations\'');
    console.log('   ORDER BY cmd;');
    console.log('');
    console.log('Expected to see:');
    console.log('  - Users can view own quotations (SELECT)');
    console.log('  - Users can insert own quotations (INSERT)');
    console.log('  - Users can update own quotations (UPDATE)');
    console.log('  - Users can delete own quotations (DELETE)');
    
  } else if (policies && policies.length > 0) {
    console.log(`✅ Found ${policies.length} policies:\n`);
    policies.forEach(p => {
      console.log(`  - ${p.cmd.padEnd(8)} | ${p.policyname}`);
    });
  } else {
    console.log('⚠️  No policies found on quotations table!');
    console.log('\nThis means the SQL script was NOT applied.');
  }
  
  console.log('\n=== Testing quotations access ===\n');
  
  // Test with service role (should work)
  console.log('1. Service role query (bypasses RLS):');
  const { data: serviceData, count: serviceCount } = await supabase
    .from('quotations')
    .select('*', { count: 'exact' })
    .eq('user_id', '2be2c560-6ab0-4732-afd9-0bbdccfce561');
  
  console.log(`   ✅ Found ${serviceCount} quotations\n`);
  
  // Test with anon key (will respect RLS)
  console.log('2. Anonymous/user query (respects RLS):');
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data: anonData, count: anonCount, error: anonError } = await anonSupabase
    .from('quotations')
    .select('*', { count: 'exact' })
    .eq('user_id', '2be2c560-6ab0-4732-afd9-0bbdccfce561');
  
  if (anonError) {
    console.log('   ❌ Error:', anonError.message);
  } else {
    console.log(`   Found ${anonCount} quotations (should be 0 without auth)`);
  }
  
  console.log('\n=== Diagnosis ===\n');
  
  if (serviceCount > 0 && (anonCount === 0 || anonCount === null)) {
    console.log('✅ RLS is working correctly!');
    console.log('   - Service role can see quotations (bypasses RLS)');
    console.log('   - Anonymous users cannot see quotations (RLS blocks)');
    console.log('');
    console.log('💡 The problem is likely:');
    console.log('   1. SELECT policy was NOT created (SQL script not run)');
    console.log('   2. OR the policy exists but user is not authenticated in browser');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Make sure you ran the SQL script in Supabase Dashboard');
    console.log('   2. Check browser console for auth errors');
    console.log('   3. Try logging out and back in as demo@admin.com');
  }
}

checkPolicies().catch(console.error);
