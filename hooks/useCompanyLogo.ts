import { useCallback, useState, useEffect } from 'react'

export function useCompanyLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCompanyLogo = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/company-settings?orgId=00000000-0000-0000-0000-000000000001')
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