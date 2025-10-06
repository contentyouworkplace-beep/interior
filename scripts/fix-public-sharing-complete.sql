-- ========================================
-- FIX PORTFOLIO PUBLIC SHARING - COMPLETE (ENHANCED)
-- ========================================
-- PURPOSE:
--   Enables PUBLIC + ANON read-only access to shared portfolio projects/media via share tokens
--   while retaining full CRUD for authenticated owners.
-- SAFETY / IDEMPOTENCY:
--   • Script is idempotent: uses DROP POLICY IF EXISTS & CREATE POLICY.
--   • Wrapped in an explicit transaction so a failure will rollback everything.
--   • Verification queries at end print current policy state.
--   • No destructive schema changes.
-- USAGE:
--   1. Paste entire script into Supabase SQL Editor.
--   2. Execute ("RUN").
--   3. Review verification output & success banner.
-- ROLLBACK:
--   • To revert public sharing, run: scripts/portfolio-sharing-rollback.sql
-- TESTING:
--   • After running, open a share URL: /portfolio/share/{TOKEN}
--   • Test in incognito (no auth) – project & media should load.
--   • Expired shares (expires_at < now) must NOT appear.
-- NOTES:
--   • Avoid editing generated policy names unless you also update rollback script.
--   • Keep policy naming consistent for maintainability.
-- ========================================
-- Begin transactional scope
BEGIN;

-- (Optional) Ensure we are on the expected schema
SET search_path TO public; -- adjust if using a custom schema

-- Step 1: Drop ALL existing conflicting policies
-- ==========================================

DROP POLICY IF EXISTS "Users can view their own projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Public access for shared projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Public access via share token" ON portfolio_projects;

DROP POLICY IF EXISTS "Users can manage their project media" ON portfolio_media;
DROP POLICY IF EXISTS "Public access for shared media" ON portfolio_media;
DROP POLICY IF EXISTS "Public access via share token media" ON portfolio_media;

DROP POLICY IF EXISTS "Users can manage their project shares" ON portfolio_shares;
DROP POLICY IF EXISTS "Public access for valid shares" ON portfolio_shares;
DROP POLICY IF EXISTS "Public can view valid shares" ON portfolio_shares;

-- Step 2: Enable RLS (safe if already enabled)
-- ==========================================

ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_shares ENABLE ROW LEVEL SECURITY;

-- Step 3: Authenticated User Policies
-- ==========================================

-- Authenticated users can SELECT their own projects
CREATE POLICY "auth_users_select_own_projects" 
ON portfolio_projects FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Authenticated users can INSERT their own projects
CREATE POLICY "auth_users_insert_own_projects" 
ON portfolio_projects FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Authenticated users can UPDATE their own projects
CREATE POLICY "auth_users_update_own_projects" 
ON portfolio_projects FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

-- Authenticated users can DELETE their own projects
CREATE POLICY "auth_users_delete_own_projects" 
ON portfolio_projects FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- Authenticated users can manage media for their projects
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

-- Authenticated users can manage shares for their projects
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

-- Step 4: PUBLIC / ANON READ-ONLY ACCESS Policies (CRITICAL FOR SHARING)
-- ==========================================

-- PUBLIC can SELECT projects that have valid share tokens
CREATE POLICY "public_select_shared_projects" 
ON portfolio_projects FOR SELECT 
TO public
USING (
  id IN (
    SELECT project_id 
    FROM portfolio_shares 
    WHERE (expires_at IS NULL OR expires_at > NOW())
  )
);

-- ANON can SELECT projects that have valid share tokens
CREATE POLICY "anon_select_shared_projects" 
ON portfolio_projects FOR SELECT 
TO anon
USING (
  id IN (
    SELECT project_id 
    FROM portfolio_shares 
    WHERE (expires_at IS NULL OR expires_at > NOW())
  )
);

-- PUBLIC can SELECT media for shared projects
CREATE POLICY "public_select_shared_media" 
ON portfolio_media FOR SELECT 
TO public
USING (
  project_id IN (
    SELECT project_id 
    FROM portfolio_shares 
    WHERE (expires_at IS NULL OR expires_at > NOW())
  )
);

-- ANON can SELECT media for shared projects
CREATE POLICY "anon_select_shared_media" 
ON portfolio_media FOR SELECT 
TO anon
USING (
  project_id IN (
    SELECT project_id 
    FROM portfolio_shares 
    WHERE (expires_at IS NULL OR expires_at > NOW())
  )
);

-- PUBLIC can SELECT valid share records
CREATE POLICY "public_select_valid_shares" 
ON portfolio_shares FOR SELECT 
TO public
USING (
  (expires_at IS NULL OR expires_at > NOW())
);

-- ANON can SELECT valid share records
CREATE POLICY "anon_select_valid_shares" 
ON portfolio_shares FOR SELECT 
TO anon
USING (
  (expires_at IS NULL OR expires_at > NOW())
);

-- Step 5: Create indexes for performance (idempotent)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_portfolio_shares_token 
ON portfolio_shares(share_token);

CREATE INDEX IF NOT EXISTS idx_portfolio_shares_project 
ON portfolio_shares(project_id);

-- Note: Can't create filtered index with NOW() as it's not immutable
-- Index on share_token is sufficient for lookups

-- Step 6: Verification
-- ==========================================

-- Check policies
SELECT 
  tablename,
  policyname,
  permissive,
  roles::text[] as roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('portfolio_projects', 'portfolio_media', 'portfolio_shares')
ORDER BY tablename, policyname;

-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('portfolio_projects', 'portfolio_media', 'portfolio_shares')
ORDER BY tablename;

-- Step 7: Success banner (only returned if transaction reaches here)

SELECT '
╔═══════════════════════════════════════════════╗
║  ✅ PORTFOLIO PUBLIC SHARING IS NOW ENABLED! ║
╚═══════════════════════════════════════════════╝

✅ RLS enabled on all portfolio tables
✅ Authenticated users can manage their portfolios
✅ PUBLIC and ANON can view shared portfolios
✅ Share links are now publicly accessible

🧪 Test your share link:
   http://localhost:3002/portfolio/share/YOUR-TOKEN

📋 All policies created:
   • auth_users_* policies for authenticated users
   • public_select_* policies for public access
   • anon_select_* policies for anonymous access

🎉 Sharing is ready to use!
' as result;

-- Commit only after success banner selected
COMMIT;

-- If you need to abort manually (in psql), you could issue: ROLLBACK; before COMMIT executes.
-- ========================================
-- END OF SCRIPT
-- ========================================
