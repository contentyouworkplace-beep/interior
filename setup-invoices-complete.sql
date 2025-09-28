-- Complete Invoice Setup Script for Interior Designer CRM
-- Run this in Supabase SQL Editor to set up invoices with demo data

-- First, ensure we have the proper invoice table structure
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  invoice_number TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 18.0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  notes TEXT,
  terms TEXT,
  template TEXT DEFAULT 'modern',
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
  hsn_sac_code TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 18.0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  item_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own invoices" ON invoices;
CREATE POLICY "Users can insert own invoices" ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own invoices" ON invoices;
CREATE POLICY "Users can update own invoices" ON invoices FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own invoices" ON invoices;
CREATE POLICY "Users can delete own invoices" ON invoices FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for invoice_items
DROP POLICY IF EXISTS "Users can view invoice items for own invoices" ON invoice_items;
CREATE POLICY "Users can view invoice items for own invoices" ON invoice_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert invoice items for own invoices" ON invoice_items;
CREATE POLICY "Users can insert invoice items for own invoices" ON invoice_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can update invoice items for own invoices" ON invoice_items;
CREATE POLICY "Users can update invoice items for own invoices" ON invoice_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete invoice items for own invoices" ON invoice_items;
CREATE POLICY "Users can delete invoice items for own invoices" ON invoice_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()));

-- Update trigger for invoices
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION update_invoice_updated_at();

-- Demo User ID (you may need to update this with your actual user ID)
-- Get the user ID from: SELECT id FROM auth.users LIMIT 1;
DO $$
DECLARE
  demo_user_id UUID;
  demo_client_1 UUID;
  demo_client_2 UUID;
  demo_client_3 UUID;
  demo_project_1 UUID;
  demo_project_2 UUID;
  demo_invoice_1 UUID;
  demo_invoice_2 UUID;
  demo_invoice_3 UUID;
  demo_invoice_4 UUID;
  demo_invoice_5 UUID;
BEGIN
  -- Get the first user (you can modify this to target specific user)
  SELECT id INTO demo_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  
  IF demo_user_id IS NULL THEN
    RAISE NOTICE 'No user found. Please ensure you have a user account created.';
    RETURN;
  END IF;

  RAISE NOTICE 'Using user ID: %', demo_user_id;

  -- Ensure we have demo clients
  INSERT INTO clients (id, user_id, first_name, last_name, company, email, phone, address, city, state, pincode, country, created_at)
  VALUES 
    (gen_random_uuid(), demo_user_id, 'Rajesh', 'Kumar', 'Kumar Enterprises', 'rajesh.kumar@email.com', '+91-9876543210', '123 Business Street', 'Mumbai', 'Maharashtra', '400001', 'India', NOW()),
    (gen_random_uuid(), demo_user_id, 'Priya', 'Sharma', 'Sharma Interiors', 'priya.sharma@email.com', '+91-9876543211', '456 Design Avenue', 'Delhi', 'Delhi', '110001', 'India', NOW()),
    (gen_random_uuid(), demo_user_id, 'Amit', 'Patel', 'Patel Home Solutions', 'amit.patel@email.com', '+91-9876543212', '789 Home Street', 'Bangalore', 'Karnataka', '560001', 'India', NOW())
  ON CONFLICT (email) DO NOTHING;

  -- Get client IDs
  SELECT id INTO demo_client_1 FROM clients WHERE email = 'rajesh.kumar@email.com' AND user_id = demo_user_id;
  SELECT id INTO demo_client_2 FROM clients WHERE email = 'priya.sharma@email.com' AND user_id = demo_user_id;
  SELECT id INTO demo_client_3 FROM clients WHERE email = 'amit.patel@email.com' AND user_id = demo_user_id;

  -- Create demo projects
  INSERT INTO projects (id, user_id, client_id, name, description, status, budget, start_date, end_date, created_at)
  VALUES 
    (gen_random_uuid(), demo_user_id, demo_client_1, 'Luxury Living Room Design', 'Complete living room renovation with modern furniture and lighting', 'active', 250000.00, '2024-01-15', '2024-03-15', NOW()),
    (gen_random_uuid(), demo_user_id, demo_client_2, 'Office Space Interior', 'Corporate office interior design and furniture setup', 'completed', 180000.00, '2024-02-01', '2024-04-01', NOW())
  ON CONFLICT DO NOTHING;

  -- Get project IDs
  SELECT id INTO demo_project_1 FROM projects WHERE name = 'Luxury Living Room Design' AND user_id = demo_user_id;
  SELECT id INTO demo_project_2 FROM projects WHERE name = 'Office Space Interior' AND user_id = demo_user_id;

  -- Create demo invoices
  INSERT INTO invoices (
    id, user_id, client_id, project_id, invoice_number, title, status, payment_status, 
    issue_date, due_date, payment_date, subtotal, tax_rate, tax_amount, discount_amount, 
    total_amount, currency, notes, terms, template, created_at
  ) VALUES 
    (
      gen_random_uuid(), demo_user_id, demo_client_1, demo_project_1, 'INV-2024-001', 
      'Living Room Design - Phase 1', 'paid', 'paid', 
      '2024-01-20', '2024-02-20', '2024-02-15', 
      84745.76, 18.0, 15254.24, 0, 100000.00, 'INR',
      'Thank you for your business. Payment received on time.',
      'Payment due within 30 days. Late payments may incur additional charges.',
      'professional', NOW() - INTERVAL '45 days'
    ),
    (
      gen_random_uuid(), demo_user_id, demo_client_2, demo_project_2, 'INV-2024-002',
      'Office Interior - Furniture Supply', 'sent', 'unpaid',
      '2024-02-15', '2024-03-15', NULL,
      63559.32, 18.0, 11440.68, 5000.00, 70000.00, 'INR',
      'Invoice for office furniture supply and installation.',
      'Payment due within 30 days. 5% discount applied for early confirmation.',
      'modern', NOW() - INTERVAL '20 days'
    ),
    (
      gen_random_uuid(), demo_user_id, demo_client_3, NULL, 'INV-2024-003',
      'Consultation and Design Planning', 'sent', 'partial',
      '2024-02-28', '2024-03-30', NULL,
      42372.88, 18.0, 7627.12, 0, 50000.00, 'INR',
      'Consultation fee for home interior design planning. Partial payment received.',
      'Balance payment due within 30 days.',
      'elegant', NOW() - INTERVAL '10 days'
    ),
    (
      gen_random_uuid(), demo_user_id, demo_client_1, demo_project_1, 'INV-2024-004',
      'Living Room Design - Final Phase', 'draft', 'unpaid',
      CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', NULL,
      127118.64, 18.0, 22881.36, 0, 150000.00, 'INR',
      'Final phase invoice for living room design project.',
      'Payment due within 30 days.',
      'professional', NOW()
    ),
    (
      gen_random_uuid(), demo_user_id, demo_client_2, NULL, 'INV-2024-005',
      'Additional Design Services', 'overdue', 'unpaid',
      '2024-01-10', '2024-02-10', NULL,
      25423.73, 18.0, 4576.27, 0, 30000.00, 'INR',
      'Additional design consultation services. Payment overdue.',
      'Immediate payment required. Late fees may apply.',
      'modern', NOW() - INTERVAL '60 days'
    )
  ON CONFLICT (invoice_number) DO NOTHING;

  -- Get invoice IDs for adding items
  SELECT id INTO demo_invoice_1 FROM invoices WHERE invoice_number = 'INV-2024-001' AND user_id = demo_user_id;
  SELECT id INTO demo_invoice_2 FROM invoices WHERE invoice_number = 'INV-2024-002' AND user_id = demo_user_id;
  SELECT id INTO demo_invoice_3 FROM invoices WHERE invoice_number = 'INV-2024-003' AND user_id = demo_user_id;
  SELECT id INTO demo_invoice_4 FROM invoices WHERE invoice_number = 'INV-2024-004' AND user_id = demo_user_id;
  SELECT id INTO demo_invoice_5 FROM invoices WHERE invoice_number = 'INV-2024-005' AND user_id = demo_user_id;

  -- Add invoice items
  -- Invoice 1 items
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, hsn_sac_code, tax_rate, tax_amount, item_order)
  VALUES 
    (demo_invoice_1, 'Premium Sofa Set - 3+2 seater', 1, 45000.00, 45000.00, '9401', 18.0, 8100.00, 1),
    (demo_invoice_1, 'Designer Coffee Table - Marble Top', 1, 18000.00, 18000.00, '9403', 18.0, 3240.00, 2),
    (demo_invoice_1, 'Custom Lighting Setup', 1, 12000.00, 12000.00, '9405', 18.0, 2160.00, 3),
    (demo_invoice_1, 'Wall Art and Decor Items', 1, 9745.76, 9745.76, '9701', 18.0, 1754.24, 4);

  -- Invoice 2 items
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, hsn_sac_code, tax_rate, tax_amount, item_order)
  VALUES 
    (demo_invoice_2, 'Executive Office Desk', 3, 15000.00, 45000.00, '9403', 18.0, 8100.00, 1),
    (demo_invoice_2, 'Ergonomic Office Chairs', 6, 8000.00, 48000.00, '9401', 18.0, 8640.00, 2),
    (demo_invoice_2, 'Meeting Room Table', 1, 25000.00, 25000.00, '9403', 18.0, 4500.00, 3);

  -- Invoice 3 items  
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, hsn_sac_code, tax_rate, tax_amount, item_order)
  VALUES 
    (demo_invoice_3, 'Design Consultation - 8 hours', 8, 2500.00, 20000.00, '9983', 18.0, 3600.00, 1),
    (demo_invoice_3, '3D Design Visualization', 1, 15000.00, 15000.00, '9983', 18.0, 2700.00, 2),
    (demo_invoice_3, 'Material Selection Assistance', 1, 7372.88, 7372.88, '9983', 18.0, 1327.12, 3);

  -- Invoice 4 items
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, hsn_sac_code, tax_rate, tax_amount, item_order)
  VALUES 
    (demo_invoice_4, 'Premium Bedroom Set', 1, 65000.00, 65000.00, '9401', 18.0, 11700.00, 1),
    (demo_invoice_4, 'Custom Wardrobe Installation', 1, 35000.00, 35000.00, '9403', 18.0, 6300.00, 2),
    (demo_invoice_4, 'Designer Curtains and Blinds', 1, 18000.00, 18000.00, '6303', 18.0, 3240.00, 3),
    (demo_invoice_4, 'Installation and Setup Charges', 1, 9118.64, 9118.64, '9983', 18.0, 1641.36, 4);

  -- Invoice 5 items
  INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount, hsn_sac_code, tax_rate, tax_amount, item_order)
  VALUES 
    (demo_invoice_5, 'Additional Design Consultation', 4, 3000.00, 12000.00, '9983', 18.0, 2160.00, 1),
    (demo_invoice_5, 'Site Visits and Measurements', 2, 1500.00, 3000.00, '9983', 18.0, 540.00, 2),
    (demo_invoice_5, 'Design Revision Services', 1, 10423.73, 10423.73, '9983', 18.0, 1876.27, 3);

  RAISE NOTICE 'Demo invoices created successfully for user: %', demo_user_id;
  RAISE NOTICE 'Created 5 invoices with various statuses: paid, sent, draft, overdue';
  RAISE NOTICE 'Invoice numbers: INV-2024-001 through INV-2024-005';

END $$;

-- Verify the data was inserted
SELECT 
  i.invoice_number,
  i.title,
  i.status,
  i.payment_status,
  i.total_amount,
  c.first_name || ' ' || c.last_name as client_name,
  p.name as project_name,
  COUNT(ii.id) as item_count
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN projects p ON i.project_id = p.id
LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
GROUP BY i.id, i.invoice_number, i.title, i.status, i.payment_status, i.total_amount, c.first_name, c.last_name, p.name
ORDER BY i.created_at DESC;