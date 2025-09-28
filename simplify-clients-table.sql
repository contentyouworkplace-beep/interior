-- ==========================================
-- SIMPLIFY CLIENTS TABLE - REMOVE EXTRA FIELDS
-- ==========================================
-- This script removes unnecessary columns from the clients table
-- to match the simplified Add Client dialog form

-- Run this in your Supabase SQL Editor

-- Check current table structure before changes
SELECT 'Current clients table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Remove extra fields that are not in the simplified Add Client form
DO $$
BEGIN
    -- Remove client_type column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'client_type'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients DROP COLUMN client_type;
        RAISE NOTICE 'Removed client_type column';
    END IF;

    -- Remove budget_range column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'budget_range'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients DROP COLUMN budget_range;
        RAISE NOTICE 'Removed budget_range column';
    END IF;

    -- Remove preferred_style column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'preferred_style'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients DROP COLUMN preferred_style;
        RAISE NOTICE 'Removed preferred_style column';
    END IF;

    -- Remove status column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients DROP COLUMN status;
        RAISE NOTICE 'Removed status column';
    END IF;

    -- Remove country column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'country'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients DROP COLUMN country;
        RAISE NOTICE 'Removed country column';
    END IF;

    -- Remove postal_code column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'postal_code'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients DROP COLUMN postal_code;
        RAISE NOTICE 'Removed postal_code column';
    END IF;

    -- Remove state column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'state'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients DROP COLUMN state;
        RAISE NOTICE 'Removed state column';
    END IF;

    -- Remove website column
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'website'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE clients DROP COLUMN website;
        RAISE NOTICE 'Removed website column';
    END IF;

END $$;

-- Check final table structure after changes
SELECT 'Final clients table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'clients'
ORDER BY ordinal_position;

-- Show the fields that should remain:
SELECT 'Remaining fields should be:' as info;
SELECT 'id, user_id, first_name, last_name, company, email, phone, alt_phone, address, city, notes, created_at, updated_at' as expected_fields;

-- Verify RLS is still enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'clients' AND schemaname = 'public';

-- Show current RLS policies (should still exist)
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'clients';

COMMIT;