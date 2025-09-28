const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  console.log('URL:', supabaseUrl ? 'Present' : 'Missing');
  console.log('Key:', supabaseKey ? 'Present' : 'Missing');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('🔗 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Supabase client created successfully');

async function testConnection() {
  try {
    console.log('📊 Testing database connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('business_settings')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Database query failed:', error.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('📄 Sample data:', data?.length ? `Found ${data.length} record(s)` : 'No records found');
    
    // Test storage bucket
    console.log('🗄️ Testing storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.log('❌ Storage bucket test failed:', bucketError.message);
      return;
    }
    
    const businessAssetsBucket = buckets?.find(bucket => bucket.name === 'business-assets');
    if (businessAssetsBucket) {
      console.log('✅ Business assets bucket exists');
    } else {
      console.log('⚠️ Business assets bucket not found');
    }
    
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }
}

testConnection();