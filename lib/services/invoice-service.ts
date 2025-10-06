import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'

export interface Invoice {
  id: string
  user_id: string
  client_id: string
  project_id?: string
  invoice_number: string
  title: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date: string
  payment_date?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  discount_amount: number
  currency: string
  notes?: string
  payment_terms?: string
  terms?: string
  template?: string
  created_at: string
  updated_at: string
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
  items?: InvoiceItem[]
  attachments?: InvoiceAttachment[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  item_order: number
  discount_rate?: number
  total?: number // DB column name (for compatibility)
}

export interface InvoiceAttachment {
  id: string
  invoice_id: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by: string
  created_at: string
}

export interface CreateInvoiceData {
  client_id: string
  project_id?: string
  title: string
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  discount_amount?: number
  currency?: string
  notes?: string
  payment_terms?: string
  terms?: string
  template?: string
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'created_at'>[]
}

export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
}

export interface EmailTemplate {
  id: string
  user_id: string
  template_type: string
  template_name: string
  subject: string
  body: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export class InvoiceService {
  private supabase: SupabaseClient

  constructor() {
    // Use the proper browser client that handles cookies and sessions
    this.supabase = createBrowserClient() as SupabaseClient
  }

  async getInvoices(): Promise<{ success: boolean; data?: Invoice[]; error?: string }> {
    try {
      // Attempt API route first (handles service-key item enrichment & RLS bypass)
      try {
        const { data: sessionData } = await this.supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        const apiRes = await fetch('/api/invoices', {
          method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
            },
            credentials: 'include'
        })
        if (apiRes.ok) {
          const json = await apiRes.json()
          const invoices = json.invoices || []
          return { success: true, data: invoices }
        } else {
          console.warn('InvoiceService.getInvoices: API route failed', apiRes.status)
        }
      } catch (apiErr) {
        console.warn('InvoiceService.getInvoices: API route error, falling back', apiErr)
      }

      const { data, error } = await this.supabase
        .from('invoices')
        .select(`\n          *,\n          client:clients(id, first_name, last_name, company, email, phone),\n          project:projects(id, name),\n          items:invoice_items(*)\n        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const invoicesWithItems = data?.map(invoice => ({
        ...invoice,
        items: invoice.items || [],
        attachments: [] // Placeholder until schema is applied
      })) || []

      return { success: true, data: invoicesWithItems }
    } catch (error: any) {
      console.error('Error fetching invoices:', error)
      return { success: false, error: error.message }
    }
  }

  async getInvoiceById(id: string): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    try {
      // API-first attempt
      try {
        const { data: sessionData } = await this.supabase.auth.getSession()
        const accessToken = sessionData.session?.access_token
        const apiRes = await fetch(`/api/invoices/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
          },
          credentials: 'include'
        })
        if (apiRes.ok) {
          const json = await apiRes.json()
          if (json.success && json.invoice) {
            return { success: true, data: json.invoice }
          }
        } else {
          console.warn('InvoiceService.getInvoiceById: API route failed', apiRes.status)
        }
      } catch (apiErr) {
        console.warn('InvoiceService.getInvoiceById: API route error, falling back', apiErr)
      }

      console.log('🔍 InvoiceService.getInvoiceById - Fetching invoice:', id)
      
      const { data, error } = await (this.supabase as any)
        .from('invoices')
        .select(`
          *,
          client:clients(id, first_name, last_name, company, email, phone),
          project:projects(id, name)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('❌ InvoiceService.getInvoiceById - Error fetching invoice:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ InvoiceService.getInvoiceById - Invoice data:', data)

      // Fetch invoice items
      const { data: items, error: itemsError } = await (this.supabase as any)
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('item_order', { ascending: true })

      if (itemsError) {
        console.error('❌ InvoiceService.getInvoiceById - Error fetching items:', itemsError)
      } else {
        console.log('✅ InvoiceService.getInvoiceById - Raw items from DB:', items)
      }

      // Map database columns to interface - handle both 'total' and 'amount'
      const mappedItems = (items || []).map((item: any) => ({
        ...item,
        amount: item.amount || item.total || 0,  // Map total->amount for consistency
        unit_price: item.unit_price || 0,
        quantity: item.quantity || 1,
        description: item.description || ''
      }))
      
      console.log('✅ InvoiceService.getInvoiceById - Mapped items:', mappedItems)

      const invoiceWithItems = {
        ...data,
        items: mappedItems,
        attachments: []
      }

      console.log('✅ Invoice fetched with items:', { id, itemCount: mappedItems.length })
      return { success: true, data: invoiceWithItems }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      return { success: false, error: 'Failed to fetch invoice' }
    }
  }

  async createInvoice(invoice: Partial<Invoice>): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    try {
      // Get current session to ensure we have authentication context
      const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        console.error('❌ Session error:', sessionError)
        return { success: false, error: 'Not authenticated. Please refresh the page and try again.' }
      }
      const userId = sessionData.session.user.id
      console.log('✅ Session valid, creating invoice for user:', userId)

      // Generate invoice number if not provided
      if (!invoice.invoice_number) {
        const invoiceNumber = await this.generateInvoiceNumber()
        invoice.invoice_number = invoiceNumber
      }

      // Ensure user_id is set from authenticated session
      const invoiceData = {
        ...invoice,
        user_id: userId,
        title: invoice.title || `Invoice ${invoice.invoice_number || 'Draft'}`
      }

      const { data, error } = await (this.supabase as any)
        .from('invoices')
        .insert([invoiceData])
        .select(`
          *,
          client:clients(id, first_name, last_name, company, email, phone),
          project:projects(id, name)
        `)
        .single()

      if (error) {
        console.error('❌ Error creating invoice:', error)
        throw error
      }

      console.log('✅ Invoice created successfully:', data.id)
      return { success: true, data }
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      return { success: false, error: error.message }
    }
  }

  async updateInvoice(id: string, updates: UpdateInvoiceData): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    try {
      const { items, ...invoiceUpdates } = updates

      // Get current session to ensure we have authentication context
      const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession()
      if (sessionError || !sessionData.session) {
        console.error('❌ Session error:', sessionError)
        return { success: false, error: 'Not authenticated. Please refresh the page and try again.' }
      }
      console.log('✅ Session valid:', sessionData.session.user.id)

      // Update invoice
      const { error: invoiceError } = await (this.supabase as any)
        .from('invoices')
        .update({
          ...invoiceUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (invoiceError) {
        console.error('Error updating invoice:', invoiceError)
        return { success: false, error: invoiceError.message }
      }

      // Update line items if provided
      if (items && items.length > 0) {
        // Delete existing items
        const { error: deleteError } = await (this.supabase as any)
          .from('invoice_items')
          .delete()
          .eq('invoice_id', id)

        if (deleteError) {
          console.error('Error deleting old invoice items:', deleteError)
          return { success: false, error: 'Failed to update line items' }
        }

        // Insert new items
        const itemsToInsert = items.map((item, idx) => ({
          invoice_id: id,
          description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount, // correct column name present in schema
            item_order: item.item_order || (idx + 1)
        }))
        
        console.log('📝 Inserting invoice items:', itemsToInsert)

        const { error: insertError } = await (this.supabase as any)
          .from('invoice_items')
          .insert(itemsToInsert)

        if (insertError) {
          console.error('Error inserting invoice items:', insertError)
          return { success: false, error: 'Failed to update line items' }
        }
      }

      // Fetch updated invoice
      const result = await this.getInvoiceById(id)
      return result
    } catch (error) {
      console.error('Error updating invoice:', error)
      return { success: false, error: 'Failed to update invoice' }
    }
  }

  async deleteInvoice(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('invoices')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Error deleting invoice:', error)
      return { success: false, error: error.message }
    }
  }

  async addInvoiceItem(invoiceId: string, item: {
    description: string
    quantity: number
    unit_price: number
    amount: number
    item_order: number
    hsn_sac_code?: string
  }): Promise<{ success: boolean; data?: InvoiceItem; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('invoice_items')
        .insert([{ 
          invoice_id: invoiceId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          item_order: item.item_order
        }])
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error adding invoice item:', error)
      return { success: false, error: error.message }
    }
  }

  // DISABLED until schema is applied - attachment methods
  /*
  async uploadAttachment(
    invoiceId: string, 
    file: File
  ): Promise<{ success: boolean; data?: InvoiceAttachment; error?: string }> {
    try {
      // Upload file to storage
      const fileName = `invoice-${invoiceId}-${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('invoice-attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('invoice-attachments')
        .getPublicUrl(fileName)

      // Save attachment record
      const { data, error } = await this.supabase
        .from('invoice_attachments')
        .insert([{
          invoice_id: invoiceId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          file_size: file.size
        }])
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error uploading attachment:', error)
      return { success: false, error: error.message }
    }
  }

  async deleteAttachment(attachmentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get attachment info first
      const { data: attachment, error: fetchError } = await this.supabase
        .from('invoice_attachments')
        .select('file_url')
        .eq('id', attachmentId)
        .single()

      if (fetchError) throw fetchError

      // Extract file path from URL
      const filePath = attachment.file_url.split('/').pop()

      // Delete file from storage
      if (filePath) {
        await this.supabase.storage
          .from('invoice-attachments')
          .remove([filePath])
      }

      // Delete attachment record
      const { error } = await this.supabase
        .from('invoice_attachments')
        .delete()
        .eq('id', attachmentId)

      if (error) throw error

      return { success: true }
    } catch (error: any) {
      console.error('Error deleting attachment:', error)
      return { success: false, error: error.message }
    }
  }
  */

  async getEmailTemplates(templateType?: string): Promise<{ success: boolean; data?: EmailTemplate[]; error?: string }> {
    try {
      let query = this.supabase
        .from('email_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (templateType) {
        query = query.eq('template_type', templateType)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error fetching email templates:', error)
      return { success: false, error: error.message }
    }
  }

  async generateInvoiceNumber(): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1)

      if (error && error.code !== 'PGRST116') throw error

      const currentYear = new Date().getFullYear()
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0')
      
      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = data[0].invoice_number
        const match = lastNumber.match(/INV-(\d{4})-(\d{2})-(\d{3})/)
        if (match && match[1] === String(currentYear) && match[2] === currentMonth) {
          nextNumber = parseInt(match[3]) + 1
        }
      }

      return `INV-${currentYear}-${currentMonth}-${String(nextNumber).padStart(3, '0')}`
    } catch (error) {
      console.error('Error generating invoice number:', error)
      return `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-001`
    }
  }

  formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  calculateTax(amount: number, taxRate: number): number {
    return (amount * taxRate) / 100
  }

  calculateTotal(subtotal: number, taxAmount: number, discountAmount: number = 0): number {
    return subtotal + taxAmount - discountAmount
  }

  // Convert quotation to invoice
  async convertQuotationToInvoice(quotation: any): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    try {
      // Generate new invoice number
      const invoiceNumber = await this.generateInvoiceNumber()
      
      // Prepare invoice data from quotation
      const invoiceData = {
        client_id: quotation.client_id,
        project_id: quotation.project_id,
        invoice_number: invoiceNumber,
        title: quotation.title,
        status: 'draft' as const,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        subtotal: quotation.subtotal,
        gst_type: quotation.gst_type,
        gstin: quotation.gstin,
        pan: quotation.pan,
        hsn_sac_code: quotation.hsn_sac_code,
        tax_rate: quotation.tax_rate,
        tax_amount: quotation.tax_amount,
        total_amount: quotation.total_amount,
        discount_type: quotation.discount_type,
        discount_value: quotation.discount_value,
        discount_amount: quotation.discount_amount || 0,
        currency: quotation.currency,
        notes: quotation.notes,
        terms: quotation.terms,
        logo_url: quotation.logo_url,
        signature_url: quotation.signature_url,
        template: quotation.template,
        items: quotation.items || []
      }

      // Create the invoice
      const result = await this.createInvoice(invoiceData)
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          error: undefined
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error: any) {
      console.error('Error converting quotation to invoice:', error)
      return { success: false, error: error.message }
    }
  }

  // Email/WhatsApp sharing utilities
  async prepareEmailContent(invoice: Invoice, templateType: string = 'invoice_share'): Promise<{
    subject: string
    body: string
  }> {
    const templates = await this.getEmailTemplates(templateType)
    const template = templates.data?.[0] // Get default template

    if (!template) {
      return {
        subject: `Invoice #${invoice.invoice_number}`,
        body: `Please find attached invoice #${invoice.invoice_number} for ${this.formatCurrency(invoice.total_amount, invoice.currency)}.`
      }
    }

    // Replace placeholders
    const clientName = invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : 'Valued Client'
    const projectName = invoice.project?.name || 'Your Project'
    
    const subject = template.subject
      .replace('{invoice_number}', invoice.invoice_number)
      .replace('{company_name}', 'Your Company') // You can get this from user profile
      .replace('{client_name}', clientName)

    const body = template.body
      .replace('{client_name}', clientName)
      .replace('{invoice_number}', invoice.invoice_number)
      .replace('{project_name}', projectName)
      .replace('{total_amount}', this.formatCurrency(invoice.total_amount, invoice.currency))
      .replace('{due_date}', new Date(invoice.due_date).toLocaleDateString())
      .replace('{sender_name}', 'Your Name') // You can get this from user profile
      .replace('{company_name}', 'Your Company')

    return { subject, body }
  }

  async prepareWhatsAppMessage(invoice: Invoice): Promise<string> {
    const clientName = invoice.client ? `${invoice.client.first_name} ${invoice.client.last_name}` : 'Valued Client'
    const projectName = invoice.project?.name || 'Your Project'
    
    return `Hi ${clientName}! 👋

Invoice Details:
📋 Invoice #${invoice.invoice_number}
🏗️ Project: ${projectName}
💰 Amount: ${this.formatCurrency(invoice.total_amount, invoice.currency)}
📅 Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Thank you for your business! Please let me know if you have any questions.

Best regards! 🙏`
  }

  async updateInvoicePaymentStatus(id: string, paymentStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    try {
      const updateData: any = {
        status: paymentStatus,
        updated_at: new Date().toISOString()
      }
      // payment_date column currently not present in schema; omit until added via migration

      const { data, error } = await this.supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating invoice payment status:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error updating invoice payment status:', error)
      return { success: false, error: 'Failed to update invoice payment status' }
    }
  }

  async updateInvoiceStatus(id: string, status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select(`
          *,
          client:clients(id, first_name, last_name, company, email, phone),
          project:projects(id, name)
        `)
        .single()

      if (error) {
        console.error('Error updating invoice status:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Error updating invoice status:', error)
      return { success: false, error: 'Failed to update invoice status' }
    }
  }
}