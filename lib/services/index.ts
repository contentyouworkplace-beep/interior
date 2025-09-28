import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

const supabase = createClient()

// Client Services
export const clientService = {
  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(client: Database['public']['Tables']['clients']['Insert']) {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Database['public']['Tables']['clients']['Update']) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Project Services
export const projectService = {
  async getAll() {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients:client_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(project: Database['public']['Tables']['projects']['Insert']) {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Database['public']['Tables']['projects']['Update']) {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Invoice Services
export const invoiceService = {
  async getAll() {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients:client_id (
          id,
          first_name,
          last_name,
          email
        ),
        projects:project_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(invoice: any) { // TODO: Replace any with generated invoices table types when added
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: any) { // TODO: Replace any with generated invoices table types when added
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Expense Services
export const expenseService = {
  async getAll() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(expense: Database['public']['Tables']['expenses']['Insert']) {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Database['public']['Tables']['expenses']['Update']) {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Team Services
export const teamService = {
  async getAll() {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async create(member: Database['public']['Tables']['team_members']['Insert']) {
    const { data, error } = await supabase
      .from('team_members')
      .insert([member])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Database['public']['Tables']['team_members']['Update']) {
    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Dashboard Services
export const dashboardService = {
  async getStats() {
    const [
      { count: clientCount },
      { count: projectCount },
      { count: invoiceCount },
      { data: recentProjects }
    ] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }),
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      supabase.from('invoices').select('*', { count: 'exact', head: true }),
      supabase.from('projects')
        .select(`
          *,
          clients:client_id (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Calculate total revenue
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid')

    const totalRevenue = invoices?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0

    return {
      clientCount: clientCount || 0,
      projectCount: projectCount || 0,
      invoiceCount: invoiceCount || 0,
      totalRevenue,
      recentProjects: recentProjects || []
    }
  }
}

// Activity Log Service
export const activityLogService = {
  async record(entry: Omit<Database['public']['Tables']['activity_log']['Insert'], 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('activity_log')
      .insert([entry])
      .select()
      .single()
    if (error) throw error
    return data
  },
  async listForProject(projectId: string) {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('entity_type', 'project')
      .eq('entity_id', projectId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw error
    return data
  }
}

// Project Assets Service
export const projectAssetsService = {
  async add(asset: Omit<Database['public']['Tables']['project_assets']['Insert'], 'id' | 'created_at' | 'updated_at' | 'version'> & { version?: number }) {
    const { data, error } = await supabase
      .from('project_assets')
      .insert([asset])
      .select()
      .single()
    if (error) throw error
    return data
  },
  async list(projectId: string) {
    const { data, error } = await supabase
      .from('project_assets')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }
}