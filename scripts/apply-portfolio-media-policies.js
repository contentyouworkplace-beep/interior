// Apply storage policies for portfolio-media bucket
// Usage: node scripts/apply-portfolio-media-policies.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ywcqtmzqsvcobtetunuf.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NzM4NCwiZXhwIjoyMDczMzUzMzg0fQ.fUj0lqp_NApqfrpN38ydEqE08Hh2WwL-BoVPqdjp3ac'

const supabase = createClient(url, key)

async function applyStoragePolicies() {
  console.log('📋 Applying RLS policies for portfolio-media bucket...')
  
  try {
    const sql = `
-- Storage policies for 'portfolio-media' bucket used by PortfolioService

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create bucket if missing (id and name must match)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', false)
ON CONFLICT (id) DO NOTHING;

-- Basic policies: allow authenticated users to manage files in this bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_media_select'
  ) THEN
    CREATE POLICY portfolio_media_select ON storage.objects
      FOR SELECT USING (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_media_insert'
  ) THEN
    CREATE POLICY portfolio_media_insert ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_media_update'
  ) THEN
    CREATE POLICY portfolio_media_update ON storage.objects
      FOR UPDATE USING (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_media_delete'
  ) THEN
    CREATE POLICY portfolio_media_delete ON storage.objects
      FOR DELETE USING (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated');
  END IF;
END $$;`

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('❌ SQL execution failed:', error)
      return
    }
    
    console.log('✅ RLS policies applied successfully!')
    
    // Verify policies were created
    const { data: policies, error: policyErr } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects')
      .like('policyname', 'portfolio_media_%')
    
    if (policyErr) {
      console.log('⚠️  Could not verify policies (this is normal):', policyErr.message)
    } else {
      console.log('📋 Policies created:', policies?.map(p => p.policyname) || [])
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

applyStoragePolicies()