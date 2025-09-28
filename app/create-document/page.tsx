"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Plus,
  Trash2,
  Download,
  Send,
  Eye,
  Save,
  FileText,
  RefreshCw,
  Calculator,
  Users,
  Building2,
  IndianRupee,
  Percent,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Copy
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { toast } from "sonner"
import { CompanyDataService } from "@/lib/services/company-data-service"
import { PDFGenerationService } from "@/lib/services/pdf-generation-service"
import { EmailService } from "@/lib/services/email-service"
import { QuotationToInvoiceService } from "@/lib/services/quotation-to-invoice-service"
import {
  LineItem,
  QuotationInvoiceData,
  DocumentMetadata,
  ClientDetails,
  ProjectDetails,
  TaxConfiguration,
  DiscountConfiguration,
  DocumentTotals,
  DocumentCalculator,
  DEFAULT_TAX_CONFIG,
  DOCUMENT_TEMPLATES,
  INDIAN_STATES,
  UNITS,
  TemplateType
} from "@/lib/types/document-types"
import { CreateClientDialog } from "@/components/create-client-dialog"

interface CreateQuotationInvoicePageProps {
  mode: 'quotation' | 'invoice'
  editId?: string
  convertFromQuotation?: string
}

export default function CreateQuotationInvoicePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast: showToast } = useToast()
  
  const mode = (searchParams?.get('type') as 'quotation' | 'invoice') || 'quotation'
  const editId = searchParams?.get('id') || undefined
  const convertFromQuotation = searchParams?.get('convertFrom') || undefined

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [companyData, setCompanyData] = useState<any>(null)
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  
  // Services
  const companyService = new CompanyDataService()
  const pdfService = new PDFGenerationService()
  const emailService = new EmailService()
  const conversionService = new QuotationToInvoiceService()
  
  // Form state
  const [documentData, setDocumentData] = useState<QuotationInvoiceData>({
    metadata: {
      documentNumber: '',
      documentType: mode,
      issueDate: new Date().toISOString().split('T')[0],
      validUntil: mode === 'quotation' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      dueDate: mode === 'invoice' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      currency: 'INR',
      template: 'modern'
    },
    client: {
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pinCode: '',
      gstin: ''
    },
    project: {
      name: '',
      description: '',
      location: ''
    },
    lineItems: [{
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit: 'Pcs',
      unitPrice: 0,
      total: 0,
      taxable: true,
      notes: ''
    }],
    taxConfig: DEFAULT_TAX_CONFIG,
    discount: {
      type: 'percentage',
      value: 0
    },
    totals: {
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      cessAmount: 0,
      tdsAmount: 0,
      totalTaxAmount: 0,
      roundOffAmount: 0,
      finalTotal: 0
    },
    terms: '',
    notes: '',
    status: 'draft'
  })

  // Initialize data on component mount
  useEffect(() => {
    loadInitialData()
  }, [mode])

  // Recalculate totals when line items, discount, or tax config changes
  useEffect(() => {
    calculateTotals()
  }, [documentData.lineItems, documentData.discount, documentData.client.state])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load company data
      const company = await companyService.getCompanyData()
      setCompanyData(company)
      
      // Generate document number if not editing
      if (!editId) {
        const nextNumber = await generateDocumentNumber(mode)
        setDocumentData(prev => ({
          ...prev,
          metadata: {
            ...prev.metadata,
            documentNumber: nextNumber
          }
        }))
      }
      
      // If converting from quotation, load quotation data
      if (convertFromQuotation) {
        await loadQuotationForConversion(convertFromQuotation)
      }
      
      // If editing, load existing document
      if (editId) {
        await loadExistingDocument(editId)
      }
      
    } catch (error) {
      console.error('Error loading initial data:', error)
      showToast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateDocumentNumber = async (type: 'quotation' | 'invoice'): Promise<string> => {
    // Generate a simple sequential number
    const prefix = type === 'quotation' ? 'QUO' : 'INV'
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}-${timestamp}`
  }

  const loadQuotationForConversion = async (quotationId: string) => {
    try {
      const conversionResult = await conversionService.convertQuotationToInvoice(quotationId)
      if (!conversionResult.success || !conversionResult.data) {
        throw new Error(conversionResult.error || 'Conversion failed')
      }
      const quotationData = conversionResult.data
      setDocumentData(prev => ({
        ...prev,
        ...quotationData,
        metadata: {
          ...quotationData.metadata,
          documentType: 'invoice',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        status: 'draft',
        paymentStatus: 'pending'
      }))
    } catch (error) {
      console.error('Error converting quotation:', error)
      showToast({
        title: "Error",
        description: "Failed to convert quotation",
        variant: "destructive"
      })
    }
  }

  const loadExistingDocument = async (id: string) => {
    // Implementation for loading existing document
    // This would fetch from your database
    console.log('Loading existing document:', id)
  }

  const calculateTotals = () => {
    const newTotals = DocumentCalculator.calculateCompleteDocument(
      documentData.lineItems,
      documentData.taxConfig,
      documentData.discount,
      documentData.client.state,
      companyData?.profile?.state
    )
    
    setDocumentData(prev => ({
      ...prev,
      totals: newTotals
    }))
  }

  const handleLineItemChange = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...documentData.lineItems]
    newItems[index] = {
      ...newItems[index],
      [field]: value
    }
    
    // Recalculate item total
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setDocumentData(prev => ({
      ...prev,
      lineItems: newItems
    }))
  }

  const addLineItem = () => {
    setDocumentData(prev => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          id: crypto.randomUUID(),
          description: '',
          quantity: 1,
          unit: 'Pcs',
          unitPrice: 0,
          total: 0,
          taxable: true,
          notes: ''
        }
      ]
    }))
  }

  const removeLineItem = (index: number) => {
    if (documentData.lineItems.length > 1) {
      setDocumentData(prev => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validate required fields
      if (!documentData.metadata.documentNumber) {
        throw new Error('Document number is required')
      }
      
      if (!documentData.client.name) {
        throw new Error('Client name is required')
      }
      
      if (documentData.lineItems.length === 0) {
        throw new Error('At least one line item is required')
      }
      
      // Save document
      // Implementation would save to your database
      
      showToast({
        title: "Success",
        description: `${mode === 'quotation' ? 'Quotation' : 'Invoice'} saved successfully`
      })
      
      router.push(`/${mode}s`)
      
    } catch (error) {
      console.error('Error saving document:', error)
      showToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save document",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    if (!companyData) {
      showToast({
        title: "Error",
        description: "Company data not loaded",
        variant: "destructive"
      })
      return
    }
    
    setPreviewOpen(true)
  }

  const handleDownloadPDF = async () => {
    try {
      if (!companyData) {
        throw new Error('Company data not loaded')
      }
      
      await pdfService.downloadDocument(documentData, companyData)
      
      showToast({
        title: "Success",
        description: "PDF downloaded successfully"
      })
      
    } catch (error) {
      console.error('Error downloading PDF:', error)
      showToast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Create Document">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          Loading...
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={`${editId ? 'Edit' : convertFromQuotation ? 'Convert' : 'Create'} ${mode === 'quotation' ? 'Quotation' : 'Invoice'}`}>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {editId ? 'Edit' : convertFromQuotation ? 'Convert' : 'Create'} {mode === 'quotation' ? 'Quotation' : 'Invoice'}
              </h1>
              <p className="text-muted-foreground">
                {mode === 'quotation' ? 'Create a new quotation for your client' : 'Generate an invoice for your client'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save {mode === 'quotation' ? 'Quotation' : 'Invoice'}
            </Button>
          </div>
        </div>

        {/* Form Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Document Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">
                      {mode === 'quotation' ? 'Quotation' : 'Invoice'} Number
                    </Label>
                    <Input
                      id="documentNumber"
                      value={documentData.metadata.documentNumber}
                      onChange={(e) => setDocumentData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, documentNumber: e.target.value }
                      }))}
                      placeholder={`Enter ${mode} number`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={documentData.metadata.issueDate}
                      onChange={(e) => setDocumentData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, issueDate: e.target.value }
                      }))}
                    />
                  </div>
                  
                  {mode === 'quotation' && (
                    <div className="space-y-2">
                      <Label htmlFor="validUntil">Valid Until</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={documentData.metadata.validUntil || ''}
                        onChange={(e) => setDocumentData(prev => ({
                          ...prev,
                          metadata: { ...prev.metadata, validUntil: e.target.value }
                        }))}
                      />
                    </div>
                  )}
                  
                  {mode === 'invoice' && (
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={documentData.metadata.dueDate || ''}
                        onChange={(e) => setDocumentData(prev => ({
                          ...prev,
                          metadata: { ...prev.metadata, dueDate: e.target.value }
                        }))}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="template">Template</Label>
                    <Select
                      value={documentData.metadata.template}
                      onValueChange={(value: TemplateType) => setDocumentData(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, template: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(DOCUMENT_TEMPLATES).map(([key, template]) => (
                          <SelectItem key={key} value={key}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* New client selection row */}
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <Label>Client *</Label>
                    <Select
                      value={documentData.client.id || ''}
                      onValueChange={(val) => {
                        const c = clients.find(cl => cl.id === val)
                        if (c) {
                          setDocumentData(prev => ({
                            ...prev,
                            client: {
                              name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
                              company: c.company || '',
                              email: c.email || '',
                              phone: c.phone || '',
                              address: c.address || '',
                              city: c.city || '',
                              state: c.state || '',
                              pinCode: c.zip_code || '',
                              gstin: c.gstin || '',
                              id: c.id
                            }
                          }))
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing client" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.first_name} {c.last_name}{c.company ? ` • ${c.company}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {/* Inline create client dialog */}
                    <CreateClientDialog
                      onCreated={(c) => {
                        setClients(prev => [c, ...prev])
                        setDocumentData(prev => ({
                          ...prev,
                          client: {
                            name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
                            company: c.company || '',
                            email: c.email || '',
                            phone: c.phone || '',
                            address: c.address || '',
                            city: c.city || '',
                            state: c.state || '',
                            pinCode: c.zip_code || '',
                            gstin: c.gstin || '',
                            id: c.id
                          }
                        }))
                      }}
                      trigger={<Button type="button" variant="outline" className="mt-1">New Client</Button>}
                    />
                  </div>
                </div>

                {/* Existing manual fields retained for adjustment after selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client Name *</Label>
                    <Input
                      id="clientName"
                      value={documentData.client.name}
                      onChange={(e) => setDocumentData(prev => ({
                        ...prev,
                        client: { ...prev.client, name: e.target.value }
                      }))}
                      placeholder="Enter client name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientCompany">Company</Label>
                    <Input
                      id="clientCompany"
                      value={documentData.client.company}
                      onChange={(e) => setDocumentData(prev => ({
                        ...prev,
                        client: { ...prev.client, company: e.target.value }
                      }))}
                      placeholder="Enter company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={documentData.client.email}
                      onChange={(e) => setDocumentData(prev => ({
                        ...prev,
                        client: { ...prev.client, email: e.target.value }
                      }))}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Phone</Label>
                    <Input
                      id="clientPhone"
                      value={documentData.client.phone}
                      onChange={(e) => setDocumentData(prev => ({
                        ...prev,
                        client: { ...prev.client, phone: e.target.value }
                      }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Address</Label>
                  <Textarea
                    id="clientAddress"
                    value={documentData.client.address}
                    onChange={(e) => setDocumentData(prev => ({
                      ...prev,
                      client: { ...prev.client, address: e.target.value }
                    }))}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientCity">City</Label>
                    <Input
                      id="clientCity"
                      value={documentData.client.city}
                      onChange={(e) => setDocumentData(prev => ({
                        ...prev,
                        client: { ...prev.client, city: e.target.value }
                      }))}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientState">State</Label>
                    <Select
                      value={documentData.client.state}
                      onValueChange={(value) => setDocumentData(prev => ({
                        ...prev,
                        client: { ...prev.client, state: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientPinCode">PIN Code</Label>
                    <Input
                      id="clientPinCode"
                      value={documentData.client.pinCode}
                      onChange={(e) => setDocumentData(prev => ({
                        ...prev,
                        client: { ...prev.client, pinCode: e.target.value }
                      }))}
                      placeholder="Enter PIN code"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientGstin">GSTIN (Optional)</Label>
                  <Input
                    id="clientGstin"
                    value={documentData.client.gstin}
                    onChange={(e) => setDocumentData(prev => ({
                      ...prev,
                      client: { ...prev.client, gstin: e.target.value }
                    }))}
                    placeholder="Enter GSTIN"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2" />
                    Line Items
                  </span>
                  <Button onClick={addLineItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {documentData.lineItems.map((item, index) => (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Item #{index + 1}</h4>
                          {documentData.lineItems.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 space-y-2">
                            <Label>Description *</Label>
                            <Textarea
                              value={item.description}
                              onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                              placeholder="Describe the item or service"
                              rows={2}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Quantity *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Unit</Label>
                            <Select
                              value={item.unit}
                              onValueChange={(value) => handleLineItemChange(index, 'unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {UNITS.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Unit Price *</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Total</Label>
                            <Input
                              type="number"
                              value={item.total.toFixed(2)}
                              readOnly
                              className="bg-muted"
                            />
                          </div>
                          
                          <div className="md:col-span-2 space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Input
                              value={item.notes}
                              onChange={(e) => handleLineItemChange(index, 'notes', e.target.value)}
                              placeholder="Additional notes for this item"
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Terms and Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="terms">Terms and Conditions</Label>
                  <Textarea
                    id="terms"
                    value={documentData.terms}
                    onChange={(e) => setDocumentData(prev => ({
                      ...prev,
                      terms: e.target.value
                    }))}
                    placeholder="Enter terms and conditions"
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Totals and Actions */}
          <div className="space-y-6">
            {/* Totals Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <IndianRupee className="h-5 w-5 mr-2" />
                  Total Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{documentData.totals.subtotal.toFixed(2)}</span>
                </div>
                
                {documentData.totals.discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-₹{documentData.totals.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Taxable Amount:</span>
                  <span>₹{documentData.totals.taxableAmount.toFixed(2)}</span>
                </div>
                
                {documentData.totals.cgstAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>CGST ({documentData.taxConfig.cgst}%):</span>
                    <span>₹{documentData.totals.cgstAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {documentData.totals.sgstAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>SGST ({documentData.taxConfig.sgst}%):</span>
                    <span>₹{documentData.totals.sgstAmount.toFixed(2)}</span>
                  </div>
                )}
                
                {documentData.totals.igstAmount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>IGST ({documentData.taxConfig.igst}%):</span>
                    <span>₹{documentData.totals.igstAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>₹{documentData.totals.finalTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Status Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Document Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={documentData.status}
                    onValueChange={(value: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted') => 
                      setDocumentData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {mode === 'invoice' && (
                  <div className="space-y-2">
                    <Label>Payment Status</Label>
                    <Select
                      value={documentData.metadata.paymentStatus || 'pending'}
                      onValueChange={(value: 'pending' | 'paid' | 'partial' | 'overdue') => 
                        setDocumentData(prev => ({
                          ...prev, 
                          metadata: { ...prev.metadata, paymentStatus: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
            </DialogHeader>
            <div className="p-6 bg-white min-h-[600px]">
              {companyData ? (
                <div className="document-preview">
                  <p>Preview functionality will be implemented with proper PDF service integration</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin mr-2" />
                  Loading preview...
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}