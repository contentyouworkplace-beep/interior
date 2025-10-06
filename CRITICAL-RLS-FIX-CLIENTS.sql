-- ==========================================
-- CRITICAL RLS FIX FOR CLIENTS TABLE
-- ==========================================
-- This MUST be run in Supabase SQL Editor to fix user data isolation

-- 1. ENABLE RLS ON CLIENTS TABLE
-- ==========================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 2. DROP ALL EXISTING POLICIES
-- ==========================================
DROP POLICY IF EXISTS "users_own_clients" ON clients;
DROP POLICY IF EXISTS "Users can manage own clients" ON clients;
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

-- 3. CREATE STRICT USER ISOLATION POLICIES
-- ==========================================

-- Policy for SELECT (viewing clients)
CREATE POLICY "clients_user_isolation_select" ON clients
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for INSERT (creating clients)
CREATE POLICY "clients_user_isolation_insert" ON clients
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE (modifying clients)
CREATE POLICY "clients_user_isolation_update" ON clients
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for DELETE (removing clients)
CREATE POLICY "clients_user_isolation_delete" ON clients
  FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. VERIFICATION QUERIES
-- ==========================================

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'clients' AND schemaname = 'public';

-- Check policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'clients' AND schemaname = 'public'
ORDER BY policyname;

-- Count total clients (this should show ALL clients - will be high)
-- This query bypasses RLS because it's run as superuser
SELECT COUNT(*) as total_clients_in_db FROM clients;

-- Show user distribution (this will show the isolation problem)
SELECT 
  user_id,
  COUNT(*) as client_count,
  MIN(first_name) as sample_client
FROM clients 
GROUP BY user_id 
ORDER BY client_count DESC;

-- ==========================================
-- IMMEDIATE TESTING
-- ==========================================

-- After running this, test by:
-- 1. Login as demo@admin.com 
-- 2. Go to /clients page
-- 3. Should only see clients with user_id matching that user
-- 4. Login as another user
-- 5. Should see completely different clients

-- ==========================================
-- SUCCESS INDICATORS
-- ==========================================

-- ✅ RLS enabled: rowsecurity = true
-- ✅ 4 policies created: select, insert, update, delete
-- ✅ Each user sees only their own clients
-- ✅ No cross-user data visibility

SELECT 'RLS policies applied successfully for clients table!' as status;