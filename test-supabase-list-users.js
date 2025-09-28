require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE env vars')
    process.exit(1)
  }
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const res = await supabase.auth.admin.listUsers()
    console.log('admin.listUsers response:')
    console.dir(res, { depth: 5 })
  } catch (err) {
    console.error('Error calling admin.listUsers:', err)
  }
}

main()
