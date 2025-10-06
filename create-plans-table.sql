-- Create plans table for subscription management
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    duration_days INTEGER DEFAULT 30,
    features JSONB DEFAULT '[]'::jsonb,
    max_projects INTEGER DEFAULT 10,
    max_users INTEGER DEFAULT 1,
    support_level VARCHAR(50) DEFAULT 'email',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on plan name
ALTER TABLE plans ADD CONSTRAINT unique_plan_name UNIQUE (name);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_plans_active ON plans (is_active);
CREATE INDEX IF NOT EXISTS idx_plans_price ON plans (price);

-- Insert default plans
INSERT INTO plans (name, description, price, duration_days, features, max_projects, max_users, support_level, is_active) VALUES
('Basic Plan', 'Perfect for small interior design businesses', 999, 30, '["Project Management", "Client Portal", "Basic Templates", "Email Support"]', 10, 1, 'email', true),
('Pro Plan', 'Ideal for growing design firms', 2499, 30, '["Unlimited Projects", "Team Collaboration", "Advanced Templates", "Priority Support", "Custom Branding"]', -1, 5, 'priority', true),
('Enterprise Plan', 'Complete solution for large design companies', 4999, 30, '["Everything in Pro", "Unlimited Users", "API Access", "Custom Integrations", "Dedicated Support", "White Label"]', -1, -1, 'dedicated', true);

-- Update subscriptions table to reference plans
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions (plan_id);

-- RLS policies for plans table
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Admin can manage plans
CREATE POLICY "Admins can manage plans" ON plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email = 'admin@interior.com'
        )
    );

-- Users can view active plans
CREATE POLICY "Users can view active plans" ON plans
    FOR SELECT USING (is_active = true);

COMMENT ON TABLE plans IS 'Subscription plans for the interior design CRM';
COMMENT ON COLUMN plans.price IS 'Price in rupees (₹)';
COMMENT ON COLUMN plans.duration_days IS 'Plan duration in days';
COMMENT ON COLUMN plans.features IS 'JSON array of plan features';
COMMENT ON COLUMN plans.max_projects IS 'Maximum projects allowed (-1 for unlimited)';
COMMENT ON COLUMN plans.max_users IS 'Maximum users allowed (-1 for unlimited)';
COMMENT ON COLUMN plans.support_level IS 'Level of support (email, priority, dedicated, 24/7)';