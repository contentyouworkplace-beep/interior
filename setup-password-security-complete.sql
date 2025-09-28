-- ==========================================
-- PASSWORD CHANGE TESTING SETUP
-- ==========================================
-- Execute this COMPLETE script in your Supabase SQL Editor

-- Step 1: Ensure RLS policies are set up for security_settings table
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT false,
    login_notifications BOOLEAN DEFAULT true,
    session_timeout INTEGER DEFAULT 3600,
    password_change_required BOOLEAN DEFAULT false,
    last_password_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT false,
    security_questions JSONB,
    trusted_devices JSONB DEFAULT '[]'::jsonb,
    login_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on security_settings
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own security settings" ON security_settings;
DROP POLICY IF EXISTS "Users can insert own security settings" ON security_settings;
DROP POLICY IF EXISTS "Users can update own security settings" ON security_settings;

-- Create RLS policies for security_settings
CREATE POLICY "Users can view own security settings" 
ON security_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security settings" 
ON security_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own security settings" 
ON security_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Step 2: Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT true
);

-- Enable RLS on security_audit_log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_audit_log
DROP POLICY IF EXISTS "Users can view own audit logs" ON security_audit_log;
CREATE POLICY "Users can view own audit logs" 
ON security_audit_log FOR SELECT 
USING (auth.uid() = user_id);

-- Step 3: Insert/Update demo user security settings
INSERT INTO security_settings (
  user_id,
  two_factor_enabled,
  login_notifications,
  session_timeout,
  password_change_required,
  last_password_change,
  failed_login_attempts,
  account_locked,
  created_at,
  updated_at
) VALUES (
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
  false,
  true,
  3600,
  false,
  NOW(),
  0,
  false,
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  two_factor_enabled = EXCLUDED.two_factor_enabled,
  login_notifications = EXCLUDED.login_notifications,
  session_timeout = EXCLUDED.session_timeout,
  password_change_required = EXCLUDED.password_change_required,
  last_password_change = EXCLUDED.last_password_change,
  updated_at = NOW();

-- Step 4: Create function to update security settings easily
CREATE OR REPLACE FUNCTION update_security_settings(
  p_user_id UUID,
  p_last_password_change TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_password_change_required BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE security_settings 
  SET 
    last_password_change = COALESCE(p_last_password_change, last_password_change),
    password_change_required = COALESCE(p_password_change_required, password_change_required),
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_action VARCHAR(100),
  p_details TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_success BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    action,
    details,
    ip_address,
    success,
    timestamp
  ) VALUES (
    p_user_id,
    p_action,
    p_details,
    p_ip_address,
    p_success,
    NOW()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Verify everything is set up correctly
SELECT 'Security Settings Table:' as check_type;
SELECT * FROM security_settings WHERE user_id = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';

SELECT 'RLS Policies for security_settings:' as check_type;
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'security_settings';

SELECT 'Test Functions Created:' as check_type;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('update_security_settings', 'log_security_event');

-- Step 7: Test the security functions
SELECT 'Testing Security Functions:' as check_type;
SELECT update_security_settings(
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'::UUID,
  NOW(),
  false
);

SELECT log_security_event(
  '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'::UUID,
  'TEST_EVENT',
  'Testing security logging system'
);