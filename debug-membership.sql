-- Check and fix organization membership
-- Run this in Supabase SQL Editor

-- 1. Check current memberships
SELECT om.*, u.email 
FROM public.organization_members om
LEFT JOIN auth.users u ON u.id = om.user_id
ORDER BY om.created_at DESC;

-- 2. Check organizations
SELECT * FROM public.organizations;

-- 3. Get current authenticated user (if running from authenticated session)
SELECT auth.uid() as current_user, auth.email() as current_email;

-- 4. If no membership exists, create one for the current user
-- (Replace the user_id with your actual user ID from step 3)
-- INSERT INTO public.organization_members (organization_id, user_id, role)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'YOUR-ACTUAL-USER-ID-HERE', 'admin')
-- ON CONFLICT (organization_id, user_id) DO NOTHING;