-- ========================================
-- QUICK FIX: Restore Portfolio Access
-- ========================================
-- Run this if your portfolios disappeared

-- Re-create basic authenticated user policies
CREATE POLICY IF NOT EXISTS "auth_users_select_own_projects" 
ON portfolio_projects FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "auth_users_insert_own_projects" 
ON portfolio_projects FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "auth_users_update_own_projects" 
ON portfolio_projects FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "auth_users_delete_own_projects" 
ON portfolio_projects FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "auth_users_manage_media" 
ON portfolio_media FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM portfolio_projects 
    WHERE id = portfolio_media.project_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "auth_users_manage_shares" 
ON portfolio_shares FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM portfolio_projects 
    WHERE id = portfolio_shares.project_id 
    AND user_id = auth.uid()
  )
);

SELECT '✅ Portfolio access restored! Refresh your browser.' as result;
