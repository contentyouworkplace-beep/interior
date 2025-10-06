# 🎯 Portfolio Upload Issue - Complete Fix

## 🔍 Root Cause Analysis

Looking at your console errors:

```
❌ Database insert error: ▶ Object
   window.console.error @ app-index.js:33
❌ Failed to upload data_Looks_3.jpg: Database error: Could not find the 
   'media_url' column of 'portfolio_media' in the schema cache
   window.console.error @ app-index.js:33
⚠️ Failed to load resource: the server responded with a status of 400 ()
```

### The Problem

Your `portfolio_media` table is **missing two critical columns**:

| Missing Column | Purpose | Why It's Needed |
|---------------|---------|-----------------|
| `media_url` | Stores signed URL to access file | Upload code tries to insert this |
| `thumbnail_url` | Stores signed URL for thumbnail | Upload code tries to insert this |

When the code tries to INSERT a new media record with these columns, PostgreSQL returns:
> "Could not find the 'media_url' column"

This causes the upload to fail with a **400 error**.

---

## ✅ The Fix

### Option 1: Quick Fix (30 seconds) ⚡

**Copy/paste this in Supabase SQL Editor:**

```sql
ALTER TABLE portfolio_media ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE portfolio_media ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
```

Click **RUN** ▶️ and you're done!

---

### Option 2: Use Migration Script (Complete) 📋

**File:** `scripts/add-media-url-columns.sql`

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Paste contents of `add-media-url-columns.sql`
5. Click RUN

This adds:
- ✅ `media_url` column (TEXT)
- ✅ `thumbnail_url` column (TEXT)
- ✅ Column comments for documentation
- ✅ Success confirmation message

---

## 🧪 Testing

### Before Fix:
```
❌ Database insert error
❌ Failed to upload: Database error
❌ 400 status code
```

### After Fix:
```
✅ File uploaded successfully
✅ Generating thumbnail...
✅ Thumbnail uploaded successfully
✅ Generated media URL: Yes
✅ Generated thumbnail URL: Yes
✅ File upload complete: 0/2 files
```

---

## 📋 Step-by-Step Instructions

### 1️⃣ Add Columns to Database

**Go to:** Supabase Dashboard → SQL Editor

**Run this:**
```sql
ALTER TABLE portfolio_media 
ADD COLUMN IF NOT EXISTS media_url TEXT;

ALTER TABLE portfolio_media 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
```

**Expected result:**
```
Success. No rows returned
```

---

### 2️⃣ Verify Columns Were Added

**Run this:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'portfolio_media' 
  AND column_name IN ('media_url', 'thumbnail_url');
```

**Expected result:**
| column_name | data_type |
|-------------|-----------|
| media_url | text |
| thumbnail_url | text |

---

### 3️⃣ Test File Upload

1. **Refresh browser:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Go to:** http://localhost:3002/portfolio
3. **Click:** "New Project" button
4. **Fill in:**
   - Title: "Test Upload"
   - Category: Any
   - Description: Optional
5. **Upload files:**
   - Click "Upload Files"
   - Select 2-3 images or PDFs
   - Click "Save Project"
6. **Check console:** Should see success messages ✅

---

### 4️⃣ Verify in Supabase

**Check uploaded files:**
1. Supabase Dashboard → Storage
2. Click `portfolio-media` bucket
3. Navigate to `projects/{some-id}/`
4. You should see your uploaded files!

**Check database records:**
```sql
SELECT 
    id,
    filename,
    media_url IS NOT NULL as has_media_url,
    thumbnail_url IS NOT NULL as has_thumbnail_url
FROM portfolio_media
ORDER BY created_at DESC
LIMIT 5;
```

Expected result:
| id | filename | has_media_url | has_thumbnail_url |
|----|----------|---------------|-------------------|
| abc... | image.jpg | true | true |

---

## 🔧 Additional Setup (If Needed)

If you still can't upload after adding columns, check:

### Check Storage Bucket

```sql
SELECT * FROM storage.buckets WHERE id = 'portfolio-media';
```

**Should return:**
- id: `portfolio-media`
- public: `false` (private bucket)
- file_size_limit: `104857600` (100MB)

**If empty,** run: `scripts/setup-portfolio-storage-simple.sql`

---

### Check Storage Policies

```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND qual::text LIKE '%portfolio-media%';
```

**Should have 4 policies:**
- `portfolio_media_select` (SELECT)
- `portfolio_media_insert` (INSERT)
- `portfolio_media_update` (UPDATE)
- `portfolio_media_delete` (DELETE)

**If empty,** run: `scripts/setup-portfolio-storage-simple.sql`

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `scripts/add-media-url-columns.sql` | Migration script (what you need) |
| `scripts/verify-portfolio-schema.sql` | Verification script |
| `QUICK-FIX-UPLOAD.md` | Quick reference guide |
| `PORTFOLIO-DATABASE-FIX.md` | Detailed troubleshooting |

---

## ❓ FAQ

### Q: Why were these columns missing?

The initial database schema didn't include `media_url` and `thumbnail_url` columns. They store the signed URLs needed to access files in the private storage bucket.

### Q: Will this affect existing data?

No! The `ADD COLUMN IF NOT EXISTS` ensures safe addition. Existing rows will have NULL values for these columns (which is fine).

### Q: Do I need to run other scripts?

Only if storage isn't set up:
1. First: `add-media-url-columns.sql` (REQUIRED)
2. Then if needed: `setup-portfolio-storage-simple.sql` (storage setup)

### Q: Can I undo this?

Yes, run:
```sql
ALTER TABLE portfolio_media DROP COLUMN IF EXISTS media_url;
ALTER TABLE portfolio_media DROP COLUMN IF EXISTS thumbnail_url;
```

But you won't be able to upload files without them!

---

## ✅ Success Indicators

After the fix, you should see:

**In Console:**
```
✅ File uploaded successfully
✅ Generating thumbnail...  
✅ Thumbnail uploaded successfully
✅ Generated media URL: Yes
✅ Generated thumbnail URL: Yes
```

**In UI:**
- Portfolio project appears with thumbnail
- Files shown in gallery
- Click file to view/download
- No console errors

**In Database:**
- New rows in `portfolio_media` table
- `media_url` and `thumbnail_url` populated
- Files in Storage → `portfolio-media` bucket

---

## 🎉 Done!

Your portfolio upload should work perfectly now.

**Any issues?** Check the detailed troubleshooting in `PORTFOLIO-DATABASE-FIX.md`
