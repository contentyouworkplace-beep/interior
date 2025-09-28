const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const fs = require('fs')
const path = require('path')

async function setupQuotationsTable() {
  try {
    console.log('🛠️ Setting up quotations table...')
    
    // Read SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'setup-quotations-table.sql'), 'utf8')
    
    // Execute SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql
    })
    
    if (error) {
      console.error('❌ Error executing SQL:', error)
      
      // Try alternative approach
      console.log('🔄 Trying alternative approach - checking if table exists first...')
      
      // Check if table exists
      const { data: tables, error: tableError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = 'quotations'
            );
          `
        })
      
      if (tableError) {
        console.error('❌ Error checking table existence:', tableError)
      } else {
        const tableExists = tables && tables[0] && tables[0].exists
        console.log('📊 Quotations table exists:', tableExists)
        
        if (!tableExists) {
          console.log('🔨 Creating quotations table...')
          // Create table with minimum fields
          const { data: createResult, error: createError } = await supabase
            .rpc('exec_sql', {
              sql: `
                CREATE TABLE quotations (
                  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                  user_id UUID NOT NULL,
                  client_id UUID NOT NULL,
                  quotation_number TEXT UNIQUE NOT NULL,
                  title TEXT NOT NULL,
                  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
                  created_at TIMESTAMPTZ DEFAULT NOW()
                );
              `
            })
          
          if (createError) {
            console.error('❌ Error creating table:', createError)
          } else {
            console.log('✅ Table created successfully')
          }
        } else {
          // Check the table structure
          const { data: columns, error: columnError } = await supabase
            .rpc('exec_sql', {
              sql: `
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'quotations' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
              `
            })
          
          if (columnError) {
            console.error('❌ Error getting columns:', columnError)
          } else {
            console.log('📋 Quotations table structure:', columns)
          }
        }
      }
    } else {
      console.log('✅ SQL executed successfully')
    }
    
    // Try inserting a test quotation
    console.log('🧪 Testing with a quotation insert...')
    const { data: insertData, error: insertError } = await supabase
      .from('quotations')
      .insert({
        user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6", // Use the hardcoded user ID from the API
        client_id: "00000000-0000-0000-0000-000000000000", // This will likely fail but show us the error
        quotation_number: "TEST-SETUP",
        title: "Test Quotation",
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: new Date().toISOString().split('T')[0],
        total_amount: 100.00
      })
      .select()
    
    if (insertError) {
      console.error('❌ Test insert error:', insertError)
      
      // If error is about foreign keys, try to get a valid client ID
      if (insertError.message.includes('foreign key constraint')) {
        console.log('🔍 Looking for valid client IDs...')
        const { data: clients, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .limit(1)
        
        if (clientError) {
          console.error('❌ Error fetching clients:', clientError)
        } else if (clients && clients.length > 0) {
          console.log('✅ Found valid client:', clients[0])
          
          // Try insert with valid client
          console.log('🔄 Trying insert with valid client ID...')
          const { data: validInsert, error: validInsertError } = await supabase
            .from('quotations')
            .insert({
              user_id: "4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6",
              client_id: clients[0].id,
              quotation_number: "TEST-SETUP-VALID",
              title: "Test Quotation",
              issue_date: new Date().toISOString().split('T')[0],
              valid_until: new Date().toISOString().split('T')[0],
              total_amount: 100.00
            })
            .select()
          
          if (validInsertError) {
            console.error('❌ Valid client insert error:', validInsertError)
          } else {
            console.log('✅ Valid insert successful:', validInsert)
          }
        }
      }
    } else {
      console.log('✅ Test insert successful:', insertData)
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setupQuotationsTable()