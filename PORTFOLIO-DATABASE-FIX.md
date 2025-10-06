# 🚨 Portfolio Upload Database Error Fix

## Problem
When trying to upload files to portfolio, you're getting these errors:
```
❌ Database insert error: Could not find the 'media_url' column of 'portfolio_media' in the schema cache
❌ Failed to upload file: Database error
```

## Root Cause
The `portfolio_media` table is missing two columns that the upload code expects:
- `media_url` - Stores the signed URL to access the uploaded file
- `thumbnail_url` - Stores the signed URL to access the thumbnail

## Solution

### Step 1: Add Missing Columns to Database

Run this SQL in **Supabase Dashboard → SQL Editor**:

```sql
-- Add media_url column (stores signed URL or path to media file)
ALTER TABLE portfolio_media 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Add thumbnail_url column (stores signed URL or path to thumbnail)
ALTER TABLE portfolio_media 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN portfolio_media.media_url IS 'Signed URL or public path to the media file';
COMMENT ON COLUMN portfolio_media.thumbnail_url IS 'Signed URL or public path to the thumbnail';

-- ✅ Migration complete!
SELECT '✅ Successfully added media_url and thumbnail_url columns to portfolio_media table' as status;
```

**Or run the script file:**
```bash
# Copy contents of scripts/add-media-url-columns.sql to Supabase SQL Editor
```

### Step 2: Verify the Fix

After running the SQL, refresh your browser and try uploading files again.

### Step 3: Check Storage Setup

If you still get errors, make sure the storage bucket is set up correctly:

1. **Run the storage setup script** (if not already done):
   ```bash
   # In Supabase SQL Editor, run:
   ```
   Copy contents of `scripts/setup-portfolio-storage-simple.sql`

2. **Verify bucket exists**:
   - Go to Supabase Dashboard → Storage
   - Check if `portfolio-media` bucket exists
   - It should be **private** (not public)

3. **Verify RLS policies**:
   - In Supabase Dashboard → SQL Editor
   - Run:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'portfolio-media';
   ```

### Step 4: Test Upload Again

1. Go to Portfolio page: `http://localhost:3002/portfolio`
2. Click "New Project" button
3. Fill in project details
4. Upload files (images, PDFs, videos)
5. Check browser console - should see:
   ```
   ✅ File uploaded successfully
   ✅ Generating thumbnail...
   ✅ Thumbnail uploaded successfully
   ✅ Generated media URL: Yes
   ✅ Generated thumbnail URL: Yes
   ```

## Expected Result

After applying the fix:
- ✅ Files upload to Supabase Storage successfully
- ✅ Thumbnails are generated and uploaded
- ✅ Media URLs and thumbnail URLs are saved in database
- ✅ Portfolio gallery displays uploaded files
- ✅ No console errors

## Troubleshooting

### Still getting "Database insert error"?

Check if there are other missing columns:
```sql
-- Run this to see all columns in portfolio_media table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'portfolio_media' 
ORDER BY ordinal_position;
```

### Files not appearing in Storage?

1. Check authentication:
   ```sql
   -- Verify you're logged in
   SELECT auth.uid();
   ```

2. Check storage policies:
   ```sql
   -- List all policies for storage.objects
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

### Thumbnails not generating?

- Check browser console for thumbnail generation errors
- Ensure files are valid images/videos/PDFs
- Try with smaller files first (< 10MB)

## Quick Fix Commands

```bash
# 1. Add missing columns (run in Supabase SQL Editor)
scripts/add-media-url-columns.sql

# 2. Verify storage setup (run in Supabase SQL Editor)
scripts/setup-portfolio-storage-simple.sql

# 3. Test upload
# Go to http://localhost:3002/portfolio and try uploading
```

## Files Modified/Created

1. ✅ Created `scripts/add-media-url-columns.sql` - Adds missing columns
2. 📝 This document - `PORTFOLIO-DATABASE-FIX.md`

## Next Steps

1. **Run the SQL migration** in Supabase SQL Editor
2. **Hard refresh browser** (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. **Try uploading files again**
4. **Check console** for success messages
5. **Verify files** in Supabase Storage dashboard

---

**Need Help?**
- Check console errors for specific messages
- Verify all SQL scripts ran successfully
- Check Supabase Storage dashboard for uploaded files
