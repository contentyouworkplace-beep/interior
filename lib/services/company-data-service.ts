import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export interface CompanyProfile {
  id?: string
  company_name: string
  company_tagline?: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  pin_code?: string
  gstin?: string
  pan?: string
  cin?: string
}

export interface BrandingDetails {
  id?: string
  logo_url?: string
  primary_color: string
  secondary_color: string
}

export interface BankingDetails {
  id?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  account_holder_name?: string
  branch_name?: string
}

export interface BusinessTerms {
  quotation_terms?: string
  invoice_terms?: string
  payment_terms?: string
  warranty_terms?: string
}

export interface CompanyData {
  profile: CompanyProfile
  branding: BrandingDetails
  banking: BankingDetails
  terms: BusinessTerms
  default_template: {
    quotation: string
    invoice: string
  }
}

export class CompanyDataService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  async getCompanyData(): Promise<{ success: boolean; data?: CompanyData; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !user) {
        return { success: false, error: 'Authentication required' }
      }

      // Fetch all company-related data in parallel
      const [profileResult, brandingResult, bankingResult, businessResult] = await Promise.all([
        this.getCompanyProfile(user.id),
        this.getBrandingDetails(user.id),
        this.getBankingDetails(user.id),
        this.getBusinessSettings(user.id)
      ])

      if (!profileResult.success || !brandingResult.success || !bankingResult.success || !businessResult.success) {
        return { 
          success: false, 
          error: 'Failed to fetch company data'
        }
      }

      const companyData: CompanyData = {
        profile: profileResult.data!,
        branding: brandingResult.data!,
        banking: bankingResult.data!,
        terms: businessResult.data!.terms,
        default_template: businessResult.data!.default_template
      }

      return { success: true, data: companyData }
    } catch (error) {
      console.error('Error fetching company data:', error)
      return { success: false, error: 'Failed to fetch company data' }
    }
  }

  private async getCompanyProfile(userId: string): Promise<{ success: boolean; data?: CompanyProfile; error?: string }> {
    try {
      // Try both profiles and business_settings tables for company data
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const { data: businessSettings, error: businessError } = await this.supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Merge data from both sources
      const companyProfile: CompanyProfile = {
        company_name: profile?.company_name || businessSettings?.business_name || businessSettings?.company_name || 'Your Company',
        company_tagline: businessSettings?.tagline || '',
        email: businessSettings?.business_email || businessSettings?.email || profile?.email || '',
        phone: businessSettings?.business_phone || businessSettings?.phone || profile?.phone || '',
        website: businessSettings?.business_website || businessSettings?.website || '',
        address: businessSettings?.business_address || businessSettings?.address || '',
        city: businessSettings?.city || '',
        state: businessSettings?.state || '',
        pin_code: businessSettings?.pincode || '',
        gstin: businessSettings?.gstin || '',
        pan: businessSettings?.pan || '',
        cin: businessSettings?.cin || ''
      }

      return { success: true, data: companyProfile }
    } catch (error) {
      console.error('Error fetching company profile:', error)
      return { success: false, error: 'Failed to fetch company profile' }
    }
  }

  private async getBrandingDetails(userId: string): Promise<{ success: boolean; data?: BrandingDetails; error?: string }> {
    try {
      // Check branding table first, then business_settings as fallback
      const { data: branding, error: brandingError } = await this.supabase
        .from('branding')
        .select('*')
        .eq('user_id', userId)
        .single()

      const { data: businessSettings, error: businessError } = await this.supabase
        .from('business_settings')
        .select('logo_url, primary_color, secondary_color')
        .eq('user_id', userId)
        .single()

      const brandingDetails: BrandingDetails = {
        logo_url: branding?.logo_url || businessSettings?.logo_url || '',
        primary_color: branding?.primary_color || businessSettings?.primary_color || '#3B82F6',
        secondary_color: branding?.secondary_color || businessSettings?.secondary_color || '#1E40AF'
      }

      return { success: true, data: brandingDetails }
    } catch (error) {
      console.error('Error fetching branding details:', error)
      return { 
        success: true, 
        data: {
          logo_url: '',
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF'
        }
      }
    }
  }

  private async getBankingDetails(userId: string): Promise<{ success: boolean; data?: BankingDetails; error?: string }> {
    try {
      // Check banking_info table first, then business_settings as fallback
      const { data: banking, error: bankingError } = await this.supabase
        .from('banking_info')
        .select('*')
        .eq('user_id', userId)
        .single()

      const { data: businessSettings, error: businessError } = await this.supabase
        .from('business_settings')
        .select('bank_name, bank_account, ifsc_code')
        .eq('user_id', userId)
        .single()

      const bankingDetails: BankingDetails = {
        bank_name: banking?.bank_name || businessSettings?.bank_name || '',
        account_number: banking?.account_number || businessSettings?.bank_account || '',
        ifsc_code: banking?.ifsc_code || businessSettings?.ifsc_code || '',
        account_holder_name: banking?.account_holder_name || '',
        branch_name: banking?.branch_name || ''
      }

      return { success: true, data: bankingDetails }
    } catch (error) {
      console.error('Error fetching banking details:', error)
      return { 
        success: true, 
        data: {
          bank_name: '',
          account_number: '',
          ifsc_code: '',
          account_holder_name: '',
          branch_name: ''
        }
      }
    }
  }

  private async getBusinessSettings(userId: string): Promise<{ success: boolean; data?: { terms: BusinessTerms; default_template: { quotation: string; invoice: string } }; error?: string }> {
    try {
      const { data: settings, error } = await this.supabase
        .from('business_settings')
        .select('terms_conditions, terms, quotation_template, invoice_template')
        .eq('user_id', userId)
        .single()

      const defaultTerms = `1. Payment terms: 30 days from invoice date
2. GST will be charged as applicable
3. All disputes subject to local jurisdiction
4. Prices are valid for 30 days from quotation date
5. 50% advance required to commence work`

      const terms: BusinessTerms = {
        quotation_terms: settings?.terms_conditions || settings?.terms || defaultTerms,
        invoice_terms: settings?.terms_conditions || settings?.terms || defaultTerms,
        payment_terms: 'Payment due within 30 days of invoice date',
        warranty_terms: '1 year warranty on all work'
      }

      const default_template = {
        quotation: settings?.quotation_template || 'modern',
        invoice: settings?.invoice_template || 'modern'
      }

      return { 
        success: true, 
        data: { terms, default_template }
      }
    } catch (error) {
      console.error('Error fetching business settings:', error)
      return { 
        success: true, 
        data: {
          terms: {
            quotation_terms: `1. Payment terms: 30 days from invoice date
2. GST will be charged as applicable
3. All disputes subject to local jurisdiction
4. Prices are valid for 30 days from quotation date
5. 50% advance required to commence work`,
            invoice_terms: `1. Payment due within 30 days
2. GST included as applicable
3. Late payment charges may apply`,
            payment_terms: 'Payment due within 30 days of invoice date',
            warranty_terms: '1 year warranty on all work'
          },
          default_template: {
            quotation: 'modern',
            invoice: 'modern'
          }
        }
      }
    }
  }

  // Helper method for quotation/invoice generation
  async getFormattedCompanyData(): Promise<{ 
    success: boolean; 
    data?: {
      company: CompanyProfile & BrandingDetails
      banking: BankingDetails
      terms: BusinessTerms
      templates: { quotation: string; invoice: string }
    }; 
    error?: string 
  }> {
    const result = await this.getCompanyData()
    
    if (!result.success) {
      return result
    }

    const { profile, branding, banking, terms, default_template } = result.data!

    return {
      success: true,
      data: {
        company: {
          ...profile,
          ...branding
        },
        banking,
        terms,
        templates: default_template
      }
    }
  }
}