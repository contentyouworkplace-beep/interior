-- ==========================================
-- CREATE VENDOR TABLES SCHEMA
-- ==========================================
-- Run this in Supabase SQL Editor to create the necessary tables for the vendors feature.

DO $$
BEGIN
    -- Create vendors table
    CREATE TABLE vendors (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) NOT NULL,
        name TEXT NOT NULL,
        contact_person TEXT,
        category TEXT,
        email TEXT,
        phone TEXT NOT NULL,
        whatsapp_number TEXT,
        address TEXT,
        city TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create vendor_files table
    CREATE TABLE vendor_files (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type TEXT NOT NULL,
        category TEXT,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    RAISE NOTICE '✅ Vendor tables created successfully!';
END $$;

-- ==========================================
-- DISABLE ROW LEVEL SECURITY FOR DEVELOPMENT
-- ==========================================
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_files DISABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ RLS disabled on vendor tables for development.';

-- ==========================================
-- CREATE TRIGGERS FOR UPDATED_AT
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for vendors table
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at 
    BEFORE UPDATE ON vendors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for vendor_files table
DROP TRIGGER IF EXISTS update_vendor_files_updated_at ON vendor_files;
CREATE TRIGGER update_vendor_files_updated_at 
    BEFORE UPDATE ON vendor_files 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ "updated_at" triggers created for vendor tables.';

-- ==========================================
-- FINAL SUCCESS MESSAGE
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '🚀 Vendor schema setup is complete. You can now use the form to add vendors.';
END $$;
