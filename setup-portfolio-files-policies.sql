-- Storage policies for the 'portfolio-files' bucket (as per your dashboard)
-- Run this in Supabase SQL editor once per project

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Ensure the bucket exists (id and name must match exactly)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-files', 'portfolio-files', false)
ON CONFLICT (id) DO NOTHING;

-- Basic RLS: allow authenticated users to manage only objects in this bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_files_select'
  ) THEN
    CREATE POLICY portfolio_files_select ON storage.objects
      FOR SELECT USING (bucket_id = 'portfolio-files' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_files_insert'
  ) THEN
    CREATE POLICY portfolio_files_insert ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'portfolio-files' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_files_update'
  ) THEN
    CREATE POLICY portfolio_files_update ON storage.objects
      FOR UPDATE USING (bucket_id = 'portfolio-files' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_files_delete'
  ) THEN
    CREATE POLICY portfolio_files_delete ON storage.objects
      FOR DELETE USING (bucket_id = 'portfolio-files' AND auth.role() = 'authenticated');
  END IF;
END $$;
