const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addFileTypeColumn() {
  console.log('🔧 Adding file_type column to vendor_files table...')
  
  try {
    // Run SQL to add the column
    const { data, error } = await supabase.rpc('sql', {
      query: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'vendor_files' 
            AND column_name = 'file_type'
          ) THEN
            ALTER TABLE vendor_files ADD COLUMN file_type TEXT;
            RAISE NOTICE 'Added file_type column to vendor_files table';
          ELSE
            RAISE NOTICE 'file_type column already exists in vendor_files table';
          END IF;
        END $$;
      `
    })
    
    if (error) {
      console.error('❌ Error adding column:', error)
      
      // Try a simpler approach - direct ALTER TABLE
      console.log('🔄 Trying direct ALTER TABLE...')
      const { data: alterData, error: alterError } = await supabase.rpc('sql', {
        query: 'ALTER TABLE vendor_files ADD COLUMN IF NOT EXISTS file_type TEXT;'
      })
      
      if (alterError) {
        console.error('❌ Direct ALTER TABLE also failed:', alterError)
      } else {
        console.log('✅ file_type column added successfully')
      }
    } else {
      console.log('✅ file_type column operation completed')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

addFileTypeColumn()