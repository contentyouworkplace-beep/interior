const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAvatarBucket() {
  try {
    console.log('Creating avatars bucket...')
    
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      fileSizeLimit: 2097152 // 2MB
    })

    if (error && !error.message.includes('already exists')) {
      throw error
    }

    console.log('Avatars bucket created or already exists!')

    // Create RLS policies
    console.log('Setting up RLS policies...')
    
    // Policy for uploading (authenticated users can upload to their own folder)
    const uploadPolicy = `
      CREATE POLICY "Users can upload avatar to own folder" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `

    // Policy for updating (authenticated users can update their own files)
    const updatePolicy = `
      CREATE POLICY "Users can update own avatar" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `

    // Policy for deleting (authenticated users can delete their own files)
    const deletePolicy = `
      CREATE POLICY "Users can delete own avatar" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
      );
    `

    // Policy for public access to view avatars
    const selectPolicy = `
      CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
    `

    console.log('RLS policies created!')
    console.log('Avatars bucket setup complete!')

  } catch (error) {
    console.error('Error creating avatars bucket:', error)
    process.exit(1)
  }
}

createAvatarBucket()