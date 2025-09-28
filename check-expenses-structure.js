const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrateExpensesTable() {
  console.log('🔧 Migrating expenses table to add billable column...')
  
  try {
    // Test if billable column exists by trying to select it
    console.log('🔍 Testing if billable column exists...')
    const { data: testData, error: testError } = await supabase
      .from('expenses')
      .select('billable')
      .limit(1)
    
    if (testError && testError.message.includes("column") && testError.message.includes("billable")) {
      console.log('❌ Billable column does not exist, needs to be added via Supabase dashboard')
      console.log('')
      console.log('🔧 MANUAL MIGRATION REQUIRED:')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Run this SQL command:')
      console.log('')
      console.log('ALTER TABLE expenses ADD COLUMN billable BOOLEAN DEFAULT true;')
      console.log('')
      console.log('3. Then run: CREATE INDEX idx_expenses_billable ON expenses(billable);')
      console.log('')
      console.log('After running the SQL, the save functionality will work.')
      
      // As a workaround, let's try using a simple INSERT to see what columns exist
      console.log('')
      console.log('🔍 Checking current table structure by attempting test insert...')
      
      const { data: insertTest, error: insertError } = await supabase
        .from('expenses')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          amount: 1,
          category: 'Test',
          description: 'Test Structure',
          expense_date: '2025-01-01'
        })
        .select()
      
      if (insertError) {
        console.log('📋 Available columns based on error:', insertError.message)
      } else {
        console.log('✅ Test insert worked, deleting test record...')
        if (insertTest && insertTest[0]) {
          await supabase.from('expenses').delete().eq('id', insertTest[0].id)
        }
      }
      
    } else if (testError) {
      console.error('❌ Other error checking billable column:', testError)
    } else {
      console.log('✅ Billable column already exists and is accessible!')
      console.log('📊 Sample data:', testData)
    }
    
    // Check current expenses to see structure
    console.log('')
    console.log('🔍 Checking existing expenses structure...')
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .limit(1)
    
    if (expensesError) {
      console.error('❌ Error fetching expenses:', expensesError)
    } else {
      console.log('📋 Current expense record structure:')
      if (expenses && expenses[0]) {
        console.log('Available columns:', Object.keys(expenses[0]))
      } else {
        console.log('No expenses found in table')
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

migrateExpensesTable()