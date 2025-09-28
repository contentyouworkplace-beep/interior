const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing env vars NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key)

async function audit() {
  console.log('🔎 Auditing RLS state...')

  // Query tables with relrowsecurity
  const sqlTables = `SELECT nspname AS schema, relname AS table_name, relrowsecurity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE relkind = 'r' AND nspname NOT IN ('pg_catalog', 'information_schema')
    ORDER BY relname;`

  const sqlPolicies = `SELECT schemaname, tablename, policyname, permissive, roles, qual, using
    FROM pg_policies
    ORDER BY schemaname, tablename;`

  const { data: tables, error: err1 } = await supabase.rpc('exec_sql', { sql: sqlTables })
  if (err1) {
    console.error('Error querying tables:', err1.message)
  } else {
    console.log('\nTables with relrowsecurity flag:')
    tables.forEach(t => console.log(`- ${t.schema}.${t.table_name}  relrowsecurity=${t.relrowsecurity}`))
  }

  const { data: policies, error: err2 } = await supabase.rpc('exec_sql', { sql: sqlPolicies })
  if (err2) {
    console.error('Error querying policies:', err2.message)
  } else {
    console.log('\nPolicies:')
    policies.forEach(p => console.log(`- ${p.schemaname}.${p.tablename} :: ${p.policyname}`))
  }
}

audit().catch(e => console.error(e))
