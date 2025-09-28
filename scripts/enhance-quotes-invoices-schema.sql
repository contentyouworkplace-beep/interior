-- ENHANCED QUOTES & INVOICES SCHEMA
-- Execute this in Supabase SQL Editor to add file attachments and improve structure

-- Add attachments columns to existing quotations table
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS gst_type TEXT DEFAULT 'cgst_sgst',
ADD COLUMN IF NOT EXISTS gstin TEXT,
ADD COLUMN IF NOT EXISTS pan TEXT,
ADD COLUMN IF NOT EXISTS hsn_sac_code TEXT,
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percent',
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'modern';

-- Add attachments columns to existing invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS gst_type TEXT DEFAULT 'cgst_sgst',
ADD COLUMN IF NOT EXISTS gstin TEXT,
ADD COLUMN IF NOT EXISTS pan TEXT,
ADD COLUMN IF NOT EXISTS hsn_sac_code TEXT,
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percent',
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';

-- Create quotation_attachments table
CREATE TABLE IF NOT EXISTS quotation_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create invoice_attachments table
CREATE TABLE IF NOT EXISTS invoice_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quotation_items table (if using separate table instead of JSONB)
CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
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

-- Create email_templates table for prewritten messages
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  template_type TEXT NOT NULL, -- 'quotation_share', 'invoice_share', 'payment_reminder', etc.
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotation_attachments_quotation_id ON quotation_attachments(quotation_id);
CREATE INDEX IF NOT EXISTS idx_invoice_attachments_invoice_id ON invoice_attachments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON email_templates(template_type);

-- Enable RLS on new tables
ALTER TABLE quotation_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quotation_attachments
CREATE POLICY "Users can view attachments for own quotations" ON quotation_attachments FOR SELECT 
USING (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_attachments.quotation_id AND quotations.user_id = auth.uid()));

CREATE POLICY "Users can insert attachments for own quotations" ON quotation_attachments FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_attachments.quotation_id AND quotations.user_id = auth.uid()));

CREATE POLICY "Users can delete attachments for own quotations" ON quotation_attachments FOR DELETE 
USING (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_attachments.quotation_id AND quotations.user_id = auth.uid()));

-- RLS Policies for invoice_attachments
CREATE POLICY "Users can view attachments for own invoices" ON invoice_attachments FOR SELECT 
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_attachments.invoice_id AND invoices.user_id = auth.uid()));

CREATE POLICY "Users can insert attachments for own invoices" ON invoice_attachments FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_attachments.invoice_id AND invoices.user_id = auth.uid()));

CREATE POLICY "Users can delete attachments for own invoices" ON invoice_attachments FOR DELETE 
USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_attachments.invoice_id AND invoices.user_id = auth.uid()));

-- RLS Policies for quotation_items
CREATE POLICY "Users can view items for own quotations" ON quotation_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));

CREATE POLICY "Users can insert items for own quotations" ON quotation_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));

CREATE POLICY "Users can update items for own quotations" ON quotation_items FOR UPDATE 
USING (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));

CREATE POLICY "Users can delete items for own quotations" ON quotation_items FOR DELETE 
USING (EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid()));

-- RLS Policies for email_templates
CREATE POLICY "Users can view own email templates" ON email_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own email templates" ON email_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own email templates" ON email_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own email templates" ON email_templates FOR DELETE USING (auth.uid() = user_id);

-- Insert default email templates
INSERT INTO email_templates (user_id, template_type, template_name, subject, body, is_default) 
SELECT 
  auth.uid(),
  'quotation_share',
  'Default Quotation Share',
  'Quotation #{quotation_number} from {company_name}',
  'Dear {client_name},

Please find attached the quotation #{quotation_number} for your project "{project_name}".

Quotation Details:
- Amount: {total_amount}
- Valid Until: {valid_until}

We look forward to working with you on this exciting project. Please feel free to contact us if you have any questions.

Best regards,
{sender_name}
{company_name}',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates 
  WHERE template_type = 'quotation_share' AND user_id = auth.uid() AND is_default = true
);

INSERT INTO email_templates (user_id, template_type, template_name, subject, body, is_default) 
SELECT 
  auth.uid(),
  'invoice_share',
  'Default Invoice Share',
  'Invoice #{invoice_number} from {company_name}',
  'Dear {client_name},

Please find attached the invoice #{invoice_number} for your project "{project_name}".

Invoice Details:
- Amount: {total_amount}
- Due Date: {due_date}

Payment can be made via bank transfer or as per the terms mentioned in the invoice. Please let us know once the payment is processed.

Thank you for your business!

Best regards,
{sender_name}
{company_name}',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM email_templates 
  WHERE template_type = 'invoice_share' AND user_id = auth.uid() AND is_default = true
);

-- Update triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_email_templates_updated_at') THEN
    CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;