-- Create team_payments table for team member payments
-- Separate from the main payments table which is for invoices/clients

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

-- Create RLS policies for team_payments
ALTER TABLE team_payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own team payments
CREATE POLICY "Users can view own team payments" ON team_payments
    FOR SELECT USING (auth.uid() = organization_id);

-- Policy: Users can insert their own team payments  
CREATE POLICY "Users can insert own team payments" ON team_payments
    FOR INSERT WITH CHECK (auth.uid() = organization_id);

-- Policy: Users can update their own team payments
CREATE POLICY "Users can update own team payments" ON team_payments
    FOR UPDATE USING (auth.uid() = organization_id);

-- Policy: Users can delete their own team payments
CREATE POLICY "Users can delete own team payments" ON team_payments
    FOR DELETE USING (auth.uid() = organization_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_team_payments_org_member ON team_payments(organization_id, team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_payments_date ON team_payments(payment_date DESC);