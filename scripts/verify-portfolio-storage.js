// Quick storage CRUD verification for portfolio bucket
// Usage: node scripts/verify-portfolio-storage.js
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const bucket = process.env.NEXT_PUBLIC_PORTFOLIO_BUCKET || 'portfolio-media'

if (!url || !key) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  console.log('ℹ️ Using bucket:', bucket)
  // 1. Ensure bucket exists
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets()
  if (bucketErr) {
    console.error('❌ listBuckets error:', bucketErr)
    process.exit(1)
  }
  const exists = buckets?.some(b => b.name === bucket)
  console.log('📦 Bucket exists?', exists ? '✅ Yes' : '❌ No')

  // 2. Create bucket if missing
  if (!exists) {
    const { error: createErr } = await supabase.storage.createBucket(bucket, { public: false })
    if (createErr && !createErr.message.includes('already exists')) {
      console.error('❌ createBucket error:', createErr)
      process.exit(1)
    }
    console.log('✅ Bucket ensured')
  }

  // 3. Upload a tiny test file
  const path = `test/${Date.now()}-hello.txt`
  const content = new Blob([`hello from verify script at ${new Date().toISOString()}`], { type: 'text/plain' })
  const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, content, { upsert: true, contentType: 'text/plain' })
  if (uploadErr) {
    console.error('❌ Upload failed:', uploadErr)
    process.exit(1)
  }
  console.log('✅ Upload ok:', path)

  // 4. List folder
  const { data: list, error: listErr } = await supabase.storage.from(bucket).list('test', { limit: 10 })
  if (listErr) {
    console.error('❌ List failed:', listErr)
    process.exit(1)
  }
  console.log('📄 Objects in test/:', list?.map(f => f.name))

  // 5. Get signed URL
  const { data: signed, error: urlErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60)
  if (urlErr) {
    console.error('❌ Signed URL failed:', urlErr)
    process.exit(1)
  }
  console.log('🔐 Signed URL:', signed?.signedUrl)

  // 6. Cleanup (optional)
  const { error: rmErr } = await supabase.storage.from(bucket).remove([path])
  if (rmErr) {
    console.error('⚠️ Remove failed:', rmErr)
  } else {
    console.log('🧹 Removed test object')
  }

  console.log('✅ Storage CRUD verification complete')
}

main().catch(err => {
  console.error('❌ Unexpected error:', err)
  process.exit(1)
})
