-- Copy and paste this into your Supabase SQL Editor
-- This will update the expenses table to match our ExpenseService interface

-- Add missing columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS vendor TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS billable BOOLEAN DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS file_urls TEXT[];
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;

-- Remove status column if it exists (not needed)  
ALTER TABLE expenses DROP COLUMN IF EXISTS status;

-- Enable RLS on expenses table
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create an RLS policy for expenses if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'expenses' AND policyname = 'Users can manage their own expenses'
    ) THEN
        CREATE POLICY "Users can manage their own expenses" ON expenses
        FOR ALL USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Create a test user if auth.users is empty (for development)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Check if we have any users
    IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
        -- Create a test user (only for development - you should use proper auth in production)
        test_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            id,
            email,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            role,
            email_confirmed_at
        ) VALUES (
            test_user_id,
            'test@example.com',
            '{"provider": "email", "providers": ["email"]}',
            '{"first_name": "Test", "last_name": "User"}',
            false,
            NOW(),
            NOW(),
            'authenticated',
            NOW()
        );
        
        -- Add profile for test user
        INSERT INTO profiles (
            id,
            first_name,
            last_name,
            company_name,
            role
        ) VALUES (
            test_user_id,
            'Test',
            'User',
            'Test Interior Design Co.',
            'designer'
        );
        
        -- Add some sample expenses for the test user
        INSERT INTO expenses (user_id, category, amount, description, expense_date, vendor, billable, payment_method, notes)
        VALUES 
            (test_user_id, 'Materials & Supplies', 25000.00, 'Teak wood panels for living room wall', '2024-09-10', 'Timber Mart', true, 'Credit Card', 'High-quality teak wood for premium finish'),
            (test_user_id, 'Labor & Wages', 8500.00, 'Custom cabinet installation labor', '2024-09-08', 'Skilled Carpenters Co.', true, 'Bank Transfer', 'Professional installation services'),
            (test_user_id, 'Furniture & Décor', 15000.00, 'Designer pendant lights for dining area', '2024-09-05', 'Luxury Lights Ltd', true, 'Credit Card', 'Premium lighting fixtures'),
            (test_user_id, 'Transportation', 1200.00, 'Furniture delivery from warehouse to site', '2024-09-03', 'Express Logistics', false, 'Cash', 'Same-day delivery service'),
            (test_user_id, 'Professional Services', 50000.00, 'Interior design consultation for villa project', '2024-09-01', 'Design Studio Pro', true, 'Cheque', 'Comprehensive design consultation');
    END IF;
END $$;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'expenses' 
ORDER BY ordinal_position;