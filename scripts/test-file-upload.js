// Test file upload directly
// Run: node scripts/test-file-upload.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials. Check .env.local')
  process.exit(1)
}

// Use the same client configuration as the browser
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpload() {
  console.log('🧪 Testing file upload with browser client...')

  // First check if we can authenticate (simulate browser login)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.log('⚠️ No authenticated user found. Need to login first.')
    console.log('This test should be run in the browser console while logged in.')
    return
  }

  console.log('✅ User authenticated:', user.id)

  // Create a test file
  const testContent = 'This is a test file content for expense upload'
  const testFile = new Blob([testContent], { type: 'text/plain' })
  const fileName = `${user.id}/test-expense-${Date.now()}/test-receipt.txt`

  console.log('📤 Uploading test file to:', fileName)

  const { data, error } = await supabase.storage
    .from('expense-documents')
    .upload(fileName, testFile, {
      cacheControl: '3600',
      upsert: false,
      metadata: {
        type: 'receipt',
        description: 'Test upload',
        userId: user.id,
        expenseId: 'test-expense-' + Date.now()
      }
    })

  if (error) {
    console.error('❌ Upload failed:', error)
    return
  }

  console.log('✅ Upload successful:', data.path)

  // Test public URL generation
  const { data: urlData } = supabase.storage
    .from('expense-documents')
    .getPublicUrl(data.path)

  if (urlData?.publicUrl) {
    console.log('🔗 Public URL:', urlData.publicUrl)
  }

  console.log('🎉 File upload test completed successfully!')
}

// For Node.js testing (won't work without browser auth)
if (typeof window === 'undefined') {
  console.log('📝 Copy this code and run it in the browser console:')
  console.log(`
// Test file upload in browser console:
const testUpload = async () => {
  const testContent = 'Test expense attachment';
  const testFile = new Blob([testContent], { type: 'text/plain' });
  const user = (await supabase.auth.getUser()).data.user;
  
  if (!user) {
    console.log('❌ Not logged in');
    return;
  }
  
  const fileName = \`\${user.id}/test-\${Date.now()}/test-receipt.txt\`;
  console.log('📤 Uploading to:', fileName);
  
  const result = await supabase.storage
    .from('expense-documents')  
    .upload(fileName, testFile, {
      cacheControl: '3600',
      upsert: false,
      metadata: { type: 'receipt', description: 'Test' }
    });
    
  console.log('Result:', result);
  
  if (result.data) {
    const { data: url } = supabase.storage
      .from('expense-documents')
      .getPublicUrl(result.data.path);
    console.log('Public URL:', url.publicUrl);
  }
};

testUpload();
`)
} else {
  // Browser environment
  testUpload()
}