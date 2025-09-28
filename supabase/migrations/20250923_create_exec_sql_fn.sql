-- 2025-09-23 - Create exec_sql helper function
-- This helper is intended for local/dev automation only. It executes the provided SQL
-- and attempts to return a JSON array of results when the SQL is a SELECT. For DDL/other
-- statements it simply executes and returns an empty JSON array. The function is
-- SECURITY DEFINER so it can be used by service-role connections to apply migrations.

CREATE OR REPLACE FUNCTION public.exec_sql(sql_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Try to run the SQL as a SELECT and aggregate rows to JSON
  BEGIN
    EXECUTE format('SELECT jsonb_agg(t) FROM (%s) t', sql_text) INTO result;
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
  EXCEPTION WHEN others THEN
    -- Not a SELECT or failed; fall through to execute directly
    NULL;
  END;

  -- Execute non-SELECT (DDL/DML). If it errors, it will bubble up to caller.
  EXECUTE sql_text;
  RETURN '[]'::jsonb;
END;
$$;

-- Give authenticated role execute permission so service/automation can call via RPC when needed
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
