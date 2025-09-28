-- Super Admin & Licensing Schema
-- Date: 2025-09-22
-- This migration introduces platform-level admins and licensing so you can manage multiple interior design businesses (organizations) from a single Super Admin panel.

-- 1) Safety extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Platform admins table
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 3) Helper: is_super_admin()
CREATE OR REPLACE FUNCTION public.is_super_admin(uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = uid
  );
$$;

-- 4) Subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,              -- e.g., STARTER, GROWTH, PRO
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0, -- pricing in minor units
  currency text NOT NULL DEFAULT 'INR',
  billing_cycle text NOT NULL DEFAULT 'monthly', -- monthly|yearly
  max_users integer,                      -- null = unlimited
  features jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5) Licenses assigned to organizations
CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active',    -- active|expired|trial|suspended
  starts_on date NOT NULL DEFAULT current_date,
  ends_on date,
  seats integer,
  amount_cents integer DEFAULT 0,
  currency text DEFAULT 'INR',
  sales_city text,                          -- for city-wise reporting (optional override)
  sales_rep text,                           -- optional salesperson identifier/name
  channel text,                             -- online|partner|direct
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6) Views for admin reporting
CREATE OR REPLACE VIEW public.orgs_with_license AS
SELECT 
  o.id AS organization_id,
  o.name AS organization_name,
  coalesce(cp.city, l.sales_city) AS city,
  l.id AS license_id,
  l.status,
  l.starts_on,
  l.ends_on,
  sp.code AS plan_code,
  sp.name AS plan_name,
  l.amount_cents,
  l.currency,
  l.sales_rep,
  l.channel,
  l.created_at
FROM public.organizations o
LEFT JOIN public.company_profiles cp ON cp.organization_id = o.id
LEFT JOIN LATERAL (
  SELECT * FROM public.licenses l2
  WHERE l2.organization_id = o.id
  ORDER BY l2.created_at DESC
  LIMIT 1
) l ON TRUE
LEFT JOIN public.subscription_plans sp ON sp.id = l.plan_id;

-- 7) RLS enablement
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- 8) Drop conflicting policies (if re-running)
DO $$
DECLARE r record; BEGIN
  FOR r IN (
    SELECT tablename, policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename IN ('platform_admins','subscription_plans','licenses')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- 9) Policies for platform tables
-- Only super admins can manage platform_admins
CREATE POLICY "super_admins_manage_platform_admins" ON public.platform_admins
  FOR ALL USING (public.is_super_admin());

-- Super admins can manage subscription plans; everyone else read-only (optional)
CREATE POLICY "super_admins_manage_plans" ON public.subscription_plans
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "all_can_read_active_plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Super admins can manage licenses
CREATE POLICY "super_admins_manage_licenses" ON public.licenses
  FOR ALL USING (public.is_super_admin());

-- 10) Extend existing business tables so super admin can access everything
-- Note: These additive policies assume tables already have org-member RLS in place
DO $$ BEGIN
  EXECUTE 'CREATE POLICY "super_admins_manage_organizations" ON public.organizations FOR ALL USING (public.is_super_admin())';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "super_admins_manage_organization_members" ON public.organization_members FOR ALL USING (public.is_super_admin())';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "super_admins_manage_company_profiles" ON public.company_profiles FOR ALL USING (public.is_super_admin())';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "super_admins_manage_banking_info" ON public.banking_info FOR ALL USING (public.is_super_admin())';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  EXECUTE 'CREATE POLICY "super_admins_manage_branding" ON public.branding FOR ALL USING (public.is_super_admin())';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 11) Updated-at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_subscription_plans_updated_at') THEN
    CREATE TRIGGER trg_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_licenses_updated_at') THEN
    CREATE TRIGGER trg_licenses_updated_at BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- 12) Seed example plans (idempotent)
INSERT INTO public.subscription_plans (code, name, description, price_cents, currency, billing_cycle, max_users, features, is_active)
VALUES
  ('STARTER','Starter','For solo designers', 9900,'INR','monthly', 3, '{"support":"email"}'::jsonb, true),
  ('GROWTH','Growth','For small teams',     29900,'INR','monthly', 10,'{"support":"priority","reports":true}'::jsonb, true),
  ('PRO',   'Pro',   'For agencies',        59900,'INR','monthly', NULL,'{"support":"24x7","reports":true,"sso":true}'::jsonb, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  currency = EXCLUDED.currency,
  billing_cycle = EXCLUDED.billing_cycle,
  max_users = EXCLUDED.max_users,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 13) Convenience grants (optional, since RLS applies)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO anon, authenticated;
