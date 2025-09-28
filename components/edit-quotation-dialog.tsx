"use client"

// Legacy quotationId-based edit dialog removed; using modern quotation-prop implementation below.
"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatINR, RUPEE_SYMBOL } from "@/lib/utils"
import { CalendarIcon, Plus, Trash2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { QuotationService, Quotation } from "@/lib/services/quotation-service"
import { BusinessSettingsService, BusinessSettings } from "@/lib/services/business-settings-service"
import { ClientService } from "@/lib/services/client-service"
import { type Tables } from "@/lib/services/base-service"
import { useSettings } from "@/contexts/settings-context"
import { toast } from "sonner"

interface EditQuotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation
  onSuccess: () => void
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  tax_rate: number
  tax_amount: number
  item_order: number
}

export function EditQuotationDialog({ open, onOpenChange, quotation, onSuccess }: EditQuotationDialogProps) {
  console.log('🔄 EditQuotationDialog rendered - open:', open)
  
  const { gstRate } = useSettings()
  const businessService = new BusinessSettingsService()
  const quotationService = new QuotationService()
  const clientService = new ClientService()
  
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [clients, setClients] = useState<Tables['clients']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state - initialize with quotation data
  const [formData, setFormData] = useState({
    client_id: quotation.client_id || '',
    project_id: quotation.project_id || '',
    title: quotation.title || '',
    notes: quotation.notes || '',
    template: quotation.template || 'modern',
    currency: quotation.currency || 'INR',
    tax_rate: quotation.tax_rate || gstRate,
    status: quotation.status || 'draft' as const,
    valid_until: quotation.valid_until ? new Date(quotation.valid_until) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  })
  
  const [lineItems, setLineItems] = useState<LineItem[]>(
    quotation.items?.map((item, index) => ({
      id: item.id || `item-${index}`,
      description: item.description || '',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      amount: (item.quantity || 1) * (item.unit_price || 0),
      tax_rate: item.tax_rate || gstRate,
      tax_amount: ((item.quantity || 1) * (item.unit_price || 0) * (item.tax_rate || gstRate)) / 100,
      item_order: index + 1
    })) || [{ id: 'item-1', description: '', quantity: 1, unit_price: 0, amount: 0, tax_rate: gstRate, tax_amount: 0, item_order: 1 }]
  )

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load business settings
      const businessResult = await businessService.getBusinessSettings()
      if (businessResult.success && businessResult.data) {
        setBusinessSettings(businessResult.data)
      }
      
      // Load clients
      const clientsResult = await clientService.getClients()
      if (clientsResult.data) {
        setClients(clientsResult.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load form data')
    } finally {
      setLoading(false)
    }
  }

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.amount, 0)
  }

  const calculateTaxAmount = () => {
    return (calculateSubtotal() * formData.tax_rate) / 100
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxAmount()
  }

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      tax_rate: formData.tax_rate,
      tax_amount: 0,
      item_order: lineItems.length + 1
    }
    setLineItems([...lineItems, newItem])
  }

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.amount = updatedItem.quantity * updatedItem.unit_price
          updatedItem.tax_amount = (updatedItem.amount * updatedItem.tax_rate) / 100
        }
        return updatedItem
      }
      return item
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.client_id) {
      toast.error('Please select a client')
      return
    }
    
    if (!formData.title.trim()) {
      toast.error('Please enter a quotation title')
      return
    }
    
    if (lineItems.length === 0 || lineItems.every(item => !item.description.trim())) {
      toast.error('Please add at least one line item')
      return
    }

    try {
      setSubmitting(true)
      
      const quotationData = {
        ...formData,
        subtotal: calculateSubtotal(),
        tax_amount: calculateTaxAmount(),
        total_amount: calculateTotal(),
        items: lineItems.filter(item => item.description.trim()).map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          item_order: item.item_order
        })),
        valid_until: formData.valid_until.toISOString()
      }
      
      console.log('Updating quotation with data:', quotationData)
      
      const result = await quotationService.updateQuotation(quotation.id, quotationData)
      
      if (result.success) {
        toast.success('Quotation updated successfully!')
        onSuccess()
        onOpenChange(false)
      } else {
        throw new Error(result.error || 'Failed to update quotation')
      }
    } catch (error) {
      console.error('Failed to update quotation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update quotation')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedClient = clients.find(client => client.id === formData.client_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Quotation - {quotation.quotation_number}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({...formData, client_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name} - {client.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter quotation title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Enter quotation notes"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={formData.template} onValueChange={(value) => setFormData({...formData, template: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({...formData, tax_rate: parseFloat(e.target.value) || 0})}
                  placeholder="18"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.valid_until && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.valid_until ? format(formData.valid_until, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.valid_until}
                    onSelect={(date) => date && setFormData({...formData, valid_until: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Line Items</Label>
                <Button type="button" onClick={addLineItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                    <div className="col-span-5">
                      <Label className="text-xs">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Amount</Label>
                      <Input
                        value={formatINR(item.amount)}
                        readOnly
                        className="mt-1 bg-muted"
                      />
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
              </div>
            </div>

            {/* Totals */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatINR(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax ({formData.tax_rate}%):</span>
                <span>{formatINR(calculateTaxAmount())}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                <span>Total:</span>
                <span>{formatINR(calculateTotal())}</span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Quotation'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}