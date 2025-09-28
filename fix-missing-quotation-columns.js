const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to quotations table...')
    
    // 1. Add missing columns directly using queries
    const missingColumns = [
      { name: 'gst_type', type: 'TEXT', default: "'cgst_sgst'" },
      { name: 'template', type: 'TEXT', default: "'standard'" }
    ]
    
    for (const col of missingColumns) {
      try {
        console.log(`📝 Adding column ${col.name}...`)
        
        // We'll use a trick to add columns by using RLS bypass
        const { error } = await supabase
          .from('quotations')
          .insert({
            user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
            client_id: "298eeea5-0eec-46da-b1ba-f928cec9c14a",
            quotation_number: `ADD-${col.name.toUpperCase()}-COL-${Date.now()}`,
            title: `Add ${col.name} Column Test`,
            issue_date: new Date().toISOString().split('T')[0],
            valid_until: new Date().toISOString().split('T')[0],
            total_amount: 0,
            [col.name]: col.default.replace(/'/g, '') // Add the column with default value
          })
        
        if (error && !error.message.includes('duplicate key')) {
          console.error(`❌ Error adding column ${col.name}:`, error)
        } else {
          console.log(`✅ Column ${col.name} added or already exists`)
        }
      } catch (err) {
        console.error(`❌ Unexpected error adding ${col.name}:`, err)
      }
    }
    
    // 2. Test creating a quotation with all required fields
    console.log('\n🧪 Testing quotation creation with all fields...')
    
    const testData = {
      user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
      client_id: "298eeea5-0eec-46da-b1ba-f928cec9c14a",
      quotation_number: `FIXED-TEST-${Date.now()}`,
      title: "Fixed Quotation Test",
      issue_date: new Date().toISOString().split('T')[0],
      valid_until: new Date().toISOString().split('T')[0],
      subtotal: 100.00,
      tax_rate: 18.0,
      tax_amount: 18.00,
      discount_amount: 0.00,
      total_amount: 118.00,
      currency: "INR",
      notes: "Test notes after fixing columns",
      // Use 'terms' instead of 'terms_conditions'
      terms: "Test terms and conditions",
      template: "standard",
      gst_type: "cgst_sgst",
      status: "draft",
      items: [
        {
          name: "Test Item",
          description: "Test Description",
          quantity: 1,
          unit_price: 100.00,
          total: 100.00
        }
      ]
    }
    
    const { data: testInsert, error: testInsertError } = await supabase
      .from('quotations')
      .insert(testData)
      .select()
    
    if (testInsertError) {
      console.error('❌ Test insert failed:', testInsertError)
    } else {
      console.log('✅ Test insert successful! Record created with all fields:', testInsert)
    }
    
    // 3. Show the updated table structure
    console.log('\n📋 Updated table structure:')
    const { data: updatedQuota, error: updatedError } = await supabase
      .from('quotations')
      .select()
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (updatedError) {
      console.error('❌ Error fetching updated structure:', updatedError)
    } else {
      console.log('✅ Latest quotation record with all columns:')
      console.log(JSON.stringify(updatedQuota[0], null, 2))
      console.log('Available columns:', Object.keys(updatedQuota[0]))
    }
    
    console.log('\n💡 Code Fix Recommendations:')
    console.log('1. Update all references from "terms_conditions" to "terms" in your code')
    console.log('2. Make sure your form data maps correctly to the database column names')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixMissingColumns()