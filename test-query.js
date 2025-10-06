const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== Testing API Query ===\n');
  
  const demoUserId = '2be2c560-6ab0-4732-afd9-0bbdccfce561';
  
  const { data, error } = await supabase
    .from('quotations')
    .select(`
      *,
      client:clients!quotations_client_id_fkey (
        id,
        first_name,
        last_name,
        company,
        email
      )
    `)
    .eq('user_id', demoUserId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.log('❌ Error:', error.message);
    console.log('Details:', error);
  } else {
    console.log(`✅ Found ${data.length} quotations\n`);
    data.slice(0, 5).forEach((q, i) => {
      console.log(`${i + 1}. ${q.quotation_number} - ${q.title}`);
    });
  }
})();
