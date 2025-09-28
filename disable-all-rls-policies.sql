-- ==========================================
-- DISABLE ALL RLS POLICIES - DEVELOPMENT MODE
-- ==========================================
-- Run this in Supabase SQL Editor to remove all RLS restrictions
-- This allows authenticated users full access to all data during development

-- ==========================================
-- DISABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==========================================

-- Core user and business tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings DISABLE ROW LEVEL SECURITY;

-- Client management tables
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;

-- Project management tables
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs DISABLE ROW LEVEL SECURITY;

-- Financial tables
ALTER TABLE quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- Team and vendor tables
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotations DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_files DISABLE ROW LEVEL SECURITY;

-- Communication and scheduling
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;

-- Inventory and assets
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- DROP ALL EXISTING RLS POLICIES
-- ==========================================

-- Drop all policies for profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Drop all policies for business_settings
DROP POLICY IF EXISTS "Users can view own business settings" ON business_settings;
DROP POLICY IF EXISTS "Users can update own business settings" ON business_settings;
DROP POLICY IF EXISTS "Users can insert own business settings" ON business_settings;

-- Drop all policies for clients
DROP POLICY IF EXISTS "Users can view own clients" ON clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON clients;
DROP POLICY IF EXISTS "Users can update own clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON clients;

-- Drop all policies for client_files
DROP POLICY IF EXISTS "Users can view own client files" ON client_files;
DROP POLICY IF EXISTS "Users can insert own client files" ON client_files;
DROP POLICY IF EXISTS "Users can update own client files" ON client_files;
DROP POLICY IF EXISTS "Users can delete own client files" ON client_files;

-- Drop all policies for leads
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert own leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;
DROP POLICY IF EXISTS "Users can delete own leads" ON leads;

-- Drop all policies for projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Drop all policies for project_tasks
DROP POLICY IF EXISTS "Users can view tasks for own projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can insert tasks for own projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can update tasks for own projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete tasks for own projects" ON project_tasks;

-- Drop all policies for project_team_members
DROP POLICY IF EXISTS "Select own project team members" ON project_team_members;
DROP POLICY IF EXISTS "Insert own project team members" ON project_team_members;
DROP POLICY IF EXISTS "Update own project team members" ON project_team_members;
DROP POLICY IF EXISTS "Delete own project team members" ON project_team_members;

-- Drop all policies for project_phases
DROP POLICY IF EXISTS "Select own project phases" ON project_phases;
DROP POLICY IF EXISTS "Insert own project phases" ON project_phases;
DROP POLICY IF EXISTS "Update own project phases" ON project_phases;
DROP POLICY IF EXISTS "Delete own project phases" ON project_phases;

-- Drop all policies for project_assets
DROP POLICY IF EXISTS "Users can view assets for own projects" ON project_assets;
DROP POLICY IF EXISTS "Users can insert assets for own projects" ON project_assets;
DROP POLICY IF EXISTS "Users can update assets for own projects" ON project_assets;
DROP POLICY IF EXISTS "Users can delete assets for own projects" ON project_assets;

-- Drop all policies for project_files
DROP POLICY IF EXISTS "Users can view files for own projects" ON project_files;
DROP POLICY IF EXISTS "Users can insert files for own projects" ON project_files;
DROP POLICY IF EXISTS "Users can update files for own projects" ON project_files;
DROP POLICY IF EXISTS "Users can delete files for own projects" ON project_files;

-- Drop all policies for quotations
DROP POLICY IF EXISTS "Users can view own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can insert own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can update own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can delete own quotations" ON quotations;

-- Drop all policies for quotation_items
DROP POLICY IF EXISTS "Users can view items for own quotations" ON quotation_items;
DROP POLICY IF EXISTS "Users can insert items for own quotations" ON quotation_items;
DROP POLICY IF EXISTS "Users can update items for own quotations" ON quotation_items;
DROP POLICY IF EXISTS "Users can delete items for own quotations" ON quotation_items;

-- Drop all policies for invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;

-- Drop all policies for invoice_items
DROP POLICY IF EXISTS "Users can view items for own invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can insert items for own invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can update items for own invoices" ON invoice_items;
DROP POLICY IF EXISTS "Users can delete items for own invoices" ON invoice_items;

-- Drop all policies for payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON payments;

-- Drop all policies for expenses
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can manage their own expenses" ON expenses;

-- Drop all policies for team_members
DROP POLICY IF EXISTS "Users can view own team members" ON team_members;
DROP POLICY IF EXISTS "Users can insert own team members" ON team_members;
DROP POLICY IF EXISTS "Users can update own team members" ON team_members;
DROP POLICY IF EXISTS "Users can delete own team members" ON team_members;
DROP POLICY IF EXISTS "Users can view own team" ON team_members;
DROP POLICY IF EXISTS "Users can insert own team" ON team_members;
DROP POLICY IF EXISTS "Users can update own team" ON team_members;
DROP POLICY IF EXISTS "Users can delete own team" ON team_members;

-- Drop all policies for vendors
DROP POLICY IF EXISTS "Users can view own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can insert own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can manage own vendors" ON vendors;

-- Drop all policies for vendor_projects
DROP POLICY IF EXISTS "Users can manage vendor projects" ON vendor_projects;

-- Drop all policies for vendor_quotations
DROP POLICY IF EXISTS "Users can manage vendor quotations" ON vendor_quotations;

-- Drop all policies for vendor_files
DROP POLICY IF EXISTS "Users can manage vendor files" ON vendor_files;

-- Drop all policies for activity_log
DROP POLICY IF EXISTS "Users can view own activity" ON activity_log;
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_log;

-- Drop all policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Drop all policies for appointments
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete own appointments" ON appointments;

-- Drop all policies for inventory_items
DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can update own inventory" ON inventory_items;
DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory_items;

-- Drop all policies for email_templates
DROP POLICY IF EXISTS "Users can view own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can insert own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can update own email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can delete own email templates" ON email_templates;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check RLS status for all tables
SELECT 
    schemaname, 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '🔒 RLS ENABLED'
        ELSE '🔓 RLS DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'profiles', 'business_settings', 'clients', 'client_files', 'leads',
        'projects', 'project_tasks', 'project_team_members', 'project_phases',
        'project_assets', 'project_files', 'project_templates', 'task_time_logs',
        'quotations', 'quotation_items', 'invoices', 'invoice_items', 'payments',
        'expenses', 'team_members', 'vendors', 'vendor_projects', 'vendor_quotations',
        'vendor_files', 'activity_log', 'notifications', 'appointments',
        'inventory_items', 'email_templates'
    )
ORDER BY tablename;

-- Check if any RLS policies still exist
SELECT 
    schemaname, 
    tablename, 
    policyname,
    '⚠️ POLICY STILL EXISTS' as warning
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '🚀 ALL RLS POLICIES DISABLED FOR DEVELOPMENT!';
    RAISE NOTICE '✅ Authenticated users now have full access to all data';
    RAISE NOTICE '📝 RLS can be re-enabled later for production security';
    RAISE NOTICE '🔓 Development mode: No permission restrictions';
END $$;