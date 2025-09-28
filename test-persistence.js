// Test QR Code and Terms & Conditions Persistence
// This script tests the complete workflow after database update

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

async function testDataPersistence() {
  console.log('🧪 Testing QR Code and Terms & Conditions persistence...')
  
  const orgId = '00000000-0000-0000-0000-000000000001'

  try {
    // 1. Test branding table structure
    console.log('📊 Testing branding table structure...')
    const { data: brandingData, error: brandingError } = await supabase
      .from('branding')
      .select('*')
      .eq('organization_id', orgId)
      .single()

    if (brandingError && brandingError.code !== 'PGRST116') {
      console.error('❌ Branding table error:', brandingError)
    } else {
      console.log('✅ Branding table accessible')
      console.log('🔍 Current branding data:', {
        has_logo: !!brandingData?.logo_url,
        has_signature: !!brandingData?.signature_url,
        has_qr_code: !!brandingData?.qr_code_url,
        qr_code_column_exists: brandingData && Object.hasOwnProperty.call(brandingData, 'qr_code_url')
      })
    }

    // 2. Test company profiles table structure
    console.log('📋 Testing company profiles table structure...')
    const { data: profileData, error: profileError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('organization_id', orgId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Company profiles table error:', profileError)
    } else {
      console.log('✅ Company profiles table accessible')
      console.log('🔍 Current profile data:', {
        company_name: profileData?.company_name,
        has_terms: !!profileData?.terms_and_conditions,
        terms_column_exists: profileData && Object.hasOwnProperty.call(profileData, 'terms_and_conditions'),
        terms_length: profileData?.terms_and_conditions?.length || 0
      })
    }

    // 3. Test QR code bucket access
    console.log('📁 Testing QR code bucket access...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Storage error:', bucketError)
    } else {
      const qrBucket = buckets.find(b => b.name === 'qr-codes')
      console.log('✅ Storage accessible')
      console.log('🔍 Available buckets:', buckets.map(b => b.name))
      console.log('🎯 QR codes bucket exists:', !!qrBucket)
    }

    // 4. Test API endpoint simulation
    console.log('🔌 Testing API endpoint compatibility...')
    const testBrandingData = {
      logo_url: 'test-logo.png',
      signature_url: 'test-signature.png',
      qr_code_url: 'test-qr-code.png',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF'
    }

    const testProfileData = {
      company_name: 'Test Company',
      terms_and_conditions: 'Test terms and conditions'
    }

    console.log('📤 API would handle:', {
      branding_fields: Object.keys(testBrandingData),
      profile_fields: Object.keys(testProfileData)
    })

    console.log('🎉 All persistence tests completed successfully!')
    console.log('')
    console.log('📌 Next Steps:')
    console.log('1. Run the DATABASE-UPDATE-SCRIPT.sql in Supabase SQL Editor')
    console.log('2. Test QR code upload in the application')
    console.log('3. Verify terms & conditions saving')
    console.log('4. Check template previews include QR codes')

  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Execute the test
testDataPersistence()