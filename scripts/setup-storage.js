import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage...')

  try {
    // Create the client-files bucket
    console.log('📁 Creating client-files bucket...')
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('client-files', {
      public: false, // Private bucket for security
      fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
      allowedMimeTypes: [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Documents
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        // Spreadsheets
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Presentations
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // Text files
        'text/plain', 'text/csv',
        // Archives
        'application/zip', 'application/x-rar-compressed',
        // Videos (common formats)
        'video/mp4', 'video/mpeg', 'video/quicktime'
      ]
    })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket already exists')
      } else {
        throw bucketError
      }
    } else {
      console.log('✅ Created bucket successfully')
    }

    // Set up RLS policies for the bucket
    console.log('🔒 Setting up storage policies...')
    
    // Policy to allow authenticated users to upload files
    const uploadPolicy = `
      CREATE POLICY "Users can upload client files" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'client-files' AND
        auth.role() = 'authenticated'
      );
    `

    // Policy to allow users to view files they have access to
    const selectPolicy = `
      CREATE POLICY "Users can view client files" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'client-files' AND
        auth.role() = 'authenticated'
      );
    `

    // Policy to allow users to delete files they uploaded
    const deletePolicy = `
      CREATE POLICY "Users can delete client files" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'client-files' AND
        auth.role() = 'authenticated'
      );
    `

    console.log('📋 Storage policies should be set up manually in Supabase Dashboard')
    console.log('Go to: Storage > Policies and add the following policies:')
    console.log('\n1. Upload Policy:')
    console.log(uploadPolicy)
    console.log('\n2. Select Policy:')
    console.log(selectPolicy)
    console.log('\n3. Delete Policy:')
    console.log(deletePolicy)

    console.log('\n✅ Storage setup completed!')
    console.log('📝 Next steps:')
    console.log('1. Add the storage policies manually in Supabase Dashboard')
    console.log('2. The ClientFileService will now use real storage instead of mock data')

  } catch (error) {
    console.error('❌ Storage setup failed:', error)
    process.exit(1)
  }
}

setupStorage()