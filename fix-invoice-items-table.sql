-- Fix invoice_items table by adding missing columns
-- Run this in your Supabase SQL Editor

-- Add missing columns to invoice_items table
ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS item_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS hsn_sac_code TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_order ON invoice_items(invoice_id, item_order);

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'invoice_items' 
ORDER BY ordinal_position;