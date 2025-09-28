#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service role to bypass RLS
);

async function testDirectConnection() {
  console.log('🔍 Testing direct Supabase connection...');
  
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .limit(10);
    
    console.log('✅ Connection successful');
    console.log('📊 Data:', data ? `${data.length} expenses found` : 'No data');
    console.log('❌ Error:', error || 'None');
    
    if (data && data.length > 0) {
      console.log('\n📋 Expenses in database:');
      data.forEach((exp, i) => {
        console.log(`   ${i+1}. ₹${exp.amount} - ${exp.description}`);
        console.log(`      User ID: ${exp.user_id}`);
        console.log(`      Date: ${exp.expense_date}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No expenses found in database');
    }
    
  } catch (error) {
    console.error('💥 Connection failed:', error.message);
  }
}

testDirectConnection();