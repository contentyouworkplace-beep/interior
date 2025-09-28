-- Storage policies for client-files bucket
-- Run this in Supabase SQL Editor

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files to client-files bucket
CREATE POLICY "Allow authenticated users to upload to client-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-files');

-- Policy to allow authenticated users to view their uploaded files
CREATE POLICY "Allow authenticated users to view client-files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-files');

-- Policy to allow authenticated users to update files they uploaded
CREATE POLICY "Allow authenticated users to update their client-files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-files')
WITH CHECK (bucket_id = 'client-files');

-- Policy to allow authenticated users to delete files they uploaded
CREATE POLICY "Allow authenticated users to delete their client-files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-files');

-- Optional: Make bucket public for reading (uncomment if needed)
-- UPDATE storage.buckets SET public = true WHERE id = 'client-files';