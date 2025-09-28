/**
 * Test PDF Handling Functions
 * Run this script to test PDF operations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPDFOperations() {
  console.log('🧪 Testing PDF handling operations...');
  
  try {
    // Test 1: List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Test 2: Check if new bucket exists
    const newBucket = buckets.find(b => b.name === 'expense-documents-new');
    if (newBucket) {
      console.log('✅ New expense documents bucket found');
      
      // Test 3: List files in bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('expense-documents-new')
        .list('', { limit: 10 });
        
      if (filesError) {
        console.log('⚠️ Could not list files (may be empty):', filesError.message);
      } else {
        console.log(`✅ Found ${files.length} files in new bucket`);
      }
      
    } else {
      console.log('⚠️ New expense documents bucket not found');
    }
    
    console.log('✅ PDF handling test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPDFOperations();
