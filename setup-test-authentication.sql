-- ==========================================
-- SETUP AUTHENTICATION AND TEST USER
-- ==========================================
-- Execute this in your Supabase SQL Editor

-- Step 1: Create demo user in auth.users (if not exists)
-- Note: This should be done through Supabase Auth signup, not direct SQL
-- This script just documents the process

-- For testing, use Supabase Dashboard -> Authentication -> Users -> Invite User
-- OR use the signup API to create user with:
-- Email: demo@interior-crm.com
-- Password: Demo123!@#
-- User ID: 4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6

-- Step 2: Update the existing demo profile to ensure it matches auth user
UPDATE profiles 
SET 
  first_name = 'John',
  last_name = 'Demo',
  company_name = 'Design Studio Pro',
  phone = '+1234567890',
  role = 'designer',
  designation = 'Senior Interior Designer',
  department = 'Design',
  updated_at = NOW()
WHERE id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';

-- Step 3: Create security settings for the demo user
INSERT INTO security_settings (
  user_id,
  two_factor_enabled,
  login_notifications,
  session_timeout,
  password_change_required,
  last_password_change,
  failed_login_attempts,
  account_locked,
  created_at,
  updated_at
) VALUES (
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
  false,
  true,
  3600,
  false,
  NOW(),
  0,
  false,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  two_factor_enabled = EXCLUDED.two_factor_enabled,
  login_notifications = EXCLUDED.login_notifications,
  session_timeout = EXCLUDED.session_timeout,
  password_change_required = EXCLUDED.password_change_required,
  last_password_change = EXCLUDED.last_password_change,
  updated_at = NOW();

-- Step 4: Verify the setup
SELECT 'Demo user profile:' as check_type;
SELECT * FROM profiles WHERE id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';

SELECT 'Demo user security settings:' as check_type;
SELECT * FROM security_settings WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';

-- Step 5: Check if user exists in auth.users (read-only check)
-- Note: auth.users table is managed by Supabase Auth service
SELECT 'Auth user check (if visible):' as check_type;
-- This may not work depending on RLS policies on auth schema