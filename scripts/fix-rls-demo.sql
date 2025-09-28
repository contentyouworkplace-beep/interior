-- Quick RLS fix for demo user
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS for testing
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- Or alternatively, create a policy that allows your specific user
-- ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "demo_user_access" ON public.expenses;
-- CREATE POLICY "demo_user_access" ON public.expenses 
-- FOR ALL 
-- USING (user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6' OR auth.uid()::text = user_id);

-- Check current expenses for your user
SELECT * FROM public.expenses WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';