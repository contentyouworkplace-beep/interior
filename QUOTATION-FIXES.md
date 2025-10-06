# Quotation Creation & Terms & Conditions Fix

## Issues Fixed

### 1. Quotation Creation Not Working
**Problem**: Quotations showed "success" message but weren't actually being created in the database.

**Root Cause**: The API route was creating the quotation record but not inserting the quotation items (line items).

**Solution**: 
- Added quotation items insertion logic in `/app/api/quotations/route.ts` (lines 148-167)
- Items are now properly inserted into the `quotation_items` table with correct schema mapping:
  - `amount` (from UI) → `total` (in database)
  - `item_order` automatically assigned if not provided
  - Proper error handling (logs error but doesn't fail the whole request)

### 2. Terms & Conditions Not Loading from Settings
**Problem**: Terms & Conditions in the quotation dialog were hardcoded instead of being fetched from the company settings page.

**Root Cause**: 
- Component was trying to use `BusinessSettingsService` which had authentication issues
- Wrong table/column reference

**Solution**:
- Replaced `BusinessSettingsService` with direct Supabase client calls
- Updated to fetch from correct table: `business_settings.terms_conditions`
- Added `loadCompanyTerms()` function that:
  1. Gets authenticated user
  2. Fetches `terms_conditions` from `business_settings` table
  3. Pre-populates the terms field in the quotation form
  4. Falls back to default text if no custom terms are found

## Files Modified

1. **`/components/create-quotation-dialog-clean.tsx`**
   - Removed `BusinessSettingsService` import
   - Added `createClient` from `@/lib/supabase/client`
   - Added `loadCompanyTerms()` function to fetch terms from settings
   - Replaced `loadBusinessSettings()` with direct Supabase query

2. **`/app/api/quotations/route.ts`**
   - Added quotation items insertion after creating the quotation
   - Properly mapped item fields to database schema
   - Added error handling for item insertion
   - Fixed TypeScript type annotations for `newQuotation` variable

## Database Schema Reference

### `business_settings` table (where terms are stored):
```
terms_conditions: string | null
```

### `quotation_items` table (where line items are stored):
```sql
{
  id: string
  quotation_id: string
  description: string
  quantity: number (default: 1)
  unit_price: number
  total: number  -- This is what 'amount' from UI maps to
  item_order: number
  discount_rate: number (nullable)
  created_at: timestamp
}
```

## Testing

To test the fixes:

1. **Terms & Conditions**:
   - Go to Settings → Company tab
   - Enter custom Terms & Conditions
   - Save settings
   - Create a new quotation
   - Verify the terms field is pre-populated with your custom terms

2. **Quotation Creation**:
   - Create a new quotation with at least one line item
   - Submit the form
   - Verify success message appears
   - Check the quotations table to confirm the quotation exists
   - Check the quotation_items table to confirm line items were inserted
   - View the quotation details page to see all items displayed correctly

## Notes

- Default terms text: "Quotation valid for 30 days from the date of issue."
- If user hasn't set custom terms in settings, the default is used
- Quotation items are inserted separately after the quotation record to avoid transaction issues
- If item insertion fails, the quotation is still created (logged as warning, not error)
