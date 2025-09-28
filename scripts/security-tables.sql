-- Security Settings Table
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    login_notifications BOOLEAN DEFAULT TRUE,
    session_timeout INTEGER DEFAULT 60,
    password_change_required BOOLEAN DEFAULT FALSE,
    last_password_change TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked BOOLEAN DEFAULT FALSE,
    security_questions JSONB DEFAULT '[]'::jsonb,
    trusted_devices JSONB DEFAULT '[]'::jsonb,
    login_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security Audit Logs Table
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success BOOLEAN DEFAULT TRUE
);

-- Active Sessions Table
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address INET,
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Two-Factor Authentication Table
CREATE TABLE IF NOT EXISTS two_factor_auth (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    secret_key VARCHAR(255),
    backup_codes JSONB DEFAULT '[]'::jsonb,
    enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_timestamp ON security_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;

-- Security Settings Policies
CREATE POLICY "Users can view their own security settings" ON security_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security settings" ON security_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" ON security_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Security Audit Logs Policies
CREATE POLICY "Users can view their own audit logs" ON security_audit_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own audit logs" ON security_audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Active Sessions Policies
CREATE POLICY "Users can view their own sessions" ON active_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON active_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON active_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON active_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Two-Factor Authentication Policies
CREATE POLICY "Users can view their own 2FA settings" ON two_factor_auth
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings" ON two_factor_auth
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" ON two_factor_auth
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_security_settings_updated_at BEFORE UPDATE ON security_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_two_factor_auth_updated_at BEFORE UPDATE ON two_factor_auth
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();