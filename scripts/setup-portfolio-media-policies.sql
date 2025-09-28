-- Storage policies for 'portfolio-media' bucket used by PortfolioService
-- Run in Supabase SQL editor

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create bucket if missing (id and name must match)
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-media', 'portfolio-media', false)
ON CONFLICT (id) DO NOTHING;

-- Basic policies: allow authenticated users to manage files in this bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_media_select'
  ) THEN
    CREATE POLICY portfolio_media_select ON storage.objects
      FOR SELECT USING (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_media_insert'
  ) THEN
    CREATE POLICY portfolio_media_insert ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_media_update'
  ) THEN
    CREATE POLICY portfolio_media_update ON storage.objects
      FOR UPDATE USING (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'portfolio_media_delete'
  ) THEN
    CREATE POLICY portfolio_media_delete ON storage.objects
      FOR DELETE USING (bucket_id = 'portfolio-media' AND auth.role() = 'authenticated');
  END IF;
END $$;
