# Manual Smoke Test Guide for Plan Management System

## Prerequisites
1. ✅ Next.js development server running (`pnpm dev`)
2. ⚠️ **Database Setup Required**: Plans table needs to be created in Supabase

## Database Setup (Required First Step)

**Go to your Supabase Dashboard → SQL Editor and run:**

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

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage plans" ON plans FOR ALL USING (true);
CREATE POLICY "Users can view active plans" ON plans FOR SELECT USING (is_active = true);

-- Insert default demo plans
INSERT INTO plans (name, description, price, duration_days, features, max_projects, max_users, support_level, is_active) VALUES
('Basic Plan', 'Perfect for small interior design businesses', 999, 30, '["Project Management", "Client Portal", "Basic Templates", "Email Support"]', 10, 1, 'email', true),
('Pro Plan', 'Ideal for growing design firms', 2499, 30, '["Unlimited Projects", "Team Collaboration", "Advanced Templates", "Priority Support", "Custom Branding"]', -1, 5, 'priority', true),
('Enterprise Plan', 'Complete solution for large design companies', 4999, 30, '["Everything in Pro", "Unlimited Users", "API Access", "Custom Integrations", "Dedicated Support", "White Label"]', -1, -1, 'dedicated', true);
```

## Manual Test Steps

### 1. Test Plan Management (CREATE, READ, UPDATE, DELETE)

#### 🎯 Navigate to Plans Page
- Open: `http://localhost:3000/admin/plans`
- ✅ Should show plan management interface
- ✅ Should display existing plans (Basic, Pro, Enterprise)
- ✅ Should show statistics cards

#### 📝 Test CREATE Operation
1. **Click "Add Plan" button**
2. **Fill out form:**
   - Plan Name: `Demo Test Plan`
   - Price: `1499`
   - Duration: `45`
   - Active Plan: `Enabled`
3. **Click "Create Plan"**
4. ✅ **Expected:** Plan appears in list with correct details
5. ✅ **Expected:** Success notification shown

#### ✏️ Test UPDATE Operation
1. **Find the demo plan** in the list
2. **Click the Edit button** (pencil icon)
3. **Modify fields:**
   - Plan Name: `Updated Demo Plan`
   - Price: `1999` 
   - Duration: `60`
4. **Click "Update Plan"**
5. ✅ **Expected:** Plan details updated in list
6. ✅ **Expected:** Success notification shown

#### 🗑️ Test DELETE Operation
1. **Find the demo plan** in the list
2. **Click the Delete button** (trash icon)
3. **Confirm deletion** in popup
4. ✅ **Expected:** Plan removed from list
5. ✅ **Expected:** Success notification shown

### 2. Test Plan Assignment in User Creation

#### 🎯 Navigate to Users Page
- Open: `http://localhost:3000/admin/users`
- ✅ Should show user management interface

#### 👤 Test User Creation with Plan Assignment
1. **Click "Add User" button**
2. **Fill out form:**
   - Email: `test@demo.com`
   - Password: `Test123!`
   - First Name: `Test`
   - Last Name: `User`
   - Company: `Demo Company`
   - **Subscription Plan: Select from dropdown** (should show available plans)
   - Validity: Should auto-fill based on plan
   - Expiry Date: Should auto-calculate
3. **Click "Create User"**
4. ✅ **Expected:** User created with plan assignment
5. ✅ **Expected:** Success notification shown

### 3. Test Plan Display in User Settings

#### 🎯 Navigate to Settings
- Open: `http://localhost:3000/settings`
- ✅ Should show 4 tabs: Profile, Company, Plan, Security

#### 📋 Test Plan Tab
1. **Click "Plan" tab**
2. ✅ **Expected:** Shows current subscription details
3. ✅ **Expected:** Displays plan features
4. ✅ **Expected:** Shows expiry information
5. ✅ **Expected:** No billing tab visible (removed as requested)

## Test Results Checklist

### ✅ Plan Management Features
- [ ] Create new plans through admin interface
- [ ] View all plans with statistics
- [ ] Edit existing plan details
- [ ] Delete unused plans
- [ ] Mobile-responsive design

### ✅ User Assignment Features  
- [ ] Plan selection dropdown in user creation
- [ ] Auto-validity calculation based on plan
- [ ] Plan assignment during user creation
- [ ] Plan details in user settings

### ✅ UI/UX Features
- [ ] Simplified 4-field plan creation form
- [ ] Mobile-friendly dialogs and forms
- [ ] Proper validation and error handling
- [ ] Success notifications for all operations
- [ ] Billing tab successfully removed

## Common Issues & Solutions

### Issue: "Plans table not found"
**Solution:** Run the database setup SQL script above

### Issue: "No plans shown in dropdown"
**Solution:** Create at least one active plan first

### Issue: "API errors during creation"
**Solution:** Check Supabase environment variables and service role key

### Issue: "Plan assignment not working"
**Solution:** Ensure subscriptions table exists and has plan_id column

## Expected Outcomes

After running all tests successfully:

1. ✅ **Admin can create/edit/delete plans** with simplified 4-field form
2. ✅ **Plans appear in user creation dropdown** with pricing info
3. ✅ **Users see plan details** in Settings → Plan tab
4. ✅ **Billing tab is removed** from user settings
5. ✅ **Mobile-responsive design** works on all devices
6. ✅ **Complete CRUD operations** work through the interface

## Next Steps

Once manual testing is complete:
1. **Database is properly set up** with plans table
2. **Default plans are available** for assignment
3. **Plan management system is functional** for production use
4. **Users can be created with plans** and see their subscription details

---

**Status: Ready for manual testing after database setup** 🚀