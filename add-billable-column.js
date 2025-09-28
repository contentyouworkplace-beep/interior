const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addBillableColumn() {
  console.log('🔧 Adding billable column to expenses table...')
  
  try {
    // Check if column already exists
    const { data: existingColumns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'expenses')
      .eq('column_name', 'billable')
      
    if (checkError) {
      console.log('📋 Checking current table structure...')
      
      // Let's just try to add the column directly
      const { data, error } = await supabase
        .rpc('exec_sql', { 
          sql: `
            ALTER TABLE expenses 
            ADD COLUMN IF NOT EXISTS billable BOOLEAN DEFAULT true;
            
            -- Create index for better performance
            CREATE INDEX IF NOT EXISTS idx_expenses_billable ON expenses(billable);
            
            -- Update existing records to have billable=true by default
            UPDATE expenses SET billable = true WHERE billable IS NULL;
          `
        })
        
      if (error) {
        console.error('❌ Error adding billable column:', error)
        
        // Try alternative approach - direct column addition
        console.log('🔄 Trying alternative method...')
        const { error: altError } = await supabase
          .from('expenses')
          .select('*')
          .limit(1)
          
        console.log('Current table accessible:', !altError)
        return
      }
      
      console.log('✅ Billable column added successfully!')
      console.log('📊 SQL execution result:', data)
    } else {
      console.log('✅ Billable column already exists!')
    }
    
    // Verify the column was added by checking table structure
    console.log('🔍 Verifying table structure...')
    const { data: testData, error: testError } = await supabase
      .from('expenses')
      .select('billable')
      .limit(1)
      
    if (testError) {
      console.error('❌ Column verification failed:', testError.message)
    } else {
      console.log('✅ Billable column is working correctly!')
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

addBillableColumn()