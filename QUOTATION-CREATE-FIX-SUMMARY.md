# Quotation Creation Fix Summary

## Root Cause Analysis

The POST /api/quotations 500 error stemmed from **two combined issues**:

### 1. **Schema Column Mismatch**
- **Problem**: The live `quotations` table lacks columns `template` and `terms_conditions` that the API attempted to insert.
- **Evidence**: Logs show `PGRST204` errors: `Could not find the 'template' column` and `Could not find the 'terms_conditions' column`.
- **Impact**: Initial insert attempts failed until adaptive code removed unsupported columns.

### 2. **Missing RLS SELECT Policy** (Primary Blocker)
- **Problem**: After successfully inserting a quotation row, the `.insert().select().single()` chain returns `null` because the authenticated user cannot SELECT their own newly inserted row due to missing/restrictive RLS policy.
- **Evidence**: 
  - Logs show ✅ `Quotation created successfully: undefined` (newQuotation.id is undefined).
  - Followed by crash: `Cannot read properties of null (reading 'id')` when trying to insert quotation_items.
  - Quotation_number conflicts persist across retries (QUO-2025-0001 repeatedly), suggesting rows ARE being inserted but not visible to subsequent SELECT queries.
- **Impact**: Items insertion fails; 500 error returned to client despite quotation row likely existing in DB.

---

## Solution Implemented

### Code Changes (`/app/api/quotations/route.ts`)

1. **Adaptive Column Removal**:
   - Loop now detects `PGRST204` errors, parses missing column names, removes them from payload, and retries.
   - Falls back to legacy `terms` column if `terms_conditions` is unsupported.

2. **Improved Quotation Number Generation**:
   - Numeric increment without re-querying DB when conflicts occur (avoids RLS SELECT issues during retry).

3. **Null-Safe Items Insertion**:
   - Guard: Only insert items if `newQuotation?.id` exists.
   - Logs warning if items are skipped due to missing quotation ID (indicates RLS SELECT issue).

4. **Enhanced Error Response**:
   - Returns structured JSON with:
     - Detailed error message
     - List of removed columns
     - Actionable hints (RLS policy, schema sync)

### Sample Fixed Code Excerpt
```typescript
if (lastError || !newQuotation) {
  const explanation = lastError ? lastError.message : 'Insert returned no row (possible missing SELECT RLS policy on quotations)'
  return NextResponse.json({
    error: 'Failed to create quotation',
    details: explanation,
    hints: [
      'Ensure RLS SELECT policy: USING (user_id = auth.uid())',
      'Add missing columns (terms_conditions, template) or use legacy schema',
      'Consider dedicated sequence for quotation_number'
    ]
  }, { status: 500 })
}
```

---

## Required Database Fixes

### Fix 1: Add Missing RLS SELECT Policy

**Problem**: Users cannot SELECT rows they just inserted.

**Solution**: Run this SQL in your Supabase SQL editor:

```sql
-- Allow users to SELECT their own quotations
CREATE POLICY "Users can select own quotations"
ON quotations
FOR SELECT
USING (user_id = auth.uid());
```

**Verification**:
```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'quotations';
```

Expected output should include both INSERT and SELECT policies with `user_id = auth.uid()`.

---

### Fix 2: Add Missing Columns (Optional if you want modern schema)

**Option A**: Add `terms_conditions` and `template` columns:
```sql
ALTER TABLE quotations 
  ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
  ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'modern';
```

**Option B**: Keep legacy schema (code already adapts):
- Ensure `terms` column exists (older schema used this name).
- Code will automatically fall back to `terms` if `terms_conditions` fails.

---

### Fix 3: Resolve Quotation Number Conflicts (if rows are orphaned)

If quotation rows were inserted but not returned (due to RLS SELECT issue), they may cause permanent conflicts. Clean up:

```sql
-- Find orphaned quotations (no items, created recently, draft status)
SELECT id, quotation_number, title, created_at, user_id
FROM quotations
WHERE status = 'draft'
  AND created_at > NOW() - INTERVAL '1 hour'
  AND NOT EXISTS (
    SELECT 1 FROM quotation_items WHERE quotation_items.quotation_id = quotations.id
  )
ORDER BY created_at DESC;

-- Delete if confirmed orphaned (replace <id> with actual UUID):
-- DELETE FROM quotations WHERE id = '<orphaned-id>';
```

---

## Testing Instructions

### Prerequisites
1. Apply RLS SELECT policy SQL above.
2. Restart Next.js dev server:
   ```bash
   pkill -f "next dev"
   pnpm dev
   ```

### Smoke Test #1
1. Navigate to `/quotations` page.
2. Click "+ New Quotation".
3. Fill form:
   - **Client**: Select any client
   - **Title**: "Test Quote 1"
   - **Items**: Add 1 item (e.g., "Cement", qty: 1, price: 100)
   - **Terms**: Auto-loaded from Company Settings
4. Submit.
5. **Expected**: 201 success, quotation appears in list with auto-generated number (QUO-2025-0002 or next available).
6. **Server log should show**:
   ```
   ✅ API: Quotation created successfully: <uuid>
   📦 API: Inserting 1 quotation items...
   ✅ API: Quotation items inserted successfully
   ```

### Smoke Test #2
Repeat above with different data (multiple items, custom terms). Verify sequential quotation_number increment.

---

## Remaining Work

### ✅ Completed
- [x] Adaptive column fallback logic
- [x] Null-safe items insertion guard
- [x] Enhanced error messaging with RLS hints
- [x] Improved quotation number retry logic

### ⬜ Pending (requires DB admin access)
- [ ] Apply RLS SELECT policy (user must run SQL above)
- [ ] Decide on schema: add `terms_conditions` + `template` OR keep legacy `terms`
- [ ] Clean up orphaned draft quotations (if any)

### 🔄 Future Enhancements
- [ ] Add PATCH `/api/quotations/[id]` for updates
- [ ] Add DELETE `/api/quotations/[id]` for deletion
- [ ] Implement quotation PDF generation
- [ ] Add quotation status workflow (draft → sent → approved/rejected)

---

## Quick Reference

**Key Files Modified**:
- `/app/api/quotations/route.ts` - POST handler with adaptive schema detection
- `/lib/services/quotation-service.ts` - Client-side API wrapper (unchanged)
- `/components/create-quotation-dialog-clean.tsx` - UI form (unchanged)

**Database Tables**:
- `quotations` - Main table (needs RLS SELECT policy)
- `quotation_items` - Line items (linked by `quotation_id`)
- `clients` - Referenced by `client_id`
- `company_profiles` - Source of default terms & conditions

**Environment**:
- Next.js 14.2.16 (App Router)
- Supabase (PostgreSQL + PostgREST)
- pnpm package manager

---

## Contact & Support

If issues persist after applying RLS policy:
1. Check Supabase logs (Dashboard → Logs → API)
2. Verify `user_id` column references correct auth table (`profiles` vs `auth.users`)
3. Confirm `quotation_items` table exists with correct foreign key
4. Review full error response JSON from POST `/api/quotations` for hints array

**Document Version**: 1.0  
**Last Updated**: 2025-10-04  
**Status**: Requires DB admin to apply RLS policy; code changes complete.
