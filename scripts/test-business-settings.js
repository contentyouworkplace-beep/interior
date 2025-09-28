const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testBusinessSettings() {
  try {
    console.log('🔍 Testing business_settings table...')

    // Test 1: Check if table exists by trying to select from it
    console.log('1. Checking if business_settings table exists...')
    const { data, error: selectError } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)

    if (selectError) {
      console.error('❌ Error accessing business_settings table:', selectError.message)
      console.log('🛠️  This means the table doesn\'t exist or has permission issues')
      return
    }

    console.log('✅ business_settings table exists and is accessible')
    console.log('📊 Current records:', data?.length || 0)

    // Test 2: Check storage bucket
    console.log('\n2. Checking storage buckets...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError.message)
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.name).join(', '))
      const hasBusinessAssets = buckets.some(b => b.name === 'business-assets')
      console.log('📁 business-assets bucket exists:', hasBusinessAssets ? '✅ Yes' : '❌ No')
    }

    // Test 3: Try authentication
    console.log('\n3. Checking authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('⚠️  No authenticated user (this is expected for this test)')
      console.log('🔧 For the app to work, users need to be logged in')
    } else {
      console.log('✅ User authenticated:', user.email)
    }

    console.log('\n🎯 Summary:')
    console.log('- Database table: ✅ Ready')
    console.log('- Storage setup: ' + (buckets.some(b => b.name === 'business-assets') ? '✅ Ready' : '❌ Needs setup'))
    console.log('- Auth required: ⚠️  Users must be logged in')

  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
  }
}

testBusinessSettings()