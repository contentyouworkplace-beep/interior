require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyPortfolioDatabaseSchema() {
  console.log('🗄️ Applying portfolio database schema...')
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./setup-portfolio-database.sql', 'utf8')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    })
    
    if (error) {
      console.log('❌ Error executing SQL:', error.message)
      
      // Try alternative approach - split and execute individual statements
      console.log('🔄 Trying individual SQL statements...')
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';'
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        
        const { error: stmtError } = await supabase.rpc('exec_sql', {
          sql: statement
        })
        
        if (stmtError) {
          console.log(`❌ Error in statement ${i + 1}:`, stmtError.message)
          console.log('Statement:', statement.substring(0, 100) + '...')
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      }
    } else {
      console.log('✅ Database schema applied successfully')
    }
    
    // Verify tables were created
    console.log('🔍 Verifying portfolio tables...')
    
    const tables = ['portfolios', 'portfolio_files', 'portfolio_views']
    
    for (const table of tables) {
      const { data: tableData, error: tableError } = await supabase
        .from(table)
        .select('*')
        .limit(0)
      
      if (tableError) {
        console.log(`❌ Table '${table}' not accessible:`, tableError.message)
      } else {
        console.log(`✅ Table '${table}' is accessible`)
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to apply database schema:', error.message)
  }
}

applyPortfolioDatabaseSchema()