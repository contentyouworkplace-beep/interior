// Move files inside the expense-documents bucket from a legacy folder to the standard userId/expenseId
// Usage:
//   node scripts/move-expense-files.js <userId> <fromFolderName> <toExpenseId>
// Example:
//   node scripts/move-expense-files.js 4bdb74e7-... 333fba98-... a7a4fe19-...

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  const [userId, fromFolder, toExpenseId] = process.argv.slice(2)
  if (!userId || !fromFolder || !toExpenseId) {
    console.log('Usage: node scripts/move-expense-files.js <userId> <fromFolderName> <toExpenseId>')
    process.exit(1)
  }

  const bucket = supabase.storage.from('expense-documents')
  const fromBase = `${userId}/${fromFolder}`
  const toBase = `${userId}/${toExpenseId}`

  console.log('📦 Moving files in bucket expense-documents')
  console.log('  From:', fromBase)
  console.log('  To  :', toBase)

  const { data: list, error } = await bucket.list(fromBase, { limit: 100 })
  if (error) {
    console.error('❌ Error listing source folder:', error)
    process.exit(1)
  }

  if (!list || list.length === 0) {
    console.log('⚠️ No files found in source folder.')
    return
  }

  // Create destination folder by uploading a tiny marker (Supabase creates folders implicitly)
  const markerPath = `${toBase}/.keep`;
  await bucket.upload(markerPath, new Blob(['keep']), { upsert: true }).catch(() => {})

  for (const obj of list) {
    const isFolder = !obj.name?.includes('.') && (!obj.metadata || obj.metadata.size == null)
    if (isFolder) continue
    const fromPath = `${fromBase}/${obj.name}`
    const toPath = `${toBase}/${obj.name}`

    console.log('➡️  Moving', fromPath, '->', toPath)

    // Download then re-upload (Supabase storage has copy/move in Management API, but via JS client we workaround)
    const { data: downloadData, error: dlErr } = await bucket.download(fromPath)
    if (dlErr) {
      console.error('  ❌ Download error:', dlErr)
      continue
    }

    const { error: upErr } = await bucket.upload(toPath, downloadData, { upsert: true })
    if (upErr) {
      console.error('  ❌ Upload error:', upErr)
      continue
    }

    // Remove old file
    const { error: rmErr } = await bucket.remove([fromPath])
    if (rmErr) {
      console.error('  ❌ Remove old error:', rmErr)
    } else {
      console.log('  ✅ Moved')
    }
  }

  console.log('🎉 Done')
}

main().catch(e => { console.error('❌ Unexpected error:', e); process.exit(1) })
