require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupPortfolioStorageBuckets() {
  console.log('📁 Setting up portfolio storage buckets...')
  
  try {
    // List existing buckets first
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.log('❌ Error listing buckets:', listError.message)
      return
    }
    
    console.log('🗂️ Existing buckets:', existingBuckets?.map(b => b.name) || 'None')
    
    const buckets = [
      {
        name: 'portfolio-files',
        options: {
          public: false,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/webp',
            'image/gif',
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'video/avi',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ]
        }
      },
      {
        name: 'portfolio-thumbnails',
        options: {
          public: true, // Thumbnails can be public for faster loading
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
          ]
        }
      }
    ]
    
    for (const bucket of buckets) {
      const bucketExists = existingBuckets?.some(b => b.name === bucket.name)
      
      if (bucketExists) {
        console.log(`✅ Bucket '${bucket.name}' already exists`)
        continue
      }
      
      console.log(`🔄 Creating bucket '${bucket.name}'...`)
      
      const { data, error } = await supabase.storage.createBucket(bucket.name, bucket.options)
      
      if (error) {
        console.log(`❌ Error creating bucket '${bucket.name}':`, error.message)
      } else {
        console.log(`✅ Successfully created bucket '${bucket.name}'`)
      }
    }
    
    // Verify buckets were created
    const { data: updatedBuckets, error: verifyError } = await supabase.storage.listBuckets()
    
    if (verifyError) {
      console.log('❌ Error verifying buckets:', verifyError.message)
    } else {
      const portfolioBuckets = updatedBuckets?.filter(b => b.name.startsWith('portfolio-')) || []
      console.log('📁 Portfolio buckets available:', portfolioBuckets.map(b => b.name))
    }
    
  } catch (error) {
    console.error('❌ Failed to setup portfolio storage buckets:', error.message)
  }
}

setupPortfolioStorageBuckets()