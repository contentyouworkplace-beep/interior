-- ==========================================
-- FIX RLS PERMISSIONS FOR CLIENTS TABLE
-- ==========================================
-- Execute this in your Supabase SQL Editor

-- First, make sure the clients table exists with the correct structure
DO $$
BEGIN
    -- Check if the user_id column exists and has the correct type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clients' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        -- Add user_id column if it doesn't exist
        ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

-- Create new RLS policies for clients table
CREATE POLICY "Users can view own clients" 
ON clients FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" 
ON clients FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" 
ON clients FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" 
ON clients FOR DELETE 
USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'clients';

-- Show current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'clients' AND schemaname = 'public';