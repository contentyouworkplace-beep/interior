const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://vfkfqgmpxdcwtszdgqrk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZma2ZxZ21weGRjd3RzemRncXJrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjI4NjE3NSwiZXhwIjoyMDQxODYyMTc1fQ.CRHi4BoMaZ_qV2VmVWcJHYUwR6F5hULo8lKtYb03Owc'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function addPaymentColumns() {
  try {
    // First check the current table structure
    console.log('Checking current team_members table structure...')
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'team_members')
      .eq('table_schema', 'public')
    
    if (columnsError) {
      console.error('Error checking columns:', columnsError)
      return
    }
    
    console.log('Current columns:', columns.map(c => c.column_name))
    
    // Check if the columns already exist
    const hasMonthly = columns.some(c => c.column_name === 'monthly_salary')
    const hasLastPayment = columns.some(c => c.column_name === 'last_payment')
    const hasPaymentDate = columns.some(c => c.column_name === 'payment_date')
    
    if (hasMonthly && hasLastPayment && hasPaymentDate) {
      console.log('✅ All payment columns already exist!')
      return
    }
    
    // Add columns using SQL query
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: `
        ALTER TABLE team_members 
        ADD COLUMN IF NOT EXISTS monthly_salary DECIMAL(12,2),
        ADD COLUMN IF NOT EXISTS last_payment DECIMAL(12,2),
        ADD COLUMN IF NOT EXISTS payment_date DATE;
      `
    })
    
    if (error) {
      console.error('Error adding columns:', error)
    } else {
      console.log('✅ Payment columns added successfully')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

addPaymentColumns()