-- Portfolio Public Sharing Fix
-- This script enables public access for shared portfolio links
-- Run this in Supabase SQL Editor

-- ==========================================
-- 1. Enable RLS on portfolio tables
-- ==========================================

ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_shares ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. Drop existing conflicting policies
-- ==========================================

-- Portfolio Projects
DROP POLICY IF EXISTS "Users can view their own projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Public access for shared projects" ON portfolio_projects;
DROP POLICY IF EXISTS "Public access via share token" ON portfolio_projects;

-- Portfolio Media
DROP POLICY IF EXISTS "Users can manage their project media" ON portfolio_media;
DROP POLICY IF EXISTS "Public access for shared media" ON portfolio_media;
DROP POLICY IF EXISTS "Public access via share token media" ON portfolio_media;

-- Portfolio Shares
DROP POLICY IF EXISTS "Users can manage their project shares" ON portfolio_shares;
DROP POLICY IF EXISTS "Public access for valid shares" ON portfolio_shares;
DROP POLICY IF EXISTS "Public can view valid shares" ON portfolio_shares;

-- ==========================================
-- 3. Create policies for authenticated users
-- ==========================================

-- PORTFOLIO_PROJECTS: Authenticated users can manage their own projects
CREATE POLICY "Users can view their own projects" 
ON portfolio_projects
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own projects" 
ON portfolio_projects
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects" 
ON portfolio_projects
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" 
ON portfolio_projects
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- PORTFOLIO_MEDIA: Authenticated users can manage their project media
CREATE POLICY "Users can manage their project media" 
ON portfolio_media
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM portfolio_projects 
    WHERE id = portfolio_media.project_id 
    AND user_id = auth.uid()
  )
);

-- PORTFOLIO_SHARES: Authenticated users can manage their project shares
CREATE POLICY "Users can manage their project shares" 
ON portfolio_shares
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM portfolio_projects 
    WHERE id = portfolio_shares.project_id 
    AND user_id = auth.uid()
  )
);

-- ==========================================
-- 4. Create PUBLIC ACCESS policies for sharing
-- ==========================================

-- PUBLIC ACCESS: Anyone can view projects via valid share token
CREATE POLICY "Public access via share token" 
ON portfolio_projects
FOR SELECT 
TO public, anon, authenticated
USING (
  id IN (
    SELECT project_id 
    FROM portfolio_shares 
    WHERE (expires_at IS NULL OR expires_at > NOW())
    AND NOT deleted
  )
);

-- PUBLIC ACCESS: Anyone can view media for shared projects
CREATE POLICY "Public access via share token media" 
ON portfolio_media
FOR SELECT 
TO public, anon, authenticated
USING (
  project_id IN (
    SELECT project_id 
    FROM portfolio_shares 
    WHERE (expires_at IS NULL OR expires_at > NOW())
    AND NOT deleted
  )
);

-- PUBLIC ACCESS: Anyone can view valid share records
CREATE POLICY "Public can view valid shares" 
ON portfolio_shares
FOR SELECT 
TO public, anon, authenticated
USING (
  (expires_at IS NULL OR expires_at > NOW())
  AND NOT deleted
);

-- ==========================================
-- 5. Add deleted column if missing
-- ==========================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'portfolio_shares' 
    AND column_name = 'deleted'
  ) THEN
    ALTER TABLE portfolio_shares 
    ADD COLUMN deleted BOOLEAN DEFAULT FALSE;
    
    RAISE NOTICE 'Added deleted column to portfolio_shares';
  END IF;
END $$;

-- ==========================================
-- 6. Update share token index for performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_portfolio_shares_token_valid 
ON portfolio_shares(share_token) 
WHERE (expires_at IS NULL OR expires_at > NOW()) AND NOT deleted;

-- ==========================================
-- 7. Verification queries
-- ==========================================

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('portfolio_projects', 'portfolio_media', 'portfolio_shares')
  AND schemaname = 'public'
ORDER BY tablename;

-- Check policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('portfolio_projects', 'portfolio_media', 'portfolio_shares')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test share access (replace with actual share_token)
-- SELECT * FROM portfolio_shares WHERE share_token = 'your-token-here';

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$ 
BEGIN 
  RAISE NOTICE '✅ Portfolio public sharing setup complete!';
  RAISE NOTICE '📦 RLS enabled on portfolio tables';
  RAISE NOTICE '🔒 Policies created for authenticated users';
  RAISE NOTICE '🌐 Public access enabled for shared portfolios';
  RAISE NOTICE '✨ Share links are now publicly accessible!';
END $$;
