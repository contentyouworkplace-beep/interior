-- Migration: Update quotation status to use pending/approved/rejected instead of draft/sent/approved/rejected/expired
-- Date: 2025-10-05

-- Update existing records: convert old statuses to new ones
UPDATE quotations 
SET status = 'pending' 
WHERE status IN ('draft', 'sent');

-- Expired quotations become rejected
UPDATE quotations 
SET status = 'rejected' 
WHERE status = 'expired';

-- Update the default value for status column
ALTER TABLE quotations 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add a check constraint (optional - for data integrity)
-- ALTER TABLE quotations 
-- ADD CONSTRAINT quotations_status_check 
-- CHECK (status IN ('pending', 'approved', 'rejected'));

-- Note: If you want to enforce the constraint, uncomment the above lines
-- This will prevent any invalid status values from being inserted
