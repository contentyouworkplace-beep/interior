const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDatabaseSchema() {
  console.log('🔍 Checking actual Supabase database schema...')
  
  try {
    // Query the information_schema to get the actual table structure
    const { data: columns, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'vendor_files' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      })
    
    if (error) {
      console.error('❌ Error querying schema:', error)
      
      // Alternative: Try to get schema by attempting insert with empty data
      console.log('🔄 Trying alternative method...')
      const { data: insertData, error: insertError } = await supabase
        .from('vendor_files')
        .insert({})
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
      console.log('✅ Database schema:', columns)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkDatabaseSchema()