# Quotations Table Fix

This document outlines the issues found with the quotations table and the fixes applied.

## Database Structure Issues

The database has a `quotations` table with the following structure:
```
- id
- user_id
- client_id
- project_id
- quotation_number
- title
- status
- issue_date
- valid_until
- subtotal
- tax_rate
- tax_amount
- discount_amount
- total_amount
- currency
- notes
- terms                 ← (NOT terms_conditions as in the code)
- items
- created_at
- updated_at
```

## Key Issues Found

1. The code was referring to `terms_conditions` but the database has `terms`
2. The code was trying to use `template` and `gst_type` columns that don't exist in the database

## Fixes Applied

1. Updated `/app/api/quotations/route.ts`:
   - Changed from sending `terms_conditions` to sending `terms`
   - Removed reference to the `template` field

2. Updated `/lib/services/quotation-service.ts`:
   - Changed the mapping to use `terms` instead of `terms_conditions` when sending data to the API
   - Removed the `template` field since it doesn't exist in the database

## Recommended Next Steps

To fully fix the application and make it work correctly:

1. Update all code that refers to `terms_conditions` to use `terms` instead:
   - Update interface definitions in all service files
   - Update component props and form fields
   - Update any data fetching or manipulation code

2. Either:
   - Add the `gst_type` and `template` columns to the database (preferred), or
   - Remove all references to these fields from the code

3. Verify the fix works by creating a new quotation through the UI

## How to Add Missing Columns

If you decide to add the missing columns, you can execute the following SQL in Supabase:

```sql
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS gst_type TEXT DEFAULT 'cgst_sgst',
ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'standard';
```

## Testing 

We confirmed that creating quotations works with the existing table structure when using the correct field names (`terms` instead of `terms_conditions`).