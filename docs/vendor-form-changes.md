# Vendor Form Modifications

## Removal of State Field

### Changes Made
- Removed the "State" field from the edit vendor dialog form
- Updated form state initialization to no longer include the state field
- Modified the form layout to use a single-column layout for the city field
- Updated the database update logic to no longer include the state field
- Updated the fallback API call to no longer include the state field

### Rationale
The "State" field was removed to simplify the vendor form. For most use cases in this interior designer CRM, the city information is sufficient for vendor location identification, making the state field redundant.

### Files Modified
- `/components/edit-vendor-dialog-new.tsx`

### Date
- Change implemented: [Date]