# Company Settings Fix - Terms & Conditions and Business Address

## Issues Fixed

### 1. Terms & Conditions Not Saving
**Problem**: Terms & Conditions field was being entered but not persisted to the database.

**Root Cause**: The `terms_and_conditions` field was not included in the `normalizedProfile` object when preparing data for the API update.

**Solution**:
- Added `terms_and_conditions` to the `normalizedProfile` object in `/app/settings/CompanyPageNew.tsx` (line ~593)
- Added `terms_and_conditions` field to the `CompanyProfile` interface in `/hooks/useCompanySettings.ts`
- API route already supported this field in the `allowedProfileKeys` array

**Files Modified**:
1. `/app/settings/CompanyPageNew.tsx` - Added terms_and_conditions to normalize function
2. `/hooks/useCompanySettings.ts` - Added terms_and_conditions to CompanyProfile interface

### 2. Business Address Not Saving  
**Problem**: Business address field was not being saved properly.

**Status**: The `address` field is already:
- ✅ In the form schema (`companyFormSchema`)
- ✅ In the `normalizedProfile` object
- ✅ In the API's `allowedProfileKeys` array
- ✅ In the `CompanyProfile` interface

**Verification**: The address should now save correctly. If it's still not working, it might be a validation issue or empty value filtering.

### 3. QR Code URL Support
**Bonus Fix**: Added `qr_code_url` to the `BrandingInfo` interface for consistency.

## Technical Details

### Database Tables

#### `company_profiles` table:
```sql
- organization_id (primary key)
- company_name
- company_tagline
- email
- phone
- website
- address  ← Saves here
- city
- state
- pin_code
- gstin
- pan
- cin
- terms_and_conditions  ← Now saves here
- created_at
- updated_at
```

#### `branding` table:
```sql
- organization_id (primary key)
- logo_url
- signature_url
- qr_code_url  ← Now typed
- primary_color
- secondary_color
- quotation_template
- invoice_template
- created_at
- updated_at
```

### Data Flow

1. **User enters data** in Company Settings form
2. **Form validates** using Zod schema
3. **onSubmit handler** normalizes data (removes empty strings)
4. **API call** to `/api/company-settings` with payload:
   ```typescript
   {
     orgId: "...",
     profile: {
       company_name: "...",
       address: "...",
       terms_and_conditions: "...",
       // ... other fields
     },
     banking: { ... },
     branding: { ... }
   }
   ```
5. **API upserts** data to respective tables
6. **Response** returns updated data
7. **Form refreshes** with saved data

### Normalization Logic

The `normalize` function filters out empty values:
```typescript
const normalize = (obj: Record<string, any>) => {
  const out: Record<string, any> = {}
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined) return
    if (typeof v === 'string') {
      const t = v.trim()
      if (t === '') return  // Skip empty strings
      out[k] = t
    } else {
      out[k] = v
    }
  })
  return out
}
```

**Important**: If you enter only whitespace or leave fields empty, they won't be saved (by design).

## Testing

### To test Terms & Conditions:
1. Go to Settings → Company tab
2. Scroll to "Terms & Conditions" section
3. Enter some text (e.g., "Payment within 30 days")
4. Click "Save Settings"
5. Refresh the page
6. Verify the text persists in the textarea

### To test Business Address:
1. Go to Settings → Contact tab
2. Find "Business Address" field
3. Enter a complete address (e.g., "2nd Floor, Maruti Building 12...")
4. Click "Save Settings"  
5. Refresh the page
6. Verify the address persists

### To test QR Code:
1. Go to Settings → Branding tab
2. Upload a QR code image
3. Click "Save Settings"
4. Check that QR code displays in preview
5. Verify it's used in generated invoices/quotations

## Debugging

If saving still doesn't work:

1. **Check browser console** for errors
2. **Check Network tab** to see API request/response
3. **Check server logs** for API errors
4. **Verify organization ID** is being passed correctly
5. **Check database** directly:
   ```sql
   SELECT * FROM company_profiles 
   WHERE organization_id = 'your-org-id';
   ```

## Common Issues

### Issue: Data disappears after save
**Cause**: Value is being trimmed to empty string
**Solution**: Ensure you enter actual content, not just spaces

### Issue: "Organization not found" error
**Cause**: User is not a member of any organization
**Solution**: Run the organization_members fix script from earlier

### Issue: Save button disabled
**Cause**: Form validation errors
**Solution**: Check for red error messages below fields

### Issue: Changes don't appear after refresh
**Cause**: Data not loading from database
**Solution**: Check `loadCompanyData()` function and API GET response

## Validation Rules

Fields have specific validation:
- **Terms & Conditions**: Max 5000 characters
- **Address**: Max 500 characters
- **PIN Code**: Must be 6 digits, first digit 1-9
- **Phone**: Must be 10 digits starting with 6-9
- **Email**: Must be valid email format
- **Website**: Must be valid URL
- **GSTIN**: Must match GST format (15 characters)
- **PAN**: Must match PAN format (10 characters)
- **IFSC**: Must match IFSC format (11 characters)

If validation fails, the field will show an error message and data won't save.
