import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

export interface Quotation {
  id: string
  user_id: string
  client_id: string
  project_id?: string
  quotation_number: string
  title: string
  status: 'pending' | 'approved' | 'rejected'
  issue_date: string
  valid_until: string
  subtotal: number
  gst_type: 'cgst_sgst' | 'igst' | 'none'
  gstin?: string
  pan?: string
  hsn_sac_code?: string
  tax_rate: number
  tax_amount: number
  total_amount: number
  discount_type?: 'percent' | 'flat'
  discount_value?: number
  currency: string
  notes?: string
  terms?: string
  logo_url?: string
  signature_url?: string
  template: string
  created_at: string
  updated_at: string
  // Computed fields
  discount_amount: number
  // Joined data
  client?: {
    id: string
    first_name: string
    last_name: string
    company?: string
    email: string
    phone?: string
  }
  project?: {
    id: string
    name: string
  }
  items?: QuotationItem[]
  attachments?: QuotationAttachment[]
}

export interface QuotationItem {
  id: string
  quotation_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  hsn_sac_code?: string
  tax_rate: number
  tax_amount: number
  item_order: number
  discount_rate?: number
  total?: number // DB column name (for compatibility)
}

export interface QuotationAttachment {
  id: string
  quotation_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by: string
  created_at: string
}

export interface CreateQuotationData {
  client_id: string
  project_id?: string
  title: string
  issue_date: string
  valid_until: string
  subtotal: number
  gst_type?: 'cgst_sgst' | 'igst' | 'none' // Optional since not in DB
  gstin?: string
  pan?: string
  hsn_sac_code?: string
  tax_rate: number
  tax_amount: number
  total_amount: number
  discount_type?: 'percent' | 'flat'
  discount_value?: number
  currency?: string
  notes?: string
  terms?: string
  template?: string // Optional since not in DB
  items: Omit<QuotationItem, 'id' | 'quotation_id' | 'created_at'>[]
}

export interface UpdateQuotationData extends Partial<CreateQuotationData> {
  status?: 'pending' | 'approved' | 'rejected'
}

// Alias for backward compatibility
export type CreateQuotationRequest = CreateQuotationData

export class QuotationService {
  private supabase: SupabaseClient

  constructor() {
    // Use the proper browser client that handles cookies and sessions
    this.supabase = createBrowserClient() as SupabaseClient
  }

  async getQuotations(): Promise<{ success: boolean; data?: Quotation[]; error?: string }> {
    try {
      // Get current session to attach access token (some browsers block cookie on cross-scope fetch)
      const { data: sessionData } = await this.supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token

      // Attempt API route first (preferred for uniform logic / RLS safety)
      const apiResponse = await fetch('/api/quotations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        credentials: 'include'
      })

      if (apiResponse.ok) {
        const result = await apiResponse.json()
        const quotations = result.quotations || result.data || result
        const quotationsWithItems = quotations?.map((quotation: any) => ({
          ...quotation,
          items: quotation.items || [],
          attachments: quotation.attachments || []
        })) || []
        return { success: true, data: quotationsWithItems }
      }

      // If API route failed unauthorized, fall back to direct Supabase query for visibility
      if (apiResponse.status === 401) {
        console.warn('QuotationService: API returned 401, attempting direct Supabase query fallback')
        const userRes = await this.supabase.auth.getUser()
        if (!userRes.data.user) {
          return { success: false, error: 'Not authenticated' }
        }
        const userId = userRes.data.user.id
        const { data, error } = await (this.supabase as any)
          .from('quotations')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)
        if (error) {
          console.error('Direct quotations query error:', error)
          return { success: false, error: 'Failed to fetch quotations' }
        }
        const mapped = (data || []).map((q: any) => ({
          ...q,
          items: q.items || [],
          attachments: []
        }))
        return { success: true, data: mapped }
      }

      const errorPayload = await apiResponse.json().catch(() => ({}))
      return { success: false, error: errorPayload.error || `Failed (status ${apiResponse.status})` }
    } catch (error) {
      console.error('Error fetching quotations:', error)
      return { success: false, error: 'Failed to fetch quotations' }
    }
  }

  async getQuotationById(id: string): Promise<{ success: boolean; data?: Quotation; error?: string }> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('quotations')
        .select(`
          *,
          client:clients(id, first_name, last_name, company, email, phone),
          project:projects(id, name)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching quotation:', error)
        return { success: false, error: error.message }
      }

      // Fetch quotation items
      const { data: items, error: itemsError } = await (this.supabase as any)
        .from('quotation_items')
        .select('*')
        .eq('quotation_id', id)
        .order('item_order', { ascending: true })

      if (itemsError) {
        console.error('Error fetching quotation items:', itemsError)
      }

      // Map database 'total' column to 'amount' for consistency with interface
      const mappedItems = (items || []).map((item: any) => ({
        ...item,
        amount: item.total,
        tax_rate: item.tax_rate || 0,
        tax_amount: item.tax_amount || 0
      }))

      const quotationWithItems = {
        ...data,
        items: mappedItems,
        attachments: []
      }

      return { success: true, data: quotationWithItems }
    } catch (error) {
      console.error('Error fetching quotation:', error)
      return { success: false, error: 'Failed to fetch quotation' }
    }
  }

  async createQuotation(quotationData: CreateQuotationData): Promise<{ success: boolean; data?: Quotation; error?: string }> {
    try {
      console.log('🔍 QuotationService: Creating quotation with data:', quotationData)
      
      // Use the API route instead of direct database access
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: quotationData.client_id,
          project_id: quotationData.project_id,
          title: quotationData.title,
          issue_date: quotationData.issue_date,
          valid_until: quotationData.valid_until,
          subtotal: quotationData.subtotal,
          tax_rate: quotationData.tax_rate,
          tax_amount: quotationData.tax_amount,
          total_amount: quotationData.total_amount,
          discount_type: quotationData.discount_type,
          discount_value: quotationData.discount_value,
          currency: quotationData.currency || 'INR',
          notes: quotationData.notes,
          terms: quotationData.terms, // Mapping terms from UI to terms in DB
          items: quotationData.items
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to create quotation' }
      }

      return { success: true, data: result.quotation }
    } catch (error) {
      console.error('Error creating quotation:', error)
      return { success: false, error: 'Failed to create quotation' }
    }
  }

  async updateQuotation(id: string, updates: UpdateQuotationData): Promise<{ success: boolean; data?: Quotation; error?: string }> {
    try {
      const { items, ...quotationUpdates } = updates

      // Get current session to ensure we have authentication context
      const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        console.error('❌ Session error:', sessionError)
        return { success: false, error: 'Not authenticated. Please refresh the page and try again.' }
      }
      console.log('✅ Session valid:', sessionData.session.user.id)

      // Update quotation
      const { error: quotationError } = await (this.supabase as any)
        .from('quotations')
        .update({
          ...quotationUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (quotationError) {
        console.error('Error updating quotation:', quotationError)
        return { success: false, error: quotationError.message }
      }

      // Update line items if provided
      if (items && items.length > 0) {
        // Delete existing items
        const { error: deleteError } = await (this.supabase as any)
          .from('quotation_items')
          .delete()
          .eq('quotation_id', id)

        if (deleteError) {
          console.error('Error deleting old quotation items:', deleteError)
          return { success: false, error: 'Failed to update line items' }
        }

        // Insert new items
        const itemsToInsert = items.map((item, idx) => ({
          quotation_id: id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.amount, // Map 'amount' to 'total' column
          item_order: item.item_order || (idx + 1), // Fallback to index-based order
          discount_rate: item.discount_rate || 0
        }))
        
        console.log('📝 Inserting quotation items:', itemsToInsert)

        const { error: insertError } = await (this.supabase as any)
          .from('quotation_items')
          .insert(itemsToInsert)

        if (insertError) {
          console.error('Error inserting quotation items:', insertError)
          return { success: false, error: 'Failed to update line items' }
        }
      }

      // Fetch updated quotation
      const result = await this.getQuotationById(id)
      return result
    } catch (error) {
      console.error('Error updating quotation:', error)
      return { success: false, error: 'Failed to update quotation' }
    }
  }

  async deleteQuotation(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (this.supabase as any)
        .from('quotations')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting quotation:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Error deleting quotation:', error)
      return { success: false, error: 'Failed to delete quotation' }
    }
  }

  private async generateQuotationNumber(): Promise<string> {
    try {
      const currentDate = new Date()
      const year = currentDate.getFullYear()
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
      
      // Get the count of quotations for this month
      const { count } = await (this.supabase as any)
        .from('quotations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-${month}-01`)
        .lt('created_at', `${year}-${parseInt(month) + 1}-01`)

      const sequence = ((count || 0) + 1).toString().padStart(3, '0')
      return `QUO-${year}${month}-${sequence}`
    } catch (error) {
      console.error('Error generating quotation number:', error)
      // Fallback to timestamp-based number
      return `QUO-${Date.now()}`
    }
  }

  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  calculateTax(subtotal: number, taxRate: number): number {
    return (subtotal * taxRate) / 100
  }

  calculateTotal(subtotal: number, taxAmount: number, discountAmount: number = 0): number {
    return subtotal + taxAmount - discountAmount
  }

  // Email/WhatsApp sharing utilities
  async prepareEmailContent(quotation: Quotation, templateType: string = 'quotation_share'): Promise<{
    subject: string
    body: string
  }> {
    // For now, return a default template. Later this can be enhanced with database templates
    const clientName = quotation.client ? `${quotation.client.first_name} ${quotation.client.last_name}` : 'Valued Client'
    const projectName = quotation.project?.name || 'Your Project'
    
    const subject = `Quotation #${quotation.quotation_number} from Your Company`
    
    const body = `Dear ${clientName},

Please find attached the quotation #${quotation.quotation_number} for your project "${projectName}".

Quotation Details:
- Amount: ${this.formatCurrency(quotation.total_amount || 0, quotation.currency)}
- Valid Until: ${new Date(quotation.valid_until || new Date()).toLocaleDateString()}

We look forward to working with you on this exciting project. Please feel free to contact us if you have any questions.

Best regards,
Your Name
Your Company`

    return { subject, body }
  }

  async prepareWhatsAppMessage(quotation: Quotation): Promise<string> {
    const clientName = quotation.client ? `${quotation.client.first_name} ${quotation.client.last_name}` : 'Valued Client'
    const projectName = quotation.project?.name || 'Your Project'
    
    return `Hi ${clientName}! 👋

Quotation Details:
📋 Quotation #${quotation.quotation_number}
🏗️ Project: ${projectName}
💰 Amount: ${this.formatCurrency(quotation.total_amount || 0, quotation.currency)}
📅 Valid Until: ${new Date(quotation.valid_until || new Date()).toLocaleDateString()}

Thank you for considering our services! Please let me know if you have any questions.

Best regards! 🙏`
  }

  async updateQuotationStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; data?: Quotation; error?: string }> {
    try {
      const { data, error } = await (this.supabase as any)
        .from('quotations')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating quotation status:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error updating quotation status:', error)
      return { success: false, error: 'Failed to update quotation status' }
    }
  }
}

export default new QuotationService()