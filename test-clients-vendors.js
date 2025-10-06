const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testData() {
  // This will only work if you're logged in via the browser
  // Just checking table structure
  const { data: clients, error: clientsError, count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: false })
    .limit(5)
  
  const { data: vendors, error: vendorsError, count: vendorsCount } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: false })
    .limit(5)
  
  console.log('Clients:', { count: clientsCount, error: clientsError, sample: clients?.length || 0 })
  console.log('Vendors:', { count: vendorsCount, error: vendorsError, sample: vendors?.length || 0 })
}

testData()
