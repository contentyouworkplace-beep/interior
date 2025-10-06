-- Fix RLS Policies for Quotations Table
-- This script adds missing SELECT policies for quotations and quotation_items tables
-- Run this in Supabase Dashboard -> SQL Editor

-- ============================================================================
-- 1. DROP EXISTING POLICIES (if any conflicts)
-- ============================================================================

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on quotations" ON quotations;
DROP POLICY IF EXISTS "quotations_user_isolation" ON quotations;
DROP POLICY IF EXISTS "Users can manage own quotations" ON quotations;

-- Drop and recreate individual CRUD policies for clarity
DROP POLICY IF EXISTS "Users can view own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can insert own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can update own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can delete own quotations" ON quotations;

-- ============================================================================
-- 2. CREATE GRANULAR POLICIES FOR QUOTATIONS
-- ============================================================================

-- SELECT policy - Users can view their own quotations
CREATE POLICY "Users can view own quotations" ON quotations 
FOR SELECT 
USING (auth.uid() = user_id);

-- INSERT policy - Users can create quotations for themselves
CREATE POLICY "Users can insert own quotations" ON quotations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy - Users can update their own quotations
CREATE POLICY "Users can update own quotations" ON quotations 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy - Users can delete their own quotations
CREATE POLICY "Users can delete own quotations" ON quotations 
FOR DELETE 
USING (auth.uid() = user_id);

-- ============================================================================
-- 3. ENSURE QUOTATION_ITEMS POLICIES EXIST
-- ============================================================================

-- Drop existing policies for quotation_items
DROP POLICY IF EXISTS "Users can view items for own quotations" ON quotation_items;
DROP POLICY IF EXISTS "Users can insert items for own quotations" ON quotation_items;
DROP POLICY IF EXISTS "Users can update items for own quotations" ON quotation_items;
DROP POLICY IF EXISTS "Users can delete items for own quotations" ON quotation_items;

-- SELECT policy - Users can view items for their quotations
CREATE POLICY "Users can view items for own quotations" ON quotation_items 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM quotations 
        WHERE quotations.id = quotation_items.quotation_id 
        AND quotations.user_id = auth.uid()
    )
);

-- INSERT policy - Users can add items to their quotations
CREATE POLICY "Users can insert items for own quotations" ON quotation_items 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM quotations 
        WHERE quotations.id = quotation_items.quotation_id 
        AND quotations.user_id = auth.uid()
    )
);

-- UPDATE policy - Users can update items in their quotations
CREATE POLICY "Users can update items for own quotations" ON quotation_items 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM quotations 
        WHERE quotations.id = quotation_items.quotation_id 
        AND quotations.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM quotations 
        WHERE quotations.id = quotation_items.quotation_id 
        AND quotations.user_id = auth.uid()
    )
);

-- DELETE policy - Users can delete items from their quotations
CREATE POLICY "Users can delete items for own quotations" ON quotation_items 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM quotations 
        WHERE quotations.id = quotation_items.quotation_id 
        AND quotations.user_id = auth.uid()
    )
);

-- ============================================================================
-- 4. VERIFICATION QUERIES
-- ============================================================================

-- Check that RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('quotations', 'quotation_items');

-- List all policies on quotations table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'quotations'
ORDER BY policyname;

-- List all policies on quotation_items table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'quotation_items'
ORDER BY policyname;

-- ============================================================================
-- 5. TEST QUERIES (run these to verify policies work)
-- ============================================================================

-- Test SELECT (should return user's quotations)
-- SELECT COUNT(*) as my_quotations_count FROM quotations;

-- Test INSERT (should succeed if authenticated)
-- INSERT INTO quotations (user_id, client_id, quotation_number, title, subtotal, total_amount, status)
-- VALUES (auth.uid(), '<valid-client-id>', 'TEST-001', 'Test Quote', 100, 100, 'draft');

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- After running this script:
-- 1. GET /api/quotations should return user's quotations (not empty array)
-- 2. POST /api/quotations should continue to work (INSERT policy preserved)
-- 3. PATCH /api/quotations/[id] should work (UPDATE policy added)
-- 4. DELETE /api/quotations/[id] should work (DELETE policy added)
-- ============================================================================
