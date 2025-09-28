const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixQuotationsTable() {
  try {
    console.log('🔍 Checking quotations table structure...')
    
    // Check if the table exists
    const { data: tableExists, error: tableExistsError } = await supabase
      .from('quotations')
      .select('id')
      .limit(1)
    
    if (tableExistsError && tableExistsError.code === '42P01') {
      console.log('⚠️ Quotations table does not exist - creating it...')
      await createQuotationsTable()
      console.log('✅ Table created')
    } else if (tableExistsError) {
      console.error('❌ Error checking table:', tableExistsError)
      return
    } else {
      console.log('✅ Quotations table exists')
      
      // Get table structure using Supabase API
      console.log('🔍 Analyzing quotations table structure...')
      
      // Test insert to verify and find missing columns
      const testData = {
        user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
        client_id: "298eeea5-0eec-46da-b1ba-f928cec9c14a", // Using the valid client ID we found
        quotation_number: "TEST-COLUMNS",
        title: "Test Column Structure",
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: new Date().toISOString().split('T')[0],
        subtotal: 100.00,
        tax_rate: 18.0,
        tax_amount: 18.00,
        discount_amount: 0.00,
        total_amount: 118.00,
        currency: "INR",
        notes: "Test notes",
        terms_conditions: "Test terms and conditions",
        items: JSON.stringify([
          {
            name: "Test Item",
            description: "Test Description",
            quantity: 1,
            unit_price: 100.00,
            total: 100.00
          }
        ]),
        status: "draft",
        template: "standard"
      }
      
      const { data: testInsert, error: testInsertError } = await supabase
        .from('quotations')
        .insert(testData)
        .select()
      
      if (testInsertError) {
        console.log('❌ Test insert failed, analyzing error:', testInsertError)
        
        // Check what columns we're missing
        if (testInsertError.message.includes('does not exist')) {
          const missingColumns = []
          
          // Extract missing column names from error message
          const regex = /column "([^"]+)" does not exist/g
          let match
          
          while ((match = regex.exec(testInsertError.message)) !== null) {
            missingColumns.push(match[1])
          }
          
          console.log('⚠️ Missing columns:', missingColumns)
          
          // Add missing columns
          if (missingColumns.length > 0) {
            console.log('🔧 Adding missing columns...')
            
            for (const column of missingColumns) {
              let dataType = 'TEXT'
              let defaultValue = 'NULL'
              
              // Determine appropriate data type and default based on column name
              if (column === 'items') {
                dataType = 'JSONB'
                defaultValue = "'[]'"
              } else if (column === 'terms_conditions') {
                dataType = 'TEXT'
              } else if (column === 'tax_rate') {
                dataType = 'DECIMAL(5,2)'
                defaultValue = '18.0'
              } else if (column === 'tax_amount' || column === 'subtotal' || column === 'discount_amount') {
                dataType = 'DECIMAL(12,2)'
                defaultValue = '0'
              } else if (column === 'status') {
                dataType = 'TEXT'
                defaultValue = "'draft'"
              } else if (column === 'template') {
                dataType = 'TEXT'
                defaultValue = "'standard'"
              } else if (column === 'currency') {
                dataType = 'TEXT'
                defaultValue = "'INR'"
              }
              
              try {
                const { data, error } = await supabase.rpc('exec_sql', {
                  sql: `ALTER TABLE quotations ADD COLUMN IF NOT EXISTS ${column} ${dataType} DEFAULT ${defaultValue};`
                })
                
                if (error) {
                  console.log(`❌ Failed to add column ${column}:`, error)
                  
                  // Try direct query approach
                  const { error: directError } = await supabase
                    .from('quotations')
                    .update({ [column]: null })
                    .eq('id', 'dummy-id-that-doesnt-exist')
                  
                  if (directError && !directError.message.includes('does not exist')) {
                    console.log(`✅ Column ${column} seems to exist now`)
                  } else {
                    console.log(`❌ Still can't verify column ${column}:`, directError)
                  }
                } else {
                  console.log(`✅ Added column ${column}`)
                }
              } catch (err) {
                console.error(`❌ Error adding column ${column}:`, err)
              }
            }
          }
        }
      } else {
        console.log('✅ Test insert successful, table structure looks good:', testInsert)
      }
    }
    
    // Final verification
    console.log('🧪 Final verification...')
    const { data: finalCheck, error: finalCheckError } = await supabase
      .from('quotations')
      .select('*')
      .limit(1)
    
    if (finalCheckError) {
      console.error('❌ Final verification failed:', finalCheckError)
    } else {
      console.log('✅ Quotations table is ready for use!')
      console.log('📋 Table structure sample:', finalCheck)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

async function createQuotationsTable() {
  // This will be called if the table doesn't exist
  try {
    const { data, error } = await supabase
      .from('quotations')
      .insert({
        user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
        client_id: "298eeea5-0eec-46da-b1ba-f928cec9c14a",
        quotation_number: "INITIAL-TEST",
        title: "Initial Test Quotation",
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: new Date().toISOString().split('T')[0],
        subtotal: 100.00,
        tax_rate: 18.0,
        tax_amount: 18.00,
        discount_amount: 0.00,
        total_amount: 118.00,
        status: "draft",
        currency: "INR",
        items: []
      })
      .select()
    
    if (error) {
      console.error('❌ Initial insert failed:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('❌ Error creating table:', error)
    throw error
  }
}

fixQuotationsTable()