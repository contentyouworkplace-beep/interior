const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jtsowtwuydqeziwquvqu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0c293dHd1eWRxZXppd3F1dnF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY0NzIwOCwiZXhwIjoyMDUxMjIzMjA4fQ.uKxFVRKcjNzFxgC6m-xALNEqXHJo_IPJNFYW_1ZZ5Uo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkClientData() {
  try {
    console.log('Checking client data for Sushil Singh...\n');
    
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .ilike('first_name', 'Sushil')
      .single();
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log('Client data:', JSON.stringify(client, null, 2));
    
    // Now check quotation with client
    const { data: quotation, error: quotError } = await supabase
      .from('quotations')
      .select(`
        id,
        quotation_number,
        client:clients(id, first_name, last_name, company, email, phone, city, state)
      `)
      .eq('quotation_number', 'QUO-2025-0004')
      .single();
    
    if (quotError) {
      console.error('Quotation error:', quotError);
      return;
    }
    
    console.log('\nQuotation with client:', JSON.stringify(quotation, null, 2));
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkClientData();
