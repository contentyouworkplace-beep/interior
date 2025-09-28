-- UPDATE EXPENSES TABLE SCHEMA
-- Remove status field and add new fields for enhanced expense management

-- Add new columns to expenses table
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS vendor TEXT,
  ADD COLUMN IF NOT EXISTS project_name TEXT,
  ADD COLUMN IF NOT EXISTS billable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS file_urls TEXT[],
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurring_period TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Remove status column if it exists
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'status') THEN
    ALTER TABLE expenses DROP COLUMN status;
  END IF;
END $$;

-- Update receipt_url to support multiple files (rename to legacy_receipt_url)
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'receipt_url') THEN
    ALTER TABLE expenses RENAME COLUMN receipt_url TO legacy_receipt_url;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_billable ON expenses(billable);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor);

-- Add constraint to ensure amount is positive
ALTER TABLE expenses ADD CONSTRAINT IF NOT EXISTS expenses_amount_positive CHECK (amount > 0);

-- Add constraint for expense date (not in future)
ALTER TABLE expenses ADD CONSTRAINT IF NOT EXISTS expenses_date_not_future CHECK (expense_date <= CURRENT_DATE);