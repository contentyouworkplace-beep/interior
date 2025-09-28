-- ==========================================
-- INTERIOR DESIGNER CRM - COMPLETE DATABASE SCHEMA
-- ==========================================
-- This script creates all tables, relationships, RLS policies, and storage buckets
-- for the Interior Designer CRM system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CORE USER & PROFILE TABLES
-- ==========================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'designer',
  designation TEXT,
  department TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business settings table
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  business_address TEXT,
  business_phone TEXT,
  business_email TEXT,
  business_website TEXT,
  logo_url TEXT,
  tax_number TEXT,
  default_currency TEXT DEFAULT 'USD',
  gst_rate DECIMAL(5,2) DEFAULT 18.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. CLIENT MANAGEMENT TABLES
-- ==========================================

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  alt_phone TEXT,
  company TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  postal_code TEXT,
  client_type TEXT DEFAULT 'individual',
  budget_range TEXT,
  preferred_style TEXT,
  website TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  stage TEXT DEFAULT 'new',
  interest_level TEXT,
  potential_value DECIMAL(12,2),
  notes TEXT,
  next_follow_up DATE,
  converted_client_id UUID REFERENCES clients(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client files table
CREATE TABLE IF NOT EXISTS client_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  category TEXT CHECK (category IN ('document', 'image', 'spreadsheet', 'other')),
  description TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. PROJECT MANAGEMENT TABLES
-- ==========================================

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL DEFAULT 'residential',
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  budget DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  completion_percentage INTEGER DEFAULT 0,
  location TEXT,
  square_footage INTEGER,
  style_preference TEXT,
  special_requirements TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) NOT NULL,
  template_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID, -- Will add foreign key constraint after team_members table is created
  role TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  completion_percentage INTEGER DEFAULT 0,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  dependencies TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project team members table
CREATE TABLE IF NOT EXISTS project_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  team_member_id UUID, -- Will add foreign key constraint after team_members table is created
  role TEXT,
  is_manager BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, team_member_id)
);

-- Project phases table
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  status TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project assets table
CREATE TABLE IF NOT EXISTS project_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  file_url TEXT NOT NULL,
  label TEXT,
  asset_type TEXT,
  version INTEGER DEFAULT 1,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project files table
CREATE TABLE IF NOT EXISTS project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  folder TEXT,
  file_type TEXT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  size_bytes BIGINT,
  extension TEXT,
  uploaded_by TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project templates table
CREATE TABLE IF NOT EXISTS project_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL,
  template_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task time logs table
CREATE TABLE IF NOT EXISTS task_time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  hours_logged DECIMAL(6,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. FINANCIAL MANAGEMENT TABLES
-- ==========================================

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  quotation_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  issue_date DATE NOT NULL,
  valid_until DATE,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 18.0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  terms TEXT,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotation items table
CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  item_order INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_rate DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  invoice_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 18.0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  payment_terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  item_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode TEXT NOT NULL,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. TEAM & VENDOR TABLES
-- ==========================================

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  specialization TEXT,
  hourly_rate DECIMAL(10,2),
  experience_years INTEGER,
  portfolio_url TEXT,
  bio TEXT,
  salary DECIMAL(12,2),
  advance_salary DECIMAL(12,2),
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  status TEXT DEFAULT 'active',
  join_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint for project_tasks.assigned_to now that team_members exists
ALTER TABLE project_tasks 
ADD CONSTRAINT fk_project_tasks_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES team_members(id);

-- Add foreign key constraint for project_team_members.team_member_id now that team_members exists
ALTER TABLE project_team_members 
ADD CONSTRAINT fk_project_team_members_team_member_id 
FOREIGN KEY (team_member_id) REFERENCES team_members(id);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  pan TEXT,
  category TEXT,
  rating DECIMAL(3,2),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor projects table
CREATE TABLE IF NOT EXISTS vendor_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, project_id)
);

-- Vendor quotations table
CREATE TABLE IF NOT EXISTS vendor_quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  file_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. SYSTEM & TRACKING TABLES
-- ==========================================

-- Activity log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  entity_type TEXT,
  entity_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  event_type TEXT DEFAULT 'meeting',
  location TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sku TEXT UNIQUE,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2),
  supplier TEXT,
  location TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_type TEXT NOT NULL,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- User-based indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Status and date indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ==========================================
-- 8. CREATE UPDATED_AT TRIGGERS
-- ==========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at (use DROP IF EXISTS to avoid conflicts)
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_settings_updated_at ON business_settings;
CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_files_updated_at ON client_files;
CREATE TRIGGER update_client_files_updated_at BEFORE UPDATE ON client_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON project_tasks;
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_team_members_updated_at ON project_team_members;
CREATE TRIGGER update_project_team_members_updated_at BEFORE UPDATE ON project_team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_phases_updated_at ON project_phases;
CREATE TRIGGER update_project_phases_updated_at BEFORE UPDATE ON project_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_assets_updated_at ON project_assets;
CREATE TRIGGER update_project_assets_updated_at BEFORE UPDATE ON project_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_files_updated_at ON project_files;
CREATE TRIGGER update_project_files_updated_at BEFORE UPDATE ON project_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_templates_updated_at ON project_templates;
CREATE TRIGGER update_project_templates_updated_at BEFORE UPDATE ON project_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotations_updated_at ON quotations;
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 9. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 10. CREATE RLS POLICIES (DROP EXISTING FIRST TO AVOID CONFLICTS)
-- ==========================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Business settings policies
DROP POLICY IF EXISTS "Users can manage own business settings" ON business_settings;
CREATE POLICY "Users can manage own business settings" ON business_settings FOR ALL USING (auth.uid() = user_id);

-- Clients policies
DROP POLICY IF EXISTS "Users can manage own clients" ON clients;
CREATE POLICY "Users can manage own clients" ON clients FOR ALL USING (auth.uid() = user_id);

-- Leads policies
DROP POLICY IF EXISTS "Users can manage own leads" ON leads;
CREATE POLICY "Users can manage own leads" ON leads FOR ALL USING (auth.uid() = user_id);

-- Client files policies
DROP POLICY IF EXISTS "Users can manage own client files" ON client_files;
CREATE POLICY "Users can manage own client files" ON client_files FOR ALL USING (auth.uid() = user_id);

-- Projects policies
DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
CREATE POLICY "Users can manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);

-- Project tasks policies
DROP POLICY IF EXISTS "Users can manage project tasks" ON project_tasks;
CREATE POLICY "Users can manage project tasks" ON project_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid())
);

-- Project team members policies
DROP POLICY IF EXISTS "Users can manage project team members" ON project_team_members;
CREATE POLICY "Users can manage project team members" ON project_team_members FOR ALL USING (auth.uid() = user_id);

-- Project phases policies
DROP POLICY IF EXISTS "Users can manage project phases" ON project_phases;
CREATE POLICY "Users can manage project phases" ON project_phases FOR ALL USING (auth.uid() = user_id);

-- Project assets policies
DROP POLICY IF EXISTS "Users can manage project assets" ON project_assets;
CREATE POLICY "Users can manage project assets" ON project_assets FOR ALL USING (auth.uid() = user_id);

-- Project files policies
DROP POLICY IF EXISTS "Users can manage project files" ON project_files;
CREATE POLICY "Users can manage project files" ON project_files FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.user_id = auth.uid())
);

-- Project templates policies
DROP POLICY IF EXISTS "Users can manage project templates" ON project_templates;
CREATE POLICY "Users can manage project templates" ON project_templates FOR ALL USING (auth.uid() = user_id OR is_public = true);

-- Task time logs policies
DROP POLICY IF EXISTS "Users can manage task time logs" ON task_time_logs;
CREATE POLICY "Users can manage task time logs" ON task_time_logs FOR ALL USING (auth.uid() = user_id);

-- Quotations policies
DROP POLICY IF EXISTS "Users can manage own quotations" ON quotations;
CREATE POLICY "Users can manage own quotations" ON quotations FOR ALL USING (auth.uid() = user_id);

-- Quotation items policies
DROP POLICY IF EXISTS "Users can manage quotation items" ON quotation_items;
CREATE POLICY "Users can manage quotation items" ON quotation_items FOR ALL USING (
  EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
);

-- Invoices policies
DROP POLICY IF EXISTS "Users can manage own invoices" ON invoices;
CREATE POLICY "Users can manage own invoices" ON invoices FOR ALL USING (auth.uid() = user_id);

-- Invoice items policies
DROP POLICY IF EXISTS "Users can manage invoice items" ON invoice_items;
CREATE POLICY "Users can manage invoice items" ON invoice_items FOR ALL USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);

-- Payments policies
DROP POLICY IF EXISTS "Users can manage own payments" ON payments;
CREATE POLICY "Users can manage own payments" ON payments FOR ALL USING (auth.uid() = user_id);

-- Expenses policies
DROP POLICY IF EXISTS "Users can manage own expenses" ON expenses;
CREATE POLICY "Users can manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);

-- Team members policies
DROP POLICY IF EXISTS "Users can manage own team members" ON team_members;
CREATE POLICY "Users can manage own team members" ON team_members FOR ALL USING (auth.uid() = user_id);

-- Vendors policies
DROP POLICY IF EXISTS "Users can manage own vendors" ON vendors;
CREATE POLICY "Users can manage own vendors" ON vendors FOR ALL USING (auth.uid() = user_id);

-- Vendor projects policies
DROP POLICY IF EXISTS "Users can manage vendor projects" ON vendor_projects;
CREATE POLICY "Users can manage vendor projects" ON vendor_projects FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = vendor_projects.project_id AND projects.user_id = auth.uid())
);

-- Vendor quotations policies
DROP POLICY IF EXISTS "Users can manage vendor quotations" ON vendor_quotations;
CREATE POLICY "Users can manage vendor quotations" ON vendor_quotations FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = vendor_quotations.project_id AND projects.user_id = auth.uid())
);

-- Activity log policies
DROP POLICY IF EXISTS "Users can view own activity" ON activity_log;
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_log;
CREATE POLICY "Users can view own activity" ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Appointments policies
DROP POLICY IF EXISTS "Users can manage own appointments" ON appointments;
CREATE POLICY "Users can manage own appointments" ON appointments FOR ALL USING (auth.uid() = user_id);

-- Inventory items policies
DROP POLICY IF EXISTS "Users can manage own inventory" ON inventory_items;
CREATE POLICY "Users can manage own inventory" ON inventory_items FOR ALL USING (auth.uid() = user_id);

-- Email templates policies
DROP POLICY IF EXISTS "Users can manage own email templates" ON email_templates;
CREATE POLICY "Users can manage own email templates" ON email_templates FOR ALL USING (auth.uid() = user_id);

-- ==========================================
-- 11. CREATE STORAGE BUCKETS
-- ==========================================

-- Insert storage buckets (these will be created via Supabase dashboard or API)
-- The actual bucket creation should be done via the Supabase client

-- Storage bucket configurations:
-- 1. avatars (public) - User profile pictures
-- 2. receipts (private) - Expense receipts  
-- 3. client-files (private) - Client documents
-- 4. project-assets (private) - Project files
-- 5. expense-documents (private) - Expense documentation

-- ==========================================
-- END OF SCHEMA
-- ==========================================