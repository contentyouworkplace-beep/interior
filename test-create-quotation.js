const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testCreateQuotation() {
  try {
    console.log('🧪 Testing quotation creation with fixed structure...')
    
    // 1. Find a valid client
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .limit(1)
    
    if (clientError || !clients || clients.length === 0) {
      console.error('❌ Error finding valid client:', clientError || 'No clients found')
      return
    }
    
    const clientId = clients[0].id
    console.log('✅ Using client ID:', clientId)
    
    // 2. Create test quotation data
    const quotationData = {
      user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
      client_id: clientId,
      quotation_number: `TEST-${Date.now()}`,
      title: "Final Test Quotation",
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal: 1000.00,
      tax_rate: 18.0,
      tax_amount: 180.00,
      discount_amount: 0.00,
      total_amount: 1180.00,
      currency: "INR",
      notes: "Test notes with fixed structure",
      terms: "Test terms with fixed structure", // Using 'terms' instead of 'terms_conditions'
      status: "draft",
      items: [
        {
          name: "Design Consultation",
          description: "Initial design consultation",
          quantity: 1,
          unit_price: 1000.00,
          total: 1000.00
        }
      ]
    }
    
    // 3. Insert quotation
    const { data: newQuotation, error: insertError } = await supabase
      .from('quotations')
      .insert(quotationData)
      .select()
    
    if (insertError) {
      console.error('❌ Error creating quotation:', insertError)
    } else {
      console.log('✅ Quotation created successfully:', newQuotation)
      
      // 4. Verify structure
      const { data: verifyQuotation, error: verifyError } = await supabase
        .from('quotations')
        .select('*')
        .eq('id', newQuotation[0].id)
        .single()
      
      if (verifyError) {
        console.error('❌ Error verifying quotation:', verifyError)
      } else {
        console.log('✅ Verified quotation structure:', verifyQuotation)
        console.log('📋 Available columns:', Object.keys(verifyQuotation))
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testCreateQuotation()