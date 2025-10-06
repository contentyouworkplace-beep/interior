# CRITICAL: Database Setup Required

## ❌ Issue Identified
The `plans` table does not exist in your Supabase database, which is causing the 500 Internal Server Error when trying to create plans.

## 🔧 IMMEDIATE FIX REQUIRED

### Step 1: Create Plans Table in Supabase

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run this exact SQL script:**

```sql
-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    price DECIMAL(10,2) DEFAULT 0,
    duration_days INTEGER DEFAULT 30,
    features JSONB DEFAULT '[]'::jsonb,
    max_projects INTEGER DEFAULT 10,
    max_users INTEGER DEFAULT 1,
    support_level VARCHAR(50) DEFAULT 'email',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage plans" ON plans 
    FOR ALL USING (true);

CREATE POLICY "Users can view active plans" ON plans 
    FOR SELECT USING (is_active = true);

-- Insert default plans
INSERT INTO plans (name, description, price, duration_days, features, max_projects, max_users, support_level, is_active) VALUES
('Basic Plan', 'Perfect for small interior design businesses', 999, 30, '["Project Management", "Client Portal", "Basic Templates", "Email Support"]', 10, 1, 'email', true),
('Pro Plan', 'Ideal for growing design firms', 2499, 30, '["Unlimited Projects", "Team Collaboration", "Advanced Templates", "Priority Support", "Custom Branding"]', -1, 5, 'priority', true),
('Enterprise Plan', 'Complete solution for large design companies', 4999, 30, '["Everything in Pro", "Unlimited Users", "API Access", "Custom Integrations", "Dedicated Support", "White Label"]', -1, -1, 'dedicated', true);
```

### Step 2: Verify Table Creation

After running the SQL, you should see:
- ✅ `plans` table created in Tables section
- ✅ 3 default plans inserted
- ✅ RLS policies enabled

### Step 3: Test Plan Creation

1. **Refresh your browser** at `http://localhost:3000/admin/plans`
2. **Click "Add Plan"**
3. **Fill in the form:**
   - Plan Name: `Test Plan`
   - Price: `1499`
   - Duration: `45`
   - Active Plan: `Enabled`
4. **Click "Create Plan"**

### Expected Result After Database Setup:
- ✅ Form submits successfully
- ✅ Plan appears in the list
- ✅ No console errors
- ✅ Success notification shown

## 🐛 Additional Console Error Fixes

I've also fixed the API to handle the simplified form data properly. The API now:
- ✅ Only requires `name` field (not description)
- ✅ Auto-generates description from name and price
- ✅ Sets sensible defaults for all fields

## 🎯 Next Steps

1. **Run the SQL script above** in Supabase Dashboard
2. **Refresh the admin plans page**
3. **Try creating a plan** - it should work perfectly now!

Once the table is created, all CRUD operations (Create, Read, Update, Delete) will work seamlessly.