"use client"

import { useState, useEffect } from "react"
import { CreateInvoiceDialog } from "@/components/create-invoice-dialog"
import { CreateInvoiceDialogMinimal } from "@/components/create-invoice-dialog-minimal"
import { EditInvoiceDialog } from "@/components/edit-invoice-dialog"
import { ShareInvoiceDialog } from "@/components/share-invoice-dialog"
import { ViewInvoiceDialog } from "@/components/view-invoice-dialog"
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  
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

  const handleEditInvoice = (invoice: Invoice) => {
    // Navigate to the new dynamic page for editing
    router.push(`/create-document?type=invoice&id=${invoice.id}`)
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setViewDialogOpen(true)
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
              tax_rate: item.tax_rate,
              tax_amount: item.tax_amount,
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
      toast.info("Generating professional PDF...", { 
        description: "Fetching invoice details and creating your branded document" 
      })
      
      // Use the professional PDF generation service
      const { professionalPDFService } = await import('@/lib/services/professional-pdf-service')
      
      // First, fetch the complete invoice with items
      const fullInvoiceResult = await invoiceService.getInvoiceById(invoice.id)
      
      if (!fullInvoiceResult.success || !fullInvoiceResult.data) {
        throw new Error('Failed to fetch complete invoice details')
      }
      
      const fullInvoice = fullInvoiceResult.data
      console.log('Full invoice with items:', fullInvoice)
      console.log('Invoice items specifically:', fullInvoice.items)
      console.log('Items array length:', fullInvoice.items?.length || 0)
      
      // Get company settings with proper organization ID
      const orgId = '00000000-0000-0000-0000-000000000001'
      
      // Fetch company settings via API
      const response = await fetch(`/api/company-settings?orgId=${orgId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch company settings')
      }
      
      const companySettings = result.data || {
        profile: { company_name: 'Your Company', organization_id: orgId },
        banking: null,
        branding: null
      }
      
      // Generate professional PDF with complete invoice data including items
      const pdfBuffer = await professionalPDFService.generateInvoicePDF(fullInvoice, companySettings)
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      
      // Download the PDF
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `invoice-${invoice.invoice_number}.pdf`
      
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success("Professional PDF downloaded successfully!", {
        description: "Your branded invoice with company details has been saved to downloads"
      })
      
    } catch (error) {
      console.error('Error downloading professional PDF:', error)
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
      const result = await invoiceService.updateInvoicePaymentStatus(invoice.id, 'paid')
      
      if (result.success) {
        await fetchInvoices()
        toast.success('Invoice marked as paid')
      } else {
        throw new Error(result.error || 'Failed to update payment status')
      }
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error('Failed to update payment status')
    }
  }

  const confirmDelete = async () => {
    if (!selectedInvoice) return
    
    try {
      const result = await invoiceService.deleteInvoice(selectedInvoice.id)
      
      if (result.success) {
        await fetchInvoices()
        toast.success('Invoice deleted successfully')
      } else {
        throw new Error(result.error || 'Failed to delete invoice')
      }
    } catch (error) {
      console.error('Error deleting invoice:', error)
      toast.error('Failed to delete invoice')
    }
    
    setDeleteDialogOpen(false)
    setSelectedInvoice(null)
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
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </Button>

                  {invoice.status !== 'paid' ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex flex-col items-center p-2 h-auto gap-1 text-xs text-green-600 hover:text-green-700"
                      onClick={() => handleMarkAsPaid(invoice)}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Paid</span>
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
        {selectedInvoice && (
          <EditInvoiceDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            invoice={selectedInvoice}
            onSuccess={() => {
              setEditDialogOpen(false)
              setSelectedInvoice(null)
              fetchInvoices()
              toast.success('Invoice updated successfully')
            }}
          />
        )}

        {/* View Invoice Dialog */}
        {selectedInvoice && (
          <ViewInvoiceDialog
            open={viewDialogOpen}
            onOpenChange={setViewDialogOpen}
            invoice={selectedInvoice}
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
      </div>
    </DashboardLayout>
  )
}