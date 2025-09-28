const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkVendorFilesSchema() {
  console.log('🔍 Checking vendor_files table schema...')
  
  try {
    // Try to insert with minimal fields to see what's required
    const { data, error } = await supabase
      .from('vendor_files')
      .insert({
        vendor_id: 'test-id',
        file_name: 'test.txt',
        file_path: 'test/test.txt',
        file_size: 100
      })
      .select()
    
    if (error) {
      console.error('❌ Schema test error:', error)
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
    } else {
      console.log('✅ Schema test successful:', data)
      
      // Clean up
      if (data && data.length > 0) {
        await supabase
          .from('vendor_files')
          .delete()
          .eq('id', data[0].id)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkVendorFilesSchema()