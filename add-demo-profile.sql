-- ==========================================
-- ADD DEMO PROFILE FOR TESTING
-- ==========================================
-- Execute this in your Supabase SQL Editor

-- Insert demo profile for user ID: 4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6
INSERT INTO profiles (
  id,
  first_name,
  last_name,
  company_name,
  phone,
  role,
  designation,
  department,
  created_at,
  updated_at
) VALUES (
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
  'Rahul',
  'Medhe',
  'Interior Design Studio',
  '+91 98765 43210',
  'designer',
  'Lead Interior Designer',
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

-- Verify the profile was added
SELECT 
  id,
  first_name,
  last_name,
  company_name,
  phone,
  role,
  created_at
FROM profiles 
WHERE id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';