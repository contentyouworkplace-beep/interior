-- ==========================================
-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- ==========================================
-- This fixes RLS isolation for ALL CRM tables

-- 1. FIX CLIENTS TABLE
-- ==========================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_clients" ON clients;
DROP POLICY IF EXISTS "Users can manage own clients" ON clients;
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

CREATE POLICY "clients_user_isolation_select" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_user_isolation_insert" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_user_isolation_update" ON clients FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clients_user_isolation_delete" ON clients FOR DELETE USING (auth.uid() = user_id);

-- 2. FIX TEAM_MEMBERS TABLE
-- ==========================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_team_members" ON team_members;
DROP POLICY IF EXISTS "Users can manage own team members" ON team_members;
DROP POLICY IF EXISTS "team_members_select_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_update_policy" ON team_members;
DROP POLICY IF EXISTS "team_members_delete_policy" ON team_members;

CREATE POLICY "team_members_user_isolation_select" ON team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "team_members_user_isolation_insert" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "team_members_user_isolation_update" ON team_members FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "team_members_user_isolation_delete" ON team_members FOR DELETE USING (auth.uid() = user_id);

-- 3. STRENGTHEN ALL OTHER TABLES (EXTRA SECURITY)
-- ==========================================

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_projects" ON projects;
CREATE POLICY "projects_user_isolation" ON projects FOR ALL USING (auth.uid() = user_id);

-- Quotations
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_quotations" ON quotations;
CREATE POLICY "quotations_user_isolation" ON quotations FOR ALL USING (auth.uid() = user_id);

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_invoices" ON invoices;
CREATE POLICY "invoices_user_isolation" ON invoices FOR ALL USING (auth.uid() = user_id);

-- Expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_expenses" ON expenses;
CREATE POLICY "expenses_user_isolation" ON expenses FOR ALL USING (auth.uid() = user_id);

-- Vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_vendors" ON vendors;
CREATE POLICY "vendors_user_isolation" ON vendors FOR ALL USING (auth.uid() = user_id);

-- Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_payments" ON payments;
CREATE POLICY "payments_user_isolation" ON payments FOR ALL USING (auth.uid() = user_id);

-- Business Settings
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_business_settings" ON business_settings;
CREATE POLICY "business_settings_user_isolation" ON business_settings FOR ALL USING (auth.uid() = user_id);

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_data_only" ON profiles;
CREATE POLICY "profiles_user_isolation" ON profiles FOR ALL USING (auth.uid() = id);

-- 4. RELATED TABLES (FOREIGN KEY PROTECTION)
-- ==========================================

-- Project Tasks (access via projects.user_id)
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage project tasks" ON project_tasks;
CREATE POLICY "project_tasks_user_isolation" ON project_tasks FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
);

-- Quotation Items (access via quotations.user_id)
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage quotation items" ON quotation_items;
CREATE POLICY "quotation_items_user_isolation" ON quotation_items FOR ALL USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
);

-- Invoice Items (access via invoices.user_id)
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage invoice items" ON invoice_items;
CREATE POLICY "invoice_items_user_isolation" ON invoice_items FOR ALL USING (
    EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);

-- 5. VERIFICATION
-- ==========================================

-- Check RLS status on all tables
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('clients', 'projects', 'quotations', 'invoices', 'expenses', 'vendors', 'team_members', 'payments')
ORDER BY tablename;

-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('clients', 'projects', 'quotations', 'invoices', 'expenses', 'vendors', 'team_members', 'payments')
GROUP BY tablename
ORDER BY tablename;

-- Success message
SELECT 'COMPREHENSIVE RLS SECURITY APPLIED - ALL TABLES NOW HAVE USER ISOLATION!' as status;