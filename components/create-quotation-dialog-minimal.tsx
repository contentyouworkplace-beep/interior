"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Calculator, Loader2, UserPlus } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { useSettings } from "@/contexts/settings-context"
import { BusinessSettingsService } from "@/lib/services/business-settings-service"
import { QuotationService, type Quotation } from "@/lib/services/quotation-service"
import { toast } from "sonner"

interface CreateQuotationDialogMinimalProps {
  children?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface LineItem { 
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
}

interface Client { 
  id: string
  first_name: string
  last_name: string
  company?: string
  email?: string
  phone?: string
}

export function CreateQuotationDialogMinimal({ children, onSuccess, open: controlledOpen, onOpenChange }: CreateQuotationDialogMinimalProps) {
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
  const [showNewClientForm, setShowNewClientForm] = useState(false)

  const [formData, setFormData] = useState({
    clientId: "",
    quotationNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    validUntil: "",
    currency: "INR",
    tax_rate: gstRate,
    tax_amount: 0,
    subtotal: 0,
    total: 0,
    notes: ""
  })

  const [newClient, setNewClient] = useState({
    first_name: "",
    last_name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    gstin: ""
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unit_price: 0, amount: 0 }
  ])

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0)
  const taxAmount = (subtotal * formData.tax_rate) / 100
  const total = subtotal + taxAmount

  useEffect(() => { 
    if (open) loadInitial() 
  }, [open])
  
  useEffect(() => { 
    setFormData(p => ({ ...p, subtotal, tax_amount: taxAmount, total }))
  }, [subtotal, taxAmount, total])

  const loadInitial = async () => {
    setLoading(true)
    try {
      const [settingsRes, clientsRes, quotationNumberRes] = await Promise.all([
        businessService.getBusinessSettings(),
        fetch('/api/clients').then(r => r.json()).catch(() => ({ success: false })),
        quotationService.generateQuotationNumber()
      ])

      if (clientsRes.success && clientsRes.clients) {
        setClients(clientsRes.clients)
      }

      if (quotationNumberRes) {
        setFormData(prev => ({ ...prev, quotationNumber: quotationNumberRes }))
      }

      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 30)
      setFormData(prev => ({ ...prev, validUntil: validUntil.toISOString().split("T")[0] }))

    } catch (e) {
      console.error(e)
    } finally { 
      setLoading(false) 
    }
  }

  const addLineItem = () => setLineItems(items => [
    ...items, 
    { id: Date.now().toString(), description: "", quantity: 1, unit_price: 0, amount: 0 }
  ])

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(items => items.filter(i => i.id !== id))
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(items => items.map(it => {
      if (it.id === id) {
        const updated: LineItem = { ...it, [field]: value } as LineItem
        if (field === 'quantity' || field === 'unit_price') {
          updated.amount = updated.quantity * updated.unit_price
        }
        return updated
      }
      return it
    }))
  }

  const handleCreateClient = async () => {
    if (!newClient.first_name.trim() || !newClient.email.trim()) {
      toast.error("First name and email are required")
      return
    }

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      })

      const result = await response.json()
      
      if (result.success && result.client) {
        setClients(prev => [...prev, result.client])
        setFormData(prev => ({ ...prev, clientId: result.client.id }))
        setNewClient({ first_name: "", last_name: "", company: "", email: "", phone: "", address: "", city: "", state: "", zip_code: "", gstin: "" })
        setShowNewClientForm(false)
        toast.success("Client created successfully")
      } else {
        throw new Error(result.error || 'Failed to create client')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to create client')
    }
  }

  const resetForm = () => {
    setFormData({
      clientId: "",
      quotationNumber: "",
      issueDate: new Date().toISOString().split("T")[0],
      validUntil: "",
      currency: "INR",
      tax_rate: gstRate,
      tax_amount: 0,
      subtotal: 0,
      total: 0,
      notes: ""
    })
    setLineItems([{ id: "1", description: "", quantity: 1, unit_price: 0, amount: 0 }])
    setShowNewClientForm(false)
    setNewClient({ first_name: "", last_name: "", company: "", email: "", phone: "", address: "", city: "", state: "", zip_code: "", gstin: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientId) { 
      toast.error("Select a client") 
      return 
    }
    
    const validItems = lineItems.filter(i => i.description.trim())
    if (!validItems.length) { 
      toast.error("Add at least one line item") 
      return 
    }

    setSubmitting(true)
    try {
      const payload: Partial<Quotation> = {
        client_id: formData.clientId,
        quotation_number: formData.quotationNumber,
        status: 'draft',
        issue_date: formData.issueDate,
        valid_until: formData.validUntil,
        subtotal: subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: taxAmount,
        total_amount: total,
        currency: formData.currency,
        notes: formData.notes || undefined
      }

      const res = await quotationService.createQuotation(payload)
      
      if (res.success && res.data) {
        for (const [idx, item] of validItems.entries()) {
          const itemData = {
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
            tax_rate: formData.tax_rate || 0,
            tax_amount: (item.amount * (formData.tax_rate || 0)) / 100,
            item_order: idx + 1
          }
          await quotationService.addQuotationItem(res.data.id, itemData as any)
        }
        toast.success("Quotation created successfully")
        onSuccess?.()
        resetForm()
        setOpen(false)
      } else {
        toast.error(res.error || 'Failed to create quotation')
      }
    } catch (err) {
      console.error(err)
      toast.error('Unexpected error')
    } finally { 
      setSubmitting(false) 
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && !isControlled && (
        <DialogTrigger asChild>{children}</DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quotation</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="py-8 text-center">Loading...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quotation Number *</Label>
                    <Input 
                      value={formData.quotationNumber} 
                      onChange={e => setFormData(p => ({ ...p, quotationNumber: e.target.value }))}
                      placeholder="QUO-001" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Issue Date</Label>
                    <Input 
                      type="date" 
                      value={formData.issueDate} 
                      onChange={e => setFormData(p => ({ ...p, issueDate: e.target.value }))} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valid Until</Label>
                    <Input 
                      type="date" 
                      value={formData.validUntil} 
                      onChange={e => setFormData(p => ({ ...p, validUntil: e.target.value }))} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showNewClientForm ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>Select Client *</Label>
                        <Select value={formData.clientId} onValueChange={v => setFormData(p => ({ ...p, clientId: v }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.first_name} {c.last_name} {c.company && `(${c.company})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowNewClientForm(true)}
                        className="mt-6"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        New Client
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Create New Client</h4>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowNewClientForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1 space-y-2">
                        <Label>First Name *</Label>
                        <Input 
                          value={newClient.first_name}
                          onChange={e => setNewClient(p => ({ ...p, first_name: e.target.value }))}
                          placeholder="John"
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label>Last Name</Label>
                        <Input 
                          value={newClient.last_name}
                          onChange={e => setNewClient(p => ({ ...p, last_name: e.target.value }))}
                          placeholder="Doe"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Company</Label>
                        <Input 
                          value={newClient.company}
                          onChange={e => setNewClient(p => ({ ...p, company: e.target.value }))}
                          placeholder="ABC Corp"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Email *</Label>
                        <Input 
                          type="email"
                          value={newClient.email}
                          onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))}
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Phone</Label>
                        <Input 
                          value={newClient.phone}
                          onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+91 9876543210"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Address</Label>
                        <Textarea 
                          rows={2}
                          value={newClient.address}
                          onChange={e => setNewClient(p => ({ ...p, address: e.target.value }))}
                          placeholder="Street address"
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label>City</Label>
                        <Input 
                          value={newClient.city}
                          onChange={e => setNewClient(p => ({ ...p, city: e.target.value }))}
                          placeholder="Mumbai"
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label>State</Label>
                        <Input 
                          value={newClient.state}
                          onChange={e => setNewClient(p => ({ ...p, state: e.target.value }))}
                          placeholder="Maharashtra"
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label>PIN Code</Label>
                        <Input 
                          value={newClient.zip_code}
                          onChange={e => setNewClient(p => ({ ...p, zip_code: e.target.value }))}
                          placeholder="400001"
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label>GSTIN</Label>
                        <Input 
                          value={newClient.gstin}
                          onChange={e => setNewClient(p => ({ ...p, gstin: e.target.value }))}
                          placeholder="27ABCDE1234F1Z5"
                        />
                      </div>
                    </div>
                    <Button type="button" onClick={handleCreateClient} className="w-full">
                      Create Client
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <CardTitle className="text-base">Items</CardTitle>
                <Button type="button" size="sm" variant="outline" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <Label className="text-xs">Description *</Label>
                      <Input 
                        value={item.description} 
                        onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Service or item description" 
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        value={item.quantity} 
                        onChange={e => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label className="text-xs">Unit Price (₹)</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        step="0.01" 
                        value={item.unit_price} 
                        onChange={e => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label className="text-xs">Amount</Label>
                      <Input readOnly value={formatINR(item.amount)} className="bg-muted" />
                    </div>
                    <div className="col-span-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" /> 
                  Quotation Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST ({formData.tax_rate}%)</span>
                  <span>{formatINR(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                  <span>Total Amount</span>
                  <span>{formatINR(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm">Notes</Label>
                  <Textarea 
                    rows={3} 
                    value={formData.notes} 
                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} 
                    placeholder="Any additional notes for this quotation..." 
                  />
                </div>

              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Quotation'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
