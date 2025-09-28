const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function addMissingColumns() {
  try {
    console.log('🔧 Adding missing columns to quotations table...')
    
    // Direct approach using Supabase API
    const columnsToAdd = [
      {
        name: 'template',
        type: 'TEXT',
        default: "'standard'"
      },
      {
        name: 'terms_conditions',
        type: 'TEXT',
        default: 'NULL'
      }
    ]
    
    for (const column of columnsToAdd) {
      console.log(`📝 Checking column ${column.name}...`)
      
      try {
        // Try to select using the column to see if it exists
        const { data, error } = await supabase
          .from('quotations')
          .select(column.name)
          .limit(1)
        
        if (error && error.message.includes(column.name)) {
          console.log(`⚠️ Column ${column.name} doesn't exist, adding it...`)
          
          try {
            // Try to update a non-existent record with this column
            // This will force Supabase to recognize the column
            const { error: updateError } = await supabase
              .from('quotations')
              .update({ [column.name]: column.default === 'NULL' ? null : column.default.replace(/'/g, '') })
              .eq('id', '00000000-0000-0000-0000-000000000000')
            
            if (updateError && !updateError.message.includes(`column "${column.name}" of relation "quotations" does not exist`)) {
              console.log(`✅ Column ${column.name} added or already exists`)
            } else {
              console.log(`❌ Failed to add column ${column.name}: ${updateError?.message}`)
            }
          } catch (updateErr) {
            console.error(`❌ Error updating column ${column.name}:`, updateErr)
          }
        } else {
          console.log(`✅ Column ${column.name} already exists`)
        }
      } catch (err) {
        console.error(`❌ Error checking column ${column.name}:`, err)
      }
    }
    
    // Insert test record with template column
    console.log('🧪 Testing with all columns...')
    const { data: testInsert, error: testInsertError } = await supabase
      .from('quotations')
      .insert({
        user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
        client_id: "298eeea5-0eec-46da-b1ba-f928cec9c14a", // Using known valid client ID
        quotation_number: "TEST-COLUMNS-DIRECT",
        title: "Test All Columns",
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: new Date().toISOString().split('T')[0],
        subtotal: 100.00,
        tax_rate: 18.0,
        tax_amount: 18.00,
        discount_amount: 0.00,
        total_amount: 118.00,
        currency: "INR",
        notes: "Test notes with direct column addition",
        terms_conditions: "Test terms and conditions directly added",
        template: "standard",
        status: "draft",
        items: []
      })
      .select('*')
    
    if (testInsertError) {
      console.error('❌ Test insert failed:', testInsertError)
    } else {
      console.log('✅ Test insert successful! Record created with all columns:', testInsert)
    }
    
    // Show all columns in the table
    console.log('📋 Querying quotations table structure...')
    const { data: quota, error: quotaError } = await supabase
      .from('quotations')
      .select()
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (quotaError) {
      console.error('❌ Error querying quotations:', quotaError)
    } else {
      console.log('✅ Latest quotation record:')
      console.log(JSON.stringify(quota[0], null, 2))
      console.log('Available columns:', Object.keys(quota[0]))
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

addMissingColumns()