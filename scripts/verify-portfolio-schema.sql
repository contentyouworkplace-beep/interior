-- ========================================
-- Verify Portfolio Media Table Schema
-- ========================================
-- Run this to check if all required columns exist

-- 1. Check if portfolio_media table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'portfolio_media'
        ) 
        THEN '✅ portfolio_media table exists'
        ELSE '❌ portfolio_media table NOT FOUND'
    END as table_status;

-- 2. List all columns in portfolio_media table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('media_url', 'thumbnail_url') THEN '⭐ REQUIRED FOR UPLOAD'
        ELSE ''
    END as importance
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'portfolio_media' 
ORDER BY 
    CASE 
        WHEN column_name IN ('media_url', 'thumbnail_url') THEN 0
        ELSE 1
    END,
    ordinal_position;

-- 3. Check for missing required columns
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'portfolio_media' 
                AND column_name = 'media_url'
        )
        THEN '❌ MISSING: media_url column - RUN add-media-url-columns.sql'
        ELSE '✅ media_url column exists'
    END as media_url_status,
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'portfolio_media' 
                AND column_name = 'thumbnail_url'
        )
        THEN '❌ MISSING: thumbnail_url column - RUN add-media-url-columns.sql'
        ELSE '✅ thumbnail_url column exists'
    END as thumbnail_url_status;

-- 4. Check storage bucket
SELECT 
    id,
    name,
    public,
    file_size_limit,
    CASE 
        WHEN public = false THEN '✅ Correctly set to PRIVATE'
        ELSE '⚠️ Should be PRIVATE'
    END as bucket_status
FROM storage.buckets 
WHERE id = 'portfolio-media';

-- 5. Check storage policies
SELECT 
    policyname,
    CASE 
        WHEN cmd = 'SELECT' THEN '📖 Read access'
        WHEN cmd = 'INSERT' THEN '📥 Upload access'
        WHEN cmd = 'UPDATE' THEN '✏️ Update access'
        WHEN cmd = 'DELETE' THEN '🗑️ Delete access'
        ELSE cmd
    END as permission_type,
    CASE 
        WHEN qual::text LIKE '%authenticated%' THEN '✅ Authenticated users'
        ELSE '⚠️ ' || qual::text
    END as who_can_access
FROM pg_policies 
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
    AND qual::text LIKE '%portfolio-media%'
ORDER BY cmd;

-- ========================================
-- Summary
-- ========================================
SELECT '
📊 VERIFICATION COMPLETE

If you see:
✅ portfolio_media table exists
✅ media_url column exists  
✅ thumbnail_url column exists
✅ Correctly set to PRIVATE
✅ Storage policies exist

Then your database is ready for file uploads!

If you see ❌ errors, run the appropriate SQL scripts:
1. add-media-url-columns.sql (for missing columns)
2. setup-portfolio-storage-simple.sql (for storage setup)
' as summary;
