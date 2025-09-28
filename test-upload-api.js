const FormData = require('form-data')
const fetch = require('node-fetch')
const fs = require('fs')

async function testUploadAPI() {
  console.log('🧪 Testing the /api/upload-file endpoint...')
  
  try {
    // Create a test PDF file
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Test PDF Content) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000136 00000 n 
0000000229 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
323
%%EOF`

    // Write test PDF file
    fs.writeFileSync('/tmp/test-upload.pdf', pdfContent)
    
    // Create FormData
    const form = new FormData()
    form.append('file', fs.createReadStream('/tmp/test-upload.pdf'), {
      filename: 'test-upload.pdf',
      contentType: 'application/pdf'
    })
    form.append('vendorId', 'test-vendor-123')
    form.append('description', 'Test PDF upload')
    form.append('category', 'invoice')
    
    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/upload-file', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Upload API test successful!')
      console.log('📤 Upload result:', result)
    } else {
      console.error('❌ Upload API test failed:', result)
    }
    
    // Clean up
    fs.unlinkSync('/tmp/test-upload.pdf')
    
  } catch (error) {
    console.error('❌ Error during API test:', error.message)
  }
}

testUploadAPI()