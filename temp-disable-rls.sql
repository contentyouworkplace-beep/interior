-- TEMPORARY FIX - DISABLE RLS (NOT RECOMMENDED FOR PRODUCTION)
-- Execute this in Supabase SQL Editor if you need immediate access

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Insert demo profile data
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

-- WARNING: Remember to enable RLS and create proper policies later for security!