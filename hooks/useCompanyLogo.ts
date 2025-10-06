import { useCallback, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useCompanyLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCompanyLogo = useCallback(async () => {
    setLoading(true)
    try {
      // Get current user and their organization ID
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLogoUrl(null)
        return
      }

      // Get organization ID from organization_members table
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

      const orgId = membership?.organization_id

      if (!orgId) {
        console.warn('No organization_id found for user')
        setLogoUrl(null)
        return
      }

      const response = await fetch(`/api/company-settings?orgId=${orgId}`)
      const result = await response.json()
      
      if (response.ok && result.data?.branding?.logo_url) {
        setLogoUrl(result.data.branding.logo_url)
      } else {
        setLogoUrl(null)
      }
    } catch (error) {
      console.error('Failed to fetch company logo:', error)
      setLogoUrl(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanyLogo()
  }, [fetchCompanyLogo])

  return { logoUrl, loading, refreshLogo: fetchCompanyLogo }
}