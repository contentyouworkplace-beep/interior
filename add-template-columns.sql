-- Add template columns to branding table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.branding 
ADD COLUMN IF NOT EXISTS quotation_template text DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS invoice_template text DEFAULT 'modern';

-- Update the existing record if it exists to have default templates
UPDATE public.branding 
SET 
  quotation_template = COALESCE(quotation_template, 'modern'),
  invoice_template = COALESCE(invoice_template, 'modern')
WHERE quotation_template IS NULL OR invoice_template IS NULL;

-- Verify the changes
SELECT 'Branding table structure after template addition:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'branding' 
  AND column_name IN ('quotation_template', 'invoice_template');

SELECT 'Current branding data:' as info;
SELECT * FROM public.branding;