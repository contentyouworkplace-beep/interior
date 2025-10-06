// Quick check - what data exists for the real org ID
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const realOrgId = '422fe3dc-2470-40e7-944a-6e46a48ebd30';
  
  console.log('\n🔍 Checking branding table for orgId:', realOrgId);
  const { data: branding, error: brandingError } = await supabase
    .from('branding')
    .select('*')
    .eq('organization_id', realOrgId)
    .single();
  
  if (brandingError) {
    console.log('❌ Branding error:', brandingError);
  } else {
    console.log('✅ Branding data found:');
    console.log('   - qr_code_url:', branding.qr_code_url);
    console.log('   - logo_url:', branding.logo_url);
    console.log('   - signature_url:', branding.signature_url);
  }
  
  console.log('\n🔍 Checking banking_info table for orgId:', realOrgId);
  const { data: banking, error: bankingError } = await supabase
    .from('banking_info')
    .select('*')
    .eq('organization_id', realOrgId)
    .maybeSingle();
  
  if (bankingError) {
    console.log('❌ Banking error:', bankingError);
  } else if (!banking) {
    console.log('⚠️  No banking_info record found');
  } else {
    console.log('✅ Banking data found:');
    console.log('   - bank_name:', banking.bank_name);
    console.log('   - account_number:', banking.account_number);
    console.log('   - qr_code_url:', banking.qr_code_url || 'NOT SET');
  }
  
  console.log('\n🔍 Checking company_profiles for user connection:');
  const { data: companyProfile, error: cpError } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('user_id', '2be2c560-6ab0-4732-afd9-0bbdccfce561')
    .single();
  
  if (cpError) {
    console.log('❌ Company profile error:', cpError);
  } else {
    console.log('✅ Company profile found:');
    console.log('   - organization_id:', companyProfile.organization_id);
    console.log('   - user_id:', companyProfile.user_id);
    console.log('   - Matches real orgId?', companyProfile.organization_id === realOrgId);
  }
})();
