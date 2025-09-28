require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPortfolioTables() {
  console.log('🔍 Checking for existing portfolio tables...')
  
  try {
    // Check for portfolios table
    const { data: portfoliosCheck, error: portfoliosError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%portfolio%')
    
    if (portfoliosError) {
      console.log('❌ Error checking tables:', portfoliosError.message)
    } else {
      console.log('📋 Existing portfolio-related tables:', portfoliosCheck?.map(t => t.table_name) || 'None')
    }
    
    // Check for storage buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.log('❌ Error checking buckets:', bucketsError.message)
    } else {
      console.log('🗂️ Existing storage buckets:', buckets?.map(b => b.name) || 'None')
      
      // Check for portfolio-related buckets
      const portfolioBuckets = buckets?.filter(b => b.name.includes('portfolio')) || []
      console.log('📁 Portfolio buckets:', portfolioBuckets.map(b => b.name) || 'None')
    }
    
  } catch (error) {
    console.error('❌ Failed to check portfolio tables:', error.message)
  }
}

checkPortfolioTables()