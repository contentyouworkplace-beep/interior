const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(url, key)

async function executeRLSFix() {
  console.log('🔧 Applying RLS policies using direct SQL execution...')
  
  // First, let's create a simple test to verify we can execute SQL
  try {
    console.log('Testing SQL execution...')
    const { data, error } = await supabase.from('organizations').select('id').limit(1)
    if (error) {
      console.error('❌ Cannot connect to database:', error.message)
      return
    }
    console.log('✅ Database connection verified')
  } catch (e) {
    console.error('❌ Connection failed:', e.message)
    return
  }

  // Execute each policy individually using raw SQL
  const policies = [
    // Enable RLS first
    {
      name: 'Enable RLS on company_profiles',
      sql: 'ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY'
    },
    {
      name: 'Enable RLS on banking_info', 
      sql: 'ALTER TABLE public.banking_info ENABLE ROW LEVEL SECURITY'
    },
    {
      name: 'Enable RLS on branding',
      sql: 'ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY'
    },
    {
      name: 'Enable RLS on organization_members',
      sql: 'ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY'
    },
    
    // Create policies for company_profiles
    {
      name: 'Drop old company_profiles select policy',
      sql: 'DROP POLICY IF EXISTS "org_members_select_company_profiles" ON public.company_profiles'
    },
    {
      name: 'Create company_profiles select policy',
      sql: `CREATE POLICY "org_members_select_company_profiles" ON public.company_profiles 
            FOR SELECT USING (
              EXISTS (
                SELECT 1 FROM public.organization_members om 
                WHERE om.organization_id = company_profiles.organization_id 
                AND om.user_id = auth.uid()
              )
            )`
    },
    {
      name: 'Drop old company_profiles insert policy',
      sql: 'DROP POLICY IF EXISTS "org_members_insert_company_profiles" ON public.company_profiles'
    },
    {
      name: 'Create company_profiles insert policy',
      sql: `CREATE POLICY "org_members_insert_company_profiles" ON public.company_profiles 
            FOR INSERT WITH CHECK (
              EXISTS (
                SELECT 1 FROM public.organization_members om 
                WHERE om.organization_id = company_profiles.organization_id 
                AND om.user_id = auth.uid()
              )
            )`
    },
    {
      name: 'Drop old company_profiles update policy',
      sql: 'DROP POLICY IF EXISTS "org_members_update_company_profiles" ON public.company_profiles'
    },
    {
      name: 'Create company_profiles update policy',
      sql: `CREATE POLICY "org_members_update_company_profiles" ON public.company_profiles 
            FOR UPDATE USING (
              EXISTS (
                SELECT 1 FROM public.organization_members om 
                WHERE om.organization_id = company_profiles.organization_id 
                AND om.user_id = auth.uid()
              )
            )`
    },
    
    // Organization members read policy
    {
      name: 'Drop old organization_members select policy',
      sql: 'DROP POLICY IF EXISTS "users_select_own_memberships" ON public.organization_members'
    },
    {
      name: 'Create organization_members select policy',
      sql: `CREATE POLICY "users_select_own_memberships" ON public.organization_members 
            FOR SELECT USING (user_id = auth.uid())`
    }
  ]

  let successCount = 0
  let failCount = 0

  for (const policy of policies) {
    try {
      console.log(`\n⚡ ${policy.name}...`)
      
      // Use the direct SQL approach via fetch
      const response = await fetch(`${url}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
          'apikey': key,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: policy.sql
        })
      })

      if (response.ok || response.status === 204) {
        console.log('✅ Success')
        successCount++
      } else {
        const errorText = await response.text()
        console.log(`⚠️  Failed: ${response.status} - ${errorText}`)
        failCount++
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
      failCount++
    }
  }

  console.log(`\n📊 Results: ${successCount} succeeded, ${failCount} failed`)
  
  if (successCount > 0) {
    console.log('\n🎉 Some policies applied! Test the company settings now.')
  } else {
    console.log('\n❌ No policies were successfully applied.')
    console.log('You may need to apply the SQL manually in Supabase SQL Editor.')
  }
}

executeRLSFix().catch(console.error)