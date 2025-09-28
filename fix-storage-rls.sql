-- Fix Supabase Storage RLS policies for branding bucket
-- Run this in Supabase SQL Editor

-- Check current storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'branding';

-- Drop existing policies if any
DROP POLICY IF EXISTS "branding_upload_policy" ON storage.objects;
DROP POLICY IF EXISTS "branding_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "branding_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "branding_update_policy" ON storage.objects;

-- Create storage policies for branding bucket
-- Allow authenticated users who are organization members to upload files
CREATE POLICY "branding_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'branding' 
  AND auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id::text = split_part((storage.foldername(name))[1], '/', 1)
  )
);

-- Allow authenticated users who are organization members to view files
CREATE POLICY "branding_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'branding' 
  AND (
    auth.uid() IN (
      SELECT om.user_id 
      FROM public.organization_members om 
      WHERE om.organization_id::text = split_part((storage.foldername(name))[1], '/', 1)
    )
    OR bucket_id = 'branding' -- Public bucket, allow public access too
  )
);

-- Allow authenticated users who are organization members to delete files
CREATE POLICY "branding_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'branding' 
  AND auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id::text = split_part((storage.foldername(name))[1], '/', 1)
  )
);

-- Allow authenticated users who are organization members to update files
CREATE POLICY "branding_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'branding' 
  AND auth.uid() IN (
    SELECT om.user_id 
    FROM public.organization_members om 
    WHERE om.organization_id::text = split_part((storage.foldername(name))[1], '/', 1)
  )
);

-- Verify policies were created
SELECT * FROM storage.policies WHERE bucket_id = 'branding';