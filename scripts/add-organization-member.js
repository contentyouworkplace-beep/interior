#!/usr/bin/env node
// Dev-only script to add an organization_members row using Supabase service key
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/add-organization-member.js <organization_id> <user_id>

const { createClient } = require('@supabase/supabase-js')

const orgId = process.argv[2]
const userId = process.argv[3]

if (!orgId || !userId) {
  console.error('Usage: node scripts/add-organization-member.js <organization_id> <user_id>')
  process.exit(1)
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment')
  process.exit(1)
}

;(async () => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const payload = { organization_id: orgId, user_id: userId, role: 'admin' }
    // Use upsert to avoid duplicates
    const { data, error } = await supabase
      .from('organization_members')
      .upsert(payload, { onConflict: ['organization_id', 'user_id'] })
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Supabase error:', error)
      process.exit(2)
    }

    console.log('Upsert result:', data)
  } catch (err) {
    console.error('Error:', err)
    process.exit(3)
  }
})()
