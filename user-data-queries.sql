-- Manual SQL Queries for User: 4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6
-- Execute these in Supabase Dashboard > SQL Editor

-- Check user's clients
SELECT id, first_name, last_name, email, phone 
FROM public.clients 
WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';

-- Check user's projects
SELECT id, name, status, client_id, created_at 
FROM public.projects 
WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'
ORDER BY created_at DESC;

-- Check user's quotations
SELECT id, project_id, amount, status, created_at 
FROM public.quotations 
WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'
ORDER BY created_at DESC;

-- Check user's tasks (after creating the tasks table)
SELECT id, title, scheduled_date, scheduled_time, type, completed 
FROM public.tasks 
WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'
ORDER BY scheduled_date, scheduled_time;

-- Check user's expenses
SELECT id, amount, description, expense_date 
FROM public.expenses 
WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'
ORDER BY expense_date DESC;

-- Check user's payments
SELECT id, amount, payment_date, status 
FROM public.payments 
WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'
ORDER BY payment_date DESC;