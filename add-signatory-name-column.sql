-- Add authorized_signatory_name column to company_profiles table
ALTER TABLE company_profiles 
ADD COLUMN IF NOT EXISTS authorized_signatory_name VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN company_profiles.authorized_signatory_name IS 'Name of the authorized person who signs documents and quotations';
