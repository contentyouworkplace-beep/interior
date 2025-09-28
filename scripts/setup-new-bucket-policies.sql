-- Script to create RLS policies for the new expense-documents-new bucket
-- Run this in the Supabase SQL Editor

-- First, drop any existing policies for the new bucket (if running this script multiple times)
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects FOR INSERT;
DROP POLICY IF EXISTS "Allow authenticated users to view their own files" ON storage.objects FOR SELECT;
DROP POLICY IF EXISTS "Allow authenticated users to update their own files" ON storage.objects FOR UPDATE;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own files" ON storage.objects FOR DELETE;

-- Create policy for file uploads (INSERT)
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'expense-documents-new' AND
  (auth.uid() = CAST(SPLIT_PART(REGEXP_REPLACE(name, '^([^/]+)/.*$', '\1'), '/', 1) AS UUID))
);

-- Create policy for file viewing (SELECT)
CREATE POLICY "Allow authenticated users to view their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'expense-documents-new' AND
  (auth.uid() = CAST(SPLIT_PART(REGEXP_REPLACE(name, '^([^/]+)/.*$', '\1'), '/', 1) AS UUID))
);

-- Create policy for file updates (UPDATE)
CREATE POLICY "Allow authenticated users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'expense-documents-new' AND
  (auth.uid() = CAST(SPLIT_PART(REGEXP_REPLACE(name, '^([^/]+)/.*$', '\1'), '/', 1) AS UUID))
);

-- Create policy for file deletions (DELETE)
CREATE POLICY "Allow authenticated users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'expense-documents-new' AND
  (auth.uid() = CAST(SPLIT_PART(REGEXP_REPLACE(name, '^([^/]+)/.*$', '\1'), '/', 1) AS UUID))
);

-- Verify the policies
SELECT policy, definition, roles, operation
FROM storage.policies
WHERE policy LIKE '%authenticated users%' AND definition::text LIKE '%expense-documents-new%';