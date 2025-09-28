import { supabase } from '@/lib/supabase'
import type { Database, Tables } from '@/types/supabase'

export type Quotation = Tables<'quotations'> & {
  items: QuotationItem[]
}

type NewQuotation = Database['public']['Tables']['quotations']['Insert'] & {
  items: QuotationItem[]
}

export type QuotationItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  item_order?: number
}

type QuotationUpdate = Partial<Omit<Quotation, 'id' | 'created_at' | 'updated_at'>> & {
  items?: QuotationItem[]
  subtotal?: number
  total?: number
  tax_amount?: number
}

/**
 * Fetch all quotations
 */
export async function fetchQuotations() {
  const { data, error } = await supabase
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as Quotation[]
}

/**
 * Fetch a single quotation
 */
export async function fetchQuotationWithItems(id: string) {
  const { data: quotation, error: qErr } = await supabase.from('quotations').select('*').eq('id', id).single()
  if (qErr) throw qErr
  return { 
    quotation: quotation as Quotation, 
    items: (quotation as Quotation).items as QuotationItem[] 
  }
}

/**
 * Create a quotation with its line items in a single transaction.
 */
export async function createQuotation(
  quotationData: Omit<NewQuotation, 'id' | 'created_at' | 'updated_at' | 'items'>,
  items: QuotationItem[] = []
) {
  // Calculate subtotal and tax amount
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = quotationData.tax_rate ? (subtotal * quotationData.tax_rate) / 100 : 0

  const quotation: Omit<NewQuotation, 'id' | 'created_at' | 'updated_at'> = {
    ...quotationData,
    items,
    subtotal,
    tax_amount: taxAmount,
    total_amount: subtotal + (taxAmount || 0)
  }

  const { data, error } = await supabase.from('quotations').insert(quotation).select().single()
  if (error) throw error
  
  return { 
    quotation: data as Quotation, 
    items
  }
}

export async function updateQuotation(
  id: string, 
  quotationData: Partial<Omit<Quotation, 'id' | 'created_at' | 'updated_at' | 'items'>>,
  items?: QuotationItem[]
) {
  const patch: Omit<Partial<Quotation>, 'id' | 'created_at' | 'updated_at'> = { ...quotationData }
  
  if (items) {
    // Recalculate totals if items are updated
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = patch.tax_rate ? (subtotal * patch.tax_rate) / 100 : 0

    patch.items = items
    patch.subtotal = subtotal
    patch.tax_amount = taxAmount
    patch.total_amount = subtotal + (taxAmount || 0)
  }

  const { data, error } = await supabase.from('quotations').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Quotation
}

/**
 * Delete a quotation (items are automatically deleted as they are stored in the JSON column)
 */
export async function deleteQuotation(id: string) {
  const { error } = await supabase.from('quotations').delete().eq('id', id)
  if (error) throw error
  return true
}

/**
 * Convert a quotation to an invoice (simple copy of monetary fields). This does NOT copy line items
 * because an invoice_items table is not yet modeled. Extend when schema is ready.
 */
export async function convertQuotationToInvoice(quotationId: string) {
  const { quotation } = await fetchQuotationWithItems(quotationId)
  // Basic mapping
  const invoiceInsert: Database['public']['Tables']['invoices']['Insert'] = {
    user_id: quotation.user_id,
    client_id: quotation.client_id,
    project_id: quotation.project_id,
    invoice_number: `INV-${Date.now()}`,
    title: quotation.title,
    status: 'draft',
    issue_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    subtotal: quotation.subtotal,
    tax_rate: quotation.tax_rate,
    tax_amount: quotation.tax_amount,
    total_amount: quotation.total_amount,
    currency: quotation.currency,
    notes: quotation.notes,
    payment_terms: 'Net 14',
  }
  const { data, error } = await supabase.from('invoices').insert(invoiceInsert).select().single()
  if (error) throw error
  return data
}
