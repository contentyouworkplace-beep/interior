-- Migration: create quotations and quotation_items tables
-- Non-destructive: creates new tables and policies mirroring invoices

CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  quotation_number text UNIQUE NOT NULL,
  title text,
  client_id uuid REFERENCES clients(id),
  project_id uuid REFERENCES projects(id),
  issue_date timestamptz DEFAULT now(),
  valid_until timestamptz,
  subtotal numeric DEFAULT 0,
  tax_rate numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  currency text DEFAULT 'INR',
  status text DEFAULT 'draft',
  notes text,
  terms text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES quotations(id) ON DELETE CASCADE,
  description text,
  quantity numeric DEFAULT 1,
  unit_price numeric DEFAULT 0,
  amount numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);

-- Enable RLS and add safe policies similar to invoices
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;

-- Policy: users can see their own quotations
CREATE POLICY IF NOT EXISTS "Users can access own quotations" ON quotations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can insert own quotations" ON quotations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can update own quotations" ON quotations FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can delete own quotations" ON quotations FOR DELETE USING (user_id = auth.uid());

-- Policies for quotation_items (linked to quotations)
CREATE POLICY IF NOT EXISTS "Users can access items for own quotations" ON quotation_items FOR SELECT USING (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can insert items for own quotations" ON quotation_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can update items for own quotations" ON quotation_items FOR UPDATE USING (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));
CREATE POLICY IF NOT EXISTS "Users can delete items for own quotations" ON quotation_items FOR DELETE USING (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));
