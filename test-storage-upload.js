const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkStoragePolicies() {
  console.log('🔍 Checking storage bucket policies...')
  
  try {
    // Try to upload a test file to see what happens
    const testFile = new Blob(['test content'], { type: 'text/plain' })
    const testFileName = `test-${Date.now()}.txt`
    
    console.log('📤 Attempting test upload...')
    const { data, error } = await supabase.storage
      .from('client-files')
      .upload(`test/${testFileName}`, testFile)
    
    if (error) {
      console.error('❌ Test upload failed:', error)
      console.log('Error details:', JSON.stringify(error, null, 2))
    } else {
      console.log('✅ Test upload successful:', data)
      
      // Clean up test file
      await supabase.storage
        .from('client-files')
        .remove([`test/${testFileName}`])
      console.log('🗑️ Test file cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

checkStoragePolicies()