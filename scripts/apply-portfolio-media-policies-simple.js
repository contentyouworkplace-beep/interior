// Apply storage policies for portfolio-media bucket
// Usage: node scripts/apply-portfolio-media-policies-simple.js

const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ywcqtmzqsvcobtetunuf.supabase.co'
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3Y3F0bXpxc3Zjb2J0ZXR1bnVmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzc3NzM4NCwiZXhwIjoyMDczMzUzMzg0fQ.fUj0lqp_NApqfrpN38ydEqE08Hh2WwL-BoVPqdjp3ac'

const supabase = createClient(url, key)

async function applyStoragePolicies() {
  console.log('📋 Applying RLS policies for portfolio-media bucket...')
  
  try {
    // 1. Enable RLS on storage.objects
    console.log('\n1. Enabling RLS on storage.objects...')
    const { error: rlsError } = await supabase.rpc('enable_rls_for_storage')
    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.log('⚠️  RLS enable result:', rlsError.message)
    }
    
    // 2. Ensure bucket exists
    console.log('2. Ensuring portfolio-media bucket exists...')
    const { error: bucketError } = await supabase.storage.createBucket('portfolio-media', { 
      public: false,
      fileSizeLimit: null,
      allowedMimeTypes: null 
    })
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.log('⚠️  Bucket creation result:', bucketError.message)
    } else {
      console.log('✅ Bucket portfolio-media ready')
    }
    
    // 3. Create policies using individual queries
    const policies = [
      {
        name: 'portfolio_media_select',
        sql: `CREATE POLICY portfolio_media_select ON storage.objects FOR SELECT USING (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated')`
      },
      {
        name: 'portfolio_media_insert',  
        sql: `CREATE POLICY portfolio_media_insert ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated')`
      },
      {
        name: 'portfolio_media_update',
        sql: `CREATE POLICY portfolio_media_update ON storage.objects FOR UPDATE USING (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated')`
      },
      {
        name: 'portfolio_media_delete',
        sql: `CREATE POLICY portfolio_media_delete ON storage.objects FOR DELETE USING (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated')`
      }
    ]
    
    console.log('3. Creating storage policies...')
    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_pgsql', { query: policy.sql })
        if (error && !error.message.includes('already exists')) {
          console.log(`⚠️  Policy ${policy.name}:`, error.message)
        } else {
          console.log(`✅ Policy ${policy.name} ready`)
        }
      } catch (err) {
        console.log(`⚠️  Policy ${policy.name}: ${err.message}`)
      }
    }
    
    console.log('\n🎉 Storage policies application complete!')
    console.log('\n📝 Note: If you see warnings above, the policies may already exist or need to be created via Supabase SQL editor.')
    console.log('You can manually run the SQL from scripts/setup-portfolio-media-policies.sql if needed.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

applyStoragePolicies()