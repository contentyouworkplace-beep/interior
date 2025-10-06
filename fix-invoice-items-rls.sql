-- Fix RLS policies for invoice_items table
-- This allows users to access invoice items for invoices they own

-- First, check if RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'invoice_items';

-- Enable RLS (if not already enabled)
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view invoice items for their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can insert invoice items for their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can update invoice items for their invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can delete invoice items for their invoices" ON invoice_items;

-- CREATE SELECT POLICY
-- Users can view invoice items if they own the parent invoice
CREATE POLICY "Users can view invoice items for their invoices"
ON invoice_items
FOR SELECT
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

-- CREATE INSERT POLICY
-- Users can insert invoice items if they own the parent invoice
CREATE POLICY "Users can insert invoice items for their invoices"
ON invoice_items
FOR INSERT
WITH CHECK (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

-- CREATE UPDATE POLICY
-- Users can update invoice items if they own the parent invoice
CREATE POLICY "Users can update invoice items for their invoices"
ON invoice_items
FOR UPDATE
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

-- CREATE DELETE POLICY
-- Users can delete invoice items if they own the parent invoice
CREATE POLICY "Users can delete invoice items for their invoices"
ON invoice_items
FOR DELETE
USING (
  invoice_id IN (
    SELECT id FROM invoices WHERE user_id = auth.uid()
  )
);

-- Verify policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'invoice_items';
