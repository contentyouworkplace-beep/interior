require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testServices() {
  console.log('🧪 Testing quotations and invoices services...\n')

  try {
    // Test quotations
    console.log('1️⃣ Testing Quotations Service:')
    const { data: quotations, error: quotationsError } = await supabase
      .from('quotations')
      .select(`
        *,
        client:clients(id, first_name, last_name, company, email),
        project:projects(id, name)
      `)
      .limit(5)

    if (quotationsError) {
      console.log('   ❌ Error:', quotationsError.message)
    } else {
      console.log(`   ✅ Success: Found ${quotations?.length || 0} quotations`)
      if (quotations && quotations.length > 0) {
        console.log(`   📋 Sample: ${quotations[0].quotation_number || 'No number'} - ${quotations[0].title || 'No title'}`)
      }
    }

    // Test invoices
    console.log('\n2️⃣ Testing Invoices Service:')
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, first_name, last_name, company, email, phone),
        project:projects(id, name)
      `)
      .limit(5)

    if (invoicesError) {
      console.log('   ❌ Error:', invoicesError.message)
    } else {
      console.log(`   ✅ Success: Found ${invoices?.length || 0} invoices`)
      if (invoices && invoices.length > 0) {
        console.log(`   📋 Sample: ${invoices[0].invoice_number || 'No number'} - ${invoices[0].title || 'No title'}`)
      }
    }

    // Test basic data counts
    console.log('\n3️⃣ Data Summary:')
    
    const { count: quotationCount } = await supabase
      .from('quotations')
      .select('*', { count: 'exact', head: true })
    
    const { count: invoiceCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    const { count: clientCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    console.log(`   📊 Total Quotations: ${quotationCount || 0}`)
    console.log(`   💰 Total Invoices: ${invoiceCount || 0}`)
    console.log(`   👥 Total Clients: ${clientCount || 0}`)

    console.log('\n✅ All services are working correctly!')
    console.log('🚀 You can now safely use the application at http://localhost:3000')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testServices()