# Fix Quotations RLS SELECT Policy - Quick Guide

## Problem
✅ **Quotations are being created** (INSERT works)  
❌ **Quotations don't appear in list** (SELECT is blocked by missing RLS policy)

## Root Cause
The `quotations` table has RLS enabled, but the **SELECT policy is missing**. This means:
- ✅ POST /api/quotations can INSERT rows (INSERT policy exists)
- ❌ GET /api/quotations cannot SELECT rows (SELECT policy missing)
- Result: Quotations create successfully but API returns empty array `[]`

## Solution
Apply the SQL script below to add SELECT policies for `quotations` and `quotation_items` tables.

---

## 🚀 Quick Fix (Copy-Paste This SQL)

**Option 1: Go to Supabase Dashboard**

1. Open **Supabase Dashboard** → Your Project
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. **Copy-paste this entire SQL block:**

```sql
-- ============================================================================
-- FIX: Add SELECT policies for quotations table
-- ============================================================================

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Allow all operations on quotations" ON quotations;
DROP POLICY IF EXISTS "quotations_user_isolation" ON quotations;
DROP POLICY IF EXISTS "Users can manage own quotations" ON quotations;

-- Create granular CRUD policies
DROP POLICY IF EXISTS "Users can view own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can insert own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can update own quotations" ON quotations;
DROP POLICY IF EXISTS "Users can delete own quotations" ON quotations;

CREATE POLICY "Users can view own quotations" ON quotations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotations" ON quotations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quotations" ON quotations 
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quotations" ON quotations 
FOR DELETE USING (auth.uid() = user_id);

-- Fix quotation_items policies too
DROP POLICY IF EXISTS "Users can view items for own quotations" ON quotation_items;
DROP POLICY IF EXISTS "Users can insert items for own quotations" ON quotation_items;
DROP POLICY IF EXISTS "Users can update items for own quotations" ON quotation_items;
DROP POLICY IF EXISTS "Users can delete items for own quotations" ON quotation_items;

CREATE POLICY "Users can view items for own quotations" ON quotation_items 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
);

CREATE POLICY "Users can insert items for own quotations" ON quotation_items 
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
);

CREATE POLICY "Users can update items for own quotations" ON quotation_items 
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
);

CREATE POLICY "Users can delete items for own quotations" ON quotation_items 
FOR DELETE USING (
    EXISTS (SELECT 1 FROM quotations WHERE quotations.id = quotation_items.quotation_id AND quotations.user_id = auth.uid())
);
```

5. Click **Run** button (or press `Cmd+Enter`)
6. You should see **"Success. No rows returned"**

---

## ✅ Verify the Fix

**After running the SQL above:**

1. **Refresh your quotations page** in the browser
2. You should now see all your quotations (including the ones you just created)
3. Try creating a new quotation - it should appear immediately in the list

**Check in Supabase Dashboard:**
```sql
-- Verify policies exist
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'quotations' ORDER BY cmd;
```

Expected output:
```
policyname                          | cmd
------------------------------------|--------
Users can delete own quotations     | DELETE
Users can insert own quotations     | INSERT
Users can view own quotations       | SELECT  ← This was missing!
Users can update own quotations     | UPDATE
```

---

## 🎯 What This Fixes

| Operation | Before | After |
|-----------|--------|-------|
| **GET /api/quotations** (list) | ❌ Returns `[]` empty | ✅ Returns user's quotations |
| **POST /api/quotations** (create) | ✅ Works | ✅ Still works |
| **PATCH /api/quotations/[id]** (update) | ❌ Would fail | ✅ Will work |
| **DELETE /api/quotations/[id]** (delete) | ❌ Would fail | ✅ Will work |

---

## 🔍 Technical Explanation

### Why was INSERT working but SELECT failing?

**RLS (Row Level Security) policies are per-operation:**
- `FOR INSERT` policy → controls who can INSERT rows
- `FOR SELECT` policy → controls who can SELECT (read) rows
- `FOR UPDATE` policy → controls who can UPDATE rows
- `FOR DELETE` policy → controls who can DELETE rows

**Your database had:**
- ✅ INSERT policy: `"quotations_user_isolation" FOR ALL USING (auth.uid() = user_id)`
  - "FOR ALL" includes INSERT, so creates worked
- ❌ SELECT policy: **MISSING** (or blocked by overly restrictive policy)
  - Without SELECT policy, GET queries return empty array

**The fix:**
- Replaces single `FOR ALL` policy with granular `FOR SELECT`, `FOR INSERT`, etc.
- Each policy explicitly checks `auth.uid() = user_id`
- Now users can SELECT their own quotations

### Why did the API return `null` after successful INSERT?

**Supabase `.insert().select()` chain:**
```typescript
const { data: newQuotation } = await supabase
  .from('quotations')
  .insert(quotationData)  // ✅ INSERT succeeds (INSERT policy exists)
  .select()               // ❌ SELECT fails (SELECT policy missing)
  .single();              // Returns null because SELECT returned []
```

**Without SELECT policy:**
- INSERT succeeds, row created in database
- SELECT fails (RLS blocks it), returns empty array
- `.single()` returns `null` (no rows to return)
- API logs "Quotation created: null"

**With SELECT policy:**
- INSERT succeeds, row created
- SELECT succeeds (RLS allows it), returns the new row
- `.single()` returns the actual quotation object
- API logs "Quotation created: {id: '...', quotation_number: 'QUO-2025-0010', ...}"

---

## 📋 After Applying This Fix

**Immediate results:**
- ✅ Quotations page will show all your existing quotations (10 found in database)
- ✅ New quotations will appear in list immediately after creation
- ✅ All CRUD operations (Create, Read, Update, Delete) will work

**No code changes needed!** The API code already handles all operations correctly. It was just blocked by database RLS policies.

---

## 🆘 Troubleshooting

**If quotations still don't appear:**

1. **Check if RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'quotations';
   ```
   Should return `rowsecurity = true`

2. **Verify user_id matches:**
   ```sql
   SELECT id, user_id, quotation_number FROM quotations LIMIT 5;
   ```
   Compare the `user_id` with your authenticated user's ID

3. **Check browser console for API errors:**
   - Open DevTools → Network tab
   - Refresh quotations page
   - Look for `/api/quotations` request
   - Check response (should not be `[]`)

4. **Verify authentication:**
   ```sql
   SELECT auth.uid(); -- Should return your user ID, not NULL
   ```

**If you see policy already exists errors:**
- That's OK! The `DROP POLICY IF EXISTS` statements handle this
- Just means some policies were already created previously

---

## 📌 Summary

**Before:** Quotation inserts succeeded, but API couldn't read them back (RLS SELECT blocked)  
**After:** All CRUD operations work (SELECT, INSERT, UPDATE, DELETE policies in place)  
**Action:** Copy-paste the SQL above into Supabase Dashboard → SQL Editor → Run  
**Result:** Quotations will appear in your list immediately ✅

