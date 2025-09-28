-- Add payment management columns to team_members table
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS monthly_salary DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS last_payment DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Update existing salary column to monthly_salary if it exists
UPDATE team_members 
SET monthly_salary = salary 
WHERE monthly_salary IS NULL AND salary IS NOT NULL;
