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
  signature_url?: string
  qr_code_url?: string
  primary_color: string
  secondary_color: string
}

export interface BankingInfo {
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  branch_name?: string
  account_holder_name?: string
  swift_code?: string
  upi_id?: string
  qr_code_url?: string
}

export interface BusinessTerms {
  quotation_terms?: string
  invoice_terms?: string
  payment_terms?: string
  warranty_terms?: string
}

export interface CompanyData {
  profile: CompanyProfile | null
  branding: BrandingDetails | null
  banking: BankingInfo | null
  signatory_name?: string
  terms?: BusinessTerms
  default_template?: {
    quotation: string
    invoice: string
  }
  // Pre-embedded data URI for QR code image (base64). Optional and computed client-side
  qr_code_data_uri?: string
  // Pre-embedded data URI for logo image (base64). Optional and computed client-side
  logo_data_uri?: string
  // Pre-embedded data URI for signature image (base64). Optional and computed client-side
  signature_data_uri?: string
  // Raw base64 (no data: prefix) + format for react-pdf object source fallback
  qr_code_base64?: string
  qr_code_format?: string
  logo_base64?: string
  logo_format?: string
  signature_base64?: string
  signature_format?: string
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

      // Try to get organization ID from profile
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .maybeSingle()

      // If profile fetch fails or no organization_id, try user metadata
      let organizationId = profile?.organization_id

      if (!organizationId) {
        console.log('⚠️ No organization_id in profile, checking user metadata...')
        // Check user metadata for organization_id
        organizationId = user.user_metadata?.organization_id
      }

      if (!organizationId) {
        console.log('⚠️ No organization_id found, trying to find from company_profiles...')
        // Last resort: try to find any company_profiles entry for this user
        const { data: anyProfile } = await this.supabase
          .from('company_profiles')
          .select('organization_id')
          .limit(1)
          .maybeSingle()
        
        organizationId = anyProfile?.organization_id
      }

      if (!organizationId) {
        console.error('❌ No organization found for user')
        // Return empty data instead of error so PDF can still generate with defaults
        return {
          success: true,
          data: {
            profile: {
              company_name: '',
              company_tagline: '',
              email: '',
              phone: '',
              website: '',
              address: '',
              city: '',
              state: '',
              pin_code: '',
              gstin: '',
              pan: '',
              cin: ''
            },
            branding: {
              logo_url: '',
              signature_url: '',
              primary_color: '#3B82F6',
              secondary_color: '#1E40AF'
            },
            banking: {
              bank_name: '',
              account_number: '',
              ifsc_code: '',
              account_holder_name: '',
              branch_name: '',
              upi_id: '',
              qr_code_url: ''
            },
            signatory_name: 'Authorized Person',
            terms: {
              quotation_terms: '',
              invoice_terms: '',
              payment_terms: '',
              warranty_terms: ''
            },
            default_template: {
              quotation: 'modern',
              invoice: 'modern'
            }
          }
        }
      }

      console.log('✅ Using organization_id:', organizationId)

      // Fetch all company-related data in parallel using organization_id
      const [profileResult, brandingResult, bankingResult, businessResult] = await Promise.all([
        this.getCompanyProfile(user.id, organizationId),
        this.getBrandingDetails(user.id, organizationId),
        this.getBankingDetails(user.id, organizationId),
        this.getBusinessSettings(user.id, organizationId)
      ])

      if (!profileResult.success || !brandingResult.success || !bankingResult.success || !businessResult.success) {
        return { 
          success: false, 
          error: 'Failed to fetch company data'
        }
      }

      // Fetch user profile to get first_name and last_name for signatory
      let signatoryName = 'Authorized Person'
      try {
        const { data: userProfile } = await this.supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single()
        
        if (userProfile?.first_name && userProfile?.last_name) {
          signatoryName = `${userProfile.first_name} ${userProfile.last_name}`
        } else if (userProfile?.first_name) {
          signatoryName = userProfile.first_name
        }
      } catch (error) {
        console.error('Error fetching signatory name:', error)
      }

      const companyData: CompanyData = {
        profile: profileResult.data!,
        branding: brandingResult.data!,
        banking: bankingResult.data!,
        signatory_name: signatoryName,
        terms: businessResult.data!.terms,
        default_template: businessResult.data!.default_template
      }

      // Note: Image embedding is handled in the PDF viewer components
      // await this.embedImagesInCompanyData(companyData)

      return { success: true, data: companyData }
    } catch (error) {
      console.error('Error fetching company data:', error)
      return { success: false, error: 'Failed to fetch company data' }
    }
  }

  private async getCompanyProfile(userId: string, organizationId: string): Promise<{ success: boolean; data?: CompanyProfile; error?: string }> {
    try {
      // Try company_profiles table first (new organization-based approach)
      const { data: companyProfile, error: companyError } = await this.supabase
        .from('company_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      // Fallback to old profiles/business_settings tables
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

      // Merge data with priority: company_profiles > business_settings > profiles
      const result: CompanyProfile = {
        company_name: companyProfile?.company_name || businessSettings?.business_name || businessSettings?.company_name || profile?.company_name || '',
        company_tagline: companyProfile?.company_tagline || businessSettings?.tagline || '',
        email: companyProfile?.email || businessSettings?.business_email || businessSettings?.email || profile?.email || '',
        phone: companyProfile?.phone || businessSettings?.business_phone || businessSettings?.phone || profile?.phone || '',
        website: companyProfile?.website || businessSettings?.business_website || businessSettings?.website || '',
        // Use correct field names from company_profiles table: address, city, state, pin_code
        address: companyProfile?.address || businessSettings?.business_address || businessSettings?.address || '',
        city: companyProfile?.city || businessSettings?.city || '',
        state: companyProfile?.state || businessSettings?.state || '',
        pin_code: companyProfile?.pin_code || businessSettings?.pincode || '',
        gstin: companyProfile?.gstin || businessSettings?.gstin || '',
        pan: companyProfile?.pan || businessSettings?.pan || '',
        cin: companyProfile?.cin || businessSettings?.cin || ''
      }

      return { success: true, data: result }
    } catch (error) {
      console.error('Error fetching company profile:', error)
      return { success: false, error: 'Failed to fetch company profile' }
    }
  }

  private async getBrandingDetails(userId: string, organizationId: string): Promise<{ success: boolean; data?: BrandingDetails; error?: string }> {
    try {
      // Check branding table with organization_id first
      const { data: orgBranding, error: orgBrandingError } = await this.supabase
        .from('branding')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      // Fallback to user_id based branding
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
        logo_url: orgBranding?.logo_url || branding?.logo_url || businessSettings?.logo_url || '',
        signature_url: orgBranding?.signature_url || branding?.signature_url || '',
        qr_code_url: orgBranding?.qr_code_url || branding?.qr_code_url || '',
        primary_color: orgBranding?.primary_color || branding?.primary_color || businessSettings?.primary_color || '#3B82F6',
        secondary_color: orgBranding?.secondary_color || branding?.secondary_color || businessSettings?.secondary_color || '#1E40AF'
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

  private async getBankingDetails(userId: string, organizationId: string): Promise<{ success: boolean; data?: BankingInfo; error?: string }> {
    try {
      // Check banking_info table with organization_id first
      const { data: orgBanking, error: orgBankingError } = await this.supabase
        .from('banking_info')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      // Fallback to user_id based banking
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

      const bankingDetails: BankingInfo = {
        bank_name: orgBanking?.bank_name || banking?.bank_name || businessSettings?.bank_name || '',
        account_number: orgBanking?.account_number || banking?.account_number || businessSettings?.bank_account || '',
        ifsc_code: orgBanking?.ifsc_code || banking?.ifsc_code || businessSettings?.ifsc_code || '',
        account_holder_name: orgBanking?.account_holder_name || banking?.account_holder_name || '',
        branch_name: orgBanking?.branch_name || banking?.branch_name || '',
        upi_id: orgBanking?.upi_id || banking?.upi_id || '',
        qr_code_url: orgBanking?.qr_code_url || banking?.qr_code_url || ''
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

  private async getBusinessSettings(userId: string, organizationId: string): Promise<{ success: boolean; data?: { terms: BusinessTerms; default_template: { quotation: string; invoice: string } }; error?: string }> {
    try {
      // Try to get terms from company_profiles first
      const { data: companyProfile, error: companyError } = await this.supabase
        .from('company_profiles')
        .select('terms_and_conditions')
        .eq('organization_id', organizationId)
        .single()

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
        quotation_terms: companyProfile?.terms_and_conditions || settings?.terms_conditions || settings?.terms || defaultTerms,
        invoice_terms: companyProfile?.terms_and_conditions || settings?.terms_conditions || settings?.terms || defaultTerms,
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
      company: Partial<CompanyProfile & BrandingDetails>
      banking: Partial<BankingInfo>
      terms: Partial<BusinessTerms>
      templates: { quotation: string; invoice: string }
    }; 
    error?: string 
  }> {
    const result = await this.getCompanyData()
    
    if (!result.success || !result.data) {
      return { success: false, error: result.error || 'Failed to fetch company data' }
    }

    const { profile, branding, banking, terms, default_template } = result.data

    return {
      success: true,
      data: {
        company: {
          ...(profile || {}),
          ...(branding || {})
        },
        banking: banking || {
          bank_name: '',
          account_number: '',
          ifsc_code: '',
          account_holder_name: '',
          branch_name: '',
          upi_id: '',
          qr_code_url: ''
        },
        terms: terms || {
          quotation_terms: '',
          invoice_terms: '',
          payment_terms: '',
          warranty_terms: ''
        },
        templates: default_template || {
          quotation: 'modern',
          invoice: 'modern'
        }
      }
    }
  }
}