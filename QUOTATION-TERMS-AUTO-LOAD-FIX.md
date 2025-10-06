# Quotation Terms & Conditions Auto-Load Fix

## Issue Fixed ✅

**Problem**: The Terms & Conditions field in the quotation creation dialog was showing a default hardcoded message instead of loading the actual Terms & Conditions saved in Company Settings.

**Root Cause**: The quotation dialog was fetching from the wrong table (`business_settings` which doesn't exist) instead of `company_profiles.terms_and_conditions`.

## Solution Implemented

Updated the `loadCompanyTerms()` function in the quotation creation dialog to:
1. Get the user's organization ID from `organization_members`
2. Fetch `terms_and_conditions` from `company_profiles` table
3. Auto-populate the Terms & Conditions field in the quotation form

### Technical Changes

**File Modified**: `/components/create-quotation-dialog-clean.tsx`

**Before** (Lines 100-119):
```typescript
const loadCompanyTerms = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch terms from business_settings table (WRONG TABLE)
    const { data: businessSettings } = await supabase
      .from('business_settings')
      .select('terms_conditions')
      .eq('user_id', user.id)
      .single()

    if (businessSettings?.terms_conditions) {
      setFormData(prev => ({
        ...prev,
        terms: businessSettings.terms_conditions || "Quotation valid for 30 days from the date of issue."
      }))
    }
  } catch (error) {
    console.error('Error loading company terms:', error)
  }
}
```

**After**:
```typescript
const loadCompanyTerms = async () => {
  try {
    console.log('📋 Loading company terms & conditions...')
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('❌ No user found')
      return
    }

    // Get user's organization from organization_members
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      console.log('❌ No organization found for user')
      return
    }

    console.log('🏢 Organization ID:', orgMember.organization_id)

    // Fetch terms from company_profiles table (CORRECT TABLE)
    const { data: companyProfile, error } = await supabase
      .from('company_profiles')
      .select('terms_and_conditions')
      .eq('organization_id', orgMember.organization_id)
      .maybeSingle()

    if (error) {
      console.error('❌ Error fetching company profile:', error)
      return
    }

    console.log('✅ Company profile loaded:', companyProfile)

    // Type cast to handle Supabase type generation issue
    const profile = companyProfile as { terms_and_conditions?: string } | null
    
    if (profile && profile.terms_and_conditions) {
      console.log('✅ Terms & Conditions found, setting in form')
      setFormData(prev => ({
        ...prev,
        terms: profile.terms_and_conditions || "Quotation valid for 30 days from the date of issue."
      }))
    } else {
      console.log('⚠️ No terms & conditions found, using default')
    }
  } catch (error) {
    console.error('❌ Error loading company terms:', error)
  }
}
```

## How It Works Now

### Data Flow:

```
User Opens Quotation Dialog
        ↓
useEffect triggers loadInitialData()
        ↓
loadCompanyTerms() is called
        ↓
Fetch user's organization_id from organization_members
        ↓
Fetch terms_and_conditions from company_profiles
        ↓
Auto-populate Terms & Conditions field in form
        ↓
User can edit or keep the loaded terms
        ↓
Create Quotation with company's terms
```

### Database Structure:

```
auth.users (user_id)
     ↓
organization_members (user_id → organization_id)
     ↓
company_profiles (organization_id → terms_and_conditions)
```

## Features

### Auto-Loading:
- ✅ Automatically loads when dialog opens
- ✅ Fetches from correct organization
- ✅ Uses saved Terms & Conditions from Company Settings
- ✅ Falls back to default if not set

### Default Fallback:
```typescript
"Quotation valid for 30 days from the date of issue."
```

### User Can Override:
- User can edit the loaded terms for specific quotation
- Edit is per-quotation (doesn't change company settings)
- Company settings remain the master source

### Debug Logging:
Added console logs for debugging:
- 📋 Loading company terms & conditions...
- 🏢 Organization ID: xxx
- ✅ Company profile loaded
- ✅ Terms & Conditions found
- ⚠️ No terms & conditions found, using default

## Testing

### Test Auto-Load Feature:

1. **Setup Company Terms** (one-time):
   - Go to **Settings → Company tab**
   - Scroll to "Terms and Conditions" field
   - Enter your company's terms, e.g.:
     ```
     Quotation valid for 30 days from the date of issue.
     Payment terms: 50% advance, 50% on completion.
     Prices are subject to change without notice.
     All disputes subject to [Your City] jurisdiction.
     ```
   - Click **"Save Settings"**
   - Wait for success message

2. **Test Quotation Creation**:
   - Go to **Quotations** page
   - Click **"+ New Quotation"** button
   - Wait for dialog to open
   - **Check Terms & Conditions field** at the bottom
   - ✅ Should show your saved terms automatically!

3. **Verify Persistence**:
   - Close and reopen the dialog multiple times
   - Terms should load each time
   - Create a quotation
   - Open dialog again - terms still there

### Expected Behavior:

| Scenario | Expected Result |
|----------|----------------|
| Company has saved terms | ✅ Auto-loads in quotation dialog |
| Company has no terms | ✅ Shows default fallback message |
| User edits terms in dialog | ✅ Only affects this quotation |
| User creates multiple quotations | ✅ All start with company terms |
| Admin updates company terms | ✅ New quotations use new terms |

## Console Debug Output

When you open the quotation dialog, check the browser console:

**Success Case:**
```
📋 Loading company terms & conditions...
🏢 Organization ID: e6ecf79e-e9eb-4db9-a863-43aa5a63feee
✅ Company profile loaded: { terms_and_conditions: "..." }
✅ Terms & Conditions found, setting in form
```

**No Terms Case:**
```
📋 Loading company terms & conditions...
🏢 Organization ID: e6ecf79e-e9eb-4db9-a863-43aa5a63feee
✅ Company profile loaded: { terms_and_conditions: null }
⚠️ No terms & conditions found, using default
```

**Error Case:**
```
📋 Loading company terms & conditions...
❌ No organization found for user
```

## Related Files

### Data Source:
- **Table**: `company_profiles`
- **Column**: `terms_and_conditions` (TEXT, nullable)
- **Relationship**: One terms per organization

### Company Settings Page:
- **File**: `/app/settings/CompanyPageNew.tsx`
- **Tab**: Company
- **Field**: Terms and Conditions textarea
- **Max Length**: 5000 characters

### Quotation Dialog:
- **File**: `/components/create-quotation-dialog-clean.tsx`
- **Function**: `loadCompanyTerms()`
- **Trigger**: Dialog open (useEffect)
- **Field**: formData.terms

## Benefits

1. **Consistency**: All quotations start with company-wide terms
2. **Efficiency**: No need to type terms for each quotation
3. **Centralized**: Update once in Settings, applies to all new quotations
4. **Flexibility**: Can still customize per quotation if needed
5. **Professional**: Ensures legal terms are always included

## Common Use Cases

### Scenario 1: New Company Setup
1. Admin sets up company profile
2. Adds standard Terms & Conditions
3. All team members see same terms in quotations
4. Professional consistency across team

### Scenario 2: Terms Update
1. Legal team revises terms
2. Admin updates in Company Settings
3. All new quotations use updated terms
4. Old quotations keep their original terms

### Scenario 3: Custom Quotation
1. User opens quotation dialog
2. Company terms load automatically
3. User adds project-specific clause
4. Creates quotation with customized terms
5. Next quotation starts fresh with company terms

## Technical Notes

### Type Casting:
Used type cast to handle Supabase type generation issue:
```typescript
const profile = companyProfile as { terms_and_conditions?: string } | null
```

This is necessary because Supabase's auto-generated types sometimes lag behind schema changes.

### Error Handling:
- Graceful fallback to default terms
- Console logging for debugging
- No error toasts (silent fallback)
- User can proceed even if terms don't load

### Performance:
- Single query to company_profiles
- Cached during dialog session
- Re-loads on each dialog open (ensures fresh data)
- No performance impact

## Future Enhancements

Potential improvements:
- Terms & Conditions template library
- Version history for terms
- Legal compliance checker
- Multi-language terms support
- Terms approval workflow
- Conditional terms based on quotation value
- Signature requirement toggle

## Troubleshooting

### Issue: Terms not loading
**Check**:
1. Company Settings → Company tab has terms saved
2. User is member of an organization
3. Browser console for error messages
4. Database: `company_profiles.terms_and_conditions` has value

### Issue: Old terms showing
**Cause**: Browser cached old dialog state
**Solution**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Issue: Default terms always showing
**Check**:
1. Terms actually saved in Company Settings
2. User logged into correct account
3. Organization membership is correct
4. Console logs show organization ID

## API Endpoints

No new API endpoints needed - uses direct Supabase queries:

```typescript
// Get organization
supabase.from('organization_members')
  .select('organization_id')
  .eq('user_id', user.id)
  .single()

// Get terms
supabase.from('company_profiles')
  .select('terms_and_conditions')
  .eq('organization_id', orgId)
  .maybeSingle()
```

## Validation

Company Settings validation (already implemented):
- Max length: 5000 characters
- Optional field (can be empty)
- Plain text (no HTML)
- Newlines preserved

## Security

- ✅ User-scoped: Only loads terms from user's organization
- ✅ Read-only: Quotation dialog can't modify company settings
- ✅ No SQL injection: Uses parameterized queries
- ✅ RLS protected: Supabase Row Level Security enforced
