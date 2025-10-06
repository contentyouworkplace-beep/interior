const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jtsowtwuydqeziwquvqu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0c293dHd1eWRxZXppd3F1dnF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY0NzIwOCwiZXhwIjoyMDUxMjIzMjA4fQ.uKxFVRKcjNzFxgC6m-xALNEqXHJo_IPJNFYW_1ZZ5Uo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBankingQR() {
  try {
    console.log('Checking banking info for QR code...\n');
    
    const { data: banking, error } = await supabase
      .from('banking_info')
      .select('*')
      .eq('organization_id', '422fe3dc-2470-40e7-944a-6e46a48ebd30')
      .single();
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Banking Info:');
    console.log('  bank_name:', banking?.bank_name);
    console.log('  account_number:', banking?.account_number);
    console.log('  ifsc_code:', banking?.ifsc_code);
    console.log('  upi_id:', banking?.upi_id);
    console.log('  qr_code_url:', banking?.qr_code_url);
    
    // Also check branding table
    const { data: branding, error: brandError } = await supabase
      .from('branding')
      .select('*')
      .eq('organization_id', '422fe3dc-2470-40e7-944a-6e46a48ebd30')
      .single();
    
    console.log('\nBranding Info:');
    console.log('  qr_code_url:', branding?.qr_code_url);
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkBankingQR();
