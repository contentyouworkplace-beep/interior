const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env file
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkQuotationsSchema() {
  console.log('🔍 Checking Quotations table schema...')
  
  try {
    // First check if the quotations table exists
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      })
    
    if (tablesError) {
      console.error('❌ Error querying tables:', tablesError)
    } else {
      console.log('📋 Tables in database:', tables)
      
      const quotationsTable = tables.find(t => t.table_name === 'quotations')
      if (!quotationsTable) {
        console.error('❌ Quotations table does not exist!')
      } else {
        console.log('✅ Quotations table exists')
      }
    }
    
    // Now check the quotations table structure
    const { data: columns, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'quotations' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })
    
    if (error) {
      console.error('❌ Error querying schema:', error)
      
      // Alternative: Try to get schema by attempting insert with empty data
      console.log('🔄 Trying alternative method...')
      const { data: insertData, error: insertError } = await supabase
        .from('quotations')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          client_id: '00000000-0000-0000-0000-000000000000',
          quotation_number: 'TEST-SCHEMA-CHECK',
          title: 'Schema Test',
          issue_date: new Date().toISOString(),
          valid_until: new Date().toISOString(),
          total_amount: 0
        })
        .select()
      
      if (insertError) {
        console.error('❌ Insert error (this shows required fields):', insertError)
        console.log('Error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        })
      }
      
    } else {
      console.log('✅ Quotations table schema:', columns)
      
      // Check for required columns
      const requiredColumns = [
        'id', 'user_id', 'client_id', 'quotation_number', 
        'title', 'issue_date', 'valid_until', 'total_amount'
      ]
      
      const missingColumns = requiredColumns.filter(col => 
        !columns.find(c => c.column_name === col)
      )
      
      if (missingColumns.length > 0) {
        console.error(`❌ Missing required columns: ${missingColumns.join(', ')}`)
      } else {
        console.log('✅ All required columns exist')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkQuotationsSchema()