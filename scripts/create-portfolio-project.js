#!/usr/bin/env node
// Create a single portfolio project using a provided user_id (via CLI or env)
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  const user_id = process.argv[2] || process.env.TEST_USER_ID
  if (!user_id) {
    console.error('Usage: node scripts/create-portfolio-project.js <user_id>')
    process.exit(1)
  }
  const payload = {
    title: 'My First Portfolio Project',
    category: 'living-room',
    status: 'published',
    featured: false,
    user_id
  }
  const { data, error } = await supabase
    .from('portfolio_projects')
    .insert([payload])
    .select()
    .single()
  if (error) {
    console.error('❌ Insert failed:', error.message)
    process.exit(1)
  }
  console.log('✅ Created project:', data)
}

main()
