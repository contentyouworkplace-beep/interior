-- Create client_files table for file management
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/ywcqtmzqsvcobtetunuf/sql

CREATE TABLE IF NOT EXISTS client_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('document', 'image', 'spreadsheet', 'other')),
  description TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE client_files ENABLE ROW LEVEL SECURITY;

-- Create policies for client_files table
CREATE POLICY "Users can view client files" ON client_files
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert client files" ON client_files
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update client files" ON client_files
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete client files" ON client_files
  FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_files_client_id ON client_files(client_id);
CREATE INDEX IF NOT EXISTS idx_client_files_user_id ON client_files(user_id);
CREATE INDEX IF NOT EXISTS idx_client_files_created_at ON client_files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_files_category ON client_files(category);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_client_files_updated_at 
    BEFORE UPDATE ON client_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();