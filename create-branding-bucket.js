#!/usr/bin/env node

// Create the branding storage bucket if it doesn't exist
const { createClient } = require('@supabase/supabase-js')

async function createBrandingBucket() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables:')
    console.error('- NEXT_PUBLIC_SUPABASE_URL')
    console.error('- SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) throw listError

    const brandingBucket = buckets.find(bucket => bucket.name === 'branding')
    
    if (brandingBucket) {
      console.log('✅ Branding bucket already exists')
      return
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket('branding', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 52428800 // 50MB
    })

    if (error) throw error

    console.log('✅ Created branding bucket successfully')
    console.log('Bucket ID:', data?.name || 'branding')

  } catch (error) {
    console.error('❌ Error creating branding bucket:', error.message)
    process.exit(1)
  }
}

// Load environment variables from .env.local if in Node.js environment
if (typeof window === 'undefined') {
  require('dotenv').config({ path: '.env.local' })
}

createBrandingBucket()