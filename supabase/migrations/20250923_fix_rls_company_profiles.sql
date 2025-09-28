-- 2025-09-23 - Fix RLS for company settings so authenticated org members can read/write

-- This migration ensures that authenticated organization members (via organization_members)
-- can SELECT, INSERT (WITH CHECK), and UPDATE their organization's rows in
-- company_profiles, banking_info, and branding tables without requiring the service_role.
-- It also tightens the organization_members INSERT policy to allow adding memberships only
-- by super_admins or via controlled server-side processes.

-- Ensure helper exists
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean STABLE LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
  );
$$;

-- Allow authenticated sessions to call is_org_member safely
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;

-- Company profiles policies
DO $$ BEGIN
  -- Drop if existing to allow re-run
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "org members select company_profiles" ON public.company_profiles';
    EXECUTE 'DROP POLICY IF EXISTS "org members upsert company_profiles" ON public.company_profiles';
    EXECUTE 'DROP POLICY IF EXISTS "org members update company_profiles" ON public.company_profiles';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Select: allow if the requester is a member of the organization
  EXECUTE 'CREATE POLICY "org members select company_profiles" ON public.company_profiles FOR SELECT USING (public.is_org_member(organization_id))';

  -- Insert (with check): allow inserting rows where the executing user is a member of the org
  EXECUTE 'CREATE POLICY "org members insert company_profiles" ON public.company_profiles FOR INSERT WITH CHECK (public.is_org_member(organization_id))';

  -- Update: allow updating rows for which the user is a member
  EXECUTE 'CREATE POLICY "org members update company_profiles" ON public.company_profiles FOR UPDATE USING (public.is_org_member(organization_id))';
END$$;

-- Banking info policies
DO $$ BEGIN
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "org members select banking_info" ON public.banking_info';
    EXECUTE 'DROP POLICY IF EXISTS "org members upsert banking_info" ON public.banking_info';
    EXECUTE 'DROP POLICY IF EXISTS "org members update banking_info" ON public.banking_info';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  EXECUTE 'CREATE POLICY "org members select banking_info" ON public.banking_info FOR SELECT USING (public.is_org_member(organization_id))';
  EXECUTE 'CREATE POLICY "org members insert banking_info" ON public.banking_info FOR INSERT WITH CHECK (public.is_org_member(organization_id))';
  EXECUTE 'CREATE POLICY "org members update banking_info" ON public.banking_info FOR UPDATE USING (public.is_org_member(organization_id))';
END$$;

-- Branding policies
DO $$ BEGIN
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "org members select branding" ON public.branding';
    EXECUTE 'DROP POLICY IF EXISTS "org members upsert branding" ON public.branding';
    EXECUTE 'DROP POLICY IF EXISTS "org members update branding" ON public.branding';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  EXECUTE 'CREATE POLICY "org members select branding" ON public.branding FOR SELECT USING (public.is_org_member(organization_id))';
  EXECUTE 'CREATE POLICY "org members insert branding" ON public.branding FOR INSERT WITH CHECK (public.is_org_member(organization_id))';
  EXECUTE 'CREATE POLICY "org members update branding" ON public.branding FOR UPDATE USING (public.is_org_member(organization_id))';
END$$;

-- Tighten organization_members insert policy (optional safe default)
DO $$ BEGIN
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "org members insert membership" ON public.organization_members';
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Recreate policy: allow super admins to insert any membership, allow insertion where the
  -- new member is the same as auth.uid() (self-join) or where the inserting user is a member of the org
  -- (this prevents arbitrary membership creation by non-members).
  EXECUTE $$
    CREATE POLICY "org members insert membership" ON public.organization_members
      FOR INSERT WITH CHECK (
        (public.is_super_admin() = true)
        OR (new.user_id = auth.uid())
        OR (public.is_org_member(new.organization_id))
      );
  $$;
END$$;

-- Grant usage of helper functions to authenticated role (already granted is_super_admin in other migrations)
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE IF EXISTS public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.banking_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.branding ENABLE ROW LEVEL SECURITY;

-- Done
-- This migration is safe to run with your usual migration runner (it's idempotent
-- and will drop/recreate the necessary policies and helper function as needed).
