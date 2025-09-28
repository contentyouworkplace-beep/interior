const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(url, key)

async function fixRLS() {
  console.log('🔧 Fixing RLS policies for company settings...')
  
  // Enable RLS on tables first
  const enableRLSQueries = [
    'ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.banking_info ENABLE ROW LEVEL SECURITY', 
    'ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY',
    'ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY'
  ]
  
  for (const sql of enableRLSQueries) {
    try {
      const { error } = await supabase.rpc('exec', { sql })
      if (!error) {
        console.log(`✅ ${sql}`)
      } else {
        console.log(`⚠️  ${sql} - ${error.message}`)
      }
    } catch (e) {
      console.log(`⚠️  ${sql} - ${e.message}`)
    }
  }
  
  // Create policies for company_profiles
  const policies = [
    `DROP POLICY IF EXISTS "org_members_select_company_profiles" ON public.company_profiles`,
    `CREATE POLICY "org_members_select_company_profiles" ON public.company_profiles 
     FOR SELECT USING (
       EXISTS (
         SELECT 1 FROM public.organization_members om 
         WHERE om.organization_id = company_profiles.organization_id 
         AND om.user_id = auth.uid()
       )
     )`,
    
    `DROP POLICY IF EXISTS "org_members_insert_company_profiles" ON public.company_profiles`,
    `CREATE POLICY "org_members_insert_company_profiles" ON public.company_profiles 
     FOR INSERT WITH CHECK (
       EXISTS (
         SELECT 1 FROM public.organization_members om 
         WHERE om.organization_id = company_profiles.organization_id 
         AND om.user_id = auth.uid()
       )
     )`,
    
    `DROP POLICY IF EXISTS "org_members_update_company_profiles" ON public.company_profiles`,
    `CREATE POLICY "org_members_update_company_profiles" ON public.company_profiles 
     FOR UPDATE USING (
       EXISTS (
         SELECT 1 FROM public.organization_members om 
         WHERE om.organization_id = company_profiles.organization_id 
         AND om.user_id = auth.uid()
       )
     )`,
     
    // Banking info policies
    `DROP POLICY IF EXISTS "org_members_select_banking_info" ON public.banking_info`,
    `CREATE POLICY "org_members_select_banking_info" ON public.banking_info 
     FOR SELECT USING (
       EXISTS (
         SELECT 1 FROM public.organization_members om 
         WHERE om.organization_id = banking_info.organization_id 
         AND om.user_id = auth.uid()
       )
     )`,
    
    `DROP POLICY IF EXISTS "org_members_insert_banking_info" ON public.banking_info`,
    `CREATE POLICY "org_members_insert_banking_info" ON public.banking_info 
     FOR INSERT WITH CHECK (
       EXISTS (
         SELECT 1 FROM public.organization_members om 
         WHERE om.organization_id = banking_info.organization_id 
         AND om.user_id = auth.uid()
       )
     )`,
    
    `DROP POLICY IF EXISTS "org_members_update_banking_info" ON public.banking_info`,
    `CREATE POLICY "org_members_update_banking_info" ON public.banking_info 
     FOR UPDATE USING (
       EXISTS (
         SELECT 1 FROM public.organization_members om 
         WHERE om.organization_id = banking_info.organization_id 
         AND om.user_id = auth.uid()
       )
     )`,
     
    // Branding policies
    `DROP POLICY IF EXISTS "org_members_select_branding" ON public.branding`,
    `CREATE POLICY "org_members_select_branding" ON public.branding 
     FOR SELECT USING (
       EXISTS (
         SELECT 1 FROM public.organization_members om 
         WHERE om.organization_id = branding.organization_id 
         AND om.user_id = auth.uid()
       )
     )`,
    
    `DROP POLICY IF EXISTS "org_members_insert_branding" ON public.branding`,
    `CREATE POLICY "org_members_insert_branding" ON public.branding 
     FOR INSERT WITH CHECK (
       EXISTS (
         SELECT 1 FROM public.organization_members om 
         WHERE om.organization_id = branding.organization_id 
         AND om.user_id = auth.uid()
       )
     )`,
    
    `DROP POLICY IF EXISTS "org_members_update_branding" ON public.branding`,
    `CREATE POLICY "org_members_update_branding" ON public.branding 
     FOR UPDATE USING (
       EXISTS (
         SELECT 1 FROM public.organization_members om 
         WHERE om.organization_id = branding.organization_id 
         AND om.user_id = auth.uid()
       )
     )`,
     
    // Organization members policy - allow reading own membership
    `DROP POLICY IF EXISTS "users_select_own_memberships" ON public.organization_members`,
    `CREATE POLICY "users_select_own_memberships" ON public.organization_members 
     FOR SELECT USING (user_id = auth.uid())`
  ]
  
  for (const sql of policies) {
    try {
      const { error } = await supabase.rpc('exec', { sql })
      if (!error) {
        console.log(`✅ Policy applied`)
      } else {
        console.log(`⚠️  Policy failed: ${error.message}`)
      }
    } catch (e) {
      console.log(`⚠️  Policy failed: ${e.message}`)
    }
  }
  
  console.log('\n🎉 RLS policy application completed!')
  console.log('Now try saving company settings in the UI...')
}

fixRLS().catch(console.error)