-- Fix vendor_files table column inconsistencies
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/ywcqtmzqsvcobtetunuf/sql

-- This script checks for missing columns in the vendor_files table and adds them

DO $$ 
BEGIN
  -- Check if vendor_files table exists
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'vendor_files'
  ) THEN
    -- Add uploaded_at column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vendor_files' 
      AND column_name = 'uploaded_at'
    ) THEN
      ALTER TABLE vendor_files 
      ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Added missing uploaded_at column to vendor_files table';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vendor_files' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE vendor_files 
      ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      RAISE NOTICE 'Added missing created_at column to vendor_files table';
    END IF;
    
    -- Add file_name column if it doesn't exist (in case only filename exists)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vendor_files' 
      AND column_name = 'file_name'
    ) THEN
      -- Check if filename column exists and use it to populate file_name
      IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'vendor_files' 
        AND column_name = 'filename'
      ) THEN
        ALTER TABLE vendor_files 
        ADD COLUMN file_name TEXT;
        
        UPDATE vendor_files 
        SET file_name = filename;
        
        ALTER TABLE vendor_files 
        ALTER COLUMN file_name SET NOT NULL;
        
        RAISE NOTICE 'Added file_name column to vendor_files table, populated from filename column';
      ELSE
        ALTER TABLE vendor_files 
        ADD COLUMN file_name TEXT NOT NULL DEFAULT 'unknown';
        RAISE NOTICE 'Added missing file_name column to vendor_files table';
      END IF;
    END IF;

    -- Add category column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vendor_files' 
      AND column_name = 'category'
    ) THEN
      ALTER TABLE vendor_files 
      ADD COLUMN category TEXT;
      RAISE NOTICE 'Added missing category column to vendor_files table';
    END IF;

    -- Add indexes if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'vendor_files' 
      AND indexname = 'idx_vendor_files_uploaded_at'
    ) THEN
      CREATE INDEX idx_vendor_files_uploaded_at 
      ON vendor_files(uploaded_at DESC);
      RAISE NOTICE 'Created missing uploaded_at index on vendor_files table';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename = 'vendor_files' 
      AND indexname = 'idx_vendor_files_created_at'
    ) THEN
      CREATE INDEX idx_vendor_files_created_at 
      ON vendor_files(created_at DESC);
      RAISE NOTICE 'Created missing created_at index on vendor_files table';
    END IF;

    -- If both uploaded_at and created_at exist but uploaded_at is NULL, copy values
    IF EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vendor_files' 
      AND column_name = 'uploaded_at'
    ) AND EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'vendor_files' 
      AND column_name = 'created_at'
    ) THEN
      UPDATE vendor_files
      SET uploaded_at = created_at
      WHERE uploaded_at IS NULL AND created_at IS NOT NULL;
      
      RAISE NOTICE 'Updated missing uploaded_at values with created_at values';
      
      UPDATE vendor_files
      SET created_at = uploaded_at
      WHERE created_at IS NULL AND uploaded_at IS NOT NULL;
      
      RAISE NOTICE 'Updated missing created_at values with uploaded_at values';
    END IF;

    RAISE NOTICE 'Vendor files table columns have been checked and fixed';
  ELSE
    RAISE NOTICE 'Vendor files table does not exist. Run the full creation script instead.';
  END IF;
END $$;