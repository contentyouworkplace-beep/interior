-- Add missing file_type column to vendor_files table
-- Run this in Supabase SQL Editor

-- Add file_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'vendor_files' 
    AND column_name = 'file_type'
  ) THEN
    ALTER TABLE vendor_files ADD COLUMN file_type TEXT;
    RAISE NOTICE 'Added file_type column to vendor_files table';
  ELSE
    RAISE NOTICE 'file_type column already exists in vendor_files table';
  END IF;
END $$;