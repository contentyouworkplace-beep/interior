const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testAllFileTypes() {
  console.log('🧪 Testing upload with different file types...')
  
  try {
    // Test with different MIME types
    const testFiles = [
      { name: 'test.pdf', type: 'application/pdf', content: 'PDF test content' },
      { name: 'test.txt', type: 'text/plain', content: 'Text file content' },
      { name: 'test.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', content: 'Word doc content' },
      { name: 'test.zip', type: 'application/zip', content: 'ZIP file content' },
      { name: 'test.mp4', type: 'video/mp4', content: 'Video file content' }
    ]
    
    for (const testFile of testFiles) {
      console.log(`📤 Testing ${testFile.name} (${testFile.type})...`)
      
      const blob = new Blob([testFile.content], { type: testFile.type })
      const fileName = `test-${Date.now()}-${testFile.name}`
      
      const { data, error } = await supabase.storage
        .from('client-files')
        .upload(`test/${fileName}`, blob)
      
      if (error) {
        console.error(`❌ ${testFile.name} failed:`, error.message)
      } else {
        console.log(`✅ ${testFile.name} uploaded successfully`)
        
        // Clean up
        await supabase.storage
          .from('client-files')
          .remove([`test/${fileName}`])
      }
    }
    
    console.log('🎉 All file type tests completed!')
    
  } catch (error) {
    console.error('❌ Error during test:', error)
  }
}

testAllFileTypes()