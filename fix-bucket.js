// Fix storage bucket to be public
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeBucketPublic() {
  try {
    console.log('=== MAKING EXPENSE-DOCUMENTS BUCKET PUBLIC ===');
    
    const { data, error } = await supabase
      .storage
      .updateBucket('expense-documents', { public: true });
    
    if (error) {
      console.error('Error updating bucket:', error);
    } else {
      console.log('✅ Successfully made bucket public:', data);
    }
    
    // Test again
    const { data: buckets } = await supabase.storage.listBuckets();
    const expenseBucket = buckets?.find(b => b.name === 'expense-documents');
    console.log('Updated bucket config:', expenseBucket);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

makeBucketPublic();