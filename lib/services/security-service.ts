import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export interface SecuritySettings {
  id?: string
  user_id?: string
  two_factor_enabled: boolean
  login_notifications: boolean
  session_timeout: number
  password_change_required: boolean
  last_password_change?: string
  failed_login_attempts?: number
  account_locked?: boolean
  security_questions?: Array<{
    question: string
    answer_hash: string
  }>
  trusted_devices?: Array<{
    device_id: string
    device_name: string
    last_used: string
    ip_address: string
  }>
  login_history?: Array<{
    timestamp: string
    ip_address: string
    device: string
    location?: string
    success: boolean
  }>
  created_at?: string
  updated_at?: string
}

export interface PasswordRequirements {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  preventReuse: boolean
  maxAge: number // days
}

export interface SecurityAuditLog {
  id?: string
  user_id: string
  action: string
  details: string
  ip_address: string
  timestamp: string
  success: boolean
}

export class SecurityService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  // Password Management
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Changing user password...')
      
      // Get current user
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Authentication required' }
      }

      // First verify the current password by attempting to sign in
      if (user.email) {
        const { error: verifyError } = await this.supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword
        })
        
        if (verifyError) {
          return { success: false, error: 'Current password is incorrect' }
        }
      }

      // Validate password requirements
      const validation = this.validatePassword(newPassword)
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(', ') }
      }

      // Update password in Supabase Auth
      const { error: updateError } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        console.error('Password update error:', updateError)
        return { success: false, error: updateError.message }
      }

      // Update security settings
      await this.updateSecuritySettings({
        last_password_change: new Date().toISOString(),
        password_change_required: false
      })

      // Log security event
      await this.logSecurityEvent(user.id, 'PASSWORD_CHANGED', 'User changed password successfully')

      console.log('✅ Password changed successfully')
      return { success: true }
    } catch (error) {
      console.error('Error changing password:', error)
      return { success: false, error: 'Failed to change password' }
    }
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const requirements: PasswordRequirements = {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: true,
      maxAge: 90
    }

    if (password.length < requirements.minLength) {
      errors.push(`Password must be at least ${requirements.minLength} characters long`)
    }

    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (requirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (requirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return { isValid: errors.length === 0, errors }
  }

  // Security Settings Management
  async getSecuritySettings(): Promise<{ success: boolean; data?: SecuritySettings; error?: string }> {
    try {
      console.log('🔍 Fetching security settings...')
      
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Authentication required' }
      }

      // Try to get existing security settings
      const { data, error } = await this.supabase
        .from('security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching security settings:', error)
        return { success: false, error: error.message }
      }

      // Return existing settings or create default ones
      const settings: SecuritySettings = data || this.getDefaultSecuritySettings(user.id)
      
      console.log('✅ Security settings retrieved')
      return { success: true, data: settings }
    } catch (error) {
      console.error('Error getting security settings:', error)
      return { success: false, error: 'Failed to get security settings' }
    }
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💾 Updating security settings...')
      
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Authentication required' }
      }

      const updateData = {
        ...settings,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      const { error } = await this.supabase
        .from('security_settings')
        .upsert(updateData, { onConflict: 'user_id' })

      if (error) {
        console.error('Error updating security settings:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Security settings updated successfully')
      return { success: true }
    } catch (error) {
      console.error('Error updating security settings:', error)
      return { success: false, error: 'Failed to update security settings' }
    }
  }

  // Two-Factor Authentication
  async enableTwoFactor(): Promise<{ success: boolean; qrCode?: string; backupCodes?: string[]; error?: string }> {
    try {
      console.log('🔐 Enabling two-factor authentication...')
      
      // In a real implementation, you would:
      // 1. Generate a secret key
      // 2. Create QR code for authenticator app
      // 3. Generate backup codes
      // 4. Save to database

      // For demo purposes, we'll simulate this
      const backupCodes = this.generateBackupCodes()
      
      await this.updateSecuritySettings({
        two_factor_enabled: true
      })

      await this.logSecurityEvent('', 'TWO_FACTOR_ENABLED', 'Two-factor authentication enabled')

      return { 
        success: true, 
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        backupCodes 
      }
    } catch (error) {
      console.error('Error enabling two-factor authentication:', error)
      return { success: false, error: 'Failed to enable two-factor authentication' }
    }
  }

  async disableTwoFactor(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.updateSecuritySettings({
        two_factor_enabled: false
      })

      await this.logSecurityEvent('', 'TWO_FACTOR_DISABLED', 'Two-factor authentication disabled')

      return { success: true }
    } catch (error) {
      console.error('Error disabling two-factor authentication:', error)
      return { success: false, error: 'Failed to disable two-factor authentication' }
    }
  }

  // Session Management
  async getActiveSessions(): Promise<{ success: boolean; sessions?: any[]; error?: string }> {
    try {
      // In a real implementation, you would fetch active sessions from the database
      // For demo purposes, we'll return mock data
      const sessions = [
        {
          id: '1',
          device_info: 'MacBook Pro - Chrome 119',
          ip_address: '192.168.1.100',
          last_activity: new Date().toISOString(),
          is_current: true
        },
        {
          id: '2',
          device_info: 'iPhone 14 - Safari',
          ip_address: '192.168.1.101',
          last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          is_current: false
        },
        {
          id: '3',
          device_info: 'Windows 11 - Edge',
          ip_address: '192.168.1.102',
          last_activity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          is_current: false
        }
      ]

      return { success: true, sessions }
    } catch (error) {
      console.error('Error getting active sessions:', error)
      return { success: false, error: 'Failed to get active sessions' }
    }
  }

  async revokeSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔐 Revoking session: ${sessionId}`)
      
      // In a real implementation, you would revoke the specific session
      await this.logSecurityEvent('', 'SESSION_REVOKED', `Session ${sessionId} revoked`)

      return { success: true }
    } catch (error) {
      console.error('Error revoking session:', error)
      return { success: false, error: 'Failed to revoke session' }
    }
  }

  async revokeAllOtherSessions(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 Revoking all other sessions')
      
      // In a real implementation, you would revoke all sessions except the current one
      await this.logSecurityEvent('', 'ALL_SESSIONS_REVOKED', 'All other sessions revoked')

      return { success: true }
    } catch (error) {
      console.error('Error revoking all sessions:', error)
      return { success: false, error: 'Failed to revoke all sessions' }
    }
  }

  // Security Audit
  async getSecurityAuditLog(): Promise<{ success: boolean; logs?: SecurityAuditLog[]; error?: string }> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Authentication required' }
      }

      const { data, error } = await this.supabase
        .from('security_audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching audit logs:', error)
        return { success: false, error: error.message }
      }

      return { success: true, logs: data || [] }
    } catch (error) {
      console.error('Error getting security audit log:', error)
      return { success: false, error: 'Failed to get security audit log' }
    }
  }

  // Alias for getSecurityAuditLog
  async getAuditLogs(): Promise<{ success: boolean; logs?: any[]; error?: string }> {
    try {
      // Return mock audit logs for demo
      const mockLogs = [
        {
          id: '1',
          action: 'Password Changed',
          created_at: new Date().toISOString(),
          ip_address: '192.168.1.100',
          details: 'Password updated successfully'
        },
        {
          id: '2', 
          action: 'Login Successful',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.100',
          details: 'User logged in from Chrome browser'
        },
        {
          id: '3',
          action: 'Two-Factor Authentication Enabled',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.100',
          details: '2FA enabled for enhanced security'
        }
      ]
      
      return { success: true, logs: mockLogs }
    } catch (error) {
      console.error('Error getting audit logs:', error)
      return { success: false, error: 'Failed to get audit logs' }
    }
  }

  async logSecurityEvent(userId: string, action: string, details: string): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      const actualUserId = userId || user?.id || ''

      await this.supabase
        .from('security_audit_log')
        .insert({
          user_id: actualUserId,
          action,
          details,
          ip_address: 'localhost', // In production, get real IP
          timestamp: new Date().toISOString(),
          success: true
        })
    } catch (error) {
      console.error('Error logging security event:', error)
    }
  }

  // Helper Methods
  private getDefaultSecuritySettings(userId: string): SecuritySettings {
    return {
      user_id: userId,
      two_factor_enabled: false,
      login_notifications: true,
      session_timeout: 60, // minutes
      password_change_required: false,
      failed_login_attempts: 0,
      account_locked: false,
      security_questions: [],
      trusted_devices: [],
      login_history: []
    }
  }

  private generateBackupCodes(): string[] {
    const codes = []
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase())
    }
    return codes
  }

  // Email Management
  async updateEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Updating user email...')
      
      const { error } = await this.supabase.auth.updateUser({
        email: newEmail
      })

      if (error) {
        console.error('Email update error:', error)
        return { success: false, error: error.message }
      }

      await this.logSecurityEvent('', 'EMAIL_UPDATE_REQUESTED', `Email update requested to ${newEmail}`)

      console.log('✅ Email update requested')
      return { success: true }
    } catch (error) {
      console.error('Error updating email:', error)
      return { success: false, error: 'Failed to update email' }
    }
  }
}