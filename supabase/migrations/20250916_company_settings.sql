-- Company Settings Schema Migration
-- Date: 2025-09-16
-- Creates organizations, organization_members, company_profiles, banking_info, branding tables and RLS policies.

-- 1. Create organizations table (core entity)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create organization_members table (user-org relationship)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 3. Safety: create helper membership function
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean STABLE LANGUAGE sql AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = org_id
      AND om.user_id = auth.uid()
  );
$$;

-- 4. Create company_profiles table
CREATE TABLE IF NOT EXISTS public.company_profiles (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_tagline text,
  gstin text,
  pan text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  pin_code text,
  website text,
  cin text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Create banking_info table
CREATE TABLE IF NOT EXISTS public.banking_info (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  bank_name text,
  account_number text,
  ifsc_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Create branding table
CREATE TABLE IF NOT EXISTS public.branding (
  organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url text,
  signature_url text,
  primary_color text,
  secondary_color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE banking_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE branding ENABLE ROW LEVEL SECURITY;

-- 8. Drop old policies if re-running
DO $$
DECLARE r record; BEGIN
  FOR r IN (
    SELECT tablename, policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename IN ('organizations','organization_members','company_profiles','banking_info','branding')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END$$;

-- 9. Organizations policies (org members can read/manage their orgs)
CREATE POLICY "org members select organizations" ON organizations
  FOR SELECT USING (is_org_member(id));
CREATE POLICY "org members update organizations" ON organizations
  FOR UPDATE USING (is_org_member(id));

-- 10. Organization_members policies (org members can see membership)
CREATE POLICY "org members select membership" ON organization_members
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "org members insert membership" ON organization_members
  FOR INSERT WITH CHECK (is_org_member(organization_id));

-- 11. Company_profiles policies (read & write for org members)
CREATE POLICY "org members select company_profiles" ON company_profiles
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "org members upsert company_profiles" ON company_profiles
  FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "org members update company_profiles" ON company_profiles
  FOR UPDATE USING (is_org_member(organization_id));

-- 12. Banking_info policies
CREATE POLICY "org members select banking_info" ON banking_info
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "org members upsert banking_info" ON banking_info
  FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "org members update banking_info" ON banking_info
  FOR UPDATE USING (is_org_member(organization_id));

-- 13. Branding policies
CREATE POLICY "org members select branding" ON branding
  FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "org members upsert branding" ON branding
  FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "org members update branding" ON branding
  FOR UPDATE USING (is_org_member(organization_id));

-- 14. Updated at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_organizations_updated_at') THEN
    CREATE TRIGGER trg_organizations_updated_at BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_company_profiles_updated_at') THEN
    CREATE TRIGGER trg_company_profiles_updated_at BEFORE UPDATE ON company_profiles
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_banking_info_updated_at') THEN
    CREATE TRIGGER trg_banking_info_updated_at BEFORE UPDATE ON banking_info
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_branding_updated_at') THEN
    CREATE TRIGGER trg_branding_updated_at BEFORE UPDATE ON branding
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- 15. Insert a default organization for single-user setup (optional)
-- This creates a default org and membership for the first user who runs this
-- You can customize this or remove it if you prefer manual org creation
INSERT INTO public.organizations (id, name, description) 
SELECT '00000000-0000-0000-0000-000000000001'::uuid, 'Default Organization', 'Auto-created default organization'
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Note: You'll need to manually add organization_members record after this
-- Example: INSERT INTO organization_members (organization_id, user_id) VALUES ('00000000-0000-0000-0000-000000000001', 'your-user-id');

-- 16. Storage: ensure branding bucket (cannot be created via SQL if already exists)
-- Run in dashboard if missing: Create bucket 'branding' with public access
-- Or use client code: storage.createBucket('branding', { public: true })

-- 17. Note: Regenerate Supabase types after running this migration so TypeScript picks up new tables.