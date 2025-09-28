# 🔧 Supabase Error Fix Guide

## Current Errors:
1. ❌ "column user_id does not exist" 
2. ❌ "relation team_members does not exist"

These errors occur due to table dependency issues in the schema.

## 🚀 **Quick Fix (Recommended)**

### Option 1: Fresh Start (Cleanest)
In your Supabase SQL Editor, run this to start completely fresh:

```sql
-- Reset the database
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
```

Then copy and paste the entire `complete-crm-schema.sql` content and run it.

### Option 2: Fix Current Database
Run the `fix-table-dependencies.sql` script first, then run `complete-crm-schema.sql`.

## 🛠️ **What I Fixed**

1. **Table Creation Order**: Fixed dependency issues where `project_tasks` and `project_team_members` reference `team_members` before it's created
2. **Missing Columns**: Added `user_id` column to `project_files` table  
3. **Foreign Key Constraints**: Added foreign key constraints after dependent tables are created
4. **Error Handling**: Added `DROP IF EXISTS` for all triggers and policies

## ✅ **Expected Result After Fix**

- ✅ All 28 tables created successfully
- ✅ All foreign key relationships working  
- ✅ All RLS policies applied
- ✅ All triggers working
- ✅ Ready for demo data seeding

## 🎯 **After Schema Success**

```bash
# Seed demo data
./seed-demo-data.sh

# Start the app  
pnpm dev
```

**Demo Login**: `demo@interiorcrm.com` / `demo123456`

## 🚨 **If You Still Get Errors**

1. **Use Fresh Start**: The cleanest option is to reset the database completely
2. **Check Environment**: Ensure your Supabase credentials are correct
3. **Check Auth**: Make sure `auth.users` table exists (it should be automatic)
4. **Run Step by Step**: Use the `fix-table-dependencies.sql` first if you don't want to reset