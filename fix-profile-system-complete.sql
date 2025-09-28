-- ==========================================
-- COMPLETE PROFILE SYSTEM FIX
-- ==========================================
-- Execute this ENTIRE script in your Supabase SQL Editor

-- Step 1: Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Step 3: Create new RLS policies for profiles table
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
ON profiles FOR DELETE 
USING (auth.uid() = id);

-- Step 4: Insert demo profile data
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  company_name,
  phone,
  avatar_url,
  role,
  designation,
  department,
  created_at,
  updated_at
) VALUES (
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
  'John',
  'Doe',
  'Design Studio Pro',
  '+1234567890',
  '',
  'designer',
  'Senior Interior Designer',
  'Design',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  company_name = EXCLUDED.company_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  designation = EXCLUDED.designation,
  department = EXCLUDED.department,
  updated_at = NOW();

-- Step 5: Verify everything is working
SELECT 'RLS Policies for profiles table:' as check_type;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 'Demo profile data:' as check_type;
SELECT * FROM profiles WHERE id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';

SELECT 'RLS status:' as check_type;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';