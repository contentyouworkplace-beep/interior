import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { toast } from 'sonner'
import { Invoice, InvoiceItem, InvoiceService } from '@/lib/services/invoice-service'
import { ClientService } from '@/lib/services/client-service'
import { BusinessSettingsService } from '@/lib/services/business-settings-service'

interface EditInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onSuccess: () => void
}

interface Client {
  id: string
  first_name: string
  last_name: string
  company: string | null
  email: string | null
  phone: string | null
}

interface FormData {
  client_id: string
  title: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
  issue_date: string
  due_date: string
  payment_date?: string
  tax_rate: number
  discount_type: 'percent' | 'flat'
  discount_value: number
  currency: string
  notes: string
  terms: string
  template: string
}

interface LineItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
  amount: number
  hsn_sac_code?: string
  tax_rate: number
  tax_amount: number
}

export function EditInvoiceDialog({ open, onOpenChange, invoice, onSuccess }: EditInvoiceDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    client_id: '',
    title: '',
    status: 'draft',
    payment_status: 'unpaid',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_date: '',
    tax_rate: 18,
    discount_type: 'percent',
    discount_value: 0,
    currency: 'INR',
    notes: '',
    terms: '',
    template: 'modern'
  })
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0, tax_rate: 18, tax_amount: 0 }
  ])
  
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [businessSettings, setBusinessSettings] = useState<any>(null)

  const invoiceService = new InvoiceService()
  const clientService = new ClientService()
  const businessService = new BusinessSettingsService()

  useEffect(() => {
    if (open) {
      fetchClients()
      fetchBusinessSettings()
      if (invoice) {
        populateFormWithInvoice(invoice)
      }
    }
  }, [open, invoice])

  const fetchClients = async () => {
    try {
      const result = await clientService.getClients()
      if (result.data) {
        setClients(result.data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
    }
  }

  const fetchBusinessSettings = async () => {
    try {
      const result = await businessService.getBusinessSettings()
      if (result.success && result.data) {
        setBusinessSettings(result.data)
        if (result.data?.terms) {
          setFormData(prev => ({ ...prev, terms: result.data!.terms }))
        }
      }
    } catch (error) {
      console.error('Error fetching business settings:', error)
    }
  }

  const populateFormWithInvoice = (invoice: Invoice) => {
    setFormData({
      client_id: invoice.client_id,
      title: invoice.title,
      status: invoice.status,
      payment_status: invoice.payment_status,
      issue_date: invoice.issue_date.split('T')[0],
      due_date: invoice.due_date.split('T')[0],
      payment_date: invoice.payment_date ? invoice.payment_date.split('T')[0] : '',
      tax_rate: invoice.tax_rate,
      discount_type: invoice.discount_type || 'percent',
      discount_value: invoice.discount_value || 0,
      currency: invoice.currency,
      notes: invoice.notes || '',
      terms: invoice.terms || '',
      template: invoice.template
    })

    if (invoice.items && invoice.items.length > 0) {
      setLineItems(invoice.items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        hsn_sac_code: item.hsn_sac_code,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount
      })))
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...lineItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    // Recalculate amount and tax when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity
      const unitPrice = field === 'unit_price' ? value : updatedItems[index].unit_price
      const amount = quantity * unitPrice
      const taxAmount = (amount * updatedItems[index].tax_rate) / 100
      
      updatedItems[index].amount = amount
      updatedItems[index].tax_amount = taxAmount
    }
    
    setLineItems(updatedItems)
  }

  const addLineItem = () => {
    setLineItems([...lineItems, {
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      tax_rate: formData.tax_rate,
      tax_amount: 0
    }])
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = lineItems.reduce((sum, item) => sum + item.tax_amount, 0)
    const discountAmount = formData.discount_type === 'percent' 
      ? (subtotal * formData.discount_value) / 100
      : formData.discount_value
    const total = subtotal + taxAmount - discountAmount
    
    return { subtotal, taxAmount, discountAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!invoice) return
    
    if (!formData.client_id || !formData.title) {
      toast.error('Please fill in all required fields')
      return
    }

    if (lineItems.some(item => !item.description || item.quantity <= 0 || item.unit_price < 0)) {
      toast.error('Please ensure all line items have valid descriptions, quantities, and prices')
      return
    }

    try {
      setLoading(true)
      
      const { subtotal, taxAmount, discountAmount, total } = calculateTotals()
      
      // Prepare update data without items for now (items need separate handling)
      const updateData = {
        client_id: formData.client_id,
        title: formData.title,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        currency: formData.currency,
        status: formData.status,
        payment_status: formData.payment_status,
        notes: formData.notes,
        terms: formData.terms,
        template: formData.template,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: total
      }

      const result = await invoiceService.updateInvoice(invoice.id, updateData)
      
      if (result.success) {
        onSuccess()
        toast.success('Invoice updated successfully')
      } else {
        throw new Error(result.error || 'Failed to update invoice')
      }
    } catch (error) {
      console.error('Error updating invoice:', error)
      toast.error('Failed to update invoice')
    } finally {
      setLoading(false)
    }
  }

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals()

  if (!invoice) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice - {invoice.invoice_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={formData.client_id} onValueChange={(value) => handleInputChange('client_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                          {client.company && ` (${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Invoice Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter invoice title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select value={formData.payment_status} onValueChange={(value) => handleInputChange('payment_status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue_date">Issue Date</Label>
                  <Input
                    id="issue_date"
                    type="date"
                    value={formData.issue_date}
                    onChange={(e) => handleInputChange('issue_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Line Items</CardTitle>
                <Button type="button" onClick={addLineItem} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                  <div className="col-span-4">
                    <Label>Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                      placeholder="Item description"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Tax %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.tax_rate}
                      onChange={(e) => handleLineItemChange(index, 'tax_rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label>Amount</Label>
                    <div className="text-sm font-medium py-2">
                      ₹{item.amount.toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLineItem(index)}
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
              <CardTitle className="text-lg">Invoice Totals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(value) => handleInputChange('discount_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage</SelectItem>
                      <SelectItem value="flat">Flat Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => handleInputChange('discount_value', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
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
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Amount:</span>
                  <span>₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => handleInputChange('terms', e.target.value)}
                  placeholder="Enter terms and conditions"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Updating...' : 'Update Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}