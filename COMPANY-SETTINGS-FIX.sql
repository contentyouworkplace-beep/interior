-- COMPLETE COMPANY SETTINGS FIX
-- Run this in your Supabase SQL Editor to fix all issues

-- Step 1: Add template columns to branding table
ALTER TABLE public.branding 
ADD COLUMN IF NOT EXISTS quotation_template text DEFAULT 'modern',
ADD COLUMN IF NOT EXISTS invoice_template text DEFAULT 'modern';

-- Step 2: Ensure service role has proper permissions
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.organization_members TO service_role;
GRANT ALL ON public.company_profiles TO service_role;
GRANT ALL ON public.banking_info TO service_role;
GRANT ALL ON public.branding TO service_role;

-- Step 3: Add service role bypass policies (for admin operations)
CREATE POLICY "service_role_all_organizations" ON public.organizations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_organization_members" ON public.organization_members
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_company_profiles" ON public.company_profiles
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_banking_info" ON public.banking_info
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_branding" ON public.branding
  FOR ALL USING (auth.role() = 'service_role');

-- Step 4: Create initial branding record if missing
INSERT INTO public.branding (organization_id, primary_color, secondary_color, quotation_template, invoice_template)
VALUES ('00000000-0000-0000-0000-000000000001', '#3B82F6', '#1E40AF', 'modern', 'modern')
ON CONFLICT (organization_id) DO UPDATE SET
  quotation_template = COALESCE(branding.quotation_template, 'modern'),
  invoice_template = COALESCE(branding.invoice_template, 'modern');

-- Step 5: Verify the setup
SELECT 'Organization membership:' as check_type, count(*) as count 
FROM public.organization_members 
WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';

SELECT 'Company profiles:' as check_type, count(*) as count 
FROM public.company_profiles 
WHERE organization_id = '00000000-0000-0000-0000-000000000001';

SELECT 'Branding records:' as check_type, count(*) as count 
FROM public.branding 
WHERE organization_id = '00000000-0000-0000-0000-000000000001';

-- Show current branding data
SELECT 'Current branding data:' as info;
SELECT organization_id, logo_url, signature_url, primary_color, secondary_color, quotation_template, invoice_template
FROM public.branding 
WHERE organization_id = '00000000-0000-0000-0000-000000000001';