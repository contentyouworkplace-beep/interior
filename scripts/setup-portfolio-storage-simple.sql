-- Portfolio Media Storage Setup (Simplified)
-- Run this in Supabase SQL Editor
-- This version avoids permission errors by skipping GRANT statements

-- ==========================================
-- 1. Ensure portfolio-media bucket exists
-- ==========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-media', 
  'portfolio-media', 
  false, -- Keep bucket private, use signed URLs
  104857600, -- 100MB file size limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'application/pdf'
  ]::text[]
)
ON CONFLICT (id) 
DO UPDATE SET
  file_size_limit = 104857600,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public = false;

-- ==========================================
-- 2. Drop existing policies (clean slate)
-- ==========================================

DROP POLICY IF EXISTS "portfolio_media_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_media_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_media_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "portfolio_media_delete_policy" ON storage.objects;

-- ==========================================
-- 3. Create RLS policies for authenticated users
-- ==========================================

-- SELECT: Allow authenticated users to view files
CREATE POLICY "portfolio_media_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'portfolio-media'
);

-- INSERT: Allow authenticated users to upload files
CREATE POLICY "portfolio_media_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-media'
);

-- UPDATE: Allow authenticated users to update files
CREATE POLICY "portfolio_media_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'portfolio-media'
);

-- DELETE: Allow authenticated users to delete files
CREATE POLICY "portfolio_media_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'portfolio-media'
);

-- ==========================================
-- 4. Verify setup
-- ==========================================

-- Check bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  created_at
FROM storage.buckets 
WHERE id = 'portfolio-media';

-- Check policies are active
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE 'portfolio_media%'
ORDER BY policyname;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ Portfolio media storage setup complete!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📦 Bucket: portfolio-media';
  RAISE NOTICE '🔒 Privacy: Private (requires signed URLs)';
  RAISE NOTICE '📏 Size Limit: 100MB per file';
  RAISE NOTICE '✅ RLS Policies: Applied';
  RAISE NOTICE '✨ Status: Ready to upload!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next: Test with: node scripts/verify-portfolio-storage.js';
  RAISE NOTICE '';
END $$;
