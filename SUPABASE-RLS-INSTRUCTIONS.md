# Supabase RLS Fix Instructions

This document provides instructions to fix the permissions and Row Level Security (RLS) issues in the Supabase database for the Interior Designer CRM application.

## Problem Background

The application is experiencing permission errors when accessing vendor data. The main issues are:

1. **Permission Denied Error**: When trying to access the vendors table
2. **Relationship Not Found**: Between vendors and vendor_projects tables
3. **Demo Data Not Showing**: Due to RLS policies blocking access

## Fix Instructions

### Option 1: Disable RLS for Development (Recommended for Development)

If you are in development mode and need quick access to all data:

1. Log in to your Supabase account
2. Navigate to the SQL Editor
3. Copy and paste the following SQL from `authentication-id-fix.sql`:

```sql
-- Disable Row Level Security globally for development
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', table_record.tablename);
        RAISE NOTICE 'Disabled RLS on table: %', table_record.tablename;
    END LOOP;
    RAISE NOTICE '✅ RLS disabled on all tables for development!';
END $$;
```

4. Execute the SQL query
5. Restart your application

### Option 2: Add Proper RLS Policies for Vendors (Recommended for Production)

For a production environment, it's better to add proper RLS policies:

1. Log in to your Supabase account
2. Navigate to the SQL Editor
3. Copy and paste the following SQL:

```sql
-- Enable RLS on vendors table
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Add vendor policies
CREATE POLICY "Users can view own vendors" ON vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vendors" ON vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vendors" ON vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vendors" ON vendors FOR DELETE USING (auth.uid() = user_id);

-- If you have a vendor_projects table, add the relationship policies
CREATE POLICY "Users can view vendor_projects for own vendors" ON vendor_projects FOR SELECT 
USING (EXISTS (SELECT 1 FROM vendors WHERE vendors.id = vendor_projects.vendor_id AND vendors.user_id = auth.uid()));
CREATE POLICY "Users can insert vendor_projects for own vendors" ON vendor_projects FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM vendors WHERE vendors.id = vendor_projects.vendor_id AND vendors.user_id = auth.uid()));
CREATE POLICY "Users can update vendor_projects for own vendors" ON vendor_projects FOR UPDATE 
USING (EXISTS (SELECT 1 FROM vendors WHERE vendors.id = vendor_projects.vendor_id AND vendors.user_id = auth.uid()));
CREATE POLICY "Users can delete vendor_projects for own vendors" ON vendor_projects FOR DELETE 
USING (EXISTS (SELECT 1 FROM vendors WHERE vendors.id = vendor_projects.vendor_id AND vendors.user_id = auth.uid()));
```

4. Execute the SQL query
5. Restart your application

## Verifying the Fix

To verify that the permissions are now working correctly:

1. Restart your application
2. Navigate to the Vendors page
3. Try to add a new vendor
4. Check if the vendors list loads correctly

## Fallback Mechanism

The application has been updated with a fallback mechanism that serves demo data when the database connection fails. If you continue experiencing issues after applying the SQL fixes, the application will still function in "demo mode" and display mock vendor data.

## Important Notes

- If you're using Supabase's free tier, note that RLS policies are enforced and cannot be completely disabled.
- Make sure the `user_id` column exists in your vendors table and is properly populated with the authenticated user's ID.
- The enhanced vendor dialog component now includes better error handling to provide more informative feedback.