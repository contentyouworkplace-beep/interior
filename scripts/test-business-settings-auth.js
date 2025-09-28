// Test script to verify authentication and business settings functionality
import { createClient } from '@supabase/supabase-js'
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testBusinessSettings() {
  console.log('🧪 Testing Business Settings Functionality...\n')

  try {
    // Test 1: Check if business_settings table exists
    console.log('1️⃣ Testing database table access...')
    const { data: tableData, error: tableError } = await supabase
      .from('business_settings')
      .select('id')
      .limit(1)
    
    if (tableError) {
      console.log('❌ Table access failed:', tableError.message)
    } else {
      console.log('✅ Business settings table is accessible')
    }

    // Test 2: Check storage bucket
    console.log('\n2️⃣ Testing storage bucket...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.log('❌ Storage bucket test failed:', bucketError.message)
    } else {
      const businessBucket = buckets?.find(bucket => bucket.name === 'business-assets')
      if (businessBucket) {
        console.log('✅ Business assets bucket exists')
      } else {
        console.log('⚠️ Business assets bucket not found')
        console.log('Available buckets:', buckets?.map(b => b.name).join(', '))
      }
    }

    // Test 3: Check authentication state
    console.log('\n3️⃣ Testing authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ Auth error:', authError.message)
    } else if (user) {
      console.log('✅ User is authenticated:', user.email)
    } else {
      console.log('ℹ️ No user session (this is expected for anonymous access)')
    }

    // Test 4: Test RLS policies (if any)
    console.log('\n4️⃣ Testing business settings query...')
    const { data: settingsData, error: settingsError } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)
    
    if (settingsError) {
      if (settingsError.message.includes('RLS')) {
        console.log('ℹ️ RLS policy requires authentication (this is expected)')
      } else {
        console.log('❌ Settings query failed:', settingsError.message)
      }
    } else {
      console.log('✅ Business settings query successful')
      console.log('Found records:', settingsData?.length || 0)
    }

    console.log('\n🎉 Test completed!')
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message)
  }
}

testBusinessSettings()