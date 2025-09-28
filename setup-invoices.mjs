import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupInvoicesDatabase() {
  try {
    console.log('🚀 Setting up invoice database...')
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'setup-invoices-complete.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length === 0) continue
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.warn(`⚠️  Warning on statement ${i + 1}:`, err.message)
      }
    }
    
    // Verify the setup by checking if invoices exist
    console.log('\n🔍 Verifying invoice data...')
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        invoice_number,
        title,
        status,
        payment_status,
        total_amount,
        client:clients(first_name, last_name),
        items:invoice_items(count)
      `)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Error verifying invoices:', error)
    } else {
      console.log(`✅ Found ${invoices?.length || 0} invoices in database`)
      invoices?.forEach(invoice => {
        console.log(`  📄 ${invoice.invoice_number}: ${invoice.title} (${invoice.status}/${invoice.payment_status}) - ₹${invoice.total_amount}`)
      })
    }
    
    console.log('\n🎉 Invoice database setup completed!')
    
  } catch (error) {
    console.error('❌ Error setting up database:', error)
    process.exit(1)
  }
}

// Execute if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupInvoicesDatabase()
}

export { setupInvoicesDatabase }