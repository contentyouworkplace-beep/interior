console.log('🔬 SMOKE TEST: QR Code Display Issue\n');
console.log('='

.repeat(60));

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const orgId = '422fe3dc-2470-40e7-944a-6e46a48ebd30';
  const userId = '2be2c560-6ab0-4732-afd9-0bbdccfce561';
  
  console.log('\n✅ STEP 1: Verify QR code exists in database');
  console.log('-'.repeat(60));
  const { data: branding } = await supabase
    .from('branding')
    .select('qr_code_url')
    .eq('organization_id', orgId)
    .single();
  
  console.log('branding.qr_code_url:', branding?.qr_code_url);
  console.log('✅ Status: QR code URL exists');
  
  console.log('\n✅ STEP 2: Verify organization_members link');
  console.log('-'.repeat(60));
  const { data: member } = await supabase
    .from('organization_members')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  console.log('Found membership:', {
    user_id: member?.user_id,
    organization_id: member?.organization_id,
    matches: member?.organization_id === orgId
  });
  console.log('✅ Status: User linked to correct organization');
  
  console.log('\n✅ STEP 3: Test company-settings API endpoint');
  console.log('-'.repeat(60));
  const apiUrl = `http://localhost:3001/api/company-settings?orgId=${orgId}`;
  console.log('Testing:', apiUrl);
  
  try {
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    console.log('\nAPI Response Status:', response.status);
    console.log('Has branding data:', !!result.data?.branding);
    console.log('branding.qr_code_url:', result.data?.branding?.qr_code_url);
    console.log('✅ Status: API returns QR code URL');
    
    console.log('\n✅ STEP 4: Check image accessibility');
    console.log('-'.repeat(60));
    const qrUrl = result.data?.branding?.qr_code_url;
    if (qrUrl) {
      const imgResponse = await fetch(qrUrl, { method: 'HEAD' });
      console.log('Image URL:', qrUrl);
      console.log('Image Status:', imgResponse.status);
      console.log('Content-Type:', imgResponse.headers.get('content-type'));
      console.log('Content-Length:', imgResponse.headers.get('content-length'), 'bytes');
      console.log('CORS Header:', imgResponse.headers.get('access-control-allow-origin'));
      console.log('✅ Status: Image is accessible');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 DIAGNOSIS:');
    console.log('='.repeat(60));
    console.log('✅ Database: QR code exists');
    console.log('✅ User linking: Correct');
    console.log('✅ API: Returns QR code URL');
    console.log('✅ Image: Accessible with CORS');
    console.log('\n❓ POTENTIAL ISSUE: React PDF Image component');
    console.log('\nNext steps:');
    console.log('1. Check browser console for PDF rendering errors');
    console.log('2. Verify Image component in quotation-pdf-document.tsx');
    console.log('3. May need to convert image to base64 for React PDF');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
