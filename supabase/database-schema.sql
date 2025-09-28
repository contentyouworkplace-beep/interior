-- GoPLNR.com Database Schema for Supabase

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'super-secret-jwt-token-with-at-least-32-characters-long';

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'designer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  alt_phone TEXT, -- Added for alternate contact number (migration v2)
  company TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'UAE',
  client_type TEXT DEFAULT 'individual', -- individual, business
  budget_range TEXT,
  preferred_style TEXT,
  website TEXT, -- Added company/personal website (migration v2)
  notes TEXT,
  status TEXT DEFAULT 'active', -- active, inactive, potential
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table (for lead tracking and stages)
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  client_id UUID REFERENCES clients(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  budget DECIMAL(12,2),
  stage TEXT DEFAULT 'new', -- new, contacted, quotation_sent, won, lost
  source TEXT, -- referral, website, etc.
  notes TEXT,
  follow_up_date DATE,
  follow_up_method TEXT, -- sms, email, whatsapp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-up reminders table
CREATE TABLE follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  method TEXT NOT NULL, -- sms, email, whatsapp
  message TEXT,
  sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL, -- residential, commercial, renovation
  status TEXT DEFAULT 'planning', -- planning, in_progress, review, completed, cancelled
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  budget DECIMAL(12,2),
  start_date DATE,
  end_date DATE,
  completion_percentage INTEGER DEFAULT 0,
  location TEXT,
  square_footage INTEGER,
  style_preference TEXT,
  special_requirements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- =============================================
-- Projects Enhancements Migration (idempotent)
-- - Drop obsolete square_footage column
-- - Add project_team_members join table (many team members per project)
-- - Add project_phases (custom per-project stages)
-- =============================================

-- 1. DROP square_footage column if exists (UI no longer uses it)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='projects' AND column_name='square_footage'
  ) THEN
    ALTER TABLE projects DROP COLUMN square_footage;
  END IF;
END$$;

-- 2. project_team_members join table
CREATE TABLE IF NOT EXISTS project_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  role TEXT, -- optional per-project role override
  is_manager BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, team_member_id)
);

-- 3. project_phases table (custom stages per project)
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending|in-progress|completed
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_project_team_members_project ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_team ON project_team_members(team_member_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_project ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_position ON project_phases(project_id, position);

-- 5. Enable RLS
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;

-- 6. Policies (scoped by owning user_id same as parent project/team)
DO $$
BEGIN
  -- project_team_members policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_team_members' AND policyname='Select own project team members') THEN
    CREATE POLICY "Select own project team members" ON project_team_members FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_team_members' AND policyname='Insert own project team members') THEN
    CREATE POLICY "Insert own project team members" ON project_team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_team_members' AND policyname='Update own project team members') THEN
    CREATE POLICY "Update own project team members" ON project_team_members FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_team_members' AND policyname='Delete own project team members') THEN
    CREATE POLICY "Delete own project team members" ON project_team_members FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- project_phases policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_phases' AND policyname='Select own project phases') THEN
    CREATE POLICY "Select own project phases" ON project_phases FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_phases' AND policyname='Insert own project phases') THEN
    CREATE POLICY "Insert own project phases" ON project_phases FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_phases' AND policyname='Update own project phases') THEN
    CREATE POLICY "Update own project phases" ON project_phases FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_phases' AND policyname='Delete own project phases') THEN
    CREATE POLICY "Delete own project phases" ON project_phases FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

-- 7. Updated_at triggers
CREATE TRIGGER IF NOT EXISTS update_project_team_members_updated_at BEFORE UPDATE ON project_team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER IF NOT EXISTS update_project_phases_updated_at BEFORE UPDATE ON project_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Activity Log & Project Assets (Idempotent)
-- =============================================

-- activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- project|task|phase|client|invoice|payment|asset
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- created|updated|deleted|status_changed|uploaded|assigned
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_log' AND policyname='Select own activity') THEN
    CREATE POLICY "Select own activity" ON activity_log FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_log' AND policyname='Insert own activity') THEN
    CREATE POLICY "Insert own activity" ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- project_assets table
CREATE TABLE IF NOT EXISTS project_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  label TEXT,
  asset_type TEXT, -- image|pdf|model|doc|other
  version INTEGER DEFAULT 1,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_assets_project ON project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_type ON project_assets(asset_type);

ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_assets' AND policyname='Select own project assets') THEN
    CREATE POLICY "Select own project assets" ON project_assets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_assets' AND policyname='Insert own project assets') THEN
    CREATE POLICY "Insert own project assets" ON project_assets FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_assets' AND policyname='Update own project assets') THEN
    CREATE POLICY "Update own project assets" ON project_assets FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='project_assets' AND policyname='Delete own project assets') THEN
    CREATE POLICY "Delete own project assets" ON project_assets FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TRIGGER IF NOT EXISTS update_project_assets_updated_at BEFORE UPDATE ON project_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL, -- designer, architect, contractor, consultant
  specialization TEXT,
  hourly_rate DECIMAL(8,2),
  experience_years INTEGER,
  portfolio_url TEXT,
  bio TEXT,
  salary DECIMAL(12,2),
  advance_salary DECIMAL(12,2),
  status TEXT DEFAULT 'active', -- active, inactive
  join_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  invoice_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  gst_type TEXT DEFAULT 'none', -- cgst_sgst, igst, none
  gstin TEXT, -- GSTIN of designer
  pan TEXT, -- PAN of designer
  hsn_sac_code TEXT, -- HSN/SAC code (optional)
  tax_rate DECIMAL(5,2) DEFAULT 0.0, -- GST rate
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_type TEXT, -- percent, flat
  discount_value DECIMAL(12,2),
  currency TEXT DEFAULT 'INR',
  notes TEXT,
  payment_terms TEXT,
  logo_url TEXT,
  signature_url TEXT,
  template TEXT DEFAULT 'modern',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Items table
CREATE TABLE invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  quotation_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, sent, approved, rejected, expired
  issue_date DATE NOT NULL,
  valid_until DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  gst_type TEXT DEFAULT 'none', -- cgst_sgst, igst, none
  gstin TEXT, -- GSTIN of designer
  pan TEXT, -- PAN of designer
  hsn_sac_code TEXT, -- HSN/SAC code (optional)
  tax_rate DECIMAL(5,2) DEFAULT 0.0, -- GST rate
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_type TEXT, -- percent, flat
  discount_value DECIMAL(12,2),
  currency TEXT DEFAULT 'INR',
  notes TEXT,
  terms_conditions TEXT,
  logo_url TEXT,
  signature_url TEXT,
  template TEXT DEFAULT 'modern',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Payments table (for client payments)
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  invoice_id UUID REFERENCES invoices(id),
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_mode TEXT NOT NULL, -- upi, cheque, cash, bank_transfer
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  pan TEXT,
  country TEXT DEFAULT 'India',
  client_type TEXT DEFAULT 'individual', -- individual, business
  budget DECIMAL(12,2), -- project budget
  lead_stage TEXT DEFAULT 'new', -- new, contacted, quotation_sent, won, lost
  follow_up_date DATE, -- next follow-up date
  follow_up_method TEXT, -- sms, email, whatsapp
  preferred_style TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active', -- active, inactive, potential
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vendor Quotations table
CREATE TABLE vendor_quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  file_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotation Items table
CREATE TABLE quotation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  expense_date DATE NOT NULL,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sku TEXT UNIQUE,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2),
  supplier TEXT,
  location TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active', -- active, inactive, discontinued
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Files table
CREATE TABLE project_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT, -- design, contract, photo, document
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Files table
CREATE TABLE client_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT, -- document, image, spreadsheet, other
  description TEXT,
  uploaded_by TEXT, -- Name of the person who uploaded
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table for schedule management
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  task_date DATE NOT NULL,
  task_time TIME,
  task_type TEXT DEFAULT 'personal', -- meeting, deadline, personal, call
  priority TEXT DEFAULT 'medium', -- low, medium, high
  status TEXT DEFAULT 'pending', -- pending, completed, cancelled
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT FALSE,
  related_id UUID, -- can reference any table
  related_type TEXT, -- project, client, invoice, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar Events table
CREATE TABLE calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT DEFAULT 'meeting', -- meeting, deadline, reminder, appointment
  location TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies
-- Users can only see their own data

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Clients
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- Projects
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Team Members
CREATE POLICY "Users can view own team" ON team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own team" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own team" ON team_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own team" ON team_members FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables...
-- (Add remaining RLS policies for invoices, quotations, expenses, etc.)

-- Invoices RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can view own invoices'
  ) THEN
    CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can insert own invoices'
  ) THEN
    CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can update own invoices'
  ) THEN
    CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can delete own invoices'
  ) THEN
    CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Payments RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view own payments'
  ) THEN
    CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can insert own payments'
  ) THEN
    CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can update own payments'
  ) THEN
    CREATE POLICY "Users can update own payments" ON payments FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can delete own payments'
  ) THEN
    CREATE POLICY "Users can delete own payments" ON payments FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Client Files RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_files' AND policyname = 'Users can view own client files'
  ) THEN
    CREATE POLICY "Users can view own client files" ON client_files FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_files' AND policyname = 'Users can insert own client files'
  ) THEN
    CREATE POLICY "Users can insert own client files" ON client_files FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_files' AND policyname = 'Users can update own client files'
  ) THEN
    CREATE POLICY "Users can update own client files" ON client_files FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_files' AND policyname = 'Users can delete own client files'
  ) THEN
    CREATE POLICY "Users can delete own client files" ON client_files FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Tasks RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can view own tasks'
  ) THEN
    CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can insert own tasks'
  ) THEN
    CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can update own tasks'
  ) THEN
    CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Users can delete own tasks'
  ) THEN
    CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();