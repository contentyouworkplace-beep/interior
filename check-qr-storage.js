const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jtsowtwuydqeziwquvqu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0c293dHd1eWRxZXppd3F1dnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NDcyMDgsImV4cCI6MjA1MTIyMzIwOH0.s3h2cr3Kh_x9wd9c6ztVJC1cMGAn0TaGfMYVQdHNE-4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQRCodeStorage() {
  console.log('Checking QR code storage in all tables...\n');
  
  const orgId = '422fe3dc-2470-40e7-944a-6e46a48ebd30';
  
  // Check branding table
  const { data: branding, error: brandingError } = await supabase
    .from('branding')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  console.log('🎨 Branding table:');
  if (brandingError) {
    console.log('  Error:', brandingError.message);
  } else {
    console.log('  logo_url:', branding?.logo_url);
    console.log('  signature_url:', branding?.signature_url);
    console.log('  qr_code_url:', branding?.qr_code_url);
    console.log('  All fields:', Object.keys(branding || {}));
  }
  
  // Check banking_info table
  const { data: banking, error: bankingError } = await supabase
    .from('banking_info')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  console.log('\n🏦 Banking Info table:');
  if (bankingError) {
    console.log('  Error:', bankingError.message);
  } else {
    console.log('  bank_name:', banking?.bank_name);
    console.log('  qr_code_url:', banking?.qr_code_url);
    console.log('  All fields:', Object.keys(banking || {}));
  }
}

checkQRCodeStorage();
