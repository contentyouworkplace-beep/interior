// Check storage uploads for recent expenses and print URLs
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listUrlsAt(bucket, basePath) {
  const { data: objects, error } = await bucket.list(basePath, { limit: 100 })
  if (error) {
    return { urls: [], error }
  }
  if (!objects || objects.length === 0) return { urls: [], error: null }
  const urls = []
  for (const obj of objects) {
    // Skip folder placeholders (no extension and likely no metadata.size)
    const isFolder = !obj.name?.includes('.') && (!obj.metadata || obj.metadata.size == null)
    if (isFolder) continue
    const { data: pub } = bucket.getPublicUrl(`${basePath}/${obj.name}`)
    if (pub?.publicUrl) urls.push(pub.publicUrl)
  }
  return { urls, error: null }
}

async function listUrlsRecursive(bucket, basePath, depth = 2) {
  const results = []
  const { data: objects, error } = await bucket.list(basePath, { limit: 100 })
  if (error) return results
  for (const obj of objects || []) {
    const isFolder = !obj.name?.includes('.') && (!obj.metadata || obj.metadata.size == null)
    if (isFolder && depth > 0) {
      const childBase = `${basePath}/${obj.name}`
      const childFiles = await listUrlsRecursive(bucket, childBase, depth - 1)
      results.push(...childFiles)
    } else if (!isFolder) {
      const { data: pub } = bucket.getPublicUrl(`${basePath}/${obj.name}`)
      if (pub?.publicUrl) results.push(pub.publicUrl)
    }
  }
  return results
}

async function main() {
  const bucket = supabase.storage.from('expense-documents')
  const [argExpenseId, argUserId] = process.argv.slice(2)

  console.log('=== STORAGE CHECK: expense-documents ===')
  console.log('Args: expenseId =', argExpenseId || '(none)', ', userId =', argUserId || '(none)')

  const expensesToCheck = []

  if (argExpenseId && argUserId) {
    // Use provided pair
    expensesToCheck.push({ id: argExpenseId, user_id: argUserId })
  } else if (argExpenseId) {
    // Try to fetch row by id to get user_id
    const { data: exp, error } = await supabase
      .from('expenses')
      .select('id, user_id, description, created_at')
      .eq('id', argExpenseId)
      .maybeSingle()
    if (error) console.warn('⚠️ Could not fetch expense by id:', error)
    if (exp) expensesToCheck.push(exp)
  } else {
    // Fetch recent expenses
    const { data, error } = await supabase
      .from('expenses')
      .select('id, user_id, description, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) {
      console.error('❌ Error fetching expenses:', error)
      process.exit(1)
    }
    expensesToCheck.push(...(data || []))
  }

  if (expensesToCheck.length === 0) {
    console.log('No expenses to check.')
    return
  }

  for (const exp of expensesToCheck) {
    const header = `${exp.id}  |  user=${exp.user_id}  |  desc=${exp.description || ''}`
    console.log('\n--- Expense ---\n', header)

    const candidates = [
      `${exp.user_id}/${exp.id}`,
      `${exp.id}`,
    ]

    let found = []
    for (const p of candidates) {
      const { urls, error } = await listUrlsAt(bucket, p)
      if (error) {
        console.log('  Path:', p, 'error:', error?.message || error)
        continue
      }
      if (urls.length > 0) {
        found = urls
        console.log('  Path:', p, '->', urls.length, 'file(s)')
        urls.forEach((u, i) => console.log(`   [${i+1}] ${u}`))
        break
      } else {
        console.log('  Path:', p, '-> 0 files')
      }
    }

    if (found.length === 0) {
      // Recursively scan user folder for any nested files (depth 2)
      const userFolder = `${exp.user_id}`
      const deepUrls = await listUrlsRecursive(bucket, userFolder, 2)
      if (deepUrls.length > 0) {
        console.log('  🔎 Found files under user folder (recursive search):', deepUrls.length)
        deepUrls.forEach((u, i) => console.log(`   [${i+1}] ${u}`))
      } else {
        console.log('  Recursive user-folder scan found 0 files')
      }
    }

    if (found.length === 0) {
      console.log('  ⚠️ No files found for this expense in known paths.')
    }
  }

  console.log('\n=== Done ===')
}

main().catch(e => {
  console.error('❌ Unexpected error:', e)
  process.exit(1)
})
