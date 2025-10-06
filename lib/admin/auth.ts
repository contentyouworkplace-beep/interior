import { createClient } from '@/lib/supabase/client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Admin user emails - configure these as your super admin emails
const ADMIN_EMAILS = [
  'admin@goplnr.com',
  'demo@admin.com',
  'rahul@contentyou.in', // Add your admin emails here
]

export async function isAdminUser(email?: string): Promise<boolean> {
  if (email) {
    return ADMIN_EMAILS.includes(email.toLowerCase())
  }
  
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return false
    return ADMIN_EMAILS.includes(user.email.toLowerCase())
  } catch {
    return false
  }
}

export async function isAdminUserServer(): Promise<boolean> {
  try {
    // For server-side, we'll use environment variables to create client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return false
    return ADMIN_EMAILS.includes(user.email.toLowerCase())
  } catch {
    return false
  }
}

export function requireAdmin() {
  return async function middleware() {
    const isAdmin = await isAdminUserServer()
    if (!isAdmin) {
      throw new Error('Admin access required')
    }
  }
}