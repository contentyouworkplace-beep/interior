const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jtsowtwuydqeziwquvqu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0c293dHd1eWRxZXppd3F1dnF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY0NzIwOCwiZXhwIjoyMDUxMjIzMjA4fQ.uKxFVRKcjNzFxgC6m-xALNEqXHJo_IPJNFYW_1ZZ5Uo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAddressData() {
  try {
    console.log('Checking address data in all tables...\n');
    
    // Check company_profiles
    const { data: companyProfiles, error: cpError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('organization_id', '422fe3dc-2470-40e7-944a-6e46a48ebd30')
      .single();
    
    console.log('📋 company_profiles:');
    console.log('  address_line1:', companyProfiles?.address_line1);
    console.log('  address_line2:', companyProfiles?.address_line2);
    console.log('  city:', companyProfiles?.city);
    console.log('  state:', companyProfiles?.state);
    console.log('  postal_code:', companyProfiles?.postal_code);
    console.log('  pincode:', companyProfiles?.pincode);
    
    // Check business_settings
    const { data: businessSettings, error: bsError } = await supabase
      .from('business_settings')
      .select('*')
      .eq('user_id', '2be2c560-6ab0-4732-afd9-0bbdccfce561')
      .single();
    
    console.log('\n📋 business_settings:');
    console.log('  business_address:', businessSettings?.business_address);
    console.log('  address:', businessSettings?.address);
    console.log('  city:', businessSettings?.city);
    console.log('  state:', businessSettings?.state);
    console.log('  pincode:', businessSettings?.pincode);
    console.log('  postal_code:', businessSettings?.postal_code);
    
    // Check profiles
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '2be2c560-6ab0-4732-afd9-0bbdccfce561')
      .single();
    
    console.log('\n📋 profiles:');
    console.log('  address:', profiles?.address);
    console.log('  city:', profiles?.city);
    console.log('  state:', profiles?.state);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAddressData();
