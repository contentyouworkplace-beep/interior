import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
)

// Basic types for our tables
export interface Client {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  address?: string
  city?: string
  country: string
  client_type: string
  budget_range?: string
  preferred_style?: string
  notes?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  client_id: string
  name: string
  description?: string
  project_type: string
  status: string
  priority: string
  budget?: number
  start_date?: string
  end_date?: string
  completion_percentage: number
  location?: string
  square_footage?: number
  style_preference?: string
  special_requirements?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  project_id?: string
  invoice_number: string
  title: string
  status: string
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  currency: string
  notes?: string
  payment_terms?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  user_id: string
  project_id?: string
  category: string
  amount: number
  description: string
  expense_date: string
  receipt_url?: string
  status: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  user_id: string
  name: string
  email: string
  phone?: string
  role: string
  specialization?: string
  hourly_rate?: number
  experience_years?: number
  portfolio_url?: string
  bio?: string
  status: string
  join_date?: string
  created_at: string
  updated_at: string
}