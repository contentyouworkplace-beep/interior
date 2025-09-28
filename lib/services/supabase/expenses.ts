import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()

export async function addExpense(expense: Omit<Database['public']['Tables']['expenses']['Insert'], 'id' | 'created_at' | 'updated_at'>) {
  return supabase.from('expenses').insert([expense]).select()
}

export async function listExpensesByProject(projectId: string) {
  return supabase.from('expenses').select('*').eq('project_id', projectId)
}

export async function getProjectExpensesTotal(projectId: string) {
  const { data, error } = await supabase.from('expenses').select('amount').eq('project_id', projectId)
  if (error || !data) return 0
  return data.reduce((sum, e) => sum + (e.amount || 0), 0)
}
