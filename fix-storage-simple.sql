-- Simple Storage RLS fix for branding bucket
-- Run this in Supabase SQL Editor

-- Check if RLS is enabled on storage.objects
SELECT tablename, enable_row_level_security FROM pg_tables WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop existing policies
DROP POLICY IF EXISTS "branding_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "branding_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "branding_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "branding_update_policy" ON storage.objects;

-- Create simple policies for branding bucket - allow all authenticated users
CREATE POLICY "branding_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "branding_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'branding'
);

CREATE POLICY "branding_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "branding_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'branding' 
  AND auth.uid() IS NOT NULL
);

-- Check what policies exist now
SELECT * FROM storage.policies WHERE bucket_id = 'branding';