-- ==========================================
-- COMPREHENSIVE RLS FIX FOR INTERIOR DESIGNER CRM
-- ==========================================

-- Disable Row Level Security globally for development
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', table_record.tablename);
        RAISE NOTICE 'Disabled RLS on table: %', table_record.tablename;
    END LOOP;
    RAISE NOTICE '✅ RLS disabled on all tables for development!';
END $$;

-- ==========================================
-- DROP AND RECREATE VENDOR TABLES WITH PROPER STRUCTURE
-- ==========================================
DO $$
BEGIN
    DROP TABLE IF EXISTS vendor_files CASCADE;
    DROP TABLE IF EXISTS vendor_quotations CASCADE;
    DROP TABLE IF EXISTS vendor_projects CASCADE;
    DROP TABLE IF EXISTS vendors CASCADE;
    
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
    
    -- Create vendor_projects table
    CREATE TABLE vendor_projects (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
        project_id UUID NOT NULL,
        role TEXT,
        start_date DATE,
        end_date DATE,
        payment_terms TEXT,
        contract_amount DECIMAL(15, 2),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Create vendor_quotations table
    CREATE TABLE vendor_quotations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
        project_id UUID,
        quotation_number TEXT,
        quotation_date DATE,
        amount DECIMAL(15, 2),
        valid_until DATE,
        status TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    RAISE NOTICE '✅ Vendor tables created successfully!';
END $$;

-- ==========================================
-- DISABLE ROW LEVEL SECURITY FOR VENDOR TABLES
-- ==========================================
ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_quotations DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE '✅ RLS disabled on vendor tables for development.';
END $$;

-- ==========================================
-- INSERT DEMO DATA WITH YOUR USER ID
-- ==========================================
INSERT INTO vendors (user_id, name, contact_person, category, email, phone, whatsapp_number, address, city, notes) VALUES
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Creative Carpenters', 'Anil Kumar', 'Carpenter', 'anil@creativecarpenters.com', '+919876543210', '+919876543210', '12 Wood Lane', 'Mumbai', 'Specializes in custom furniture.'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Bright Sparks Electric', 'Sunita Sharma', 'Electrician', 'sunita@brightsparks.com', '+919876543211', '+919876543211', '45 Power Grid Road', 'Delhi', 'All types of residential and commercial wiring.'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Perfect Plumbers', 'Rajesh Singh', 'Plumber', 'rajesh@perfectplumbers.in', '+919876543212', '+919876543212', '78 Water Works', 'Bangalore', '24/7 emergency plumbing services.'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Royal Coatings', 'Priya Patel', 'Painter', 'priya@royalcoatings.co', '+919876543213', '+919876543213', '101 Color Street', 'Chennai', 'Interior and exterior painting experts.'),
('4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6', 'Modern Flooring Co.', 'Vikram Reddy', 'Flooring', 'vikram@modernflooring.com', '+919876543214', '+919876543214', '23 Tile Avenue', 'Pune', 'Provides marble, wood, and tile flooring options.');

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

-- Create triggers for vendor_projects table
DROP TRIGGER IF EXISTS update_vendor_projects_updated_at ON vendor_projects;
CREATE TRIGGER update_vendor_projects_updated_at 
    BEFORE UPDATE ON vendor_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for vendor_quotations table
DROP TRIGGER IF EXISTS update_vendor_quotations_updated_at ON vendor_quotations;
CREATE TRIGGER update_vendor_quotations_updated_at 
    BEFORE UPDATE ON vendor_quotations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
    RAISE NOTICE '✅ "updated_at" triggers created for vendor tables.';
END $$;

-- ==========================================
-- GRANT PUBLIC ACCESS FOR DEVELOPMENT
-- ==========================================
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO authenticated;', table_record.tablename);
        RAISE NOTICE 'Granted all privileges on table: % to authenticated users', table_record.tablename;
    END LOOP;
    RAISE NOTICE '✅ All privileges granted on all tables for authenticated users!';
END $$;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
DO $$
BEGIN
    RAISE NOTICE '✅ 5 demo vendors have been added for user 4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6!';
END $$;

-- Check the data
SELECT id, user_id, name, category, contact_person, phone, email, city 
FROM vendors 
WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';