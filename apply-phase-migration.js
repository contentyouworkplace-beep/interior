const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyPhaseIdMigration() {
  console.log('🔧 Applying phase_id migration to project_tasks...\n')
  
  try {
    // Step 1: Add the column
    console.log('1. Adding phase_id column...')
    const addColumnSQL = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'project_tasks' AND column_name = 'phase_id'
        ) THEN
          ALTER TABLE public.project_tasks ADD COLUMN phase_id UUID NULL;
          RAISE NOTICE 'Added phase_id column';
        ELSE
          RAISE NOTICE 'phase_id column already exists';
        END IF;
      END$$;
    `
    
    // Use a simple approach - try to execute via raw SQL
    const response1 = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ query: addColumnSQL })
    })
    
    // Try alternative: use Supabase client to run DDL
    console.log('Attempting to add column via DDL...')
    
    // Check if column exists first
    const { data: existingColumns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'project_tasks')
      .eq('column_name', 'phase_id')
    
    if (columnsError) {
      console.log('Could not check columns, trying manual approach...')
    } else if (existingColumns && existingColumns.length > 0) {
      console.log('✅ phase_id column already exists')
    } else {
      console.log('❌ phase_id column does not exist, applying via manual SQL...')
    }
    
    // Let's try a manual test insert to see what columns exist
    console.log('\n2. Testing current table structure...')
    const { data: sampleTask, error: sampleError } = await supabase
      .from('project_tasks')
      .select('*')
      .limit(1)
      .single()
    
    if (sampleTask) {
      console.log('Current columns:', Object.keys(sampleTask))
      if ('phase_id' in sampleTask) {
        console.log('✅ phase_id column exists in table')
      } else {
        console.log('❌ phase_id column missing from table structure')
        
        // Apply migration using the supabase CLI approach
        console.log('\n3. Creating migration file and applying...')
        
        // Write the migration
        const migrationContent = `
-- Migration: Add phase_id to project_tasks
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS phase_id UUID NULL;
CREATE INDEX IF NOT EXISTS idx_project_tasks_phase_id ON public.project_tasks(phase_id);
ALTER TABLE public.project_tasks 
  DROP CONSTRAINT IF EXISTS project_tasks_phase_id_fkey;
ALTER TABLE public.project_tasks 
  ADD CONSTRAINT project_tasks_phase_id_fkey 
  FOREIGN KEY (phase_id) REFERENCES public.project_phases(id) ON DELETE SET NULL;
`
        
        fs.writeFileSync('apply-phase-migration.sql', migrationContent)
        console.log('Migration file created. Please run this SQL manually in Supabase SQL editor:')
        console.log('----------------------------------------')
        console.log(migrationContent)
        console.log('----------------------------------------')
      }
    } else if (sampleError) {
      console.error('Error accessing project_tasks:', sampleError)
    }
    
  } catch (error) {
    console.error('❌ Migration process failed:', error)
  }
}

applyPhaseIdMigration()