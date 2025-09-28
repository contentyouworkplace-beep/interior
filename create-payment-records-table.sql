-- Create payment_records table
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('monthly_salary', 'freelance_payment', 'advance', 'bonus')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_records_team_member_id ON payment_records(team_member_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_type ON payment_records(payment_type);

-- Enable RLS (Row Level Security)
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for payment_records
DROP POLICY IF EXISTS "Users can only see their own payment records" ON payment_records;
CREATE POLICY "Users can only see their own payment records" ON payment_records
  FOR ALL USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payment_records_updated_at ON payment_records;
CREATE TRIGGER update_payment_records_updated_at 
  BEFORE UPDATE ON payment_records 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();