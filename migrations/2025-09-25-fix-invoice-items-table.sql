-- Migration: Add missing columns to invoice_items
-- Run this with psql or in Supabase SQL editor
BEGIN;

ALTER TABLE public.invoice_items 
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS item_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS hsn_sac_code TEXT;

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_order ON invoice_items(invoice_id, item_order);

COMMIT;

-- Verification: select columns
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'invoice_items'
-- ORDER BY ordinal_position;