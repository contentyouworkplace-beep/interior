// Simple database check using correct env variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

console.log('Checking environment variables...');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found' : 'Missing');
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Found' : 'Missing');

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleCheck() {
  try {
    console.log('\n=== SIMPLE DATABASE CHECK ===');
    
    const { data, error } = await supabase
      .from('expenses')
      .select('id, description, file_urls, created_at')
      .limit(5);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    console.log(`Found ${data.length} expenses:`);
    data.forEach((expense, i) => {
      console.log(`\n${i + 1}. ${expense.description}`);
      console.log(`   ID: ${expense.id}`);
      console.log(`   file_urls: ${JSON.stringify(expense.file_urls)}`);
      console.log(`   file_urls type: ${typeof expense.file_urls}`);
      console.log(`   is array: ${Array.isArray(expense.file_urls)}`);
      console.log(`   length: ${expense.file_urls?.length || 0}`);
    });
    
  } catch (error) {
    console.error('Catch error:', error.message);
  }
}

simpleCheck();