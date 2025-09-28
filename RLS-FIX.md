# 🔧 RLS Permission Error Fix

## Problem
You're getting "permission denied for table" errors because Row Level Security (RLS) is blocking data insertion.

## 🚀 **Quick Solution**

### Option 1: Use SQL Script (Recommended)
1. **Create the demo user first** in Supabase Dashboard:
   - Go to Authentication > Users
   - Click "Add user"
   - Email: `demo@interiorcrm.com`
   - Password: `demo123456`
   - Confirm email: ✅ checked

2. **Run the demo data SQL**:
   - Go to SQL Editor in Supabase
   - Copy and paste `insert-demo-data.sql`
   - Click "Run"

### Option 2: Temporarily Disable RLS
Run this in Supabase SQL Editor:

```sql
-- Disable RLS temporarily
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
```

Then run:
```bash
./seed-demo-data.sh
```

Then re-enable RLS:
```sql
-- Re-enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
```

## ✅ **Expected Result**
After running either option:
- ✅ 3 Demo clients
- ✅ 2 Leads  
- ✅ 3 Team members
- ✅ 3 Vendors
- ✅ 3 Projects with tasks
- ✅ 5 Expenses
- ✅ 5 Notifications
- ✅ 2 Appointments

**Login**: `demo@interiorcrm.com` / `demo123456`

## 🎯 **Start Your CRM**
```bash
pnpm dev
```
Open http://localhost:3000 and login!