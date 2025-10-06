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
import { Quotation, QuotationService } from '@/lib/services/quotation-service'

interface SimpleEditQuotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
  onSuccess?: () => void
}

interface LineItemForm { id: string; description: string; quantity: number; unit_price: number; amount: number }
interface Client { id: string; first_name: string; last_name: string; company?: string }

export function SimpleEditQuotationDialog({ open, onOpenChange, quotation, onSuccess }: SimpleEditQuotationDialogProps){
  const quotationService = new QuotationService()
  const loadingToastId = useRef<string | number | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    clientId: '',
    number: '',
    date: '',
    validUntil: '',
    subject: '',
    currency: 'INR',
    tax_rate: 18,
    notes: '',
    terms: ''
  })

  const [lineItems, setLineItems] = useState<LineItemForm[]>([])

  // Derived
  const subtotal = lineItems.reduce((s,i)=>s+i.amount,0)
  const taxAmount = (subtotal * formData.tax_rate)/100
  const total = subtotal + taxAmount

  useEffect(()=>{ if(open){ init() } },[open, quotation])

  async function init(){
    if(!quotation) return
    setLoading(true)
    try {
      await loadClients()
      // Prefill
      setFormData({
        clientId: quotation.client_id,
        number: quotation.quotation_number,
        date: quotation.issue_date.split('T')[0],
        validUntil: quotation.valid_until?.split('T')[0] || '',
        subject: quotation.title,
        currency: quotation.currency,
        tax_rate: quotation.tax_rate,
        notes: quotation.notes || '',
        terms: quotation.terms || ''
      })
      console.log('📦 Loading items from quotation:', quotation.items)
      const mappedItems = (quotation.items||[]).map((it,i)=>({
        id: it.id || String(i+1),
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unit_price,
        amount: it.amount || it.total || (it.quantity * it.unit_price)
      }))
      console.log('✅ Line items mapped:', mappedItems)
      setLineItems(mappedItems)
    } catch(e){
      console.error('Init failed', e)
      toast.error('Failed to load quotation')
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
    if(formData.validUntil && formData.validUntil < formData.date){ toast.error('Invalid date range'); return false }
    return true
  }

  async function handleSubmit(e:React.FormEvent){
    e.preventDefault()
    if(!quotation) return
    if(!validate()) return
    setSubmitting(true)
    try { if(loadingToastId.current) toast.dismiss(loadingToastId.current) } catch{}
    loadingToastId.current = toast.loading('Saving changes...')
    try {
      const filtered = lineItems.filter(i=>i.description.trim())
      const updatePayload = {
        client_id: formData.clientId,
        title: formData.subject,
        issue_date: formData.date,
        valid_until: formData.validUntil || formData.date,
        subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: taxAmount,
        total_amount: total,
        currency: formData.currency,
        notes: formData.notes || undefined,
        terms: formData.terms || undefined,
        items: filtered.map((item, index)=>({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
            amount: item.amount,
          tax_rate: formData.tax_rate,
          tax_amount: (item.amount * formData.tax_rate)/100,
          item_order: index+1
        }))
      }
      const result = await quotationService.updateQuotation(quotation.id, updatePayload)
      if(result.success){
        try { if(loadingToastId.current) toast.dismiss(loadingToastId.current) } catch{}
        toast.success('Quotation updated')
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
          <DialogTitle className="text-xl font-semibold">Edit Quotation</DialogTitle>
        </DialogHeader>
        {(!quotation || loading) ? (
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
                    <Label>Quotation Number</Label>
                    <Input value={formData.number} disabled/>
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input type="date" value={formData.date} onChange={e=>setFormData(p=>({...p, date:e.target.value}))}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input type="date" value={formData.validUntil} onChange={e=>setFormData(p=>({...p, validUntil:e.target.value}))}/>
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
                <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={e=>setFormData(p=>({...p, notes:e.target.value}))} rows={3}/></div>
                <div className="space-y-2"><Label>Terms & Conditions</Label><Textarea value={formData.terms} onChange={e=>setFormData(p=>({...p, terms:e.target.value}))} rows={3}/></div>
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
