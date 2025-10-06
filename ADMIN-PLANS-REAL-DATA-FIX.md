# Admin Plans Tab - Real User Data Fix

## Issue Fixed ✅

**Problem**: The Plans tab in the Admin Panel was showing 0 users for all plans, even though users were assigned to plans.

**Root Cause**: The API was fetching user counts from the `subscriptions` table, but user plan assignments are actually stored in `user_metadata.plan_id` in Supabase Auth.

## Solution Implemented

Changed the user count logic in `/app/api/admin/plans/route.ts` to fetch ALL users from Supabase Auth and count how many users have each plan assigned in their user_metadata.

### Technical Changes

**File Modified**: `/app/api/admin/plans/route.ts`

**Before** (Lines 33-44):
```typescript
// Get user counts for each plan from subscriptions table
const plansWithCounts = await Promise.all(
  (plans || []).map(async (plan) => {
    const { data: subscriptions, error: subError } = await adminClient
      .from('subscriptions')
      .select('id')
      .eq('plan_id', plan.id)
    
    return {
      ...plan,
      user_count: subscriptions?.length || 0
    }
  })
)
```

**After**:
```typescript
// Get ALL users from auth to count plan assignments
const { data: authData, error: authError } = await adminClient.auth.admin.listUsers()

if (authError) {
  console.error('Error fetching users:', authError)
  return NextResponse.json({ plans: plans || [] })
}

// Count users for each plan from user_metadata.plan_id
const plansWithCounts = (plans || []).map((plan) => {
  const userCount = authData.users.filter(
    (user) => user.user_metadata?.plan_id === plan.id
  ).length
  
  return {
    ...plan,
    user_count: userCount
  }
})

console.log('Plans with user counts:', plansWithCounts.map(p => ({ name: p.name, user_count: p.user_count })))
```

## How It Works Now

1. **Fetch Plans**: Get all plans from the `plans` table
2. **Fetch All Users**: Get ALL users from Supabase Auth using `auth.admin.listUsers()`
3. **Count Users per Plan**: For each plan, filter users where `user.user_metadata.plan_id === plan.id`
4. **Return Plans with Counts**: Return plans array with accurate `user_count` for each plan

## What You'll See

### Plans Tab Stats (Top Row):
- **Total Plans**: Count of all plans
- **Active Plans**: Count of active plans only
- **Total Users**: Sum of all user_count values (real count across all plans)
- **Avg Price**: Average price across all plans

### Each Plan Card Shows:
- Plan name and icon
- Price badge (₹ amount)
- Duration in days
- Max projects and users
- Support level
- Features list (first 3 + count)
- **User count**: "X users" badge showing real assigned users ✅
- Active/Inactive status
- Edit and Delete buttons

## User Plan Assignment

When you assign a plan to a user in the Admin → Users page, the system stores:

```typescript
user_metadata: {
  plan_id: "plan-uuid-here",
  expires_at: "2025-11-03T00:00:00Z"
}
```

The Plans tab now correctly counts these assignments!

## Testing

### To Verify Real Data:
1. Go to Admin Panel → Plans tab
2. Check "Total Users" stat at the top (should match total assigned users)
3. Look at each plan card
4. Verify "X users" badge shows correct count
5. Go to Users tab and count users with that plan
6. Numbers should match! ✅

### Example Expected Output:
```
Starter Plan: 6 users
90 Days Plan: 2 users
Enterprise Plan: 1 user
Total Users: 9 users
```

## Data Flow

```
Admin Assigns Plan to User (Users Tab)
         ↓
auth.users.user_metadata.plan_id = plan_id
auth.users.user_metadata.expires_at = date
         ↓
Plans Tab Fetches All Users
         ↓
Counts users where user_metadata.plan_id matches each plan
         ↓
Displays accurate "X users" count for each plan ✅
```

## Benefits

1. **Accurate Counts**: Shows real number of users assigned to each plan
2. **No Database Dependency**: Doesn't rely on subscriptions table being populated
3. **Single Source of Truth**: Uses auth.users as the authoritative source
4. **Real-time Data**: Always shows current assignments
5. **Performance**: Single auth.admin.listUsers() call for all counts

## API Endpoint

**GET** `/api/admin/plans`

**Response**:
```typescript
{
  plans: [
    {
      id: "uuid",
      name: "Starter",
      price: 999,
      duration_days: 30,
      features: [...],
      max_projects: 50,
      max_users: 5,
      support_level: "email",
      is_active: true,
      user_count: 6,  // ✅ Real count from auth.users
      created_at: "2024-..."
    },
    // ... more plans
  ]
}
```

## Common Scenarios

### New Plan Created
- Shows "0 users" until users are assigned
- Once admin assigns users, count updates on next page load

### User Plan Updated
- When you change a user's plan in Users tab
- Plan counts update immediately on Plans tab refresh
- Old plan count decreases, new plan count increases

### User Deleted/Deactivated
- User still exists in auth.users
- Still counted in plan totals
- To exclude inactive users, add filter: `user.user_metadata?.is_active !== false`

### Plan Deleted
- Can only delete if user_count = 0
- API prevents deletion of plans with assigned users
- Protects data integrity

## Future Enhancements

Potential additions:
- Active vs Inactive user counts
- Revenue calculation (user_count × price)
- Growth trends (new users this month)
- Plan popularity ranking
- User list modal (click count to see users)
- Export plan assignments to CSV
