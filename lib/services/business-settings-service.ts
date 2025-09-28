import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export interface BusinessSettings {
  id?: string
  user_id?: string
  company_name: string
  tagline?: string
  logo_url?: string
  address: string
  city: string
  state: string
  pincode: string
  country: string
  phone: string
  email: string
  website?: string
  gstin: string
  pan: string
  cin?: string
  bank_name?: string
  bank_account: string
  ifsc_code: string
  primary_color: string
  secondary_color: string
  quotation_template: string
  invoice_template: string
  signature_url?: string
  terms: string
  created_at?: string
  updated_at?: string
}

export class BusinessSettingsService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  async getBusinessSettings(): Promise<{ success: boolean; data?: BusinessSettings; error?: string }> {
    try {
      console.log('🔍 Fetching business settings...')
      
      // Get current user
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError) {
        console.error('Authentication error:', authError)
        return { success: false, error: 'Authentication failed. Please log in again.' }
      }

      if (!user) {
        // Return default settings for non-authenticated users (fallback)
        console.warn('No authenticated user found, returning default settings')
        return { success: true, data: this.getDefaultSettings() }
      }

      console.log('✅ User authenticated:', user.email)

      // Fetch from Supabase database
      const { data, error } = await this.supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching business settings:', error)
        return { success: false, error: `Database error: ${error.message}` }
      }

      // If no data found, return default settings
      if (!data) {
        console.log('No existing settings found, returning defaults')
        return { success: true, data: this.getDefaultSettings() }
      }

      console.log('✅ Business settings loaded successfully')
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching business settings:', error)
      return { success: false, error: 'Failed to fetch business settings' }
    }
  }

  async saveBusinessSettings(settings: BusinessSettings): Promise<{ success: boolean; data?: BusinessSettings; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError) {
        console.error('Authentication error:', authError)
        return { success: false, error: 'Authentication failed' }
      }

      if (!user) {
        console.warn('No authenticated user found, cannot save settings')
        return { success: false, error: 'Please log in to save settings' }
      }

      // Prepare data for upsert
      const settingsData = {
        ...settings,
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      console.log('Attempting to save business settings:', settingsData)

      // Upsert to Supabase database
      const { data, error } = await this.supabase
        .from('business_settings')
        .upsert(settingsData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        console.error('Error saving business settings:', error)
        return { success: false, error: `Database error: ${error.message}` }
      }

      console.log('Business settings saved successfully:', data)
      return { success: true, data }
    } catch (error) {
      console.error('Error saving business settings:', error)
      return { success: false, error: 'Failed to save business settings' }
    }
  }

  private getDefaultSettings(): BusinessSettings {
    return {
      company_name: "",
      tagline: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      phone: "",
      email: "",
      website: "",
      gstin: "",
      pan: "",
      cin: "",
      bank_name: "",
      bank_account: "",
      ifsc_code: "",
      primary_color: "#3B82F6",
      secondary_color: "#1E40AF",
      quotation_template: "modern",
      invoice_template: "modern",
      terms: `1. Payment terms: 30 days from invoice date
2. GST will be charged as applicable
3. All disputes subject to local jurisdiction
4. Prices are valid for 30 days from quotation date
5. 50% advance required to commence work`
    }
  }

  async uploadFile(file: File, folder: 'logos' | 'signatures'): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError) {
        console.error('Authentication error:', authError)
        return { success: false, error: 'Authentication failed' }
      }

      if (!user) {
        console.warn('No authenticated user found, cannot upload file')
        return { success: false, error: 'Please log in to upload files' }
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Invalid file type. Please upload an image.' }
      }

      // Validate file size (2MB for logos, 1MB for signatures)
      const maxSize = folder === 'logos' ? 2 * 1024 * 1024 : 1 * 1024 * 1024
      if (file.size > maxSize) {
        const maxSizeMB = folder === 'logos' ? '2MB' : '1MB'
        return { success: false, error: `File too large. Maximum size is ${maxSizeMB}.` }
      }

      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${folder}/${Date.now()}.${fileExt}`

      console.log('Uploading file:', fileName, 'Size:', file.size, 'Type:', file.type)

      // Upload to Supabase storage
      const { data, error } = await this.supabase.storage
        .from('business-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (error) {
        console.error('Error uploading file:', error)
        return { success: false, error: `Upload failed: ${error.message}` }
      }

      console.log('File uploaded successfully:', data)

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('business-assets')
        .getPublicUrl(fileName)

      console.log('Public URL generated:', publicUrl)
      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Error uploading file:', error)
      return { success: false, error: 'Failed to upload file' }
    }
  }

  validateGSTIN(gstin: string): boolean {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstinRegex.test(gstin)
  }

  validatePAN(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    return panRegex.test(pan)
  }

  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  async ensureStorageBucketExists(): Promise<{ success: boolean; error?: string }> {
    try {
      // Note: With anon key, we can't list all buckets for security reasons
      // The bucket exists if we can interact with it, so we'll try a test operation
      
      // Try to get bucket info by attempting to list files (will work if bucket exists)
      const { data, error } = await this.supabase.storage
        .from('business-assets')
        .list('', { limit: 1 })

      if (error && error.message.includes('not found')) {
        return { 
          success: false, 
          error: 'business-assets bucket not found. Please create it manually in Supabase Dashboard.' 
        }
      }

      // If no error or other error, assume bucket exists
      return { success: true }
    } catch (error) {
      console.error('Error checking storage bucket:', error)
      // Don't fail the entire operation for storage issues
      return { success: true }
    }
  }

  async validateBusinessSettings(settings: Partial<BusinessSettings>): Promise<{ isValid: boolean; errors: Record<string, string> }> {
    const errors: Record<string, string> = {}

    // Relaxed validation: company_name is optional; other fields are format-checked if present.

    if (settings.pincode && !/^[1-9][0-9]{5}$/.test(settings.pincode)) {
      errors.pincode = 'Invalid PIN code format'
    }

    if (settings.phone && !/^[\+]?[1-9][\d]{3,14}$/.test(settings.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.phone = 'Invalid phone number format'
    }

    if (settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) {
      errors.email = 'Invalid email format'
    }

    // Business identifier validation
    if (settings.gstin && !this.validateGSTIN(settings.gstin)) {
      errors.gstin = 'Invalid GSTIN format'
    }

    if (settings.pan && !this.validatePAN(settings.pan)) {
      errors.pan = 'Invalid PAN format'
    }

    if (settings.website && !/^https?:\/\/.+/.test(settings.website)) {
      errors.website = 'Website must start with http:// or https://'
    }

    // Banking validation if provided
    if (settings.ifsc_code && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(settings.ifsc_code)) {
      errors.ifsc_code = 'Invalid IFSC code format'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}