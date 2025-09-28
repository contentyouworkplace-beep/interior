// Test file upload functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFileDisplay() {
  console.log('🧪 Testing file display functionality...');
  
  // Get expense with files
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6')
    .eq('description', 'Paint and primer for walls');
    
  if (expenses && expenses[0]) {
    const expense = expenses[0];
    console.log('✅ Found expense:', expense.description);
    console.log('📎 File URLs:', expense.file_urls);
    console.log('📊 File count:', expense.file_urls?.length || 0);
    
    if (expense.file_urls && expense.file_urls.length > 0) {
      console.log('🎯 Files should display in view dialog!');
      console.log('Test URLs:');
      expense.file_urls.forEach((url, i) => {
        console.log(`  ${i+1}. ${url}`);
      });
    } else {
      console.log('❌ No files found - this is the issue!');
    }
  } else {
    console.log('❌ No expense found');
  }
  
  console.log('\n🚀 Now test in browser:');
  console.log('1. Go to http://localhost:3000/expenses');
  console.log('2. Click eye icon on "Paint and primer for walls"');
  console.log('3. Should see 2 attachments');
}

testFileDisplay();