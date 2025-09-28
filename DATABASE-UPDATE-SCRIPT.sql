-- ==========================================================
-- DATABASE SCHEMA UPDATE FOR QR CODES AND TERMS & CONDITIONS
-- ==========================================================
-- Please run this SQL in your Supabase SQL Editor
-- 
-- Instructions:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- ==========================================================

-- Add QR code URL column to branding table
ALTER TABLE public.branding 
ADD COLUMN IF NOT EXISTS qr_code_url text;

-- Add terms and conditions column to company_profiles table  
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS terms_and_conditions text;

-- Insert sample terms and conditions for existing organizations
UPDATE public.company_profiles 
SET terms_and_conditions = 'Payment Terms:
1. Full payment is due within 30 days of invoice date
2. Late payments may incur a 1.5% monthly service charge
3. All disputes must be raised within 7 days of invoice receipt

Design Terms:
1. All designs remain the property of Interior Design Company until full payment
2. Minor revisions (up to 3) are included in the quoted price
3. Major design changes will incur additional charges

General Terms:
1. Client must provide accurate measurements and site access
2. Project timeline may be affected by unforeseen circumstances
3. All materials are subject to availability and may have substitutions
4. Installation services are subject to separate agreement

Liability:
1. Our liability is limited to the contract value
2. Client is responsible for obtaining necessary permits
3. We are not liable for damages due to structural issues

By proceeding with this project, you agree to these terms and conditions.'
WHERE terms_and_conditions IS NULL OR terms_and_conditions = '';

-- Verify the changes
SELECT 'SUCCESS: QR Code and Terms & Conditions columns added!' as result;

-- Show updated table structures
SELECT 'Branding table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'branding'
  AND column_name IN ('logo_url', 'signature_url', 'qr_code_url', 'quotation_template', 'invoice_template')
ORDER BY column_name;

SELECT 'Company profiles table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'company_profiles'
  AND column_name IN ('company_name', 'terms_and_conditions')
ORDER BY column_name;

-- Show current data
SELECT 'Current branding data:' as info;
SELECT organization_id, 
       CASE WHEN logo_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_logo,
       CASE WHEN signature_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_signature,
       CASE WHEN qr_code_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_qr_code,
       quotation_template, 
       invoice_template
FROM public.branding;

SELECT 'Current company profiles data:' as info;
SELECT organization_id, 
       company_name,
       CASE WHEN terms_and_conditions IS NOT NULL THEN 'Yes' ELSE 'No' END as has_terms,
       LEFT(terms_and_conditions, 50) || '...' as terms_preview
FROM public.company_profiles;