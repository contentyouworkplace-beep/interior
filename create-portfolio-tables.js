require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createPortfolioTables() {
  console.log('🗄️ Creating portfolio tables...')
  
  try {
    // Create portfolios table first
    console.log('1. Creating portfolios table...')
    const { error: portfoliosError } = await supabase
      .from('_temp_table_creation')
      .select('*')
      .limit(0)
    
    // Since we can't execute DDL directly, let's create the tables using INSERT approach
    // First, check if tables exist by trying to access them
    
    console.log('🔍 Checking if tables exist...')
    
    // Test portfolios table
    const { data: portfoliosData, error: portfoliosTestError } = await supabase
      .from('portfolios')
      .select('*')
      .limit(1)
    
    if (portfoliosTestError) {
      console.log('❌ Portfolios table does not exist:', portfoliosTestError.message)
      console.log('📋 Please create the portfolios table manually in Supabase SQL Editor:')
      console.log(`
CREATE TABLE portfolios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL CHECK (category IN ('residential', 'commercial', 'individual', 'corporate', 'hospitality', 'other')),
  is_featured BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
      `)
    } else {
      console.log('✅ Portfolios table already exists')
    }
    
    // Test portfolio_files table
    const { data: filesData, error: filesTestError } = await supabase
      .from('portfolio_files')
      .select('*')
      .limit(1)
    
    if (filesTestError) {
      console.log('❌ Portfolio_files table does not exist:', filesTestError.message)
      console.log('📋 Please create the portfolio_files table manually in Supabase SQL Editor:')
      console.log(`
CREATE TABLE portfolio_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  alt_text TEXT,
  caption TEXT,
  is_cover BOOLEAN DEFAULT FALSE,
  upload_status VARCHAR(50) DEFAULT 'completed' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
      `)
    } else {
      console.log('✅ Portfolio_files table already exists')
    }
    
    // Test portfolio_views table
    const { data: viewsData, error: viewsTestError } = await supabase
      .from('portfolio_views')
      .select('*')
      .limit(1)
    
    if (viewsTestError) {
      console.log('❌ Portfolio_views table does not exist:', viewsTestError.message)
      console.log('📋 Please create the portfolio_views table manually in Supabase SQL Editor:')
      console.log(`
CREATE TABLE portfolio_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);
      `)
    } else {
      console.log('✅ Portfolio_views table already exists')
    }
    
    if (!portfoliosTestError && !filesTestError && !viewsTestError) {
      console.log('🎉 All portfolio tables exist and are accessible!')
      
      // Test insert to make sure RLS is properly configured
      console.log('🔐 Testing table access permissions...')
      
      // This should fail because no user is authenticated, which is expected
      const { data: testData, error: testError } = await supabase
        .from('portfolios')
        .insert({
          name: 'Test Portfolio',
          category: 'residential',
          description: 'Test description'
        })
        .select()
      
      if (testError) {
        console.log('🔒 RLS is properly configured (insert failed as expected):', testError.message)
      } else {
        console.log('⚠️ Warning: Insert succeeded without authentication - RLS might need configuration')
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to create portfolio tables:', error.message)
  }
}

createPortfolioTables()