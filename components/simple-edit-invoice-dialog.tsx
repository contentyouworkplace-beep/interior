"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Loader2, Calculator } from 'lucide-react'
import { formatINR } from '@/lib/utils'
import { toast } from 'sonner'
import { Invoice, InvoiceService } from '@/lib/services/invoice-service'

interface SimpleEditInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onSuccess?: () => void
}

interface LineItemForm { id: string; description: string; quantity: number; unit_price: number; amount: number }
interface Client { id: string; first_name: string; last_name: string; company?: string }

export function SimpleEditInvoiceDialog({ open, onOpenChange, invoice, onSuccess }: SimpleEditInvoiceDialogProps){
  const invoiceService = new InvoiceService()
  const loadingToastId = useRef<string | number | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    clientId: '',
    number: '',
    issueDate: '',
    dueDate: '',
    subject: '',
    currency: 'INR',
    tax_rate: 18,
    notes: ''
  })

  const [lineItems, setLineItems] = useState<LineItemForm[]>([])

  // Derived
  const subtotal = lineItems.reduce((s,i)=>s+i.amount,0)
  const taxAmount = (subtotal * formData.tax_rate)/100
  const total = subtotal + taxAmount

  useEffect(()=>{ if(open){ init() } },[open, invoice])

  async function init(){
    if(!invoice) return
    setLoading(true)
    try {
      await loadClients()
      // Prefill
      setFormData({
        clientId: invoice.client_id,
        number: invoice.invoice_number,
        issueDate: invoice.issue_date.split('T')[0],
        dueDate: invoice.due_date?.split('T')[0] || '',
        subject: invoice.title,
        currency: invoice.currency,
        tax_rate: invoice.tax_rate,
        notes: invoice.notes || ''
      })
      let sourceInvoice = invoice
      // If items are missing (length 0) attempt a focused refetch via API (similar to quotation logic)
      if(!invoice.items || invoice.items.length === 0){
        try {
          console.log('🔁 Invoice edit: items empty, refetching via /api/invoices/:id')
          const res = await fetch(`/api/invoices/${invoice.id}`)
          if(res.ok){
            const json = await res.json()
            if(json?.invoice){
              sourceInvoice = { ...invoice, ...json.invoice }
              console.log('✅ Refetched invoice with items:', sourceInvoice.items?.length)
            } else {
              console.warn('⚠️ Refetch returned no invoice object')
            }
          } else {
            console.warn('⚠️ Refetch failed status', res.status)
          }
        } catch(refetchErr){
          console.warn('⚠️ Refetch error', refetchErr)
        }
      }
      console.log('📦 Loading items from invoice (final source):', sourceInvoice)
      console.log('📦 Invoice items:', sourceInvoice.items)
      const mappedItems = (sourceInvoice.items||[]).map((it,i)=>({
        id: it.id || String(i+1),
        description: it.description || '',
        quantity: it.quantity || 1,
        unit_price: it.unit_price || 0,
        amount: (it.amount ?? it.total ?? ((it.quantity || 1) * (it.unit_price || 0)))
      }))
      console.log('✅ Line items mapped:', mappedItems)
      // If no items, add one empty item
      setLineItems(mappedItems.length > 0 ? mappedItems : [{
        id: '1',
        description: '',
        quantity: 1,
        unit_price: 0,
        amount: 0
      }])
    } catch(e){
      console.error('Init failed', e)
      toast.error('Failed to load invoice')
    } finally { setLoading(false) }
  }

  async function loadClients(){
    try {
      const res = await fetch('/api/clients')
      const json = await res.json()
      if(json.success) setClients(json.clients)
    } catch(e){ console.warn('Client load failed', e) }
  }

  function addLineItem(){
    setLineItems(prev=>[...prev,{id:Date.now().toString(), description:'', quantity:1, unit_price:0, amount:0}])
  }
  function removeLineItem(id:string){ if(lineItems.length>1) setLineItems(prev=>prev.filter(i=>i.id!==id)) }
  function updateLineItem(id:string, field:keyof LineItemForm, value:string|number){
    setLineItems(prev=>prev.map(i=>{
      if(i.id===id){
        const u:any={...i,[field]:value}
        if(field==='quantity' || field==='unit_price') u.amount = Number(u.quantity)*Number(u.unit_price)
        return u
      }
      return i
    }))
  }

  function validate(){
    if(!formData.clientId){ toast.error('Client required'); return false }
    if(!formData.subject.trim()){ toast.error('Subject required'); return false }
    if(lineItems.filter(i=>i.description.trim()).length===0){ toast.error('Add at least one item'); return false }
    if(subtotal<=0){ toast.error('Subtotal must be > 0'); return false }
    if(formData.dueDate && formData.dueDate < formData.issueDate){ toast.error('Due date must be after issue date'); return false }
    return true
  }

  async function handleSubmit(e:React.FormEvent){
    e.preventDefault()
    if(!invoice) return
    if(!validate()) return
    setSubmitting(true)
    try { if(loadingToastId.current) toast.dismiss(loadingToastId.current) } catch{}
    loadingToastId.current = toast.loading('Saving changes...')
    try {
      const filtered = lineItems.filter(i=>i.description.trim())
      const updatePayload = {
        client_id: formData.clientId,
        title: formData.subject,
        issue_date: formData.issueDate,
        due_date: formData.dueDate || formData.issueDate,
        subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: taxAmount,
        total_amount: total,
        currency: formData.currency,
        notes: formData.notes || undefined,
        items: filtered.map((item, index)=>({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          item_order: index+1
        }))
      }
      const result = await invoiceService.updateInvoice(invoice.id, updatePayload)
      if(result.success){
        try { if(loadingToastId.current) toast.dismiss(loadingToastId.current) } catch{}
        toast.success('Invoice updated')
        onOpenChange(false)
        onSuccess && onSuccess()
      } else {
        throw new Error(result.error || 'Update failed')
      }
    } catch(err:any){
      console.error(err)
      try { if(loadingToastId.current) toast.dismiss(loadingToastId.current) } catch{}
      toast.error(err.message || 'Failed to update')
    } finally { setSubmitting(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Invoice</DialogTitle>
        </DialogHeader>
        {(!invoice || loading) ? (
          <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin"/></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Basic Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Client *</Label>
                    <Select value={formData.clientId} onValueChange={(v)=>setFormData(p=>({...p, clientId:v}))}>
                      <SelectTrigger><SelectValue placeholder="Select a client"/></SelectTrigger>
                      <SelectContent>
                        {clients.map(c=>(<SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.company && `(${c.company})`}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input value={formData.number} disabled/>
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input type="date" value={formData.issueDate} onChange={e=>setFormData(p=>({...p, issueDate:e.target.value}))}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={formData.dueDate} onChange={e=>setFormData(p=>({...p, dueDate:e.target.value}))}/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input value={formData.subject} onChange={e=>setFormData(p=>({...p, subject:e.target.value}))} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center justify-between">Line Items <Button type="button" size="sm" onClick={addLineItem}><Plus className="h-4 w-4 mr-1"/>Add</Button></CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lineItems.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label>Description</Label>
                        <Input value={item.description} onChange={e=>updateLineItem(item.id,'description', e.target.value)}/>
                      </div>
                      <div className="col-span-2">
                        <Label>Qty</Label>
                        <Input type="number" value={item.quantity} onChange={e=>updateLineItem(item.id,'quantity', parseFloat(e.target.value)||0)}/>
                      </div>
                      <div className="col-span-2">
                        <Label>Unit Price</Label>
                        <Input type="number" value={item.unit_price} onChange={e=>updateLineItem(item.id,'unit_price', parseFloat(e.target.value)||0)}/>
                      </div>
                      <div className="col-span-2">
                        <Label>Amount</Label>
                        <div className="text-sm font-medium p-2 bg-muted rounded">{formatINR(item.amount)}</div>
                      </div>
                      <div className="col-span-1">
                        <Button type="button" variant="outline" size="sm" onClick={()=>removeLineItem(item.id)} disabled={lineItems.length===1}><Trash2 className="h-4 w-4"/></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Calculator className="h-5 w-5 mr-2"/>Totals</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Subtotal:</span><span>{formatINR(subtotal)}</span></div>
                  <div className="flex justify-between"><span>GST ({formData.tax_rate}%):</span><span>{formatINR(taxAmount)}</span></div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2"><span>Total:</span><span>{formatINR(total)}</span></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Additional Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={e=>setFormData(p=>({...p, notes:e.target.value}))} rows={3} placeholder="Add any notes or special instructions..."/></div>
              </CardContent>
            </Card>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Saving...</>) : 'Save Changes'}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
