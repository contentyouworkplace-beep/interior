-- ==========================================
-- DELETE ALL VENDOR-RELATED TABLES
-- ==========================================
-- Run this in Supabase SQL Editor to completely remove all vendor tables and data.

-- Drop all vendor-related tables. The CASCADE option will handle dependencies.
DROP TABLE IF EXISTS vendor_files CASCADE;
DROP TABLE IF EXISTS vendor_quotations CASCADE;
DROP TABLE IF EXISTS vendor_projects CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '✅ All vendor-related tables have been successfully deleted.';
    RAISE NOTICE '🚀 You can now restart the vendor setup process.';
END $$;
