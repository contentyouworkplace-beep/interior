
-- Create exec_sql function if it doesn't exist
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

