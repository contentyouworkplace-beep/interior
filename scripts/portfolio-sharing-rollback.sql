-- ========================================
-- PORTFOLIO SHARING ROLLBACK
-- ========================================
-- PURPOSE:
--   Revert portfolio sharing so ONLY authenticated owners can access their data.
--   Removes all public / anon read policies while keeping owner CRUD.
-- USAGE:
--   1. Run in Supabase SQL Editor.
--   2. Confirm verification output.
--   3. Public share links will stop working immediately.
-- SAFETY:
--   • Idempotent (drops policies if they exist, recreates authenticated ones)
--   • No schema changes.
-- ========================================
BEGIN;
SET search_path TO public;

-- Drop public / anon policies (names must match creation script)
DROP POLICY IF EXISTS "public_select_shared_projects" ON portfolio_projects;
DROP POLICY IF EXISTS "anon_select_shared_projects" ON portfolio_projects;
DROP POLICY IF EXISTS "public_select_shared_media" ON portfolio_media;
DROP POLICY IF EXISTS "anon_select_shared_media" ON portfolio_media;
DROP POLICY IF EXISTS "public_select_valid_shares" ON portfolio_shares;
DROP POLICY IF EXISTS "anon_select_valid_shares" ON portfolio_shares;

-- Drop existing authenticated policies to normalize & recreate (optional)
DROP POLICY IF EXISTS "auth_users_select_own_projects" ON portfolio_projects;
DROP POLICY IF EXISTS "auth_users_insert_own_projects" ON portfolio_projects;
DROP POLICY IF EXISTS "auth_users_update_own_projects" ON portfolio_projects;
DROP POLICY IF EXISTS "auth_users_delete_own_projects" ON portfolio_projects;
DROP POLICY IF EXISTS "auth_users_manage_media" ON portfolio_media;
DROP POLICY IF EXISTS "auth_users_manage_shares" ON portfolio_shares;

-- Ensure RLS still enabled
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_shares ENABLE ROW LEVEL SECURITY;

-- Recreate only authenticated policies
CREATE POLICY "auth_users_select_own_projects" 
ON portfolio_projects FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "auth_users_insert_own_projects" 
ON portfolio_projects FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "auth_users_update_own_projects" 
ON portfolio_projects FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "auth_users_delete_own_projects" 
ON portfolio_projects FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "auth_users_manage_media" 
ON portfolio_media FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM portfolio_projects 
    WHERE id = portfolio_media.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "auth_users_manage_shares" 
ON portfolio_shares FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM portfolio_projects 
    WHERE id = portfolio_shares.project_id 
    AND user_id = auth.uid()
  )
);

-- Verification
SELECT tablename, policyname, roles::text[] AS roles, cmd
FROM pg_policies
WHERE tablename IN ('portfolio_projects','portfolio_media','portfolio_shares')
ORDER BY tablename, policyname;

SELECT '✅ ROLLBACK COMPLETE - Public sharing disabled' AS status;
COMMIT;
-- ========================================
-- END
-- ========================================
