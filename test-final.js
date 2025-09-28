const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFinalInsert() {
  console.log('🧪 Testing final field combination...')
  
  try {
    const { data, error } = await supabase
      .from('vendor_files')
      .insert({
        vendor_id: '253c581c-a6b3-4964-9cf7-b9ccf66a7b5f',
        filename: 'test-123.txt',
        file_name: 'test.txt',
        original_filename: 'test.txt',
        file_path: 'test/test.txt',
        file_size: 100,
        mime_type: 'text/plain'
      })
      .select()
    
    if (error) {
      console.error('❌ Final test error:', error.message)
    } else {
      console.log('✅ SUCCESS! Final test worked:', data)
      // Clean up
      if (data?.[0]?.id) {
        await supabase.from('vendor_files').delete().eq('id', data[0].id)
        console.log('🧹 Cleaned up test record')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testFinalInsert()