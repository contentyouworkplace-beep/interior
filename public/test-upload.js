// Simple test to verify upload API works
async function testUpload() {
  console.log('🧪 Testing upload API...')
  
  try {
    // Create a test blob (simulating a file)
    const testContent = 'This is a test PDF file content for debugging uploads'
    const blob = new Blob([testContent], { type: 'application/pdf' })
    
    // Create FormData like the dialog does
    const formData = new FormData()
    formData.append('file', blob, 'test-upload.pdf')
    formData.append('vendorId', '253c581c-a6b3-4964-9cf7-b9ccf66a7b5f')
    
    console.log('📤 Sending upload request...')
    
    const response = await fetch('/api/upload-file', {
      method: 'POST',
      body: formData
    })
    
    const responseText = await response.text()
    console.log('📡 Response status:', response.status)
    console.log('📡 Response text:', responseText)
    
    if (response.ok) {
      const result = JSON.parse(responseText)
      console.log('✅ Upload successful!', result)
      return result
    } else {
      console.error('❌ Upload failed:', responseText)
      throw new Error(responseText)
    }
  } catch (error) {
    console.error('❌ Test error:', error)
    throw error
  }
}

// Test when page loads
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testUpload().then(() => {
      console.log('🎉 Upload test completed successfully!')
    }).catch(error => {
      console.error('💥 Upload test failed:', error)
    })
  }, 2000)
}