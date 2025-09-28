-- Portfolio Storage Policies
-- Run this in Supabase SQL Editor after creating storage buckets

-- Storage policies for portfolio-files bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-files',
  'portfolio-files',
  false,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/avi',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio-thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-thumbnails', 
  'portfolio-thumbnails',
  true, -- Public for faster loading
  5242880, -- 5MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/webp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies for portfolio-files bucket

-- Allow users to view portfolio files from their organization or public portfolios
CREATE POLICY "Users can view portfolio files from accessible portfolios"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'portfolio-files' AND
  (
    -- Check if user owns the portfolio or is in the same organization
    EXISTS (
      SELECT 1 FROM portfolio_files pf
      JOIN portfolios p ON pf.portfolio_id = p.id
      WHERE pf.storage_path = name AND (
        p.user_id = auth.uid() OR
        p.organization_id IN (
          SELECT organization_id FROM team_members 
          WHERE user_id = auth.uid()
        ) OR
        p.is_public = true
      )
    )
  )
);

-- Allow users to upload files for portfolios in their organization
CREATE POLICY "Users can upload portfolio files for accessible portfolios"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-files' AND
  auth.uid() IS NOT NULL
  -- Additional checks will be handled at application level
);

-- Allow users to update files for portfolios in their organization
CREATE POLICY "Users can update portfolio files for accessible portfolios"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio-files' AND
  EXISTS (
    SELECT 1 FROM portfolio_files pf
    JOIN portfolios p ON pf.portfolio_id = p.id
    WHERE pf.storage_path = name AND (
      p.user_id = auth.uid() OR
      p.organization_id IN (
        SELECT organization_id FROM team_members 
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- Allow users to delete files for portfolios in their organization
CREATE POLICY "Users can delete portfolio files for accessible portfolios"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio-files' AND
  EXISTS (
    SELECT 1 FROM portfolio_files pf
    JOIN portfolios p ON pf.portfolio_id = p.id
    WHERE pf.storage_path = name AND (
      p.user_id = auth.uid() OR
      p.organization_id IN (
        SELECT organization_id FROM team_members 
        WHERE user_id = auth.uid()
      )
    )
  )
);

-- RLS Policies for portfolio-thumbnails bucket (more permissive since it's public)

-- Anyone can view thumbnails (public bucket)
CREATE POLICY "Anyone can view portfolio thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-thumbnails');

-- Allow authenticated users to upload thumbnails
CREATE POLICY "Authenticated users can upload portfolio thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio-thumbnails' AND
  auth.uid() IS NOT NULL
);

-- Allow users to update thumbnails for their portfolios
CREATE POLICY "Users can update portfolio thumbnails for accessible portfolios"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio-thumbnails' AND
  auth.uid() IS NOT NULL
);

-- Allow users to delete thumbnails for their portfolios
CREATE POLICY "Users can delete portfolio thumbnails for accessible portfolios"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio-thumbnails' AND
  auth.uid() IS NOT NULL
);