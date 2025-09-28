require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔧 Updating client-files bucket to allow all file types...');
  
  const { data, error } = await supabase.storage.updateBucket('client-files', { 
    public: false, // Keep it private
    allowedMimeTypes: null // Allow all MIME types
  });
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ client-files bucket updated successfully to allow all file types');
  }
})();