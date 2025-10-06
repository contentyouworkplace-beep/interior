const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Checking company_profiles table structure...\n');
  
  // Get a sample row to see the columns
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .limit(1)
    .single();
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Available columns in company_profiles:');
    Object.keys(data).forEach(key => {
      console.log(`   - ${key}: ${data[key]}`);
    });
  }
  
  console.log('\n🔍 Looking for organization_id for our user...');
  const { data: profiles, error: err2 } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('organization_id', '422fe3dc-2470-40e7-944a-6e46a48ebd30');
    
  console.log('Found', profiles?.length || 0, 'records');
  if (profiles && profiles.length > 0) {
    console.log('First record:', profiles[0]);
  }
})();
