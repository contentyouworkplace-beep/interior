const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Test quotation creation to verify the fix
async function testQuotationCreation() {
  console.log('🧪 Testing quotation creation after fixes...')
  
  try {
    // Test via API (simulating what the frontend does)
    const response = await fetch('http://localhost:3000/api/quotations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: "298eeea5-0eec-46da-b1ba-f928cec9c14a",
        title: "Test Quotation from Script",
        issue_date: "2025-09-20",
        valid_until: "2025-10-20",
        subtotal: 1500,
        tax_rate: 18,
        tax_amount: 270,
        total_amount: 1770,
        currency: "INR",
        notes: "Test notes from automated test",
        terms: "Payment within 30 days",
        items: [
          {
            description: "Interior Design Consultation",
            quantity: 1,
            unit_price: 1500,
            amount: 1500,
            tax_rate: 18,
            tax_amount: 270,
            item_order: 1
          }
        ]
      })
    })

    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('✅ Quotation creation test PASSED!')
      console.log('📋 Created quotation:', {
        id: result.quotation.id,
        number: result.quotation.quotation_number,
        title: result.quotation.title,
        total: result.quotation.total_amount
      })
      
      // Verify we can fetch it back
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      const { data: fetchedQuotation, error: fetchError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', result.quotation.id)
        .single()
      
      if (fetchError) {
        console.error('❌ Error fetching created quotation:', fetchError)
      } else {
        console.log('✅ Successfully fetched created quotation from database')
        console.log('📋 Database record:', {
          id: fetchedQuotation.id,
          quotation_number: fetchedQuotation.quotation_number,
          title: fetchedQuotation.title,
          total_amount: fetchedQuotation.total_amount,
          terms: fetchedQuotation.terms
        })
      }
      
    } else {
      console.error('❌ Quotation creation test FAILED!')
      console.error('Response status:', response.status)
      console.error('Response body:', result)
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

testQuotationCreation()