"use client"

import { useState, useEffect } from "react"
import { CreateInvoiceDialog } from "@/components/create-invoice-dialog"
import { CreateInvoiceDialogMinimal } from "@/components/create-invoice-dialog-minimal"
import { SimpleEditInvoiceDialog } from "@/components/simple-edit-invoice-dialog"
import { ShareInvoiceDialog } from "@/components/share-invoice-dialog"
import { ViewInvoiceDialog } from "@/components/view-invoice-dialog"
import { InvoicePDFViewerDialog } from "@/components/invoice-pdf-viewer-dialog"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Skeleton } from "@/components/ui/skeleton"
import { 
  Search, 
  Plus, 
  Download, 
  Eye, 
  Edit, 
  Send, 
  IndianRupee, 
  Clock, 
  CheckCircle, 
  AlertCircle, 

  Copy,
  Trash2,
  CreditCard,
  FileText,
  Loader2,
  Calendar,
  Share2,
  DollarSign,
  TrendingUp,
  User
} from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { InvoiceService, Invoice } from "@/lib/services/invoice-service"

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const router = useRouter()
  const invoiceService = new InvoiceService()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await invoiceService.getInvoices()
      
      if (result.success && result.data) {
        setInvoices(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch invoices')
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch invoices')
      toast.error('Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleEditInvoice = async (invoice: Invoice) => {
    // Fetch full invoice with items
    console.log('🔍 Fetching full invoice for editing:', invoice.id)
    console.log('🔍 Invoice passed to edit:', invoice)
    const result = await invoiceService.getInvoiceById(invoice.id)
    console.log('📄 Full invoice data from service:', result.data)
    console.log('📄 Items in fetched invoice:', result.data?.items)
    if (result.success && result.data) {
      setEditingInvoice(result.data)
      setEditDialogOpen(true)
    } else {
      console.error('❌ Failed to load invoice:', result.error)
      toast.error('Failed to load invoice')
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice)
    setPdfViewerOpen(true)
  }

  const handleShareInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setShareDialogOpen(true)
  }

  const handleDeleteInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setDeleteDialogOpen(true)
  }

  const handleDuplicateInvoice = async (invoice: Invoice) => {
    try {
      // Generate new invoice number
      const newInvoiceNumber = await invoiceService.generateInvoiceNumber()
      
      // Create duplicate invoice data
      const duplicateData = {
        client_id: invoice.client_id,
        project_id: invoice.project_id,
        invoice_number: newInvoiceNumber,
        title: `${invoice.title} (Copy)`,
        status: 'draft' as const,
        payment_status: 'unpaid' as const,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        subtotal: invoice.subtotal,
        tax_rate: invoice.tax_rate,
        tax_amount: invoice.tax_amount,
        total_amount: invoice.total_amount,
        discount_amount: invoice.discount_amount,
        currency: invoice.currency,
        notes: invoice.notes,

        template: invoice.template
      }
      
      const result = await invoiceService.createInvoice(duplicateData)
      
      if (result.success && result.data) {
        // Duplicate invoice items if any
        if (invoice.items && invoice.items.length > 0) {
          for (const item of invoice.items) {
            await invoiceService.addInvoiceItem(result.data.id, {
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              amount: item.amount,
              item_order: item.item_order
            })
          }
        }
        
        await fetchInvoices()
        toast.success('Invoice duplicated successfully')
      } else {
        throw new Error(result.error || 'Failed to duplicate invoice')
      }
    } catch (error) {
      console.error('Error duplicating invoice:', error)
      toast.error('Failed to duplicate invoice')
    }
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setDownloadingPdf(invoice.id)
      toast.info("Generating PDF...", { 
        description: "Creating your invoice document" 
      })
      
      // Import services
      const { ReactPDFService } = await import('@/lib/services/react-pdf-service')
      const { CompanyDataService } = await import('@/lib/services/company-data-service')
      const { documentStorage } = await import('@/lib/services/document-storage-service')
      const { activityLogger } = await import('@/lib/services/activity-logging-service')
      
      const companyService = new CompanyDataService()
      
      // Get company data with embedded images
      const companyDataResult = await companyService.getCompanyData()
      if (!companyDataResult.success || !companyDataResult.data) {
        throw new Error('Failed to fetch company data')
      }
      const companyData = companyDataResult.data

      // Helper function to fetch and embed images as PNG base64
      const fetchAndEmbed = async (url: string | undefined, label: string, forcePng: boolean = false): Promise<string | undefined> => {
        if (!url) return undefined
        
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          
          if (forcePng && blob.type !== 'image/png') {
            // Convert to PNG using canvas
            return new Promise((resolve, reject) => {
              const img = new Image()
              img.crossOrigin = 'anonymous'
              
              img.onload = () => {
                const canvas = document.createElement('canvas')
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                
                if (!ctx) {
                  reject(new Error('Failed to get canvas context'))
                  return
                }
                
                ctx.drawImage(img, 0, 0)
                const pngDataUrl = canvas.toDataURL('image/png')
                console.log(`✅ ${label} converted to PNG`)
                resolve(pngDataUrl)
              }
              
              img.onerror = () => reject(new Error(`Failed to load ${label}`))
              img.src = URL.createObjectURL(blob)
            })
          }
          
          // Return as base64 data URI
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error(`Failed to read ${label}`))
            reader.readAsDataURL(blob)
          })
        } catch (error) {
          console.error(`Failed to fetch/embed ${label}:`, error)
          return url // Fallback to original URL
        }
      }

      // Embed all images as PNG
      if (companyData.branding?.logo_url) {
        console.log('📥 Embedding logo...')
        companyData.logo_data_uri = await fetchAndEmbed(companyData.branding.logo_url, 'logo', true)
      }

      if (companyData.branding?.qr_code_url) {
        console.log('📥 Embedding QR code...')
        companyData.qr_code_data_uri = await fetchAndEmbed(companyData.branding.qr_code_url, 'QR code', true)
      }

      if (companyData.branding?.signature_url) {
        console.log('📥 Embedding signature...')
        companyData.signature_data_uri = await fetchAndEmbed(companyData.branding.signature_url, 'signature', true)
      }

      console.log('✅ All images embedded successfully')
      
      // Fetch full invoice with items
      const fullInvoiceResult = await invoiceService.getInvoiceById(invoice.id)
      if (!fullInvoiceResult.success || !fullInvoiceResult.data) {
        throw new Error('Failed to fetch invoice details')
      }
      const fullInvoice = fullInvoiceResult.data
      
      // Convert invoice to document format
      const documentData = {
        metadata: {
          documentType: 'invoice' as const,
          documentNumber: invoice.invoice_number,
          issueDate: invoice.issue_date,
          dueDate: invoice.due_date,
          currency: invoice.currency,
          template: invoice.template || 'modern'
        },
        client: {
          name: `${invoice.client?.first_name || ''} ${invoice.client?.last_name || ''}`.trim() || 'Unknown Client',
          company: invoice.client?.company || '',
          email: invoice.client?.email || '',
          phone: invoice.client?.phone || '',
          address: '',
          city: '',
          state: '',
          pinCode: '',
          gstin: ''
        },
        lineItems: fullInvoice.items?.map((item: any, index: number) => ({
          id: item.id || `item-${index}`,
          description: item.description || item.name || 'Item',
          quantity: item.quantity || 1,
          unit: item.unit || 'piece',
          unitPrice: item.unit_price || item.price || 0,
          total: (item.quantity || 1) * (item.unit_price || item.price || 0),
          notes: item.notes || '',
          taxable: true
        })) || [],
        totals: {
          subtotal: invoice.subtotal || 0,
          discountAmount: invoice.discount_amount || 0,
          taxableAmount: invoice.subtotal || 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: invoice.tax_amount || 0,
          totalTaxAmount: invoice.tax_amount || 0,
          roundOffAmount: 0,
          finalTotal: invoice.total_amount || 0
        },
        taxConfig: {
          gstRate: invoice.tax_rate || 18,
          cgst: 0,
          sgst: 0,
          igst: invoice.tax_rate || 18
        },
        terms: invoice.payment_terms || invoice.terms || '',
        status: invoice.status as 'draft' | 'sent' | 'rejected' | 'expired' | 'accepted' | 'converted'
      }
      
      // Generate PDF using React PDF
      const pdfBlob = await ReactPDFService.generatePDF(documentData, companyData)
      
      // Store PDF in CRM storage
      const fileName = `Invoice-${invoice.invoice_number}-${new Date().toISOString().split('T')[0]}.pdf`
      const storageResult = await documentStorage.storePDF(pdfBlob, {
        documentType: 'invoice',
        documentId: invoice.id,
        documentNumber: invoice.invoice_number,
        clientId: invoice.client_id,
        projectId: invoice.project_id,
        fileName,
        mimeType: 'application/pdf'
      })
      
      if (storageResult.success) {
        console.log('PDF stored successfully:', storageResult.filePath)
      }
      
      // Download PDF
      const url = window.URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileName
      
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Log activity
      await activityLogger.logDocumentDownloaded(
        'invoice',
        invoice.id,
        invoice.invoice_number,
        'pdf'
      )
      
      toast.success("PDF downloaded successfully!", {
        description: "Your invoice has been saved to downloads and CRM storage"
      })
      
    } catch (error) {
      console.error('Failed to download PDF:', error)
      toast.error("Failed to download PDF", {
        description: error instanceof Error ? error.message : "Please try again or contact support"
      })
    } finally {
      setDownloadingPdf(null)
    }
  }

  const handleCopyInvoiceNumber = (invoiceNumber: string) => {
    navigator.clipboard.writeText(invoiceNumber)
    toast.success('Invoice number copied to clipboard')
  }

  const handleMarkAsPaid = async (invoice: Invoice) => {
    try {
      setMarkingPaidId(invoice.id)
      // Optimistic UI: update local state first
  setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, status: 'paid' } : inv))
      const result = await invoiceService.updateInvoicePaymentStatus(invoice.id, 'paid')
      if (result.success) {
        toast.success('Invoice marked as paid')
        // Optionally refetch to ensure consistency
        fetchInvoices()
      } else {
        throw new Error(result.error || 'Failed to update payment status')
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('Failed to update payment status')
      // Revert optimistic change on failure
      fetchInvoices()
    } finally {
      setMarkingPaidId(null)
    }
  }

  const confirmDelete = async () => {
    if (!selectedInvoice) return
    try {
      setDeletingId(selectedInvoice.id)
      // Optimistic removal
      setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id))
      const result = await invoiceService.deleteInvoice(selectedInvoice.id)
      if (result.success) {
        toast.success('Invoice deleted successfully')
        // Ensure sync
        fetchInvoices()
      } else {
        throw new Error(result.error || 'Failed to delete invoice')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('Failed to delete invoice')
      fetchInvoices() // restore list
    } finally {
      setDeleteDialogOpen(false)
      setSelectedInvoice(null)
      setDeletingId(null)
    }
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return "bg-gray-100 text-gray-800 border-gray-200"
      case 'sent':
        return "bg-blue-100 text-blue-800 border-blue-200"
      case 'paid':
        return "bg-green-100 text-green-800 border-green-200"
      case 'overdue':
        return "bg-red-100 text-red-800 border-red-200"
      case 'cancelled':
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPaymentStatusColor = (status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled') => {
    switch (status) {
      case 'draft':
        return "bg-gray-100 text-gray-800 border-gray-200"
      case 'sent':
        return "bg-blue-100 text-blue-800 border-blue-200"
      case 'paid':
        return "bg-green-100 text-green-800 border-green-200"
      case 'overdue':
        return "bg-red-100 text-red-800 border-red-200"
      case 'cancelled':
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-4 w-4" />
      case 'sent':
        return <Send className="h-4 w-4" />
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />
      case 'cancelled':
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         invoice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (invoice.client?.first_name + ' ' + invoice.client?.last_name).toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = selectedFilter === 'all' || invoice.status === selectedFilter
    const matchesPayment = paymentFilter === 'all' || invoice.status === paymentFilter
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length
  const pendingInvoices = invoices.filter(inv => inv.status === 'draft' || inv.status === 'sent').length
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0)
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.total_amount, 0)

  if (loading) {
    return (
      <DashboardLayout title="Invoices">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
              <p className="text-muted-foreground">Manage your invoices and track payments</p>
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Invoices">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h2 className="text-xl font-semibold">Failed to load invoices</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={fetchInvoices}>Try Again</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Invoices">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
            <p className="text-muted-foreground">
              Manage your invoices and track payments
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInvoices}</div>
              <p className="text-xs text-muted-foreground">All time invoices</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{paidInvoices}</div>
              <p className="text-xs text-muted-foreground">Successfully collected</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingInvoices}</div>
              <p className="text-xs text-muted-foreground">Awaiting payment</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                ₹{paidAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                of ₹{totalAmount.toLocaleString()} total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Invoices Grid */}
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 border-2 border-dashed border-muted rounded-lg">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">No invoices found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedFilter !== 'all' || paymentFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first invoice'
                }
              </p>
            </div>
            {!searchQuery && selectedFilter === 'all' && paymentFilter === 'all' && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg leading-none">
                          {invoice.invoice_number}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyInvoiceNumber(invoice.invoice_number)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {invoice.title}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Client Info */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {invoice.client ? 
                        `${invoice.client.first_name} ${invoice.client.last_name}` : 
                        'No client assigned'
                      }
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="font-semibold">
                      ₹{invoice.total_amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Issue Date:</span>
                      <span>{new Date(invoice.issue_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span className={new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' ? 'text-red-600 font-medium' : ''}>
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={getStatusColor(invoice.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(invoice.status)}
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </div>
                    </Badge>
                  </div>
                </CardContent>

                {/* Action Buttons */}
                <div className="grid grid-cols-5 gap-1 p-4 pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex flex-col items-center p-2 h-auto gap-1 text-xs"
                    onClick={() => handleDownloadPDF(invoice)}
                    disabled={downloadingPdf === invoice.id}
                  >
                    {downloadingPdf === invoice.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>PDF</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex flex-col items-center p-2 h-auto gap-1 text-xs"
                    onClick={() => handleViewInvoice(invoice)}
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex flex-col items-center p-2 h-auto gap-1 text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteInvoice(invoice)}
                    disabled={deletingId === invoice.id}
                  >
                    {deletingId === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    <span>{deletingId === invoice.id ? 'Deleting' : 'Delete'}</span>
                  </Button>

                  {invoice.status !== 'paid' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex flex-col items-center p-2 h-auto gap-1 text-xs text-green-600 hover:text-green-700"
                      onClick={() => handleMarkAsPaid(invoice)}
                      disabled={markingPaidId === invoice.id}
                    >
                      {markingPaidId === invoice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      <span>{markingPaidId === invoice.id ? 'Saving' : 'Paid'}</span>
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex flex-col items-center p-2 h-auto gap-1 text-xs cursor-default"
                      disabled
                    >
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Paid</span>
                    </Button>
                  )}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex flex-col items-center p-2 h-auto gap-1 text-xs"
                    onClick={() => handleEditInvoice(invoice)}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Invoice Dialog */}
        <CreateInvoiceDialogMinimal
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={fetchInvoices}
        />

        {/* Edit Invoice Dialog */}
        <SimpleEditInvoiceDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          invoice={editingInvoice}
          onSuccess={fetchInvoices}
        />

        {/* View Invoice Dialog */}
        {selectedInvoice && (
          <ViewInvoiceDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            invoice={selectedInvoice}
            onRequestDelete={(inv) => { handleDeleteInvoice(inv); setViewDialogOpen(false); }}
          />
        )}

        {/* Share Invoice Dialog */}
        {selectedInvoice && (
          <ShareInvoiceDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            invoice={selectedInvoice}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete invoice {selectedInvoice?.invoice_number}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* PDF Viewer Dialog */}
        {viewingInvoice && (
          <InvoicePDFViewerDialog
            open={pdfViewerOpen}
            onOpenChange={setPdfViewerOpen}
            invoice={viewingInvoice}
          />
        )}
      </div>
    </DashboardLayout>
  )
}