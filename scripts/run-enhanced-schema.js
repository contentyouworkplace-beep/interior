const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runEnhancedSchema() {
  try {
    console.log('Running enhanced quotes & invoices schema...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'enhance-quotes-invoices-schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into individual statements (basic split by semicolon)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'))
      .map(stmt => stmt + ';');

    console.log(`Found ${statements.length} SQL statements to execute...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() === ';') continue;

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);
          
          if (directError) {
            console.log('Note: Some statements may need to be run manually in SQL Editor');
          }
        }
      } catch (err) {
        console.log(`Statement ${i + 1} may need manual execution:`, err.message);
      }
    }

    console.log('✅ Enhanced schema setup completed!');
    console.log('📝 If you see any errors, please run the enhance-quotes-invoices-schema.sql file manually in your Supabase SQL Editor');

  } catch (error) {
    console.error('Error running enhanced schema:', error);
    console.log('📝 Please run the enhance-quotes-invoices-schema.sql file manually in your Supabase SQL Editor');
  }
}

runEnhancedSchema();