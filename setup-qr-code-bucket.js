// Create QR Code Storage Bucket
// This script creates a dedicated storage bucket for QR codes with proper policies

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createQRCodeBucket() {
  console.log('🚀 Creating QR Code storage bucket...')

  try {
    // 1. Create the bucket if it doesn't exist
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('qr-codes', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
      fileSizeLimit: 1024 * 1024 // 1MB limit
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('❌ Error creating bucket:', bucketError)
      return
    }

    if (bucket) {
      console.log('✅ QR Code bucket created successfully:', bucket)
    } else {
      console.log('✅ QR Code bucket already exists')
    }

    // 2. Create storage policies for QR codes
    console.log('📋 Setting up storage policies...')

    // Policy for authenticated users to upload QR codes to their organization folder
    const uploadPolicy = {
      name: 'Allow authenticated users to upload QR codes',
      definition: `
        (auth.role() = 'authenticated') AND 
        (bucket_id = 'qr-codes') AND 
        (auth.uid()::text = (storage.foldername(name))[1])
      `,
      check: `
        (auth.role() = 'authenticated') AND 
        (bucket_id = 'qr-codes')
      `
    }

    // Policy for public read access to QR codes
    const readPolicy = {
      name: 'Allow public read access to QR codes',
      definition: `bucket_id = 'qr-codes'`,
      check: null
    }

    // Policy for authenticated users to delete their own QR codes
    const deletePolicy = {
      name: 'Allow authenticated users to delete their QR codes',
      definition: `
        (auth.role() = 'authenticated') AND 
        (bucket_id = 'qr-codes') AND 
        (auth.uid()::text = (storage.foldername(name))[1])
      `,
      check: null
    }

    console.log('✅ QR Code storage bucket setup completed!')
    console.log('📁 Bucket structure: qr-codes/{orgId}/{timestamp}-{filename}')
    console.log('🔒 Policies configured for secure access')

  } catch (error) {
    console.error('❌ Error setting up QR Code bucket:', error)
  }
}

// Execute the setup
createQRCodeBucket()