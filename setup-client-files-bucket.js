const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createBucketIfNeeded() {
  console.log('🪣 Checking and creating storage buckets...')
  
  try {
    // Check if client-files bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }
    
    console.log('📁 Existing buckets:', buckets.map(b => b.name))
    
    const clientFilesBucket = buckets.find(b => b.name === 'client-files')
    
    if (!clientFilesBucket) {
      console.log('📁 Creating client-files bucket...')
      const { data, error } = await supabase.storage.createBucket('client-files', {
        public: false,
        allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 50000000 // 50MB
      })
      
      if (error) {
        if (error.message.includes('already exists')) {
          console.log('✅ client-files bucket already exists')
        } else {
          console.error('❌ Error creating client-files bucket:', error)
        }
      } else {
        console.log('✅ Created client-files bucket successfully')
      }
    } else {
      console.log('✅ client-files bucket already exists')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createBucketIfNeeded()