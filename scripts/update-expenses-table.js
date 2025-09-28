const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateExpensesTable() {
  try {
    console.log('🚀 Updating expenses table schema...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'update-expenses-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error updating table:', error);
      return;
    }
    
    console.log('✅ Expenses table updated successfully!');
    
    // Test the table structure
    const { data: tableInfo, error: infoError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'expenses')
      .order('ordinal_position');
    
    if (infoError) {
      console.error('❌ Error getting table info:', infoError);
      return;
    }
    
    console.log('\n📋 Current expenses table structure:');
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Alternative method if RPC doesn't work
async function updateExpensesTableDirect() {
  try {
    console.log('🚀 Updating expenses table schema (direct method)...');
    
    // Add columns one by one
    const updates = [
      { column: 'vendor', type: 'TEXT' },
      { column: 'billable', type: 'BOOLEAN DEFAULT false' },
      { column: 'file_urls', type: 'TEXT[]' },
      { column: 'tags', type: 'TEXT[]' },
      { column: 'payment_method', type: 'TEXT' },
      { column: 'tax_amount', type: 'DECIMAL(12,2)' },
      { column: 'notes', type: 'TEXT' }
    ];
    
    for (const update of updates) {
      console.log(`Adding column: ${update.column}`);
      // Note: Supabase doesn't support ALTER TABLE directly through the client
      // You'll need to run the SQL manually in the Supabase dashboard
    }
    
    console.log('⚠️  Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n-- Add missing columns to expenses table');
    
    updates.forEach(update => {
      console.log(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS ${update.column} ${update.type};`);
    });
    
    console.log(`
-- Rename receipt_url to legacy_receipt_url
ALTER TABLE expenses RENAME COLUMN receipt_url TO legacy_receipt_url;

-- Remove status column  
ALTER TABLE expenses DROP COLUMN IF EXISTS status;
    `);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the update
updateExpensesTableDirect();