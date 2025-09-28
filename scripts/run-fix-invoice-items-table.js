/*
Run this script locally to apply the migration using your Supabase service_role key.
Usage:
  node scripts/run-fix-invoice-items-table.js

Make sure you have .env in project root with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
*/

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const sqlFile = path.join(__dirname, '../migrations/2025-09-25-fix-invoice-items-table.sql')
const sql = fs.readFileSync(sqlFile, 'utf8')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE URL or KEY in environment. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function run() {
  try {
    console.log('Applying migration...')
    const res = await supabase.rpc('exec_sql', { sql })
    if (res.error) {
      console.error('Migration error:', res.error)
      process.exit(1)
    }
    console.log('Migration applied. Response:', res)
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
}

run()
