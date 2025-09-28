#!/usr/bin/env node
/**
 * Create 'portfolio-media' storage bucket (used by PortfolioService)
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function ensurePortfolioMediaBucket() {
  console.log('📦 Ensuring storage bucket "portfolio-media" exists...')
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.error('❌ Could not list buckets:', listError.message)
    process.exit(1)
  }

  const exists = buckets?.some(b => b.name === 'portfolio-media')
  if (exists) {
    console.log('✅ Bucket already exists')
    process.exit(0)
  }

  const { data, error } = await supabase.storage.createBucket('portfolio-media', {
    public: false,
    fileSizeLimit: 1024 * 1024 * 200, // 200MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]
  })
  if (error) {
    console.error('❌ Failed to create bucket:', error.message)
    process.exit(1)
  }

  console.log('✅ Created bucket portfolio-media')
}

ensurePortfolioMediaBucket()
