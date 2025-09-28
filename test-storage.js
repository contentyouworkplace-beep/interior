// Test storage bucket access
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorage() {
  try {
    console.log('=== TESTING STORAGE BUCKET ===');
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`- ${bucket.name} (public: ${bucket.public})`);
    });
    
    // Check expense-documents bucket specifically
    const expenseBucket = buckets.find(b => b.name === 'expense-documents');
    if (!expenseBucket) {
      console.error('❌ expense-documents bucket not found!');
      return;
    }
    
    console.log('\n✅ expense-documents bucket found');
    console.log('Bucket config:', expenseBucket);
    
    // Test file listing
    const { data: files, error: listError } = await supabase
      .storage
      .from('expense-documents')
      .list('', { limit: 10 });
    
    if (listError) {
      console.error('Error listing files:', listError);
    } else {
      console.log(`\nFiles in bucket: ${files.length}`);
      files.forEach(file => {
        console.log(`- ${file.name} (${file.metadata?.size || 'unknown size'})`);
      });
    }
    
    // Test creating a simple image file (PNG)
    console.log('\n=== TESTING FILE UPLOAD ===');
    
    // Create a simple 1x1 pixel PNG as Buffer
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const testFileName = `test-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('expense-documents')
      .upload(testFileName, pngBuffer, {
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError);
    } else {
      console.log('✅ Upload test succeeded:', uploadData);
      
      // Get public URL
      const { data: urlData } = supabase
        .storage
        .from('expense-documents')
        .getPublicUrl(uploadData.path);
      
      console.log('Public URL:', urlData.publicUrl);
      
      // Clean up test file
      const { error: deleteError } = await supabase
        .storage
        .from('expense-documents')
        .remove([uploadData.path]);
      
      if (deleteError) {
        console.warn('Failed to clean up test file:', deleteError);
      } else {
        console.log('✅ Test file cleaned up');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testStorage();