-- Fixed RLS policies with better error handling
-- Run this in Supabase SQL Editor

-- First, let's see what policies currently exist
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('company_profiles', 'banking_info', 'branding', 'organization_members')
ORDER BY tablename, policyname;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "org_members_select_company_profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "org_members_insert_company_profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "org_members_update_company_profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "org members select company_profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "org members insert company_profiles" ON public.company_profiles; 
DROP POLICY IF EXISTS "org members update company_profiles" ON public.company_profiles;
DROP POLICY IF EXISTS "Users can manage own company profiles" ON public.company_profiles;

DROP POLICY IF EXISTS "org_members_select_banking_info" ON public.banking_info;
DROP POLICY IF EXISTS "org_members_insert_banking_info" ON public.banking_info;
DROP POLICY IF EXISTS "org_members_update_banking_info" ON public.banking_info;
DROP POLICY IF EXISTS "org members select banking_info" ON public.banking_info;
DROP POLICY IF EXISTS "org members insert banking_info" ON public.banking_info;
DROP POLICY IF EXISTS "org members update banking_info" ON public.banking_info;

DROP POLICY IF EXISTS "org_members_select_branding" ON public.branding;
DROP POLICY IF EXISTS "org_members_insert_branding" ON public.branding;
DROP POLICY IF EXISTS "org_members_update_branding" ON public.branding;
DROP POLICY IF EXISTS "org members select branding" ON public.branding;
DROP POLICY IF EXISTS "org members insert branding" ON public.branding;
DROP POLICY IF EXISTS "org members update branding" ON public.branding;

DROP POLICY IF EXISTS "users_select_own_memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Users can manage own memberships" ON public.organization_members;

-- Create simple, working policies
-- Company profiles
CREATE POLICY "company_profiles_policy" ON public.company_profiles 
FOR ALL USING (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = company_profiles.organization_id
  )
);

-- Banking info  
CREATE POLICY "banking_info_policy" ON public.banking_info 
FOR ALL USING (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = banking_info.organization_id
  )
);

-- Branding
CREATE POLICY "branding_policy" ON public.branding 
FOR ALL USING (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = branding.organization_id
  )
);

-- Organization members - can read own memberships
CREATE POLICY "organization_members_policy" ON public.organization_members 
FOR SELECT USING (user_id = auth.uid());

-- Also allow inserting memberships (for admin functions)
CREATE POLICY "organization_members_insert_policy" ON public.organization_members 
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = organization_members.organization_id
    AND om.role = 'admin'
  )
  OR auth.uid() = user_id -- Allow self-join
);