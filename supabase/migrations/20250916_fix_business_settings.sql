-- Fix / augment business_settings table so UI save stops failing on missing columns
-- Date: 2025-09-16
-- Purpose: Add any columns expected by BusinessSettingsService that may be absent,
--          ensure unique user_id, RLS, and updated_at trigger.

-- 1. Create table if it somehow does not exist (safety net)
CREATE TABLE IF NOT EXISTS public.business_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid UNIQUE,
  company_name text DEFAULT ''
);

-- 2. Add missing columns (each guarded with IF NOT EXISTS)
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS pincode text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS gstin text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS pan text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS cin text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS bank_account text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS ifsc_code text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS primary_color text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS secondary_color text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS quotation_template text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS invoice_template text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS terms_conditions text;
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.business_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Ensure user_id uniqueness (if duplicates exist this will fail; adjust manually if needed)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.business_settings'::regclass AND conname = 'business_settings_user_id_key'
  ) THEN
    ALTER TABLE public.business_settings ADD CONSTRAINT business_settings_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 4. Enable RLS & policy (user owns their row)
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='business_settings' AND policyname='user owns business settings'
  ) THEN
    CREATE POLICY "user owns business settings" ON public.business_settings
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Updated at trigger (reuse set_updated_at if already defined elsewhere)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_business_settings_updated_at') THEN
    CREATE TRIGGER trg_business_settings_updated_at BEFORE UPDATE ON public.business_settings
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 6. Optional: backfill primary/secondary colors if null
UPDATE public.business_settings
SET primary_color = COALESCE(primary_color, '#3B82F6'),
    secondary_color = COALESCE(secondary_color, '#1E40AF')
WHERE primary_color IS NULL OR secondary_color IS NULL;

-- 7. Note: Regenerate Supabase types after running this migration so TypeScript picks up columns.
