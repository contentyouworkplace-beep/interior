// Alternative Fix: Use Service Key to Create Storage Policies
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

async function createStoragePoliciesViaAPI() {
  console.log('🔧 Creating storage policies via service key...')

  try {
    // Method 1: Try to create policies using SQL via RPC
    console.log('📝 Attempting to create policies via RPC...')
    
    const policies = [
      {
        name: 'qr_code_upload_policy',
        sql: `
          CREATE POLICY "Allow authenticated QR code uploads"
          ON storage.objects FOR INSERT
          TO authenticated
          WITH CHECK (bucket_id = 'qr-codes');
        `
      },
      {
        name: 'qr_code_read_policy', 
        sql: `
          CREATE POLICY "Allow public QR code access"
          ON storage.objects FOR SELECT
          TO public
          USING (bucket_id = 'qr-codes');
        `
      },
      {
        name: 'qr_code_update_policy',
        sql: `
          CREATE POLICY "Allow authenticated QR code updates"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING (bucket_id = 'qr-codes')
          WITH CHECK (bucket_id = 'qr-codes');
        `
      },
      {
        name: 'qr_code_delete_policy',
        sql: `
          CREATE POLICY "Allow authenticated QR code deletions"
          ON storage.objects FOR DELETE
          TO authenticated
          USING (bucket_id = 'qr-codes');
        `
      }
    ]

    for (const policy of policies) {
      try {
        console.log(`Creating ${policy.name}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: policy.sql })
        if (error) {
          console.log(`⚠️ Could not create ${policy.name}:`, error.message)
        } else {
          console.log(`✅ Created ${policy.name}`)
        }
      } catch (err) {
        console.log(`⚠️ Error with ${policy.name}:`, err.message)
      }
    }

    // Method 2: Test if we can upload directly with service key
    console.log('🧪 Testing direct upload with service key...')
    
    const testContent = 'test-qr-code-upload'
    const testFile = new Blob([testContent], { type: 'image/png' })
    const testPath = `test/service-key-test-${Date.now()}.png`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(testPath, testFile)

    if (uploadError) {
      console.log('❌ Service key upload failed:', uploadError.message)
    } else {
      console.log('✅ Service key upload successful:', uploadData)
      
      // Clean up test file
      await supabase.storage.from('qr-codes').remove([testPath])
      console.log('🧹 Test file cleaned up')
    }

    // Method 3: Check what permissions we actually have
    console.log('🔍 Checking current permissions...')
    
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    if (bucketError) {
      console.log('❌ Cannot list buckets:', bucketError.message)
    } else {
      console.log('📊 Available buckets:', buckets.map(b => ({ name: b.name, public: b.public })))
    }

    console.log('')
    console.log('🎯 RECOMMENDED SOLUTIONS:')
    console.log('1. Use Supabase Dashboard → Storage → Policies to create policies manually')
    console.log('2. Contact your Supabase project admin to create the storage policies')
    console.log('3. Use the workaround below to bypass RLS temporarily')

  } catch (error) {
    console.error('❌ Error in policy creation:', error)
  }
}

// Execute the fix attempt
createStoragePoliciesViaAPI()