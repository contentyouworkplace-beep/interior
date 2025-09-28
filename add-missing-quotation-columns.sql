-- Add missing columns to the quotations table
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS gst_type TEXT DEFAULT 'cgst_sgst',
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'standard';