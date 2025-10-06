import { useCallback, useState } from 'react'

export interface CompanyProfile {
  organization_id: string
  company_name: string
  company_tagline?: string | null
  gstin?: string | null
  pan?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pin_code?: string | null
  website?: string | null
  cin?: string | null
  terms_and_conditions?: string | null
}

export interface BankingInfo {
  organization_id: string
  bank_name?: string | null
  account_number?: string | null
  ifsc_code?: string | null
}

export interface BrandingInfo {
  organization_id: string
  logo_url?: string | null
  signature_url?: string | null
  qr_code_url?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  quotation_template?: string | null
  invoice_template?: string | null
}

export interface CompanySettingsBundle {
  profile: CompanyProfile | null
  banking: BankingInfo | null
  branding: BrandingInfo | null
}

interface UpdatePayload {
  profile?: Partial<CompanyProfile>
  banking?: Partial<BankingInfo>
  branding?: Partial<BrandingInfo>
}

export function useCompanySettings() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CompanySettingsBundle | null>(null)

  const getCompanySettings = useCallback(async (orgId: string) => {
    setLoading(true)
    setError(null)
    try {
      console.log('Fetching company settings via API for orgId:', orgId)
      
      const response = await fetch(`/api/company-settings?orgId=${orgId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch company settings')
      }

      console.log('API response:', result)
      setData(result.data)
      return { data: result.data }
    } catch (e: any) {
      console.error('getCompanySettings error', e)
      setError(e.message || 'Failed to load settings')
      return { error: e.message || 'Failed to load settings' }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCompanySettings = useCallback(async (orgId: string, payload: UpdatePayload) => {
    setLoading(true)
    setError(null)
    try {
      console.log('Updating company settings via API for orgId:', orgId, 'with payload:', payload)
      
      const response = await fetch('/api/company-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          ...payload
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update company settings')
      }

      console.log('Update API response:', result)
      setData(result.data)
      return { success: true, data: result.data }
    } catch (e: any) {
      console.error('updateCompanySettings error', e)
      setError(e.message || 'Failed to update settings')
      return { error: e.message || 'Failed to update settings' }
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, getCompanySettings, updateCompanySettings }
}
