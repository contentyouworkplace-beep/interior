-- ==========================================
-- COMPLETE FIX FOR TABLE DEPENDENCY ERRORS
-- ==========================================
-- This fixes both user_id and team_members dependency issues

-- Step 1: Drop schema and recreate cleanly (if you want fresh start)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
-- GRANT ALL ON SCHEMA public TO postgres, service_role;

-- Step 2: If you just want to fix existing issues, run these:

-- Fix project_files missing user_id column
ALTER TABLE project_files 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update any existing project_files records
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    IF first_user_id IS NOT NULL THEN
        UPDATE project_files 
        SET user_id = first_user_id 
        WHERE user_id IS NULL;
    END IF;
END $$;

-- Make user_id NOT NULL
ALTER TABLE project_files 
ALTER COLUMN user_id SET NOT NULL;

-- Step 3: Create team_members table first (if it doesn't exist)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  specialization TEXT,
  hourly_rate DECIMAL(10,2),
  experience_years INTEGER,
  portfolio_url TEXT,
  bio TEXT,
  salary DECIMAL(12,2),
  advance_salary DECIMAL(12,2),
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  status TEXT DEFAULT 'active',
  join_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Add missing foreign key constraints
ALTER TABLE project_tasks 
ADD CONSTRAINT IF NOT EXISTS fk_project_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES team_members(id);

ALTER TABLE project_team_members 
ADD CONSTRAINT IF NOT EXISTS fk_project_team_members_team_member_id 
FOREIGN KEY (team_member_id) REFERENCES team_members(id);