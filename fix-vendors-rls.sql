-- Fix vendors table permissions
-- Run this in Supabase SQL Editor

-- First, ensure the vendors table exists with the correct structure
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  category TEXT NOT NULL,
  gstin TEXT,
  rating DECIMAL(2,1) DEFAULT 5.0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can view own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can insert own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can update own vendors" ON vendors;
DROP POLICY IF EXISTS "Users can delete own vendors" ON vendors;

-- Create comprehensive RLS policies for vendors
CREATE POLICY "Users can view own vendors" ON vendors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own vendors" ON vendors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own vendors" ON vendors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own vendors" ON vendors FOR DELETE USING (auth.uid() = user_id);

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Test the setup by checking policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vendors';