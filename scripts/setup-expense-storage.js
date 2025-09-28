#!/usr/bin/env node

/**
 * Setup Expense Storage Bucket
 * Creates storage bucket for expense receipts, bills, and documents
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function setupExpenseDocumentStorage() {
  console.log('🚀 Setting up expense document storage...')
  
  try {
    // 1. Create storage bucket for expense documents
    console.log('📁 Creating expense-documents bucket...')
    const { data: bucketData, error: bucketError } = await supabase.storage
      .createBucket('expense-documents', {
        public: false, // Private bucket for security
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/gif'],
        fileSizeLimit: 5242880, // 5MB limit
      })

    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError
    }
    
    if (bucketData) {
      console.log('✅ Expense documents bucket created successfully')
    } else {
      console.log('ℹ️  Expense documents bucket already exists')
    }

    // 2. Test bucket access
    console.log('🧪 Testing bucket access...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      throw listError
    }
    
    const expenseBucket = buckets.find(bucket => bucket.name === 'expense-documents')
    if (expenseBucket) {
      console.log('✅ Expense documents bucket is accessible')
      console.log(`   📊 Bucket ID: ${expenseBucket.id}`)
      console.log(`   📊 Created: ${expenseBucket.created_at}`)
      console.log(`   📊 Public: ${expenseBucket.public}`)
    }

    console.log('\n🎉 EXPENSE DOCUMENT STORAGE SETUP COMPLETE!')
    console.log('📁 Bucket: expense-documents')
    console.log('🔒 Security: Private bucket')
    console.log('📎 Allowed files: JPG, PNG, WebP, PDF, GIF (max 5MB)')
    console.log('🌐 Access via: http://localhost:3001/expenses')
    console.log('\n📝 File structure: {user_id}/receipts/{filename}')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run the setup
setupExpenseDocumentStorage().then(() => {
  console.log('✨ Setup completed successfully!')
  process.exit(0)
}).catch(error => {
  console.error('💥 Setup failed:', error)
  process.exit(1)
})