
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Search,
  Filter,
  FileText,
  IndianRupee,
  Calendar,
  Download,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react"
import { toast } from "sonner"
import { QuotationService, Quotation } from "@/lib/services/quotation-service"
import { InvoiceService } from "@/lib/services/invoice-service"
import { CreateQuotationDialog } from "@/components/create-quotation-dialog-clean"
import { SimpleEditQuotationDialog } from "@/components/simple-edit-quotation-dialog"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { QuotationPDFViewerDialog } from "@/components/quotation-pdf-viewer-dialog"

export default function QuotationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const router = useRouter()
  
  
  
  const quotationService = new QuotationService()
  const invoiceService = new InvoiceService()

  useEffect(() => {
    loadQuotations()
  }, [])

  const loadQuotations = async () => {
    setLoading(true)
    setError(null)
    
    const result = await quotationService.getQuotations()
    
    if (result.success && result.data) {
      setQuotations(result.data)
    } else {
      setError(result.error || 'Failed to load quotations')
      toast.error(result.error || 'Failed to load quotations')
    }
    
    setLoading(false)
  }

  const handleDeleteQuotation = async (id: string) => {
    const result = await quotationService.deleteQuotation(id)
    
    if (result.success) {
      setQuotations(prev => prev.filter(q => q.id !== id))
      toast.success("Quotation deleted successfully")
    } else {
      toast.error(result.error || 'Failed to delete quotation')
    }
  }

  const handleDownloadPDF = async (quotation: Quotation) => {
    try {
      toast.info("Generating PDF...", { 
        description: "Creating your quotation document" 
      })
      
      // Import services
      const { ReactPDFService } = await import('@/lib/services/react-pdf-service')
      const { CompanyDataService } = await import('@/lib/services/company-data-service')
      const { documentStorage } = await import('@/lib/services/document-storage-service')
      const { activityLogger } = await import('@/lib/services/activity-logging-service')
      
      const companyService = new CompanyDataService()
      
      // Get company data
      const companyDataResult = await companyService.getCompanyData()
      if (!companyDataResult.success || !companyDataResult.data) {
        throw new Error('Failed to fetch company data')
      }
      const companyData = companyDataResult.data
      
      // Convert quotation to document format
      const documentData = {
        metadata: {
          documentType: 'quotation' as const,
          documentNumber: quotation.quotation_number,
          issueDate: quotation.issue_date,
          validUntil: quotation.valid_until,
          currency: quotation.currency,
          template: quotation.template || 'modern'
        },
        client: {
          name: `${quotation.client?.first_name || ''} ${quotation.client?.last_name || ''}`.trim() || 'Unknown Client',
          company: quotation.client?.company || '',
          email: quotation.client?.email || '',
          phone: quotation.client?.phone || '',
          address: '',
          city: '',
          state: '',
          pinCode: '',
          gstin: ''
        },
        lineItems: quotation.items?.map((item: any, index: number) => ({
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
          subtotal: quotation.subtotal || 0,
          discountAmount: 0,
          taxableAmount: quotation.subtotal || 0,
          cgstAmount: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_amount || 0) / 2 : 0,
          sgstAmount: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_amount || 0) / 2 : 0,
          igstAmount: quotation.gst_type === 'igst' ? quotation.tax_amount || 0 : 0,
          totalTaxAmount: quotation.tax_amount || 0,
          roundOffAmount: 0,
          finalTotal: quotation.total_amount || 0
        },
        taxConfig: {
          gstRate: quotation.tax_rate || 18,
          cgst: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_rate || 18) / 2 : 0,
          sgst: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_rate || 18) / 2 : 0,
          igst: quotation.gst_type === 'igst' ? quotation.tax_rate || 18 : 0
        },
        terms: quotation.terms || '',
        status: quotation.status === 'approved' ? 'accepted' as const : quotation.status as 'draft' | 'sent' | 'rejected' | 'expired' | 'accepted' | 'converted'
      }
      
      // Generate PDF using React PDF
      const pdfBlob = await ReactPDFService.generatePDF(documentData, companyData)
      
      // Store PDF in CRM storage
      const fileName = `Quotation-${quotation.quotation_number}-${new Date().toISOString().split('T')[0]}.pdf`
      const storageResult = await documentStorage.storePDF(pdfBlob, {
        documentType: 'quotation',
        documentId: quotation.id,
        documentNumber: quotation.quotation_number,
        clientId: quotation.client_id,
        projectId: quotation.project_id,
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
        'quotation',
        quotation.id,
        quotation.quotation_number,
        'pdf'
      )
      
      toast.success("PDF downloaded successfully!", {
        description: "Your quotation has been saved to downloads and CRM storage"
      })
      
    } catch (error) {
      console.error('Failed to download PDF:', error)
      toast.error("Failed to download PDF", {
        description: error instanceof Error ? error.message : "Please try again or contact support"
      })
    }
  }

  const handleDuplicateQuotation = async (quotation: Quotation) => {
    try {
      // Create a copy with new quotation number
      const duplicateData = {
        client_id: quotation.client_id,
        project_id: quotation.project_id,
        title: `Copy of ${quotation.title}`,
        status: 'pending' as const,
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        subtotal: quotation.subtotal,
        gst_type: quotation.gst_type,
        tax_rate: quotation.tax_rate,
        tax_amount: quotation.tax_amount,
        total_amount: quotation.total_amount,
        discount_type: quotation.discount_type,
        discount_value: quotation.discount_value,
        currency: quotation.currency,
        notes: quotation.notes,
        terms: quotation.terms,
        template: quotation.template,
        items: quotation.items || []
      }
      
      const result = await quotationService.createQuotation(duplicateData)
      
      if (result.success) {
        await loadQuotations() // Reload the list
        toast.success("Quotation duplicated successfully")
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error("Failed to duplicate quotation")
    }
  }

  const handleEditQuotation = (quotation: Quotation) => {
    // Open edit dialog popup
    setEditingQuotation(quotation)
    setEditDialogOpen(true)
  }

  const handleViewQuotation = (quotation: Quotation) => {
    setViewingQuotation(quotation)
    setPdfViewerOpen(true)
  }

  const handleConvertToInvoice = async (quotation: Quotation) => {
    try {
      setConvertingId(quotation.id)
      
      // Navigate to the new dynamic page with conversion parameter
      router.push(`/create-document?type=invoice&convertFrom=${quotation.id}`)
      
    } catch (error) {
      console.error('Error navigating to conversion:', error)
      toast.error("Failed to open conversion page")
    } finally {
      setConvertingId(null)
    }
  }

  const handleRejectQuotation = async (quotation: Quotation) => {
    try {
      const result = await quotationService.updateQuotationStatus(quotation.id, 'rejected')
      
      if (result.success) {
        toast.success(`Quotation ${quotation.quotation_number} has been rejected.`)
        
        // Refresh the quotations list
        const updatedQuotations = await quotationService.getQuotations()
        if (updatedQuotations.success && updatedQuotations.data) {
          setQuotations(updatedQuotations.data)
        }
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error rejecting quotation:', error)
      toast.error("Failed to reject quotation")
    }
  }

  const handleApproveQuotation = async (quotation: Quotation) => {
    try {
      const result = await quotationService.updateQuotationStatus(quotation.id, 'approved')
      
      if (result.success) {
        toast.success(`Quotation ${quotation.quotation_number} has been approved.`)
        await loadQuotations()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error approving quotation:', error)
      toast.error("Failed to approve quotation")
    }
  }

  const handleStatusUpdate = async (quotation: Quotation, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const result = await quotationService.updateQuotationStatus(quotation.id, newStatus)
      
      if (result.success) {
        toast.success(`Quotation ${quotation.quotation_number} marked as ${newStatus}`)
        await loadQuotations()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error("Failed to update status")
    }
  }

  const handleShareQuotation = async (quotation: Quotation) => {
    try {
      // For now, copy quotation URL to clipboard
      const quotationUrl = `${window.location.origin}/quotations/view/${quotation.id}`
      await navigator.clipboard.writeText(quotationUrl)
      
      toast.success("🔗 Link Copied!", {
        description: "Quotation link has been copied to clipboard."
      })
    } catch (error) {
      console.error('Error sharing quotation:', error)
      toast.error("❌ Error", {
        description: "Failed to share quotation"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "pending":
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const filteredData = quotations.filter((item) => {
    const clientName = item.client ? `${item.client.first_name} ${item.client.last_name}` : ''
    const companyName = item.client?.company || ''
    const projectName = item.project?.name || ''
    
    const matchesSearch =
      item.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = selectedFilter === "all" || item.status === selectedFilter

    return matchesSearch && matchesFilter
  })

  const quotationStats = [
    {
      title: "Total Quotations",
      value: quotations.length.toString(),
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Pending",
      value: quotations.filter((q) => q.status === "pending" || !q.status).length.toString(),
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      title: "Approved",
      value: quotations.filter((q) => q.status === "approved").length.toString(),
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Total Value",
      value: quotationService.formatCurrency(quotations.reduce((sum, q) => sum + q.total_amount, 0)),
      icon: IndianRupee,
      color: "text-primary",
    },
  ]

  return (
    <DashboardLayout
      title="Quotations Management"
      subtitle="Manage quotations with Indian GST compliance"
      currentPath="/quotations"
    >
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quotationStats.map((stat, index) => (
          <Card key={index} className="border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Actions */}
      <Card className="border-border/50 mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-transparent">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter: {selectedFilter === "all" ? "All" : selectedFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedFilter("all")}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("pending")}>Pending</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("approved")}>Approved</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("rejected")}>Rejected</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex space-x-2">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mt-12">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="border-border/50 flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-3 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
                <div className="grid grid-cols-2 gap-4 py-3 border-t">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
                <div className="pt-3 border-t mt-auto">
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="border-border/50 mt-12">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Quotations</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadQuotations} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quotations Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredData.map((item) => (
            <Card key={item.id} className="group relative border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden bg-white">
              <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-lg font-bold text-gray-900 truncate tracking-tight">
                      {item.quotation_number}
                    </CardTitle>
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {item.client ? `${item.client.first_name} ${item.client.last_name}` : 'No client'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.project?.name || item.title}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <Badge className={`${getStatusColor(item.status || 'pending')} flex items-center space-x-1 px-2 py-1 text-xs font-semibold`}>
                      {getStatusIcon(item.status || 'pending')}
                      <span className="capitalize">{item.status || 'pending'}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-4">
                {/* Financial Information */}
                <div className="space-y-2 mb-3">
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Subtotal:</span>
                      <span className="text-xs font-semibold text-gray-800">
                        {quotationService.formatCurrency(item.subtotal, item.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">GST ({item.tax_rate}%):</span>
                      <span className="text-xs font-semibold text-gray-800">
                        {quotationService.formatCurrency(item.tax_amount, item.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-sm font-bold text-gray-900">Total:</span>
                      <span className="text-base font-bold text-blue-600">
                        {quotationService.formatCurrency(item.total_amount, item.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-3 py-2 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-600">{item.items?.length || 0}</p>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Items</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-800">
                      {new Date(item.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </p>
                    <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Created</p>
                  </div>
                </div>

                {/* Valid Until */}
                <div className="flex items-center justify-between p-2 bg-amber-50 rounded-lg border border-amber-200 mb-3">
                  <span className="text-xs font-medium text-amber-800">Valid until:</span>
                  <div className="flex items-center text-amber-700">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="text-xs font-semibold">
                      {new Date(item.valid_until).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - 2x3 Grid */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200 mt-auto">
                  {/* Row 1: View | Edit | Download */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center justify-center gap-1 h-9 text-xs font-medium border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    onClick={() => handleViewQuotation(item)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center justify-center gap-1 h-9 text-xs font-medium border-gray-300 hover:border-green-400 hover:bg-green-50 hover:text-green-600 transition-all"
                    onClick={() => handleEditQuotation(item)}
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center justify-center gap-1 h-9 text-xs font-medium border-gray-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600 transition-all"
                    onClick={() => handleDownloadPDF(item)}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>PDF</span>
                  </Button>
                  
                  {/* Row 2: Approve | Reject | Delete */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center justify-center gap-1 h-9 text-xs font-medium border-gray-300 hover:border-green-400 hover:bg-green-50 hover:text-green-600 transition-all disabled:opacity-50"
                    onClick={() => handleStatusUpdate(item, 'approved')}
                    disabled={item.status === 'approved'}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Approve</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center justify-center gap-1 h-9 text-xs font-medium border-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
                    onClick={() => handleStatusUpdate(item, 'rejected')}
                    disabled={item.status === 'rejected'}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Reject</span>
                  </Button>

                  <DeleteConfirmationDialog
                    title="Delete Quotation"
                    description={`Are you sure you want to delete quotation ${item.quotation_number}? This action cannot be undone.`}
                    onConfirm={() => handleDeleteQuotation(item.id)}
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center justify-center gap-1 h-9 text-xs font-medium border-gray-300 hover:border-red-400 hover:bg-red-50 hover:text-red-600 transition-all w-full"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </Button>
                  </DeleteConfirmationDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredData.length === 0 && (
        <Card className="border-border/50">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No quotations found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Get started by creating your first quotation"}
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Quotation
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Edit Quotation Dialog */}
      {editingQuotation && (
        <SimpleEditQuotationDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          quotation={editingQuotation}
          onSuccess={() => {
            loadQuotations()
            setEditDialogOpen(false)
            setEditingQuotation(null)
          }}
        />
      )}
      
      {/* PDF Viewer Dialog */}
      {viewingQuotation && (
        <QuotationPDFViewerDialog
          open={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          quotation={viewingQuotation}
        />
      )}
      
      {/* Create Quotation Dialog */}
      <CreateQuotationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          loadQuotations()
          setCreateDialogOpen(false)
        }}
      />
    </DashboardLayout>
  )
}
