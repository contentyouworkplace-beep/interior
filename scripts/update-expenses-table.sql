-- Update expenses table to match the service interface
-- Run this in Supabase SQL Editor

-- Add missing columns to expenses table
DO $$ 
BEGIN 
  -- Add vendor column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'vendor') THEN
    ALTER TABLE expenses ADD COLUMN vendor TEXT;
  END IF;
  
  -- Add billable column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'billable') THEN
    ALTER TABLE expenses ADD COLUMN billable BOOLEAN DEFAULT false;
  END IF;
  
  -- Add file_urls column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'file_urls') THEN
    ALTER TABLE expenses ADD COLUMN file_urls TEXT[];
  END IF;
  
  -- Add tags column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'tags') THEN
    ALTER TABLE expenses ADD COLUMN tags TEXT[];
  END IF;
  
  -- Add payment_method column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'payment_method') THEN
    ALTER TABLE expenses ADD COLUMN payment_method TEXT;
  END IF;
  
  -- Add tax_amount column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'tax_amount') THEN
    ALTER TABLE expenses ADD COLUMN tax_amount DECIMAL(12,2);
  END IF;
  
  -- Add notes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'notes') THEN
    ALTER TABLE expenses ADD COLUMN notes TEXT;
  END IF;
  
  -- Rename receipt_url to legacy_receipt_url if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'receipt_url') 
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'legacy_receipt_url') THEN
    ALTER TABLE expenses RENAME COLUMN receipt_url TO legacy_receipt_url;
  END IF;
  
  -- Remove status column if it exists (not needed for our interface)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'status') THEN
    ALTER TABLE expenses DROP COLUMN status;
  END IF;
  
END $$;

-- Update the updated_at trigger to ensure it works properly
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure trigger exists
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();