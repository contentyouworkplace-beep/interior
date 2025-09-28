-- Add missing columns to expenses table
-- Run this in your Supabase SQL Editor

-- Add vendor column
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS vendor TEXT;

-- Add payment_method column  
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Add tax_amount column
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2);

-- Add notes column
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;

-- Test query to make sure all columns work
SELECT 
  id, user_id, project_id, category, amount, description, 
  expense_date, receipt_url, status, billable,
  vendor, payment_method, tax_amount, notes,
  created_at, updated_at
FROM expenses 
LIMIT 1;