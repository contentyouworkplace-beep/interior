// Fix QR Code Storage Policies
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixQRCodeStoragePolicies() {
  console.log('🔧 Fixing QR Code storage policies...')

  try {
    // 1. First, ensure the bucket exists and is public
    console.log('📁 Ensuring qr-codes bucket is properly configured...')
    
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return
    }

    const qrBucket = buckets.find(b => b.name === 'qr-codes')
    if (!qrBucket) {
      console.log('Creating qr-codes bucket...')
      const { error: createError } = await supabase.storage.createBucket('qr-codes', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
        fileSizeLimit: 1024 * 1024 // 1MB
      })
      if (createError) {
        console.error('❌ Error creating bucket:', createError)
        return
      }
    } else {
      console.log('✅ QR codes bucket exists')
    }

    // 2. Test upload with current user context
    console.log('🧪 Testing upload capability...')
    
    // Create a simple test file
    const testFile = new Blob(['test'], { type: 'text/plain' })
    const testFileName = `test-${Date.now()}.txt`
    
    const { error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(`test/${testFileName}`, testFile)

    if (uploadError) {
      console.error('❌ Upload test failed:', uploadError)
      console.log('📋 This confirms the RLS policy issue')
    } else {
      console.log('✅ Upload test successful')
      // Clean up test file
      await supabase.storage.from('qr-codes').remove([`test/${testFileName}`])
    }

    // 3. Check existing policies via direct query
    console.log('🔍 Checking current storage policies...')
    
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage')
      .like('qual', '%qr-codes%')

    if (policiesError) {
      console.log('⚠️ Could not query policies directly:', policiesError.message)
    } else {
      console.log('📊 Found policies:', policies?.length || 0)
    }

    console.log('')
    console.log('🎯 SOLUTION: Run the following SQL in Supabase SQL Editor:')
    console.log('')
    console.log('-- Enable RLS on storage.objects if not already enabled')
    console.log('ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;')
    console.log('')
    console.log('-- Create policy for QR code uploads')
    console.log('CREATE POLICY "Allow authenticated QR code uploads"')
    console.log('ON storage.objects FOR INSERT')
    console.log('TO authenticated')
    console.log('WITH CHECK (bucket_id = \'qr-codes\');')
    console.log('')
    console.log('-- Create policy for QR code public access')
    console.log('CREATE POLICY "Allow public QR code access"')
    console.log('ON storage.objects FOR SELECT')
    console.log('TO public')
    console.log('USING (bucket_id = \'qr-codes\');')
    console.log('')
    console.log('-- Create policy for QR code updates')
    console.log('CREATE POLICY "Allow authenticated QR code updates"')
    console.log('ON storage.objects FOR UPDATE')
    console.log('TO authenticated')
    console.log('USING (bucket_id = \'qr-codes\');')
    console.log('')
    console.log('-- Create policy for QR code deletions')
    console.log('CREATE POLICY "Allow authenticated QR code deletions"')
    console.log('ON storage.objects FOR DELETE')
    console.log('TO authenticated')
    console.log('USING (bucket_id = \'qr-codes\');')

  } catch (error) {
    console.error('❌ Error fixing storage policies:', error)
  }
}

// Execute the fix
fixQRCodeStoragePolicies()