import { useState, useEffect } from 'react'
import { formatINR } from '@/lib/utils'

export interface QuotationLineItemForm {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface QuotationFormState {
  clientId: string
  number: string
  date: string
  validUntil: string
  subject: string
  description: string
  currency: string
  tax_type: string
  tax_rate: number
  tax_amount: number
  subtotal: number
  total: number
  notes: string
  terms: string
}

export interface UseQuotationFormOptions {
  gstRate: number
  initial?: Partial<QuotationFormState>
  initialItems?: QuotationLineItemForm[]
  mode?: 'create' | 'edit'
}

export function useQuotationForm({ gstRate, initial, initialItems, mode = 'create' }: UseQuotationFormOptions){
  const [formData, setFormData] = useState<QuotationFormState>({
    clientId: initial?.clientId || '',
    number: initial?.number || `QUO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: initial?.date || new Date().toISOString().split('T')[0],
    validUntil: initial?.validUntil || '',
    subject: initial?.subject || '',
    description: initial?.description || '',
    currency: initial?.currency || 'INR',
    tax_type: initial?.tax_type || 'GST',
    tax_rate: initial?.tax_rate ?? gstRate,
    tax_amount: initial?.tax_amount || 0,
    subtotal: initial?.subtotal || 0,
    total: initial?.total || 0,
    notes: initial?.notes || '',
    terms: initial?.terms || 'Quotation valid for 30 days from the date of issue.'
  })

  const [lineItems, setLineItems] = useState<QuotationLineItemForm[]>(
    initialItems?.length ? initialItems : [{ id: '1', description: '', quantity: 1, unit_price: 0, amount: 0 }]
  )

  const subtotal = lineItems.reduce((sum, i) => sum + i.amount, 0)
  const taxAmount = (subtotal * formData.tax_rate) / 100
  const total = subtotal + taxAmount

  useEffect(() => {
    setFormData(prev => ({ ...prev, subtotal, tax_amount: taxAmount, total }))
  }, [subtotal, taxAmount, total])

  function addLineItem(){
    setLineItems(prev => [...prev, { id: Date.now().toString(), description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  function removeLineItem(id: string){
    setLineItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev)
  }

  function updateLineItem(id: string, field: keyof QuotationLineItemForm, value: string | number){
    setLineItems(prev => prev.map(item => {
      if(item.id === id){
        const updated: any = { ...item, [field]: value }
        if(field === 'quantity' || field === 'unit_price'){
          updated.amount = Number(updated.quantity) * Number(updated.unit_price)
        }
        return updated
      }
      return item
    }))
  }

  function reset(){
    setFormData({
      clientId: '',
      number: `QUO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3,'0')}`,
      date: new Date().toISOString().split('T')[0],
      validUntil: '',
      subject: '',
      description: '',
      currency: 'INR',
      tax_type: 'GST',
      tax_rate: gstRate,
      tax_amount: 0,
      subtotal: 0,
      total: 0,
      notes: '',
      terms: 'Quotation valid for 30 days from the date of issue.'
    })
    setLineItems([{ id: '1', description: '', quantity: 1, unit_price: 0, amount: 0 }])
  }

  return { formData, setFormData, lineItems, addLineItem, removeLineItem, updateLineItem, reset, subtotal, taxAmount, total, mode }
}
