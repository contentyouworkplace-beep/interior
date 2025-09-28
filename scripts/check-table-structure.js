const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTableStructure() {
  try {
    console.log('🔍 Checking business_settings table structure...')

    // Test with the exact structure we expect
    const testRecord = {
      user_id: '00000000-0000-0000-0000-000000000000',
      company_name: 'Test Company',
      tagline: 'Test Tagline',
      logo_url: null,
      address: '123 Test Street',
      city: 'Test City', 
      state: 'Maharashtra',
      pincode: '400001',
      country: 'India',
      phone: '+91 9876543210',
      email: 'test@example.com',
      website: 'https://test.com',
      gstin: '27ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      cin: 'U74999MH2022PTC123456',
      bank_name: 'Test Bank',
      bank_account: '1234567890',
      ifsc_code: 'TEST0001234',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      quotation_template: 'modern',
      invoice_template: 'modern',
      signature_url: null,
      terms_conditions: 'Standard terms and conditions'
    }

    console.log('\n📝 Expected fields for business_settings:')
    Object.keys(testRecord).forEach(key => {
      console.log(`- ${key}`)
    })

    // Try inserting (will fail due to RLS but shows field validation)
    console.log('\n🧪 Testing table structure with sample insert...')
    const { error: insertError } = await supabase
      .from('business_settings')
      .insert(testRecord)

    if (insertError) {
      if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
        console.log('❌ Missing column detected:', insertError.message)
      } else if (insertError.message.includes('RLS') || insertError.message.includes('policy')) {
        console.log('✅ All columns exist (RLS blocked as expected)')
      } else {
        console.log('⚠️ Other error:', insertError.message)
      }
    } else {
      console.log('✅ All columns exist and insert would work')
    }

    // Test select to make sure table is accessible
    console.log('\n📋 Testing table access...')
    const { data, error: selectError } = await supabase
      .from('business_settings')
      .select('*')
      .limit(1)

    if (selectError) {
      console.log('❌ Select error:', selectError.message)
    } else {
      console.log('✅ Table accessible, current records:', data.length)
    }

    console.log('\n🎯 Table structure check complete!')

  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
  }
}

checkTableStructure()