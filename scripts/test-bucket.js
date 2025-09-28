const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testBucket() {
  try {
    console.log('Testing avatars bucket...')
    
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) throw bucketsError
    
    console.log('Available buckets:', buckets.map(b => b.name))
    
    const avatarsBucket = buckets.find(b => b.name === 'avatars')
    if (avatarsBucket) {
      console.log('Avatars bucket found:', avatarsBucket)
      
      // List files in bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('avatars')
        .list()
      
      if (filesError) throw filesError
      console.log('Files in avatars bucket:', files)
    } else {
      console.log('Avatars bucket not found!')
    }
    
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(5)
    
    if (usersError) {
      console.log('Could not fetch users (expected with RLS):', usersError.message)
    } else {
      console.log('Users found:', users)
    }
    
    // Check profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (profilesError) {
      console.log('Profiles error:', profilesError)
    } else {
      console.log('Profiles found:', profiles)
    }

  } catch (error) {
    console.error('Test error:', error)
  }
}

testBucket()