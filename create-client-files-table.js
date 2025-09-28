// Create client_files table
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createClientFilesTable() {
  try {
    console.log('🔧 Creating client_files table...');
    
    const { data, error } = await supabase.rpc('create_client_files_table', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS client_files (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          filename TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          category TEXT NOT NULL CHECK (category IN ('document', 'image', 'spreadsheet', 'other')),
          description TEXT,
          uploaded_by TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_client_files_client_id ON client_files(client_id);
        CREATE INDEX IF NOT EXISTS idx_client_files_created_at ON client_files(created_at);
      `
    });
    
    if (error) {
      console.error('❌ Error creating table:', error);
      
      // Try alternative approach with direct SQL
      const { error: sqlError } = await supabase
        .from('client_files')
        .select('id')
        .limit(1);
      
      if (sqlError) {
        console.log('🔄 Table doesn\'t exist, trying direct creation...');
        
        // Execute SQL directly
        const { data: result, error: execError } = await supabase.sql`
          CREATE TABLE IF NOT EXISTS client_files (
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
        `;
        
        if (execError) {
          console.error('❌ Direct SQL failed:', execError);
        } else {
          console.log('✅ Table created successfully with direct SQL');
        }
      } else {
        console.log('✅ Table already exists');
      }
    } else {
      console.log('✅ Table creation successful');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createClientFilesTable();