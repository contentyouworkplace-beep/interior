-- ROW LEVEL SECURITY POLICIES
-- Execute this AFTER the main schema

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CLIENTS POLICIES
CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON clients FOR DELETE USING (auth.uid() = user_id);

-- PROJECTS POLICIES
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- INVOICES POLICIES
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);

-- INVOICE ITEMS POLICIES
CREATE POLICY "Users can view invoice items for own invoices" ON invoice_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can insert invoice items for own invoices" ON invoice_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can update invoice items for own invoices" ON invoice_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can delete invoice items for own invoices" ON invoice_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

-- QUOTATIONS POLICIES
CREATE POLICY "Users can view own quotations" ON quotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quotations" ON quotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quotations" ON quotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quotations" ON quotations FOR DELETE USING (auth.uid() = user_id);

-- EXPENSES POLICIES
CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- TEAM MEMBERS POLICIES
CREATE POLICY "Users can view own team members" ON team_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own team members" ON team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own team members" ON team_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own team members" ON team_members FOR DELETE USING (auth.uid() = user_id);

-- PROJECT TASKS POLICIES
CREATE POLICY "Users can view tasks for own projects" ON project_tasks FOR SELECT 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can insert tasks for own projects" ON project_tasks FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update tasks for own projects" ON project_tasks FOR UPDATE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete tasks for own projects" ON project_tasks FOR DELETE 
USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_tasks.project_id AND projects.user_id = auth.uid()));

-- APPOINTMENTS POLICIES
CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON appointments FOR DELETE USING (auth.uid() = user_id);

-- LEADS POLICIES
CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own leads" ON leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON leads FOR DELETE USING (auth.uid() = user_id);

-- ACTIVITY LOG POLICIES
CREATE POLICY "Users can view own activity log" ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity log" ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);