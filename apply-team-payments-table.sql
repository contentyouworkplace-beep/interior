-- Create team_payments table for team member salary/payment management
-- This is separate from the client payments table

CREATE TABLE IF NOT EXISTS team_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES auth.users(id),
  team_member_id UUID NOT NULL,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('salary', 'advance', 'bonus', 'commission', 'reimbursement', 'other')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  description TEXT,
  notes TEXT,
  payment_mode VARCHAR(20) DEFAULT 'cash' CHECK (payment_mode IN ('cash', 'bank_transfer', 'cheque', 'upi', 'card')),
  reference_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE team_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for team_payments
CREATE POLICY "Users can view own team payments" ON team_payments
  FOR SELECT USING (auth.uid() = organization_id);

CREATE POLICY "Users can insert own team payments" ON team_payments
  FOR INSERT WITH CHECK (auth.uid() = organization_id);

CREATE POLICY "Users can update own team payments" ON team_payments
  FOR UPDATE USING (auth.uid() = organization_id);

CREATE POLICY "Users can delete own team payments" ON team_payments
  FOR DELETE USING (auth.uid() = organization_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_payments_org_member ON team_payments(organization_id, team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_payments_date ON team_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_team_payments_type ON team_payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_team_payments_status ON team_payments(status);

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at
CREATE TRIGGER update_team_payments_updated_at BEFORE UPDATE ON team_payments
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Verify table creation
SELECT 'team_payments table created successfully!' as message;