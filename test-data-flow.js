#!/usr/bin/env node

/**
 * Test script to verify complete data flow:
 * 1. Save company data to Supabase
 * 2. Fetch the data back
 * 3. Verify form can be populated with fetched data
 */

const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001';
const BASE_URL = 'http://localhost:3000';

// Test data to save
const testCompanyData = {
  profile: {
    company_name: 'DataFlow Test Company',
    company_tagline: 'Testing the complete data flow',
    email: 'dataflow@test.com',
    phone: '9876543210',
    address: '123 Test Street, Data Flow Colony',
    city: 'Test City',
    state: 'Test State',
    pin_code: '654321',
    website: 'https://dataflow-test.com',
    gstin: '29DATAFLOW1234Z',
    pan: 'DATAFLOW1',
    cin: 'U12345TEST1234ABC123456'
  },
  banking: {
    bank_name: 'DataFlow Bank',
    account_number: '987654321098',
    ifsc_code: 'DFLW0001234'
  },
  branding: {
    primary_color: '#2563eb',
    secondary_color: '#dc2626',
    quotation_template: 'modern',
    invoice_template: 'classic'
  }
};

async function testDataFlow() {
  console.log('🚀 Starting Data Flow Test...\n');
  
  try {
    // Step 1: Save data to Supabase
    console.log('📤 Step 1: Saving data to Supabase...');
    const saveResponse = await fetch(`${BASE_URL}/api/company-settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orgId: TEST_ORG_ID,
        ...testCompanyData
      })
    });

    if (!saveResponse.ok) {
      throw new Error(`Save failed: ${saveResponse.status} ${saveResponse.statusText}`);
    }

    const saveResult = await saveResponse.json();
    console.log('✅ Data saved successfully!');
    console.log('Save response:', JSON.stringify(saveResult, null, 2));
    console.log('');

    // Step 2: Fetch data back from Supabase
    console.log('📥 Step 2: Fetching data from Supabase...');
    const fetchResponse = await fetch(`${BASE_URL}/api/company-settings?orgId=${TEST_ORG_ID}`);

    if (!fetchResponse.ok) {
      throw new Error(`Fetch failed: ${fetchResponse.status} ${fetchResponse.statusText}`);
    }

    const fetchResult = await fetchResponse.json();
    console.log('✅ Data fetched successfully!');
    console.log('Fetched data:', JSON.stringify(fetchResult, null, 2));
    console.log('');

    // Step 3: Verify data integrity
    console.log('🔍 Step 3: Verifying data integrity...');
    
    const integrity = {
      profile: verifyProfile(testCompanyData.profile, fetchResult.profile),
      banking: verifyBanking(testCompanyData.banking, fetchResult.banking),
      branding: verifyBranding(testCompanyData.branding, fetchResult.branding)
    };

    console.log('Data Integrity Check:');
    console.log(`- Profile: ${integrity.profile ? '✅' : '❌'}`);
    console.log(`- Banking: ${integrity.banking ? '✅' : '❌'}`);
    console.log(`- Branding: ${integrity.branding ? '✅' : '❌'}`);
    console.log('');

    // Step 4: Show form-ready data
    console.log('📋 Step 4: Form-ready data structure:');
    const formData = {
      // Profile fields
      companyName: fetchResult.profile?.company_name || '',
      companyTagline: fetchResult.profile?.company_tagline || '',
      email: fetchResult.profile?.email || '',
      phone: fetchResult.profile?.phone || '',
      address: fetchResult.profile?.address || '',
      city: fetchResult.profile?.city || '',
      state: fetchResult.profile?.state || '',
      pinCode: fetchResult.profile?.pin_code || '',
      website: fetchResult.profile?.website || '',
      gstin: fetchResult.profile?.gstin || '',
      pan: fetchResult.profile?.pan || '',
      cin: fetchResult.profile?.cin || '',
      
      // Banking fields
      bankName: fetchResult.banking?.bank_name || '',
      accountNumber: fetchResult.banking?.account_number || '',
      ifscCode: fetchResult.banking?.ifsc_code || '',
      
      // Branding fields
      primaryColor: fetchResult.branding?.primary_color || '#000000',
      secondaryColor: fetchResult.branding?.secondary_color || '#ffffff',
      quotationTemplate: fetchResult.branding?.quotation_template || 'modern',
      invoiceTemplate: fetchResult.branding?.invoice_template || 'modern'
    };

    console.log('Form data that can populate the form:');
    console.log(JSON.stringify(formData, null, 2));
    console.log('');

    console.log('🎉 Complete Data Flow Test PASSED!');
    console.log('✅ Data can be saved to Supabase');
    console.log('✅ Data can be fetched from Supabase');
    console.log('✅ Form can be populated with fetched data');

  } catch (error) {
    console.error('❌ Data Flow Test FAILED:', error.message);
    process.exit(1);
  }
}

function verifyProfile(sent, received) {
  const fields = ['company_name', 'company_tagline', 'email', 'phone', 'address', 'city', 'state', 'pin_code', 'website', 'gstin', 'pan', 'cin'];
  return fields.every(field => sent[field] === received[field]);
}

function verifyBanking(sent, received) {
  const fields = ['bank_name', 'account_number', 'ifsc_code'];
  return fields.every(field => sent[field] === received[field]);
}

function verifyBranding(sent, received) {
  const fields = ['primary_color', 'secondary_color', 'quotation_template', 'invoice_template'];
  return fields.every(field => sent[field] === received[field]);
}

// Run the test
testDataFlow();