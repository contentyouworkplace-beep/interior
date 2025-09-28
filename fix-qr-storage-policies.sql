-- ============================================================
-- FIX QR CODE STORAGE POLICIES
-- ============================================================
-- Please run this SQL in your Supabase SQL Editor to fix
-- the Row Level Security policies for QR code uploads
-- ============================================================

-- Step 1: Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing conflicting policies for qr-codes bucket
DROP POLICY IF EXISTS "Allow authenticated QR code uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public QR code access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated QR code updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated QR code deletions" ON storage.objects;

-- Step 3: Create comprehensive policies for qr-codes bucket

-- Policy 1: Allow authenticated users to upload QR codes
CREATE POLICY "Allow authenticated QR code uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qr-codes');

-- Policy 2: Allow public read access to QR codes (for displaying in templates)
CREATE POLICY "Allow public QR code access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'qr-codes');

-- Policy 3: Allow authenticated users to update QR codes
CREATE POLICY "Allow authenticated QR code updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'qr-codes')
WITH CHECK (bucket_id = 'qr-codes');

-- Policy 4: Allow authenticated users to delete QR codes
CREATE POLICY "Allow authenticated QR code deletions"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'qr-codes');

-- Step 5: Ensure the bucket is properly configured
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 1048576,  -- 1MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/webp'
  ]
WHERE id = 'qr-codes';

-- Step 6: Verify the policies were created successfully
SELECT 'SUCCESS: QR Code storage policies have been fixed!' as result;

-- Step 7: Show all storage policies for verification
SELECT 
  policyname,
  cmd,
  roles::text as roles,
  CASE 
    WHEN qual::text LIKE '%qr-codes%' THEN 'QR Codes Policy'
    ELSE 'Other Policy'
  END as policy_type
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND (
    qual::text LIKE '%qr-codes%' 
    OR with_check::text LIKE '%qr-codes%'
    OR policyname LIKE '%QR%'
  )
ORDER BY policyname;

-- Step 8: Show bucket configuration
SELECT 
  id as bucket_name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'qr-codes';

SELECT 'QR Code storage is now ready for uploads!' as final_result;