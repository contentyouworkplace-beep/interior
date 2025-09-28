import type { Database } from '@/types/supabase'
import { supabase } from '@/lib/supabase'

export type Lead = Database['public']['Tables']['leads']['Row']

type NewLead = Database['public']['Tables']['leads']['Insert']

type LeadStage = Lead['stage']

const STAGE_ORDER: LeadStage[] = ['new', 'contacted', 'quotation_sent', 'won', 'lost']

export function getNextStage(current: LeadStage): LeadStage | null {
  const idx = STAGE_ORDER.indexOf(current)
  if (idx === -1 || idx === STAGE_ORDER.length - 2) return null // cannot move past 'won'/'lost'
  const next = STAGE_ORDER[idx + 1]
  if (next === 'won' || next === 'lost') return null
  return next
}

export async function fetchLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Lead[]
}

export async function createLead(payload: Omit<NewLead, 'id' | 'created_at' | 'updated_at'>) {
  const insert: NewLead = {
    ...payload,
    stage: payload.stage || 'new',
  }
  const { data, error } = await supabase.from('leads').insert([insert]).select().single()
  if (error) throw error
  return data as Lead
}

export async function updateLead(id: string, patch: Partial<Lead>) {
  const { data, error } = await supabase.from('leads').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Lead
}

export async function advanceLeadStage(id: string) {
  const { data: current, error: fetchErr } = await supabase.from('leads').select('stage').eq('id', id).single()
  if (fetchErr) throw fetchErr
  const next = getNextStage(current.stage as LeadStage)
  if (!next) return current
  const { data, error } = await supabase.from('leads').update({ stage: next }).eq('id', id).select().single()
  if (error) throw error
  return data as Lead
}

export async function convertLeadToClient(id: string, clientId: string) {
  const { data, error } = await supabase
    .from('leads')
    .update({ stage: 'won', converted_client_id: clientId })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Lead
}

export async function deleteLead(id: string) {
  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw error
  return true
}
