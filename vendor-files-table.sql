-- Create vendor_files table for file management
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/ywcqtmzqsvcobtetunuf/sql

-- First check if the table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'vendor_files'
  ) THEN
    -- Create vendor_files table
    CREATE TABLE vendor_files (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      vendor_id UUID NOT NULL,
      file_name TEXT NOT NULL, 
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      description TEXT,
      category TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create foreign key constraint if vendors table exists
    IF EXISTS (
      SELECT FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'vendors'
    ) THEN
      ALTER TABLE vendor_files 
      ADD CONSTRAINT fk_vendor_files_vendor_id 
      FOREIGN KEY (vendor_id) 
      REFERENCES vendors(id) 
      ON DELETE CASCADE;
    END IF;

    -- Enable Row Level Security
    ALTER TABLE vendor_files ENABLE ROW LEVEL SECURITY;

    -- Create policies for vendor_files table
    CREATE POLICY "Users can view vendor files" ON vendor_files
      FOR SELECT USING (auth.role() = 'authenticated');

    CREATE POLICY "Users can insert vendor files" ON vendor_files
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Users can update vendor files" ON vendor_files
      FOR UPDATE USING (auth.role() = 'authenticated');

    CREATE POLICY "Users can delete vendor files" ON vendor_files
      FOR DELETE USING (auth.role() = 'authenticated');

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_vendor_files_vendor_id ON vendor_files(vendor_id);
    CREATE INDEX IF NOT EXISTS idx_vendor_files_created_at ON vendor_files(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_vendor_files_uploaded_at ON vendor_files(uploaded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_vendor_files_file_type ON vendor_files(file_type);

    -- Create updated_at trigger
    IF NOT EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    END IF;

    -- Create trigger for updated_at
    CREATE TRIGGER update_vendor_files_updated_at 
    BEFORE UPDATE ON vendor_files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    -- Success message
    RAISE NOTICE 'Vendor files table created successfully';
  ELSE
    RAISE NOTICE 'Vendor files table already exists, no changes made';
  END IF;
END $$;

-- For checking that the table was created successfully
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'vendor_files'
) AS vendor_files_table_exists;

-- For checking RLS policies on the table
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'vendor_files';