-- CORRECTED Storage Policies for portfolio-media bucket
-- Run this in Supabase SQL Editor instead

-- First, ensure the bucket exists (this should work)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('portfolio-media', 'portfolio-media', false, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Create storage policies using the correct Supabase approach
-- These policies are created on storage.objects but using Supabase's policy helpers

-- Policy for SELECT (viewing/downloading files)
CREATE POLICY "Allow authenticated users to view portfolio media" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'portfolio-media' 
  AND auth.role() = 'authenticated'
);

-- Policy for INSERT (uploading files)  
CREATE POLICY "Allow authenticated users to upload portfolio media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-media'
  AND auth.role() = 'authenticated'
);

-- Policy for UPDATE (updating file metadata)
CREATE POLICY "Allow authenticated users to update portfolio media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio-media'
  AND auth.role() = 'authenticated'
);

-- Policy for DELETE (removing files)
CREATE POLICY "Allow authenticated users to delete portfolio media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio-media'
  AND auth.role() = 'authenticated'
);