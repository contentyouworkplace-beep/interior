require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.error('URL:', supabaseUrl ? 'Set' : 'Not set')
  console.error('KEY:', supabaseKey ? 'Set' : 'Not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 Checking existing tables...')
  
  try {
    // Check if quotations table exists
    const { data: quotations, error: quotationsError } = await supabase
      .from('quotations')
      .select('count')
      .limit(1)
    
    if (quotationsError) {
      console.log('❌ Quotations table does not exist or has issues:', quotationsError.message)
    } else {
      console.log('✅ Quotations table exists')
    }

    // Check if invoices table exists
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('count')
      .limit(1)
    
    if (invoicesError) {
      console.log('❌ Invoices table does not exist or has issues:', invoicesError.message)
    } else {
      console.log('✅ Invoices table exists')
    }

    // Check if clients table exists
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('count')
      .limit(1)
    
    if (clientsError) {
      console.log('❌ Clients table does not exist or has issues:', clientsError.message)
    } else {
      console.log('✅ Clients table exists')
    }

    // Check if projects table exists
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('count')
      .limit(1)
    
    if (projectsError) {
      console.log('❌ Projects table does not exist or has issues:', projectsError.message)
    } else {
      console.log('✅ Projects table exists')
    }

  } catch (error) {
    console.error('Error checking tables:', error)
  }
}

checkTables()