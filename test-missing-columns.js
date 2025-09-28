const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumnsByTesting() {
  console.log('🔧 Adding missing columns one by one...');
  
  const missingColumns = ['vendor', 'payment_method', 'tax_amount', 'notes'];
  
  for (const column of missingColumns) {
    console.log(`\n🧪 Testing column: ${column}`);
    
    // Create a minimal test object with just this column
    const testData = {
      user_id: 'test-user-id',
      category: 'Test',
      amount: 100,
      description: 'Test',
      expense_date: '2025-09-24',
      billable: true
    };
    
    // Add the specific column we're testing
    if (column === 'vendor') testData.vendor = 'Test Vendor';
    if (column === 'payment_method') testData.payment_method = 'Cash';
    if (column === 'tax_amount') testData.tax_amount = 10.50;
    if (column === 'notes') testData.notes = 'Test notes';
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([testData])
        .select()
        .single();
      
      if (error) {
        if (error.message.includes(`Could not find the '${column}' column`)) {
          console.log(`❌ Column '${column}' missing - needs to be added to database`);
        } else {
          console.log(`⚠️ Other error for ${column}:`, error.message);
        }
      } else {
        console.log(`✅ Column '${column}' exists and working`);
        // Clean up test data
        if (data?.id) {
          await supabase.from('expenses').delete().eq('id', data.id);
        }
      }
    } catch (err) {
      console.log(`💥 Error testing ${column}:`, err.message);
    }
  }
  
  console.log('\n📋 Summary: Please add the missing columns to your Supabase expenses table using the SQL script.');
}

addColumnsByTesting();