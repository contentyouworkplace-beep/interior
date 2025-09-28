#!/bin/bash

# Apply RLS migrations directly via Supabase REST API
set -e

# Load environment variables
source .env.local

echo "🔧 Applying exec_sql function..."
curl -X POST "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d '{
    "sql": "CREATE OR REPLACE FUNCTION public.exec_sql(sql_text text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE result jsonb; BEGIN BEGIN EXECUTE format('"'"'SELECT jsonb_agg(t) FROM (%s) t'"'"', sql_text) INTO result; IF result IS NOT NULL THEN RETURN result; END IF; EXCEPTION WHEN others THEN NULL; END; EXECUTE sql_text; RETURN '"'"'[]'"'"'::jsonb; END; $$; GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;"
  }'

echo -e "\n🔧 Applying RLS policies..."
curl -X POST "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -d '{
    "sql": "ALTER TABLE IF EXISTS public.company_profiles ENABLE ROW LEVEL SECURITY; ALTER TABLE IF EXISTS public.banking_info ENABLE ROW LEVEL SECURITY; ALTER TABLE IF EXISTS public.branding ENABLE ROW LEVEL SECURITY;"
  }'

echo -e "\n✅ Migrations applied!"