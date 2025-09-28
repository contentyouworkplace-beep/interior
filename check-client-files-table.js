// Check and create client_files table
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkClientFilesTable() {
  try {
    console.log('🔍 Checking if client_files table exists...');
    
    // Try to select from the table
    const { data, error } = await supabase
      .from('client_files')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Table does not exist:', error.message);
      console.log('📝 You need to create the client_files table in Supabase dashboard');
      console.log('💡 SQL to run in Supabase SQL editor:');
      console.log(`
CREATE TABLE client_files (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_client_files_client_id ON client_files(client_id);
CREATE INDEX idx_client_files_created_at ON client_files(created_at);
      `);
    } else {
      console.log('✅ client_files table exists');
      console.log(`📊 Found ${data?.length || 0} records`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkClientFilesTable();