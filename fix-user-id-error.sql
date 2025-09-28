-- ==========================================
-- QUICK FIX FOR USER_ID COLUMN ERROR
-- ==========================================
-- Run this first to fix the immediate column issue

-- Add missing user_id column to project_files if it doesn't exist
ALTER TABLE project_files 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update any existing records to have a user_id (set to first user if any exist)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user ID
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- Update project_files that don't have user_id set
    IF first_user_id IS NOT NULL THEN
        UPDATE project_files 
        SET user_id = first_user_id 
        WHERE user_id IS NULL;
    END IF;
END $$;

-- Now make the column NOT NULL
ALTER TABLE project_files 
ALTER COLUMN user_id SET NOT NULL;