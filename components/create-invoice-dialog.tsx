"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatINR, RUPEE_SYMBOL } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Calculator, Loader2 } from "lucide-react"
import { useSettings } from "@/contexts/settings-context"
import { BusinessSettingsService, type BusinessSettings } from "@/lib/services/business-settings-service"
import { InvoiceService } from "@/lib/services/invoice-service"
import { ClientService } from "@/lib/services/client-service"
import { useToast } from "@/hooks/use-toast"

interface CreateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
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
  email: string
  phone: string
  address?: string
  company?: string
}

export function CreateInvoiceDialog({ open, onOpenChange, onSuccess }: CreateInvoiceDialogProps) {
  const { gstRate } = useSettings()
  const { toast } = useToast()
  const businessService = new BusinessSettingsService()
  const invoiceService = new InvoiceService()
  const clientService = new ClientService()
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    clientId: "",
    projectId: "",
    number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    currency: "INR",
    tax_type: "GST",
    tax_rate: gstRate,
    tax_amount: 0,
    subtotal: 0,
    total: 0,
    notes: "",
    terms: "Payment due within 30 days of invoice date."
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unit_price: 0, amount: 0 },
  ])

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = (subtotal * gstRate) / 100
  const total = subtotal + taxAmount

  // Load initial data when dialog opens
  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadBusinessSettings(),
        loadClients()
      ])
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBusinessSettings = async () => {
    try {
      const result = await businessService.getBusinessSettings()
      if (result.success && result.data) {
        setBusinessSettings(result.data)
        setFormData(prev => ({
          ...prev,
          terms: result.data?.terms || "Payment due within 30 days of invoice date."
        }))
      }
    } catch (error) {
      console.error('Error loading business settings:', error)
    }
  }

  const loadClients = async () => {
    try {
      const response = await fetch('/api/clients')
      const result = await response.json()
      
      if (result.success && result.clients) {
        setClients(result.clients)
      } else {
        console.error('Failed to load clients:', result.error)
        toast({
          title: "Warning",
          description: "Could not load clients. You can still create an invoice.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast({
        title: "Warning", 
        description: "Could not load clients. You can still create an invoice.",
        variant: "destructive"
      })
    }
  }

  // Update formData totals when line items change
  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total
    }))
  }, [subtotal, taxAmount, total])

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unit_price: 0,
      amount: 0,
    }
    setLineItems([...lineItems, newItem])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === "quantity" || field === "unit_price") {
            updatedItem.amount = updatedItem.quantity * updatedItem.unit_price
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.clientId) {
      toast({ title: "Error", description: "Please select a client", variant: "destructive" })
      return
    }
    
    if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
      toast({ title: "Error", description: "Please add at least one line item", variant: "destructive" })
      return
    }
    
    setSubmitting(true)
    
    try {
      // Prepare invoice data
      const invoiceData = {
        client_id: formData.clientId,
        project_id: formData.projectId || undefined,
        invoice_number: formData.number,
        title: `Invoice for ${clients.find(c => c.id === formData.clientId)?.first_name} ${clients.find(c => c.id === formData.clientId)?.last_name}`,
        status: 'draft' as const,
        payment_status: 'unpaid' as const,
        issue_date: formData.date,
        due_date: formData.dueDate,
        subtotal: subtotal,
        tax_rate: formData.tax_rate,
        tax_amount: taxAmount,
        total_amount: total,
        discount_amount: 0,
        currency: formData.currency,
        notes: formData.notes,
        terms: formData.terms,
        template: 'modern'
      }
      
      // Create the invoice
      const result = await invoiceService.createInvoice(invoiceData)
      
      if (result.success && result.data) {
        // Create invoice items
        const itemsToCreate = lineItems
          .filter(item => item.description.trim())
          .map((item, index) => ({
            invoice_id: result.data!.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
            item_order: index + 1
          }))
        
        // Add items to the invoice
        for (const itemData of itemsToCreate) {
          await invoiceService.addInvoiceItem(result.data.id, itemData)
        }
        
        toast({ title: "Success", description: "Invoice created successfully" })
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        throw new Error(result.error || 'Failed to create invoice')
      }
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create invoice", 
        variant: "destructive" 
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData({ ...formData, clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {`${client.first_name} ${client.last_name}`.trim()}
                    </SelectItem>
                  ))}
                  {clients.length === 0 && (
                    <SelectItem value="no-clients" disabled>
                      No clients available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proj1">Presidential Suite Renovation</SelectItem>
                  <SelectItem value="proj2">Penthouse Interior Design</SelectItem>
                  <SelectItem value="proj3">Royal Suite Upgrade</SelectItem>
                  <SelectItem value="proj4">Complete Home Makeover</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Invoice Number *</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Currency</Label>
              <Input value="INR (₹)" readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Issue Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Client Information Display */}
          {clients.find(c => c.id === formData.clientId) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Client Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>Name:</strong> {`${clients.find(c => c.id === formData.clientId)?.first_name || ''} ${clients.find(c => c.id === formData.clientId)?.last_name || ''}`.trim()}</div>
                  <div><strong>Email:</strong> {clients.find(c => c.id === formData.clientId)?.email}</div>
                  <div><strong>Phone:</strong> {clients.find(c => c.id === formData.clientId)?.phone}</div>
                  {clients.find(c => c.id === formData.clientId)?.address && (
                    <div className="md:col-span-2"><strong>Address:</strong> {clients.find(c => c.id === formData.clientId)?.address}</div>
                  )}
                  {clients.find(c => c.id === formData.clientId)?.company && (
                    <div className="md:col-span-2"><strong>Company:</strong> {clients.find(c => c.id === formData.clientId)?.company}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Line Items</CardTitle>
                <Button type="button" onClick={addLineItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-5">
                    <Label className="text-sm">Description</Label>
                    <Input
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm">Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => updateLineItem(item.id, "unit_price", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm">Amount</Label>
                    <Input value={item.amount.toFixed(2)} readOnly className="bg-gray-50" />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
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
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GST ({gstRate}%):</span>
                  <span className="font-medium">{formatINR(formData.tax_amount)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total:</span>
                    <span className="text-xl font-bold text-emerald-600">{formatINR(formData.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for this invoice..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Invoice'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
