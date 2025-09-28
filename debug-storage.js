import { createClient } from '@supabase/supabase-js'

// Use the same env variables as the app
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkStorage() {
  console.log('🔍 Checking Supabase storage setup...')
  
  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError)
      return
    }
    
    console.log('📁 Available buckets:')
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (public: ${bucket.public})`)
    })
    
    // Check if client-files bucket exists
    const clientFilesBucket = buckets.find(b => b.name === 'client-files')
    if (clientFilesBucket) {
      console.log('✅ client-files bucket exists')
      
      // Try to list files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('client-files')
        .list()
      
      if (filesError) {
        console.error('❌ Error accessing client-files bucket:', filesError)
      } else {
        console.log(`📄 Files in client-files bucket: ${files.length}`)
      }
    } else {
      console.log('❌ client-files bucket does not exist')
    }
    
  } catch (error) {
    console.error('❌ Error checking storage:', error)
  }
}

checkStorage()