# 🚀 QUICK FIX - Portfolio Upload Error

## 🔴 The Problem
```
❌ Database insert error: Could not find the 'media_url' column
❌ Failed to upload data_Looks_3.jpg: Database error
```

## ✅ The Solution (2 minutes)

### Step 1: Add Missing Database Columns

**Open Supabase Dashboard → SQL Editor** and paste this:

```sql
ALTER TABLE portfolio_media 
ADD COLUMN IF NOT EXISTS media_url TEXT;

ALTER TABLE portfolio_media 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

SELECT '✅ Fixed!' as status;
```

Click **RUN** ▶️

---

### Step 2: Verify It Worked

In the same SQL Editor, run:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'portfolio_media' 
    AND column_name IN ('media_url', 'thumbnail_url');
```

You should see:
```
media_url
thumbnail_url
```

---

### Step 3: Try Upload Again

1. Go to your app: `http://localhost:3002/portfolio`
2. Click **"New Project"**
3. Upload files (images/PDFs)
4. Should work now! ✅

---

## 📋 Alternative: Run Full Script

If you want to be thorough, run this in SQL Editor:

**File:** `scripts/add-media-url-columns.sql`

```bash
# Just copy/paste its contents to Supabase SQL Editor
```

---

## 🔍 Still Not Working?

### Check 1: Verify Storage Bucket

```sql
SELECT * FROM storage.buckets WHERE id = 'portfolio-media';
```

If empty, run: `scripts/setup-portfolio-storage-simple.sql`

### Check 2: Check Browser Console

Look for these SUCCESS messages after upload:
```
✅ File uploaded successfully
✅ Generating thumbnail...
✅ Thumbnail uploaded successfully
✅ Generated media URL: Yes
✅ Generated thumbnail URL: Yes
```

### Check 3: Verify You're Logged In

```sql
SELECT auth.uid();
```

Should return your user ID (not NULL).

---

## 📝 What This Fixes

The `portfolio_media` table was missing two columns that the upload code needs:

1. **`media_url`** - Stores the signed URL to access the file
2. **`thumbnail_url`** - Stores the signed URL for the thumbnail

Without these columns, the database insert fails with "column not found" error.

---

## ⚡ Quick Commands

```bash
# 1. Add columns (Supabase SQL Editor)
ALTER TABLE portfolio_media ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE portfolio_media ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

# 2. Refresh browser (on Mac)
Cmd + Shift + R

# 3. Test upload
# Go to http://localhost:3002/portfolio
# Click "New Project" → Upload files
```

---

## ✅ Success Checklist

- [ ] Ran SQL to add `media_url` column
- [ ] Ran SQL to add `thumbnail_url` column  
- [ ] Verified columns exist with SELECT query
- [ ] Refreshed browser (hard refresh)
- [ ] Tried uploading files again
- [ ] Checked console for success messages
- [ ] Files appear in portfolio gallery

---

**That's it!** Your portfolio uploads should work now. 🎉

If you still have issues, check `PORTFOLIO-DATABASE-FIX.md` for detailed troubleshooting.
