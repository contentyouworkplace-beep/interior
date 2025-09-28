import { createClient } from '@/lib/supabase/client'

export async function testCompanySettingsFlow() {
  const supabase = createClient()
  const orgId = '00000000-0000-0000-0000-000000000001'
  
  console.log('=== Testing Company Settings Flow ===')
  
  try {
    // Test API GET
    console.log('1. Testing API GET...')
    const getResponse = await fetch(`/api/company-settings?orgId=${orgId}`)
    const getData = await getResponse.json()
    console.log('GET Response:', getData)
    
    // Test API POST
    console.log('2. Testing API POST...')
    const testData = {
      orgId,
      profile: {
        company_name: 'Test Company',
        company_tagline: 'Test Tagline',
        email: 'test@company.com',
        phone: '1234567890',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pin_code: '123456',
        website: 'https://test.com',
        gstin: '29ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        cin: 'U12345AB1234ABC123456'
      },
      banking: {
        bank_name: 'Test Bank',
        account_number: '123456789012',
        ifsc_code: 'TEST0001234'
      },
      branding: {
        primary_color: '#FF5733',
        secondary_color: '#33FF57',
        quotation_template: 'corporate',
        invoice_template: 'premium'
      }
    }
    
    const postResponse = await fetch('/api/company-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    })
    const postData = await postResponse.json()
    console.log('POST Response:', postData)
    
    // Test direct database queries
    console.log('3. Testing direct database queries...')
    const [profileRes, bankingRes, brandingRes] = await Promise.all([
      supabase.from('company_profiles').select('*').eq('organization_id', orgId),
      supabase.from('banking_info').select('*').eq('organization_id', orgId),
      supabase.from('branding').select('*').eq('organization_id', orgId),
    ])
    
    console.log('Direct DB - Profile:', profileRes)
    console.log('Direct DB - Banking:', bankingRes)
    console.log('Direct DB - Branding:', brandingRes)
    
    console.log('=== Test Complete ===')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Call this function in browser console to test
if (typeof window !== 'undefined') {
  (window as any).testCompanySettingsFlow = testCompanySettingsFlow
}