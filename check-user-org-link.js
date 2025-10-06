const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const userId = '2be2c560-6ab0-4732-afd9-0bbdccfce561';
  
  console.log('🔍 Checking profiles table for user:', userId, '\n');
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Profile columns:');
    Object.keys(profile).forEach(key => {
      console.log(`   - ${key}: ${profile[key]}`);
    });
  }
  
  console.log('\n🔍 Checking organizations table...');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);
    
  if (orgError) {
    console.log('❌ Error:', orgError.message);
  } else if (orgs && orgs[0]) {
    console.log('✅ Organization columns:');
    Object.keys(orgs[0]).forEach(key => {
      console.log(`   - ${key}`);
    });
  }
  
  console.log('\n🔍 Checking organization_members table...');
  const { data: members, error: memError } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', userId);
    
  if (memError) {
    console.log('❌ Error:', memError.message);
  } else {
    console.log(`✅ Found ${members?.length || 0} membership records`);
    if (members && members.length > 0) {
      console.log('First record:', members[0]);
    }
  }
})();
