#!/usr/bin/env node
/**
 * Setup Portfolio Database Tables
 * This script creates the portfolio tables in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupPortfolioDB() {
  console.log('🚀 Setting up Portfolio Database...');
  
  try {
    // Read the portfolio schema
    const schemaPath = path.join(__dirname, '../database/portfolio-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📄 Executing ${statements.length} SQL statements...`);
    
    for (const [index, statement] of statements.entries()) {
      console.log(`⏳ Executing statement ${index + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          console.warn(`⚠️  Warning on statement ${index + 1}:`, error.message);
          // Continue execution for warnings (table might already exist)
        } else {
          console.log(`✅ Statement ${index + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Error on statement ${index + 1}:`, err.message);
        console.log('Statement:', statement);
      }
    }
    
    // Verify tables were created
    console.log('🔍 Verifying portfolio tables...');
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name LIKE '%portfolio%'
            OR table_name = 'video_processing_jobs'
          ORDER BY table_name;
        `
      });
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('📊 Portfolio tables found:');
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`   ✓ ${table.table_name}`);
        });
      } else {
        console.log('   ⚠️  No portfolio tables found');
      }
    }
    
    console.log('🎉 Portfolio Database setup complete!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupPortfolioDB();