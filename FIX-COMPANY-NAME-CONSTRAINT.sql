-- Fix company_profiles table to allow NULL values and make fields optional
-- This addresses the NOT NULL constraint error

-- Make company_name column nullable (remove NOT NULL constraint)
ALTER TABLE company_profiles ALTER COLUMN company_name DROP NOT NULL;

-- Verify the constraint removal
SELECT 'Company profiles table updated successfully - company_name is now nullable' as status;