import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()

export async function addPayment(payment: Omit<Database['public']['Tables']['payments']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
  return supabase.from('payments').insert([payment]).select()
}

export async function listPaymentsByProject(projectId: string) {
  return supabase.from('payments').select('*').eq('project_id', projectId)
}

export async function getProjectPaymentsTotal(projectId: string) {
  const { data, error } = await supabase.from('payments').select('amount').eq('project_id', projectId)
  if (error || !data) return 0
  return data.reduce((sum, p) => sum + (p.amount || 0), 0)
}
