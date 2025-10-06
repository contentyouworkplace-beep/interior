-- Fix invoice_items RLS policy
-- The policy exists but may be configured incorrectly

-- Step 1: Drop the existing policy
DROP POLICY IF EXISTS "Allow all for authenticated users" ON invoice_items;

-- Step 2: Recreate with correct configuration
CREATE POLICY "Allow all for authenticated users" 
ON invoice_items 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 3: Verify the policy was created
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'invoice_items';
