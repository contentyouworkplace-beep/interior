const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testMinimalInsert() {
  console.log('🧪 Testing what fields are actually required...')
  
  try {
    // Test 1: Try minimal insert to see what's missing
    console.log('Test 1: Minimal fields')
    const { data: test1, error: error1 } = await supabase
      .from('vendor_files')
      .insert({
        vendor_id: '253c581c-a6b3-4964-9cf7-b9ccf66a7b5f',
        filename: 'test.txt',
        file_path: 'test/test.txt',
        file_size: 100
      })
      .select()
    
    if (error1) {
      console.error('❌ Test 1 error:', error1.message)
    } else {
      console.log('✅ Test 1 success:', test1)
      // Clean up
      if (test1?.[0]?.id) {
        await supabase.from('vendor_files').delete().eq('id', test1[0].id)
      }
      return
    }
    
    // Test 2: Add original_filename
    console.log('Test 2: With original_filename')
    const { data: test2, error: error2 } = await supabase
      .from('vendor_files')
      .insert({
        vendor_id: '253c581c-a6b3-4964-9cf7-b9ccf66a7b5f',
        filename: 'test.txt',
        original_filename: 'test.txt',
        file_path: 'test/test.txt',
        file_size: 100
      })
      .select()
    
    if (error2) {
      console.error('❌ Test 2 error:', error2.message)
    } else {
      console.log('✅ Test 2 success:', test2)
      // Clean up
      if (test2?.[0]?.id) {
        await supabase.from('vendor_files').delete().eq('id', test2[0].id)
      }
      return
    }
    
    // Test 3: Add mime_type
    console.log('Test 3: With mime_type')
    const { data: test3, error: error3 } = await supabase
      .from('vendor_files')
      .insert({
        vendor_id: '253c581c-a6b3-4964-9cf7-b9ccf66a7b5f',
        filename: 'test.txt',
        original_filename: 'test.txt',
        file_path: 'test/test.txt',
        file_size: 100,
        mime_type: 'text/plain'
      })
      .select()
    
    if (error3) {
      console.error('❌ Test 3 error:', error3.message)
    } else {
      console.log('✅ Test 3 success:', test3)
      // Clean up
      if (test3?.[0]?.id) {
        await supabase.from('vendor_files').delete().eq('id', test3[0].id)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testMinimalInsert()