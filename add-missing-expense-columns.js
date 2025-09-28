const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMissingExpenseColumns() {
  try {
    console.log('🔧 Adding missing columns to expenses table...');
    
    // First, let's see current columns
    console.log('📋 Checking current columns...');
    const { data: currentData, error: currentError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1);
    
    if (!currentError && currentData && currentData.length > 0) {
      console.log('Current columns:', Object.keys(currentData[0]));
    }
    
    // Try a simple test insert to see what columns are missing
    console.log('\n🧪 Testing with a dummy expense to identify missing columns...');
    
    const testExpense = {
      user_id: 'test-user-id',
      project_id: null,
      amount: 100,
      category: 'Test',
      description: 'Test expense',
      expense_date: '2025-09-24',
      vendor: 'Test Vendor',
      billable: true,
      payment_method: 'Cash',
      tax_amount: 10.50,
      notes: 'Test notes'
    };
    
    const { data, error } = await supabase
      .from('expenses')
      .insert([testExpense])
      .select()
      .single();
    
    if (error) {
      console.log('❌ Error details:', error);
      console.log('This tells us which columns are missing');
      
      // Try to identify the specific missing column
      if (error.message.includes("Could not find the") && error.message.includes("column")) {
        const match = error.message.match(/Could not find the '(.+?)' column/);
        if (match) {
          console.log(`🎯 Missing column identified: ${match[1]}`);
        }
      }
    } else {
      console.log('✅ All columns exist! Test expense created:', data);
      
      // Clean up the test expense
      if (data?.id) {
        await supabase.from('expenses').delete().eq('id', data.id);
        console.log('🧹 Test expense cleaned up');
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

addMissingExpenseColumns();