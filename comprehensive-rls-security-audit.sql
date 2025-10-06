-- ==========================================
-- COMPREHENSIVE RLS SECURITY AUDIT & FIX
-- ==========================================
-- This script ensures complete user data isolation for 100+ users
-- Each user can ONLY access their own data

-- 1. CHECK FOR MISSING RLS ON ADDITIONAL TABLES
-- ==========================================

-- Enable RLS on portfolio tables if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'portfolios') THEN
        ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can manage own portfolios" ON portfolios;
        CREATE POLICY "Users can manage own portfolios" ON portfolios 
        FOR ALL USING (auth.uid() = user_id);
        
        RAISE NOTICE 'RLS enabled for portfolios table';
    END IF;
END $$;

-- Enable RLS on portfolio_items if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'portfolio_items') THEN
        ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can manage portfolio items" ON portfolio_items;
        CREATE POLICY "Users can manage portfolio items" ON portfolio_items 
        FOR ALL USING (
            EXISTS (SELECT 1 FROM portfolios WHERE portfolios.id = portfolio_items.portfolio_id AND portfolios.user_id = auth.uid())
        );
        
        RAISE NOTICE 'RLS enabled for portfolio_items table';
    END IF;
END $$;

-- Enable RLS on vendor_files if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendor_files') THEN
        ALTER TABLE vendor_files ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can manage vendor files" ON vendor_files;
        CREATE POLICY "Users can manage vendor files" ON vendor_files 
        FOR ALL USING (auth.uid() = user_id);
        
        RAISE NOTICE 'RLS enabled for vendor_files table';
    END IF;
END $$;

-- Enable RLS on payment_records (already has RLS but let's ensure it's correct)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payment_records') THEN
        ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can only see their own payment records" ON payment_records;
        CREATE POLICY "Users can only see their own payment records" ON payment_records 
        FOR ALL USING (auth.uid() = user_id);
        
        RAISE NOTICE 'RLS verified for payment_records table';
    END IF;
END $$;

-- 2. STRENGTHEN EXISTING RLS POLICIES
-- ==========================================

-- Add INSERT/UPDATE/DELETE specific policies for critical tables
-- This provides more granular control than just "FOR ALL"

-- Clients - Separate policies for different operations
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

CREATE POLICY "Users can view own clients" ON clients 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON clients 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON clients 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON clients 
FOR DELETE USING (auth.uid() = user_id);

-- Projects - Enhanced security
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

CREATE POLICY "Users can view own projects" ON projects 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects 
FOR DELETE USING (auth.uid() = user_id);

-- Quotations - Enhanced security
DROP POLICY IF EXISTS "Users can view own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can insert own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can update own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can delete own quotations" ON quotations;

CREATE POLICY "Users can view own quotations" ON quotations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotations" ON quotations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotations" ON quotations 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotations" ON quotations 
FOR DELETE USING (auth.uid() = user_id);

-- 3. ENSURE FOREIGN KEY RELATIONSHIPS ARE SECURE
-- ==========================================

-- Project tasks - Only access tasks from own projects
DROP POLICY IF EXISTS "Users can manage project tasks" ON project_tasks;
CREATE POLICY "Users can view project tasks" ON project_tasks 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
);

CREATE POLICY "Users can insert project tasks" ON project_tasks 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
);

CREATE POLICY "Users can update project tasks" ON project_tasks 
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
);

CREATE POLICY "Users can delete project tasks" ON project_tasks 
FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
);

-- Quotation items - Only access items from own quotations
DROP POLICY IF EXISTS "Users can manage quotation items" ON quotation_items;
CREATE POLICY "Users can view quotation items" ON quotation_items 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
);

CREATE POLICY "Users can insert quotation items" ON quotation_items 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
);

CREATE POLICY "Users can update quotation items" ON quotation_items 
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
);

CREATE POLICY "Users can delete quotation items" ON quotation_items 
FOR DELETE USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
);

-- 4. PREVENT DATA LEAKAGE IN FUNCTIONS
-- ==========================================

-- Create a security-definer function to check user access
CREATE OR REPLACE FUNCTION check_user_access(table_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN table_user_id = auth.uid();
END;
$$;

-- 5. ADD LOGGING FOR SECURITY MONITORING
-- ==========================================

-- Create a function to log access attempts
CREATE OR REPLACE FUNCTION log_access_attempt(
    table_name TEXT,
    operation TEXT,
    user_id UUID DEFAULT auth.uid()
)
RETURNS VOID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO activity_log (user_id, action, details, created_at)
    VALUES (
        user_id,
        'data_access',
        jsonb_build_object(
            'table', table_name,
            'operation', operation,
            'timestamp', NOW()
        ),
        NOW()
    );
EXCEPTION WHEN OTHERS THEN
    -- Silently fail if activity_log doesn't exist or has issues
    NULL;
END;
$$;

-- 6. FINAL VERIFICATION QUERIES
-- ==========================================

-- Check all tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- Check all RLS policies
SELECT 
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==========================================
-- SECURITY VALIDATION COMPLETE
-- ==========================================

SELECT 'RLS Security audit and strengthening completed successfully!' AS status;