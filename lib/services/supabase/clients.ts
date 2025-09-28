import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

export type ClientRow = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

const table = 'clients'

export async function listClients() {
  const supabase = createClient()
  return supabase.from(table).select('*').order('created_at', { ascending: false })
}

export async function createClientRow(payload: ClientInsert) {
  const supabase = createClient()
  
  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: new Error('Authentication required') }
  }

  // Add user_id to the payload
  const clientData = {
    ...payload,
    user_id: user.id
  }

  return supabase.from(table).insert(clientData).select().single()
}

export async function updateClient(id: string, patch: ClientUpdate) {
  const supabase = createClient()
  return supabase.from(table).update(patch).eq('id', id).select().single()
}

export async function deleteClient(id: string) {
  const supabase = createClient()
  return supabase.from(table).delete().eq('id', id)
}
