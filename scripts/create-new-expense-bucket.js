// Script to create a new storage bucket for expense documents
// Run this script with Node.js: node create-new-expense-bucket.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Supabase client with service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const NEW_BUCKET_NAME = 'expense-documents-new';

async function createNewStorageBucket() {
  console.log(`Attempting to create new storage bucket: ${NEW_BUCKET_NAME}`);
  
  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const existingBucket = buckets.find(bucket => bucket.name === NEW_BUCKET_NAME);
    
    if (existingBucket) {
      console.log(`Bucket "${NEW_BUCKET_NAME}" already exists.`);
    } else {
      // Create the bucket
      const { data, error } = await supabaseAdmin.storage.createBucket(NEW_BUCKET_NAME, {
        public: false,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB in bytes
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }
      
      console.log(`Successfully created bucket: ${NEW_BUCKET_NAME}`);
    }
    
    // List all buckets to verify
    const { data: updatedBuckets, error: updateListError } = await supabaseAdmin.storage.listBuckets();
    
    if (updateListError) {
      console.error('Error listing buckets after creation:', updateListError);
      return;
    }
    
    console.log('All available buckets:');
    updatedBuckets.forEach(bucket => {
      console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createNewStorageBucket()
  .then(() => console.log('Script completed'))
  .catch(err => console.error('Script failed:', err));