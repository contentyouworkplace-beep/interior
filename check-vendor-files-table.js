const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTables() {
  console.log('🔍 Checking database tables...')
  
  try {
    // Check if vendor_files table exists
    const { data, error } = await supabase
      .from('vendor_files')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ vendor_files table error:', error)
      return
    }
    
    console.log('✅ vendor_files table exists and is accessible')
    console.log('📊 Sample data count:', data?.length || 0)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkTables()