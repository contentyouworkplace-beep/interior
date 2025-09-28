const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTableStructure() {
  console.log('🔍 Checking vendor_files table structure...')
  
  try {
    // Check table columns
    const { data, error } = await supabase
      .from('vendor_files')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error querying table:', error)
      return
    }
    
    console.log('✅ Sample data structure:', data)
    
    // Try to insert a test record to see the exact error
    const { data: insertData, error: insertError } = await supabase
      .from('vendor_files')
      .insert({
        vendor_id: 'test-vendor-id',
        file_name: 'test.txt',
        file_path: 'test/test.txt',
        file_type: 'text/plain',
        file_size: 1000,
        uploaded_at: new Date().toISOString()
      })
      .select()
    
    if (insertError) {
      console.error('❌ Insert error:', insertError)
    } else {
      console.log('✅ Insert successful:', insertData)
      
      // Clean up
      if (insertData && insertData.length > 0) {
        await supabase
          .from('vendor_files')
          .delete()
          .eq('id', insertData[0].id)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkTableStructure()