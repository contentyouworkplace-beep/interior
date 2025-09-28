-- Create an RPC function to get policies for a table
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_policies_for_table(table_name text)
RETURNS TABLE (
  tablename text,
  policyname text,
  command text,
  permissive text,
  roles text[],
  qual text,
  with_check text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.tablename::text,
    p.policyname::text,
    p.cmd::text as command,
    p.permissive::text,
    p.roles::text[],
    p.qual::text,
    p.with_check::text
  FROM pg_policies p
  WHERE p.tablename = table_name;
END;
$$;