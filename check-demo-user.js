const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== Finding demo@admin.com user ===\n');
  
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  const demoUser = users.users.find(u => u.email === 'demo@admin.com');
  
  if (!demoUser) {
    console.log('❌ demo@admin.com not found\n');
    console.log('Available users:');
    users.users.slice(0, 5).forEach(u => {
      console.log('  -', u.email, '|', u.id);
    });
    return;
  }
  
  console.log('✅ Found demo@admin.com');
  console.log('User ID:', demoUser.id);
  
  console.log('\n=== Checking quotations ===\n');
  
  const { data: demoQuotes, count: demoCount } = await supabase
    .from('quotations')
    .select('*', { count: 'exact' })
    .eq('user_id', demoUser.id);
  
  console.log('Quotations for demo@admin.com:', demoCount);
  
  const { data: allQuotes, count: totalCount } = await supabase
    .from('quotations')
    .select('user_id', { count: 'exact' });
  
  console.log('Total quotations in DB:', totalCount);
  
  if (demoCount === 0 && totalCount > 0) {
    console.log('\n⚠️  All quotations belong to OTHER users!');
    console.log('\nShall I update existing quotations to demo@admin.com?');
  }
})();
