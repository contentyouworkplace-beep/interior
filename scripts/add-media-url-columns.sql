-- ========================================
-- Add media_url and thumbnail_url columns to portfolio_media table
-- ========================================
-- Run this in Supabase SQL Editor to fix the "column not found" error

-- Add media_url column (stores signed URL or path to media file)
ALTER TABLE portfolio_media 
ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Add thumbnail_url column (stores signed URL or path to thumbnail)
ALTER TABLE portfolio_media 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN portfolio_media.media_url IS 'Signed URL or public path to the media file';
COMMENT ON COLUMN portfolio_media.thumbnail_url IS 'Signed URL or public path to the thumbnail';

-- ✅ Migration complete!
SELECT '✅ Successfully added media_url and thumbnail_url columns to portfolio_media table' as status;
