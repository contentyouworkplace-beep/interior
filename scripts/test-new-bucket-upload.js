// Script to create a test file in the new storage bucket and verify it works
// This bypasses the corrupted expense-service.ts file

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Constants
const NEW_BUCKET_NAME = 'expense-documents-new';
const TEST_FILE_PATH = path.resolve(process.cwd(), 'test-upload.txt');
const USER_ID = '00000000-0000-0000-0000-000000000000'; // Replace with a real user ID if testing with specific user
const EXPENSE_ID = 'test-expense-123';

// Create a test file to upload
async function createTestFile() {
  const content = `This is a test file created at ${new Date().toISOString()}\n`;
  fs.writeFileSync(TEST_FILE_PATH, content);
  console.log(`✅ Created test file at: ${TEST_FILE_PATH}`);
}

// Upload to new bucket
async function testUploadToNewBucket() {
  console.log(`🚀 Testing upload to new bucket: ${NEW_BUCKET_NAME}`);
  
  try {
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated:', authError || 'No user found');
      console.log('⚠️ Attempting to continue without authentication...');
    } else {
      console.log('✅ Authenticated as:', user.email);
    }
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    const existingBucket = buckets.find(bucket => bucket.name === NEW_BUCKET_NAME);
    
    if (!existingBucket) {
      console.error(`❌ Bucket "${NEW_BUCKET_NAME}" does not exist. Please create it first.`);
      return;
    }
    
    console.log(`✅ Bucket "${NEW_BUCKET_NAME}" exists.`);
    
    // Create a file path
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filePath = `${USER_ID}/${EXPENSE_ID}/${timestamp}-${randomId}-test-file.txt`;
    
    console.log(`📂 Uploading to path: ${filePath}`);
    
    // Upload the file
    const fileContent = fs.readFileSync(TEST_FILE_PATH);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(NEW_BUCKET_NAME)
      .upload(filePath, fileContent, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'text/plain',
      });
      
    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      
      if (uploadError.statusCode === 403) {
        console.error('⚠️ This is likely a permissions issue. Make sure storage policies are properly set up.');
      }
      
      return;
    }
    
    console.log('✅ Upload successful!');
    console.log('📄 File data:', uploadData);
    
    // Generate public URL
    const { data: { publicUrl } } = supabase.storage
      .from(NEW_BUCKET_NAME)
      .getPublicUrl(filePath);
      
    console.log('🔗 Public URL:', publicUrl);
    
    // Try to download the file to verify it's accessible
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(NEW_BUCKET_NAME)
      .download(filePath);
      
    if (downloadError) {
      console.error('❌ Download error:', downloadError);
      return;
    }
    
    const content = await downloadData.text();
    console.log('✅ Downloaded file content:', content);
    
    // Verify the same file is listed in the bucket
    const { data: listData, error: listFilesError } = await supabase.storage
      .from(NEW_BUCKET_NAME)
      .list(`${USER_ID}/${EXPENSE_ID}`);
      
    if (listFilesError) {
      console.error('❌ Error listing files:', listFilesError);
      return;
    }
    
    console.log('📂 Files in folder:', listData);
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  } finally {
    // Clean up
    try {
      fs.unlinkSync(TEST_FILE_PATH);
      console.log('🧹 Cleaned up local test file');
    } catch (e) {
      console.error('❌ Error deleting test file:', e);
    }
  }
}

// Main execution
createTestFile()
  .then(() => testUploadToNewBucket())
  .then(() => console.log('✨ Test completed'))
  .catch(err => console.error('❌ Test failed:', err));