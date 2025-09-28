import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
  hsn_sac_code?: string
  tax_rate: number
  tax_amount: number
  item_order: number
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
  private supabase = createClient(supabaseUrl, supabaseKey)

  async getInvoices(): Promise<{ success: boolean; data?: Invoice[]; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, first_name, last_name, company, email, phone),
          project:projects(id, name),
          items:invoice_items(*)
        `)
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
      const { data, error } = await this.supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, first_name, last_name, company, email, phone),
          project:projects(id, name),
          items:invoice_items(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      const invoiceWithItems = {
        ...data,
        items: data.items || [],
        attachments: [] // Placeholder until schema is applied
      }

      // Debug logging
      console.log('InvoiceService.getInvoiceById - Raw data:', data)
      console.log('InvoiceService.getInvoiceById - Items from DB:', data.items)
      console.log('InvoiceService.getInvoiceById - Final invoice items:', invoiceWithItems.items)

      return { success: true, data: invoiceWithItems }
    } catch (error: any) {
      console.error('Error fetching invoice:', error)
      return { success: false, error: error.message }
    }
  }

  async createInvoice(invoice: Partial<Invoice>): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    try {
      // Generate invoice number if not provided
      if (!invoice.invoice_number) {
        const invoiceNumber = await this.generateInvoiceNumber()
        invoice.invoice_number = invoiceNumber
      }

      // Ensure user_id is set - using hardcoded ID for now
      // Also set a default title if not provided since it's required in DB
      const invoiceData = {
        ...invoice,
        user_id: '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6',
        title: invoice.title || `Invoice ${invoice.invoice_number || 'Draft'}`
      }

      const { data, error } = await this.supabase
        .from('invoices')
        .insert([invoiceData])
        .select(`
          *,
          client:clients(id, first_name, last_name, company, email, phone),
          project:projects(id, name)
        `)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      return { success: false, error: error.message }
    }
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<{ success: boolean; data?: Invoice; error?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(id, first_name, last_name, company, email, phone),
          project:projects(id, name)
        `)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      console.error('Error updating invoice:', error)
      return { success: false, error: error.message }
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
    tax_rate: number
    tax_amount: number
    item_order: number
    hsn_sac_code?: string
  }): Promise<{ success: boolean; data?: InvoiceItem; error?: string }> {
    try {
      console.log('InvoiceService.addInvoiceItem - Adding item:', { invoiceId, item })
      
      const { data, error } = await this.supabase
        .from('invoice_items')
        .insert([{ ...item, invoice_id: invoiceId }])
        .select()
        .single()

      console.log('InvoiceService.addInvoiceItem - Insert result:', { data, error })

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

      // If marking as paid, set payment date to today
      if (paymentStatus === 'paid') {
        updateData.payment_date = new Date().toISOString()
      }

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