-- IMPORTANT: Run this after running the company settings migration
-- This adds your user to the default organization so the Company tab works

INSERT INTO organization_members (organization_id, user_id) 
VALUES ('00000000-0000-0000-0000-000000000001', '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Verify the membership was created
SELECT * FROM organization_members WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';