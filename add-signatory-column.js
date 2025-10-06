const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jtsowtwuydqeziwquvqu.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0c293dHd1eWRxZXppd3F1dnF1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY0NzIwOCwiZXhwIjoyMDUxMjIzMjA4fQ.uKxFVRKcjNzFxgC6m-xALNEqXHJo_IPJNFYW_1ZZ5Uo';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSignatoryColumn() {
  try {
    console.log('Adding authorized_signatory_name column to company_profiles...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE company_profiles 
        ADD COLUMN IF NOT EXISTS authorized_signatory_name VARCHAR(255);
      `
    });
    
    if (error) {
      console.error('Error adding column:', error);
      return;
    }
    
    console.log('✅ Successfully added authorized_signatory_name column');
    
    // Check the updated schema
    const { data: checkData, error: checkError } = await supabase
      .from('company_profiles')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking schema:', checkError);
    } else {
      console.log('Column added successfully. Sample record:', checkData?.[0]);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

addSignatoryColumn();
