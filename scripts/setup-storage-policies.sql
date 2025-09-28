-- Storage policies for expense-documents bucket
-- Run this in Supabase SQL Editor

-- Enable RLS on storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload files to expense-documents bucket
-- This policy allows users to INSERT (upload) files to expense-documents bucket
CREATE POLICY "authenticated_users_can_upload_expense_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'expense-documents');

-- Allow authenticated users to view/download files from expense-documents bucket  
-- This policy allows users to SELECT (view/download) files from expense-documents bucket
CREATE POLICY "authenticated_users_can_view_expense_documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'expense-documents');

-- Allow users to update/delete their own files
-- This policy allows users to UPDATE files they own in expense-documents bucket
CREATE POLICY "users_can_update_own_expense_documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'expense-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
-- This policy allows users to DELETE files they own in expense-documents bucket
CREATE POLICY "users_can_delete_own_expense_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'expense-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Optional: Allow public read access (if you want files to be publicly viewable)
-- Uncomment the following policy if you want public read access:
-- CREATE POLICY IF NOT EXISTS "public_can_view_expense_documents"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'expense-documents');

-- Verify the bucket exists (this should already be created)
-- If not, you'll need to create it first in Supabase Dashboard > Storage

COMMENT ON POLICY "authenticated_users_can_upload_expense_documents" ON storage.objects IS 
'Allows authenticated users to upload expense documents';

COMMENT ON POLICY "authenticated_users_can_view_expense_documents" ON storage.objects IS 
'Allows authenticated users to view/download expense documents';

COMMENT ON POLICY "users_can_update_own_expense_documents" ON storage.objects IS 
'Allows users to update their own expense documents (based on folder structure userId/expenseId/)';

COMMENT ON POLICY "users_can_delete_own_expense_documents" ON storage.objects IS 
'Allows users to delete their own expense documents (based on folder structure userId/expenseId/)';