-- Create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID NULL,
    category TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url TEXT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);

-- Enable RLS (Row Level Security)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
CREATE POLICY "Users can view their own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
CREATE POLICY "Users can insert their own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
CREATE POLICY "Users can update their own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
CREATE POLICY "Users can delete their own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- Create a test user and some sample data (optional)
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Create a test user in auth.users (this might fail if user already exists)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role)
    VALUES (
        'test-user-id-12345678-1234-1234-1234-123456789012',
        'test@example.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        'authenticated'
    ) ON CONFLICT (id) DO NOTHING;
    
    test_user_id := 'test-user-id-12345678-1234-1234-1234-123456789012';
    
    -- Insert some sample expenses for testing
    INSERT INTO public.expenses (user_id, category, amount, description, expense_date, status)
    VALUES 
        (test_user_id, 'Materials', 5000.00, 'Wood and hardware for kitchen cabinets', CURRENT_DATE - INTERVAL '5 days', 'approved'),
        (test_user_id, 'Labor', 15000.00, 'Carpenter fees for cabinet installation', CURRENT_DATE - INTERVAL '3 days', 'pending'),
        (test_user_id, 'Transportation', 500.00, 'Material delivery charges', CURRENT_DATE - INTERVAL '1 day', 'approved')
    ON CONFLICT DO NOTHING;
    
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.expenses TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;