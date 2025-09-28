const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createBusinessAssetsBucket() {
  try {
    console.log('🚀 Creating business-assets storage bucket...')

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('business-assets', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      fileSizeLimit: 2097152 // 2MB
    })

    if (error && error.message.includes('already exists')) {
      console.log('✅ business-assets bucket already exists')
    } else if (error) {
      console.error('❌ Error creating business-assets bucket:', error.message)
      console.log('\n🛠️  MANUAL BUCKET CREATION REQUIRED:')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to Storage')
      console.log('3. Click "Create bucket"')
      console.log('4. Name: business-assets')
      console.log('5. Make it public: Yes')
      console.log('6. File size limit: 2MB')
      console.log('7. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp')
    } else {
      console.log('✅ business-assets bucket created successfully')
    }

    // Test bucket access
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
    } else {
      const businessBucket = buckets.find(b => b.name === 'business-assets')
      if (businessBucket) {
        console.log('✅ business-assets bucket verified:', businessBucket.name)
        console.log('📊 Bucket details:', {
          public: businessBucket.public,
          file_size_limit: businessBucket.file_size_limit,
          allowed_mime_types: businessBucket.allowed_mime_types
        })
      } else {
        console.log('❌ business-assets bucket not found after creation')
      }
    }

    console.log('\n📝 STORAGE POLICIES NEEDED:')
    console.log('Go to Supabase Dashboard > Storage > Policies and add these:')
    console.log('\n1. INSERT Policy:')
    console.log(`CREATE POLICY "Users can upload business assets" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'business-assets' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);`)

    console.log('\n2. SELECT Policy:')
    console.log(`CREATE POLICY "Public read access for business assets" ON storage.objects 
FOR SELECT USING (bucket_id = 'business-assets');`)

    console.log('\n3. UPDATE Policy:')
    console.log(`CREATE POLICY "Users can update their business assets" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'business-assets' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);`)

    console.log('\n4. DELETE Policy:')
    console.log(`CREATE POLICY "Users can delete their business assets" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'business-assets' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);`)

  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
  }
}

createBusinessAssetsBucket()