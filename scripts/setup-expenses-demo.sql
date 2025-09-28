-- ======================================
-- INTERIOR DESIGNER CRM - EXPENSES SETUP
-- ======================================

-- 1. Create expenses table with proper structure
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID NULL,
    category TEXT NOT NULL CHECK (category IN ('Materials', 'Labor', 'Transportation', 'Equipment', 'Miscellaneous', 'Software', 'Marketing', 'Office Supplies')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    receipt_url TEXT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT expenses_amount_positive CHECK (amount > 0),
    CONSTRAINT expenses_description_not_empty CHECK (LENGTH(TRIM(description)) > 0)
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON public.expenses(created_at);

-- 3. Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

-- 5. Create RLS policies
CREATE POLICY "Users can view their own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create demo data
DO $$
DECLARE
    demo_user_id UUID;
    demo_project_id UUID;
BEGIN
    -- Try to get current authenticated user, fallback to demo user
    demo_user_id := auth.uid();
    
    -- If no authenticated user, create/use demo user
    IF demo_user_id IS NULL THEN
        demo_user_id := 'demo-user-12345678-1234-1234-1234-123456789012';
        demo_project_id := 'demo-proj-12345678-1234-1234-1234-123456789012';
    ELSE
        demo_project_id := NULL; -- Use actual user's project if available
    END IF;
    
    -- Insert comprehensive demo expenses
    INSERT INTO public.expenses (user_id, project_id, category, amount, description, expense_date, status, created_at)
    VALUES 
        -- Recent expenses (this month)
        (demo_user_id, demo_project_id, 'Materials', 12500.00, 'Premium hardwood flooring for living room', CURRENT_DATE - INTERVAL '2 days', 'approved', NOW() - INTERVAL '2 days'),
        (demo_user_id, demo_project_id, 'Labor', 8000.00, 'Electrical wiring installation by certified electrician', CURRENT_DATE - INTERVAL '5 days', 'approved', NOW() - INTERVAL '5 days'),
        (demo_user_id, demo_project_id, 'Transportation', 750.00, 'Material delivery and logistics costs', CURRENT_DATE - INTERVAL '1 day', 'pending', NOW() - INTERVAL '1 day'),
        (demo_user_id, demo_project_id, 'Equipment', 3200.00, 'Professional grade power tools rental', CURRENT_DATE - INTERVAL '7 days', 'approved', NOW() - INTERVAL '7 days'),
        
        -- Last month expenses
        (demo_user_id, demo_project_id, 'Materials', 15600.00, 'Italian marble tiles for kitchen backsplash', CURRENT_DATE - INTERVAL '15 days', 'approved', NOW() - INTERVAL '15 days'),
        (demo_user_id, demo_project_id, 'Labor', 22000.00, 'Kitchen cabinet installation by expert craftsmen', CURRENT_DATE - INTERVAL '18 days', 'approved', NOW() - INTERVAL '18 days'),
        (demo_user_id, demo_project_id, 'Software', 1200.00, 'AutoCAD and SketchUp Pro licenses', CURRENT_DATE - INTERVAL '20 days', 'approved', NOW() - INTERVAL '20 days'),
        (demo_user_id, demo_project_id, 'Miscellaneous', 450.00, 'Client meeting refreshments and materials', CURRENT_DATE - INTERVAL '12 days', 'approved', NOW() - INTERVAL '12 days'),
        
        -- Older expenses (2+ months ago)
        (demo_user_id, demo_project_id, 'Materials', 8900.00, 'Designer lighting fixtures from Europe', CURRENT_DATE - INTERVAL '45 days', 'approved', NOW() - INTERVAL '45 days'),
        (demo_user_id, demo_project_id, 'Transportation', 1200.00, 'Site visit transportation costs', CURRENT_DATE - INTERVAL '50 days', 'approved', NOW() - INTERVAL '50 days'),
        (demo_user_id, demo_project_id, 'Labor', 18500.00, 'Plumbing installation and bathroom renovation', CURRENT_DATE - INTERVAL '60 days', 'approved', NOW() - INTERVAL '60 days'),
        (demo_user_id, demo_project_id, 'Equipment', 2800.00, 'Specialized measuring and leveling equipment', CURRENT_DATE - INTERVAL '35 days', 'approved', NOW() - INTERVAL '35 days'),
        
        -- Pending/Recent expenses for testing
        (demo_user_id, demo_project_id, 'Marketing', 2500.00, 'Photography and portfolio website development', CURRENT_DATE, 'pending', NOW()),
        (demo_user_id, demo_project_id, 'Office Supplies', 380.00, 'Design materials, papers, and presentation supplies', CURRENT_DATE - INTERVAL '3 days', 'pending', NOW() - INTERVAL '3 days'),
        (demo_user_id, demo_project_id, 'Materials', 6700.00, 'Custom furniture hardware and accessories', CURRENT_DATE - INTERVAL '1 day', 'pending', NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Demo expenses created successfully for user: %', demo_user_id;
    
END $$;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.expenses TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 8. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Display summary
DO $$
DECLARE
    expense_count INTEGER;
    total_amount DECIMAL(12,2);
BEGIN
    SELECT COUNT(*), COALESCE(SUM(amount), 0) 
    INTO expense_count, total_amount 
    FROM public.expenses;
    
    RAISE NOTICE '=== EXPENSES SETUP COMPLETE ===';
    RAISE NOTICE 'Total expenses in database: %', expense_count;
    RAISE NOTICE 'Total amount: ₹%', total_amount;
    RAISE NOTICE 'Table ready for testing at: http://localhost:3001/expenses';
END $$;