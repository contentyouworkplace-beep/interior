-- CRITICAL FIX: Organization Setup SQL
-- Run this in your Supabase SQL Editor to fix the permission issues

-- Step 1: First, let's check what exists
SELECT 'Checking organizations table...' as step;
SELECT * FROM pg_tables WHERE tablename = 'organizations';

SELECT 'Checking organization_members table...' as step;
SELECT * FROM pg_tables WHERE tablename = 'organization_members';

-- Step 2: If tables don't exist, create them (this means migrations didn't run)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Step 3: Create the helper function
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean STABLE LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
  );
$$;

-- Step 4: Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies (if any)
DROP POLICY IF EXISTS "org members select organizations" ON organizations;
DROP POLICY IF EXISTS "org members update organizations" ON organizations;
DROP POLICY IF EXISTS "org members select membership" ON organization_members;
DROP POLICY IF EXISTS "org members insert membership" ON organization_members;

-- Step 6: Create RLS policies
CREATE POLICY "org members select organizations" ON organizations
  FOR SELECT USING (is_org_member(id));
  
CREATE POLICY "org members update organizations" ON organizations
  FOR UPDATE USING (is_org_member(id));

CREATE POLICY "org members select membership" ON organization_members
  FOR SELECT USING (is_org_member(organization_id));
  
CREATE POLICY "org members insert membership" ON organization_members
  FOR INSERT WITH CHECK (is_org_member(organization_id));

-- Step 7: Insert default organization (bypassing RLS temporarily)
-- IMPORTANT: Run this as a separate query as a superuser/service role
SET session_replication_role = replica; -- Bypass RLS for this session

INSERT INTO public.organizations (id, name, description) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'Auto-created default organization')
ON CONFLICT (id) DO NOTHING;

-- Insert user membership
INSERT INTO public.organization_members (organization_id, user_id, role) 
VALUES ('00000000-0000-0000-0000-000000000001', '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'admin')
ON CONFLICT (organization_id, user_id) DO NOTHING;

SET session_replication_role = DEFAULT; -- Re-enable RLS

-- Step 8: Verify the setup
SELECT 'Verifying organization...' as step;
SELECT * FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT 'Verifying membership...' as step;
SELECT * FROM organization_members WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';

SELECT 'Testing RLS function...' as step;
-- This should work when run as the authenticated user
-- SELECT is_org_member('00000000-0000-0000-0000-000000000001');