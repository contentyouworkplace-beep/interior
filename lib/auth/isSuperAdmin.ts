import { createClient } from '@/lib/supabase/server'

// Server-side check: queries platform_admins via RLS policy allowing super admins
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // quick app_metadata fallback if you add { role: 'super_admin' }
  const metaRole = (user.app_metadata as any)?.role
  if (metaRole === 'super_admin') return true

  // authoritative check via table
  const { data, error } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return false
  return !!data
}
