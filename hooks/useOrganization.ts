import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useOrganization() {
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrg() {
      setLoading(true)
      setError(null)
      try {
        const supabase = createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Not logged in')
        
        // Fetch user's organization from organization_members table
        const { data, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()
        
        if (error) throw error
        
        if (!data?.organization_id) {
          // Try to auto-create organization membership for this user
          console.log('No organization found for user, attempting auto-setup...')
          
          try {
            const response = await fetch('/api/dev/setup-auto-organization', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            
            if (response.ok) {
              // Retry fetching organization after setup
              const { data: retryData, error: retryError } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .limit(1)
                .maybeSingle()
              
              if (!retryError && retryData?.organization_id) {
                setOrgId(retryData.organization_id)
                return
              }
            }
          } catch (setupError) {
            console.log('Auto-setup failed:', setupError)
          }
          
          throw new Error('No organization found for user. Please contact support.')
        }
        
        setOrgId(data.organization_id)
        
      } catch (e: any) {
        setError(e.message || 'Failed to load organization')
        setOrgId(null)
      } finally {
        setLoading(false)
      }
    }
    fetchOrg()
  }, [])

  return { orgId, loading, error }
}
