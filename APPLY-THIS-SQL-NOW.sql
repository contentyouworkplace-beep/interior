-- ============================================================================
-- CRITICAL FIX: Add SELECT policy for quotations table
-- ============================================================================
-- Problem: demo@admin.com has 2 quotations but they don't show in UI
-- Cause: SELECT policy is missing (RLS blocks SELECT queries)
-- Solution: Run this SQL in Supabase Dashboard -> SQL Editor
-- ============================================================================

-- Step 1: Drop any conflicting policies
DROP POLICY IF EXISTS "Allow all operations on quotations" ON quotations;
DROP POLICY IF EXISTS "quotations_user_isolation" ON quotations;
DROP POLICY IF EXISTS "Users can manage own quotations" ON quotations;

-- Step 2: Drop individual policies (we'll recreate them)
DROP POLICY IF EXISTS "Users can view own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can insert own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can update own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can delete own quotations" ON quotations;

-- Step 3: Create the CRITICAL SELECT policy
-- This is what's missing! Without this, GET /api/quotations returns empty array
CREATE POLICY "Users can view own quotations" ON quotations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Step 4: Create INSERT policy (preserve existing functionality)
CREATE POLICY "Users can insert own quotations" ON quotations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Step 5: Create UPDATE policy (for future edits)
CREATE POLICY "Users can update own quotations" ON quotations 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Step 6: Create DELETE policy (for future deletes)
CREATE POLICY "Users can delete own quotations" ON quotations 
FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION: Run these queries to confirm the fix worked
-- ============================================================================

-- 1. Check that policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'quotations'
ORDER BY cmd;

-- Expected output: 4 rows
-- Users can delete own quotations | DELETE
-- Users can insert own quotations | INSERT
-- Users can view own quotations   | SELECT  ← This one is critical!
-- Users can update own quotations | UPDATE

-- 2. Test if you can now see your quotations
-- (This should return 2 quotations for demo@admin.com)
SELECT 
    quotation_number,
    title,
    total_amount,
    status
FROM quotations
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Expected output: 2 rows
-- QUO-2025-0003 | Subject | ... | ...
-- QUO-2025-0004 | Subject | ... | ...

-- ============================================================================
-- AFTER RUNNING THIS:
-- ============================================================================
-- 1. Refresh your browser on the quotations page
-- 2. You should see 2 quotations (QUO-2025-0003 and QUO-2025-0004)
-- 3. Create a new quotation - it should appear immediately
-- ============================================================================
