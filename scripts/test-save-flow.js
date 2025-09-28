const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSaveFlow() {
  try {
    console.log('🧪 Testing business settings save flow...')

    // Simulate what the frontend does
    console.log('\n1. Testing authentication...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ Auth error:', authError.message)
      console.log('💡 You need to be logged in for this test')
      return
    }

    if (!user) {
      console.log('⚠️ No authenticated user')
      console.log('💡 This is expected when testing with anon key')
      console.log('💡 The save button will work when user is logged in')
      return
    }

    console.log('✅ User authenticated:', user.email)

    // Test 2: Try to fetch existing settings
    console.log('\n2. Testing fetch business settings...')
    const { data: existingData, error: fetchError } = await supabase
      .from('business_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.log('❌ Fetch error:', fetchError.message)
    } else {
      console.log('✅ Fetch working, existing data:', existingData ? 'found' : 'none')
    }

    // Test 3: Try to save sample data
    console.log('\n3. Testing save business settings...')
    const sampleData = {
      user_id: user.id,
      company_name: 'Test Company Save',
      address: '123 Test Street Save',
      city: 'Test City',
      state: 'Maharashtra', 
      pincode: '400001',
      country: 'India',
      phone: '+91 9876543210',
      email: 'test@example.com',
      gstin: '',
      pan: '',
      bank_account: '',
      ifsc_code: '',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      quotation_template: 'modern',
      invoice_template: 'modern',
      terms_conditions: 'Test terms',
      updated_at: new Date().toISOString()
    }

    const { data: saveData, error: saveError } = await supabase
      .from('business_settings')
      .upsert(sampleData, { onConflict: 'user_id' })
      .select()
      .single()

    if (saveError) {
      console.log('❌ Save error:', saveError.message)
    } else {
      console.log('✅ Save successful:', saveData.company_name)
    }

    console.log('\n🎯 Save flow test complete!')

  } catch (error) {
    console.error('💥 Unexpected error:', error.message)
  }
}

testSaveFlow()