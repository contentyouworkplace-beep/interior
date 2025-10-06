const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ywcqtmzqsvcobtetunuf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyNjE5OTYsImV4cCI6MjA0MjgzNzk5Nn0.VY7kQ1NZ-_9v2CtBqfV-2GH3f3vJkqYqKxRqGpvY5h4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanyData() {
  console.log('\n🔍 Checking company data in database...\n');
  
  const orgId = '00000000-0000-0000-0000-000000000001';
  
  // Check company_profiles
  const { data: profile, error: profileError } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  console.log('📋 Company Profile:');
  if (profileError) {
    console.log('   ❌ Error:', profileError.message);
  } else if (!profile) {
    console.log('   ⚠️  No data found');
  } else {
    console.log('   ✅ Company Name:', profile.company_name || 'NOT SET');
    console.log('   ✅ Tagline:', profile.company_tagline || 'NOT SET');
    console.log('   ✅ Phone:', profile.phone || 'NOT SET');
    console.log('   ✅ Email:', profile.email || 'NOT SET');
    console.log('   ✅ Website:', profile.website || 'NOT SET');
    console.log('   ✅ Address:', profile.address_line1 || 'NOT SET');
    console.log('   ✅ City:', profile.city || 'NOT SET');
    console.log('   ✅ State:', profile.state || 'NOT SET');
  }
  
  // Check branding
  const { data: branding, error: brandingError } = await supabase
    .from('branding')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  console.log('\n🎨 Branding:');
  if (brandingError) {
    console.log('   ❌ Error:', brandingError.message);
  } else if (!branding) {
    console.log('   ⚠️  No data found');
  } else {
    console.log('   ✅ Logo URL:', branding.logo_url || 'NOT SET');
    console.log('   ✅ Primary Color:', branding.primary_color || 'NOT SET');
    console.log('   ✅ Secondary Color:', branding.secondary_color || 'NOT SET');
  }
  
  // Check banking_info
  const { data: banking, error: bankingError } = await supabase
    .from('banking_info')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  console.log('\n💳 Banking Info:');
  if (bankingError) {
    console.log('   ❌ Error:', bankingError.message);
  } else if (!banking) {
    console.log('   ⚠️  No data found');
  } else {
    console.log('   ✅ Bank Name:', banking.bank_name || 'NOT SET');
    console.log('   ✅ Account Number:', banking.account_number || 'NOT SET');
    console.log('   ✅ IFSC:', banking.ifsc_code || 'NOT SET');
  }
}

checkCompanyData().then(() => {
  console.log('\n✅ Check complete!\n');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
