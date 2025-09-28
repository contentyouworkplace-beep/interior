-- Check current RLS policies and organization membership
-- Run this in Supabase SQL Editor to debug the RLS issue

-- 1. Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('company_profiles', 'banking_info', 'branding', 'organization_members');

-- 2. Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('company_profiles', 'banking_info', 'branding', 'organization_members')
ORDER BY tablename, policyname;

-- 3. Check organization membership for test user
SELECT * FROM public.organization_members 
WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6' 
AND organization_id = '00000000-0000-0000-0000-000000000001';

-- 4. Check if organizations table exists and has the test org
SELECT * FROM public.organizations 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5. Test if auth.uid() function works
SELECT auth.uid() AS current_user_id;