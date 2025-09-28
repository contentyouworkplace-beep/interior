"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  Loader2, 
  FileText, 
  CheckCircle,
  Download,
  Eye
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { QuotationService, type CreateQuotationRequest } from "@/lib/services/quotation-service"
import { BusinessSettingsService, type BusinessSettings } from "@/lib/services/business-settings-service"
import { PDFGenerationService } from "@/lib/services/pdf-generation-service"

interface CreateQuotationDialogProps {
  children: React.ReactNode
  type: "quotation" | "invoice"
  onSuccess?: () => void
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface FormData {
  clientName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  projectName: string
  subject: string
  description: string
  discount: number
  discountType: 'percentage' | 'fixed'
  gstRate: number
  terms: string
}

export function CreateQuotationDialog({ children, type, onSuccess }: CreateQuotationDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validUntil, setValidUntil] = useState<Date>()
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    projectName: "",
    subject: "",
    description: "",
    discount: 0,
    discountType: 'percentage',
    gstRate: 18,
    terms: ""
  })

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    }
  ])

  const quotationService = new QuotationService()
  const businessService = new BusinessSettingsService()
  const pdfService = new PDFGenerationService()

  useEffect(() => {
    if (open) {
      loadBusinessSettings()
    }
  }, [open])

  const loadBusinessSettings = async () => {
    try {
      const result = await businessService.getBusinessSettings()
      if (result.success && result.data) {
        setBusinessSettings(result.data)
        setFormData(prev => ({
          ...prev,
          terms: result.data?.terms || ""
        }))
      }
    } catch (error) {
      console.error('Error loading business settings:', error)
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice
        }
        return updated
      }
      return item
    }))
  }

  const addLineItem = () => {
    const newId = (Math.max(...lineItems.map(item => parseInt(item.id))) + 1).toString()
    setLineItems(prev => [...prev, {
      id: newId,
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    }])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const discountAmount = formData.discountType === 'percentage' 
      ? (subtotal * formData.discount) / 100 
      : formData.discount
    const taxableAmount = subtotal - discountAmount
    const gstAmount = (taxableAmount * formData.gstRate) / 100
    const total = taxableAmount + gstAmount

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      gstAmount,
      total
    }
  }

  const handleSubmit = async () => {
    if (!businessSettings) {
      toast({
        title: "Error",
        description: "Business settings not loaded. Please try again.",
        variant: "destructive"
      })
      return
    }

    if (!formData.clientName || !formData.projectName || !formData.subject) {
      toast({
        title: "Missing Information",
        description: "Please fill in Client Name, Project Name, and Subject.",
        variant: "destructive"
      })
      return
    }

    const totals = calculateTotals()
    
    try {
      setIsLoading(true)

      const template = type === 'quotation' 
        ? businessSettings.quotation_template || 'modern'
        : businessSettings.invoice_template || 'modern'

      const quotationItems = lineItems.map((item, index) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: item.total,
        hsn_sac_code: '',
        tax_rate: 0,
        tax_amount: 0,
        item_order: index + 1
      }))

      const quotationData: CreateQuotationRequest = {
        client_id: "demo-client-1", // TODO: Get from selected client
        title: formData.subject || "Untitled Quotation",
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: validUntil?.toISOString().split('T')[0] || "",
        subtotal: totals.subtotal,
        gst_type: 'none',
        tax_rate: 0,
        tax_amount: totals.gstAmount,
        total_amount: totals.total,
        discount_type: 'percent',
        discount_value: 0,
        currency: 'INR',
        notes: formData.description,
        terms: formData.terms,
        template: template,
        items: quotationItems
      }

      const result = await quotationService.createQuotation(quotationData)
      
      if (result.success && result.data) {
        toast({
          title: "Success",
          description: `${type === 'quotation' ? 'Quotation' : 'Invoice'} created successfully`,
        })
        
        setOpen(false)
        onSuccess?.()
        resetForm()
      } else {
        throw new Error(result.error || 'Failed to create quotation')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to create ${type}. Please try again.`,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreviewPDF = async () => {
    if (!businessSettings) return

    const totals = calculateTotals()
    const template = type === 'quotation' 
      ? businessSettings.quotation_template || 'modern'
      : businessSettings.invoice_template || 'modern'
    
    const quotationData = {
      id: 'preview',
      quotation_number: 'QT-PREVIEW-001',
      client_name: formData.clientName || 'Sample Client',
      client_email: formData.clientEmail || 'client@example.com',
      client_phone: formData.clientPhone || '+91 98765 43210',
      client_address: formData.clientAddress || 'Sample Address, City, State, PIN',
      project_name: formData.projectName || 'Sample Project',
      subject: formData.subject || 'Sample Quotation',
      description: formData.description || 'This is a preview of your quotation.',
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      tax_amount: totals.gstAmount,
      total_amount: totals.total,
      valid_until: validUntil?.toISOString().split('T')[0] || null,
      terms: formData.terms,
      template_type: template,
      status: 'draft',
      created_at: new Date().toISOString(),
      quotation_items: lineItems.map(item => ({
        description: item.description || 'Sample Item',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.total
      }))
    }

    try {
      const previewItems = lineItems.map((item, index) => ({
        id: `preview-${index}`,
        quotation_id: 'preview',
        description: item.description || 'Sample Item',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        amount: item.total,
        hsn_sac_code: '',
        tax_rate: 0,
        tax_amount: 0,
        item_order: index + 1
      }))

      const blob = await pdfService.generateQuotationPDF({
        template: template,
        businessSettings,
        quotation: quotationData as any,
        items: previewItems
      })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF preview",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      projectName: "",
      subject: "",
      description: "",
      discount: 0,
      discountType: 'percentage',
      gstRate: 18,
      terms: businessSettings?.terms || ""
    })
    setLineItems([{
      id: "1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0
    }])
    setValidUntil(undefined)
  }

  const formatCurrency = (amount: number) => {
    return businessService.formatCurrency(amount)
  }

  const totals = calculateTotals()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create New {type === 'quotation' ? 'Quotation' : 'Invoice'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details to create a professional {type}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column: Client & Project Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Client & Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Enter client name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    placeholder="client@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Client Phone</Label>
                  <Input
                    id="clientPhone"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                    placeholder="+91 98765 43210"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={formData.projectName}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                    placeholder="Enter project name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Client Address</Label>
                  <Textarea
                    id="clientAddress"
                    value={formData.clientAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientAddress: e.target.value }))}
                    placeholder="Enter complete address"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valid Until</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !validUntil && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {validUntil ? format(validUntil, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={validUntil}
                        onSelect={setValidUntil}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle Column: Items & Pricing */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Line Items</CardTitle>
                <Button onClick={addLineItem} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {lineItems.map((item) => (
                  <div key={item.id} className="space-y-2 p-3 border rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">Item {item.id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="text-xs"
                    />
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Total</Label>
                        <div className="h-8 px-2 py-1 border rounded bg-muted text-xs flex items-center">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Discount & Tax</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Discount Type</Label>
                    <Select value={formData.discountType} onValueChange={(value: 'percentage' | 'fixed') => 
                      setFormData(prev => ({ ...prev, discountType: value }))
                    }>
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Discount Value</Label>
                    <Input
                      type="number"
                      value={formData.discount}
                      onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="text-xs"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">GST Rate (%)</Label>
                  <Input
                    type="number"
                    value={formData.gstRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, gstRate: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    step="0.01"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms" className="text-xs">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    placeholder="Enter terms and conditions"
                    rows={3}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Summary & Actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="text-red-600">-{formatCurrency(totals.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Amount:</span>
                  <span>{formatCurrency(totals.taxableAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({formData.gstRate}%):</span>
                  <span>{formatCurrency(totals.gstAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-green-600">{formatCurrency(totals.total)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Using <Badge variant="secondary">
                    {businessSettings?.quotation_template || 'Modern'}
                  </Badge> template from settings
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure templates in Settings → Company
                </p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handlePreviewPDF}
                disabled={!businessSettings}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview PDF
              </Button>
              
              <Button 
                className="w-full" 
                onClick={handleSubmit} 
                disabled={isLoading || !formData.clientName || !formData.projectName || !formData.subject}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create {type === 'quotation' ? 'Quotation' : 'Invoice'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}