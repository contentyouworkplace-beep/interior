-- Fix branding table RLS policies
-- This addresses the "new row violates row-level security policy" error

-- Drop existing branding policies
DROP POLICY IF EXISTS "branding_policy" ON public.branding;
DROP POLICY IF EXISTS "org_members_select_branding" ON public.branding;
DROP POLICY IF EXISTS "org_members_insert_branding" ON public.branding;
DROP POLICY IF EXISTS "org_members_update_branding" ON public.branding;

-- Create separate policies for different operations
CREATE POLICY "branding_select_policy" ON public.branding 
FOR SELECT USING (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = branding.organization_id
  )
);

CREATE POLICY "branding_insert_policy" ON public.branding 
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = branding.organization_id
  )
);

CREATE POLICY "branding_update_policy" ON public.branding 
FOR UPDATE USING (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = branding.organization_id
  )
) WITH CHECK (
  auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id = branding.organization_id
  )
);

-- Check if policies were created successfully
SELECT schemaname, tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename = 'branding' 
ORDER BY policyname;