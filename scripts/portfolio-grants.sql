-- Portfolio module grants for 'authenticated' role
-- Run this in Supabase SQL editor after creating the tables

-- Ensure the authenticated role can use the public schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table privileges (RLS will still enforce row-level access)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE portfolio_projects TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE portfolio_media TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE portfolio_shares TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE video_processing_jobs TO authenticated, service_role;

-- Categories may be read-mostly; grant full for admin UIs (RLS also applied)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE portfolio_categories TO authenticated, service_role;

-- Optional: future-proof defaults for newly created tables in public
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

-- Quick visibility check (optional)
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE grantee = 'authenticated' AND table_schema = 'public'
--   AND table_name IN ('portfolio_projects','portfolio_media','portfolio_shares','portfolio_categories','video_processing_jobs')
-- ORDER BY table_name, privilege_type;
