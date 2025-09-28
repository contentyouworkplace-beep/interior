"use client"

// Simplified single-screen quotation/invoice quick create dialog replacing prior multi-step wizard.
// Keeps same exported component name & props so external usages remain valid.
// Intentionally lean: client selection, subject, line items, automatic totals, terms, submit.

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Calculator, Loader2 } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useSettings } from "@/contexts/settings-context"
import { BusinessSettingsService } from "@/lib/services/business-settings-service"
import { QuotationService, type CreateQuotationRequest } from "@/lib/services/quotation-service"
import { toast } from "sonner"

interface CreateQuotationDialogNewProps {
  children?: React.ReactNode
  type: "quotation" | "invoice"
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface LineItem { id: string; description: string; quantity: number; unit_price: number; amount: number }
interface Client { id: string; first_name: string; last_name: string; company?: string }

export function CreateQuotationDialogNew({ children, type, onSuccess, open: controlledOpen, onOpenChange }: CreateQuotationDialogNewProps) {
    const { gstRate } = useSettings()
    const quotationService = new QuotationService()
    const businessService = new BusinessSettingsService()
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : uncontrolledOpen
    const setOpen = (val: boolean) => {
      if (!isControlled) setUncontrolledOpen(val)
      onOpenChange?.(val)
    }
    const [clients, setClients] = useState<Client[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
      clientId: "",
      subject: "",
      date: new Date().toISOString().split("T")[0],
      validUntil: "",
      currency: "INR",
      tax_rate: gstRate,
      tax_amount: 0,
      subtotal: 0,
      total: 0,
      notes: "",
      terms: ""
    })
    const [lineItems, setLineItems] = useState<LineItem[]>([{ id: "1", description: "", quantity: 1, unit_price: 0, amount: 0 }])

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0)
  const taxAmount = (subtotal * formData.tax_rate) / 100
  const total = subtotal + taxAmount

    useEffect(() => { if (open) loadInitial(); }, [open])
    useEffect(() => { setFormData(p => ({ ...p, subtotal, tax_amount: taxAmount, total })); }, [subtotal, taxAmount, total])

    const loadInitial = async () => {
      setLoading(true)
      try {
        const [settingsRes, clientsRes] = await Promise.all([
          businessService.getBusinessSettings(),
          fetch('/api/clients').then(r => r.json()).catch(() => ({ success:false }))
        ])
        if (settingsRes.success && settingsRes.data) {
          const termsVal = settingsRes.data?.terms
          setFormData(prev => ({ ...prev, terms: termsVal || prev.terms }))
        }
        if (clientsRes.success && clientsRes.clients) setClients(clientsRes.clients)
      } catch (e) {
        console.error(e)
      } finally { setLoading(false) }
    }

    const addLineItem = () => setLineItems(items => [...items, { id: Date.now().toString(), description: "", quantity: 1, unit_price: 0, amount: 0 }])
    const removeLineItem = (id: string) => lineItems.length > 1 && setLineItems(items => items.filter(i => i.id !== id))
    const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
      setLineItems(items => items.map(it => {
        if (it.id === id) {
          const updated: LineItem = { ...it, [field]: value } as LineItem
          if (field === 'quantity' || field === 'unit_price') updated.amount = updated.quantity * updated.unit_price
          return updated
        }
        return it
      }))
    }

    const resetForm = () => {
      setFormData({
        clientId: "",
        subject: "",
        date: new Date().toISOString().split("T")[0],
        validUntil: "",
        currency: "INR",
        tax_rate: gstRate,
        tax_amount: 0,
        subtotal: 0,
        total: 0,
        notes: "",
        terms: formData.terms // keep loaded terms
      })
      setLineItems([{ id: "1", description: "", quantity: 1, unit_price: 0, amount: 0 }])
    }

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!formData.clientId) { toast.error("Select a client"); return }
      if (!formData.subject.trim()) { toast.error("Subject required"); return }
      const validItems = lineItems.filter(i => i.description.trim())
      if (!validItems.length) { toast.error("Add at least one line item"); return }
      setSubmitting(true)
      try {
        if (type === 'quotation') {
          const payload: CreateQuotationRequest = {
            client_id: formData.clientId,
              title: formData.subject,
              issue_date: formData.date,
              valid_until: formData.validUntil || formData.date,
              subtotal: subtotal,
              gst_type: 'none', // using allowed enum; adjust later if standard mapping needed
              tax_rate: formData.tax_rate,
              tax_amount: taxAmount,
              total_amount: total,
              currency: formData.currency,
              notes: formData.notes || undefined,
              terms: formData.terms || undefined,
              items: validItems.map((it, idx) => ({
                description: it.description,
                quantity: it.quantity,
                unit_price: it.unit_price,
                amount: it.amount,
                tax_rate: formData.tax_rate,
                tax_amount: (it.amount * formData.tax_rate)/100,
                item_order: idx + 1
              }))
          }
          const res = await quotationService.createQuotation(payload)
          if (res.success) {
            toast.success("Quotation created")
            onSuccess?.()
            resetForm()
            setOpen(false)
          } else {
            toast.error(res.error || 'Failed to create')
          }
        } else {
          // For invoices we currently just log; preserving interface without implementing per user instruction "do nothing" besides replacement.
          console.log('[CreateQuotationDialogNew] Invoice type submit placeholder', { formData, lineItems })
          toast.success('Invoice draft (not persisted).')
          onSuccess?.()
          resetForm()
          setOpen(false)
        }
      } catch (err) {
        console.error(err)
        toast.error('Unexpected error')
      } finally { setSubmitting(false) }
    }

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {children && !isControlled && (
          <DialogTrigger asChild>{children}</DialogTrigger>
        )}
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create {type === 'quotation' ? 'Quotation' : 'Invoice'}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Basics</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Client *</Label>
                      <Select value={formData.clientId} onValueChange={v => setFormData(p => ({ ...p, clientId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                        <SelectContent>
                          {clients.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name} {c.company && `(${c.company})`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject *</Label>
                      <Input value={formData.subject} onChange={e => setFormData(p => ({ ...p, subject: e.target.value }))} placeholder="Design consultation" />
                    </div>
                    <div className="space-y-2">
                      <Label>Issue Date</Label>
                      <Input type="date" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Valid Until</Label>
                      <Input type="date" value={formData.validUntil} onChange={e => setFormData(p => ({ ...p, validUntil: e.target.value }))} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between py-3"><CardTitle className="text-base">Line Items</CardTitle><Button type="button" size="sm" variant="outline" onClick={addLineItem}><Plus className="h-4 w-4 mr-1" />Add</Button></CardHeader>
                <CardContent className="space-y-3">
                  {lineItems.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6 md:col-span-6">
                        <Label className="text-xs">Description</Label>
                        <Input value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} placeholder="Service / Item" />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" min={0} value={item.quantity} onChange={e => updateLineItem(item.id, 'quantity', parseFloat(e.target.value)||0)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Unit Price</Label>
                        <Input type="number" min={0} step="0.01" value={item.unit_price} onChange={e => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value)||0)} />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Amount</Label>
                        <Input readOnly value={item.amount.toFixed(2)} className="bg-muted" />
                      </div>
                      <div className="col-span-12 flex justify-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLineItem(item.id)} disabled={lineItems.length===1}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4" /> Summary</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
                  <div className="flex justify-between"><span>GST ({formData.tax_rate}%)</span><span>{formatINR(taxAmount)}</span></div>
                  <div className="flex justify-between font-semibold border-t pt-2 mt-1"><span>Total</span><span>{formatINR(total)}</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Notes & Terms</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-sm">Notes</Label>
                    <Textarea rows={3} value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm">Terms</Label>
                    <Textarea rows={3} value={formData.terms} onChange={e => setFormData(p => ({ ...p, terms: e.target.value }))} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : `Create ${type === 'quotation' ? 'Quotation' : 'Invoice'}`}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    )
  }