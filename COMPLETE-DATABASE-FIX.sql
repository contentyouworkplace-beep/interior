-- COMPLETE DATABASE FIX - Run this in Supabase SQL Editor
-- This will fix all permission issues and reset the organization setup

-- STEP 1: Check what tables actually exist
SELECT 'Current tables in public schema:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%organization%';

-- STEP 2: Drop and recreate organization tables to ensure clean state
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.company_profiles CASCADE;
DROP TABLE IF EXISTS public.banking_info CASCADE;
DROP TABLE IF EXISTS public.branding CASCADE;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.is_org_member(uuid);

-- STEP 3: Create organizations table
CREATE TABLE public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STEP 4: Create organization_members table
CREATE TABLE public.organization_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- STEP 5: Create company_profiles table
CREATE TABLE public.company_profiles (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_tagline text,
  gstin text,
  pan text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  pin_code text,
  website text,
  cin text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STEP 6: Create banking_info table
CREATE TABLE public.banking_info (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  bank_name text,
  account_number text,
  ifsc_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STEP 7: Create branding table
CREATE TABLE public.branding (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url text,
  signature_url text,
  primary_color text,
  secondary_color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STEP 8: Create the RLS helper function
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean 
STABLE 
SECURITY DEFINER
LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
  );
$$;

-- STEP 9: Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organization_members TO authenticated;
GRANT ALL ON public.company_profiles TO authenticated;
GRANT ALL ON public.banking_info TO authenticated;
GRANT ALL ON public.branding TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;

-- STEP 10: Grant permissions to anon role for the function
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO anon;

-- STEP 11: Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY;

-- STEP 12: Create RLS policies for organizations
CREATE POLICY "org_members_select_organizations" ON public.organizations
  FOR SELECT USING (public.is_org_member(id));

CREATE POLICY "org_members_update_organizations" ON public.organizations
  FOR UPDATE USING (public.is_org_member(id));

-- STEP 13: Create RLS policies for organization_members
CREATE POLICY "org_members_select_membership" ON public.organization_members
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "org_members_insert_membership" ON public.organization_members
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- STEP 14: Create RLS policies for company_profiles
CREATE POLICY "org_members_select_company_profiles" ON public.company_profiles
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "org_members_insert_company_profiles" ON public.company_profiles
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "org_members_update_company_profiles" ON public.company_profiles
  FOR UPDATE USING (public.is_org_member(organization_id));

-- STEP 15: Create RLS policies for banking_info
CREATE POLICY "org_members_select_banking_info" ON public.banking_info
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "org_members_insert_banking_info" ON public.banking_info
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "org_members_update_banking_info" ON public.banking_info
  FOR UPDATE USING (public.is_org_member(organization_id));

-- STEP 16: Create RLS policies for branding
CREATE POLICY "org_members_select_branding" ON public.branding
  FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY "org_members_insert_branding" ON public.branding
  FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY "org_members_update_branding" ON public.branding
  FOR UPDATE USING (public.is_org_member(organization_id));

-- STEP 17: Insert the default organization (as superuser)
INSERT INTO public.organizations (id, name, description) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'Auto-created default organization');

-- STEP 18: Insert user membership (as superuser)
INSERT INTO public.organization_members (organization_id, user_id, role) 
VALUES ('00000000-0000-0000-0000-000000000001', '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'admin');

-- STEP 19: Verify everything was created
SELECT 'Verification Results:' as info;
SELECT 'Organizations:' as table_name, count(*) as row_count FROM public.organizations;
SELECT 'Organization Members:' as table_name, count(*) as row_count FROM public.organization_members;
SELECT 'Company Profiles:' as table_name, count(*) as row_count FROM public.company_profiles;
SELECT 'Banking Info:' as table_name, count(*) as row_count FROM public.banking_info;
SELECT 'Branding:' as table_name, count(*) as row_count FROM public.branding;

-- Show the created organization and membership
SELECT 'Default Organization:' as info, * FROM public.organizations WHERE id = '00000000-0000-0000-0000-000000000001';
SELECT 'User Membership:' as info, * FROM public.organization_members WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';