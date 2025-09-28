-- Update profiles table with new fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]';

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL, -- materials, labor, transport, equipment, permits, consulting, marketing, office, other
  category TEXT NOT NULL, -- direct, overhead, marketing, administrative
  payment_method TEXT NOT NULL, -- cash, bank_transfer, credit_card, debit_card, cheque, other
  status TEXT DEFAULT 'pending', -- pending, approved, paid, rejected
  vendor TEXT,
  description TEXT NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, sent, approved, rejected, cancelled
  currency TEXT DEFAULT 'AED',
  items JSONB NOT NULL,
  tax_type TEXT NOT NULL, -- none, vat, custom
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(12,2),
  subtotal DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  terms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  project_id UUID REFERENCES projects(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  quotation_id UUID REFERENCES quotations(id),
  number TEXT NOT NULL UNIQUE,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  currency TEXT DEFAULT 'AED',
  items JSONB NOT NULL,
  tax_type TEXT NOT NULL, -- none, vat, custom
  tax_rate DECIMAL(5,2),
  tax_amount DECIMAL(12,2),
  subtotal DECIMAL(12,2) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  terms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Expenses are viewable by authenticated users in the same organization"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Expenses can be inserted by authenticated users"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Expenses can be updated by authenticated users who created them"
  ON expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Quotations policies
CREATE POLICY "Quotations are viewable by authenticated users in the same organization"
  ON quotations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Quotations can be inserted by authenticated users"
  ON quotations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Quotations can be updated by authenticated users who created them"
  ON quotations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Invoices are viewable by authenticated users in the same organization"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Invoices can be inserted by authenticated users"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Invoices can be updated by authenticated users who created them"
  ON invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);