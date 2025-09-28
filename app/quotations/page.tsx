
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
  MoreHorizontal,
  FileText,
  IndianRupee,
  Calendar,
  Download,
  Send,
  Edit,
  Copy,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Receipt,
  Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { toast } from "sonner"
import { QuotationService, Quotation } from "@/lib/services/quotation-service"
import { InvoiceService } from "@/lib/services/invoice-service"
import { CreateQuotationDialog } from "@/components/create-quotation-dialog-clean"
import { EditQuotationDialog } from "@/components/edit-quotation-dialog"
import { ShareQuotationDialog } from "@/components/share-quotation-dialog" 
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"

export default function QuotationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [convertingId, setConvertingId] = useState<string | null>(null)

  const router = useRouter()
  
  // Test function for toasts
  const testToast = () => {
    toast.success("🎉 Toast Test Successful!", {
      description: "Sonner toasts are working correctly!"
    })
  }
  
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
      const { PDFGenerationService } = await import('@/lib/services/pdf-generation-service')
      const { CompanyDataService } = await import('@/lib/services/company-data-service')
      const { documentStorage } = await import('@/lib/services/document-storage-service')
      const { activityLogger } = await import('@/lib/services/activity-logging-service')
      
      const pdfService = new PDFGenerationService()
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
      
      // Generate PDF
      const pdfBlob = await pdfService.generateDocument(documentData, companyData)
      
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
        status: 'draft' as const,
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
    // Navigate to the new dynamic page for editing
    router.push(`/create-document?type=quotation&id=${quotation.id}`)
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
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "expired":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "expired":
        return <AlertCircle className="h-4 w-4" />
      case "sent":
        return <Send className="h-4 w-4" />
      case "draft":
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
      title: "Draft & Sent",
      value: quotations.filter((q) => q.status === "draft" || q.status === "sent").length.toString(),
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
                  <DropdownMenuItem onClick={() => setSelectedFilter("draft")}>Draft</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("sent")}>Sent</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("approved")}>Approved</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("rejected")}>Rejected</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("expired")}>Expired</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex space-x-2">
              <Button onClick={() => router.push('/create-document?type=quotation')}>
                <Plus className="h-4 w-4 mr-2" />
                New Quotation
              </Button>
              <Button variant="outline" onClick={testToast}>
                Test Toast
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
            <Card key={item.id} className="group relative border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden bg-white">
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 min-w-0 flex-1">
                    <CardTitle className="text-xl font-bold text-gray-900 truncate tracking-tight">
                      {item.quotation_number}
                    </CardTitle>
                    <p className="text-base font-medium text-gray-700 truncate">
                      {item.client ? `${item.client.first_name} ${item.client.last_name}` : 'No client'}
                    </p>
                    <p className="text-sm text-gray-500 truncate font-medium">
                      {item.project?.name || item.title}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Badge className={`${getStatusColor(item.status)} flex items-center space-x-1 px-3 py-1 text-xs font-semibold`}>
                      {getStatusIcon(item.status)}
                      <span className="capitalize">{item.status}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-6">
                {/* Financial Information */}
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {quotationService.formatCurrency(item.subtotal, item.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">GST ({item.tax_rate}%):</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {quotationService.formatCurrency(item.tax_amount, item.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-base font-bold text-gray-900">Total:</span>
                      <span className="text-lg font-bold text-blue-600">
                        {quotationService.formatCurrency(item.total_amount, item.currency)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4 py-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{item.items?.length || 0}</p>
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

                {/* Valid Until - Pushed to bottom */}
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 mt-auto">
                  <span className="text-sm font-medium text-amber-800">Valid until:</span>
                  <div className="flex items-center text-amber-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm font-semibold">
                      {new Date(item.valid_until).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 mt-4">
                  {/* Primary Actions Row */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center justify-center gap-2 h-10 font-medium border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                    onClick={() => router.push(`/create-document?type=quotation&id=${item.id}&mode=view`)}
                  >
                    <Eye className="h-4 w-4" />
                    <span>View</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center justify-center gap-2 h-10 font-medium border-gray-300 hover:border-green-400 hover:bg-green-50 hover:text-green-600 transition-all"
                    onClick={() => handleEditQuotation(item)}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                  
                  {/* Secondary Actions Row */}
                  <ShareQuotationDialog quotation={item}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center justify-center gap-2 h-10 font-medium border-gray-300 hover:border-purple-400 hover:bg-purple-50 hover:text-purple-600 transition-all"
                    >
                      <Send className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </ShareQuotationDialog>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center justify-center gap-2 h-10 font-medium border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span>More</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[200px]">
                      <DropdownMenuItem 
                        onClick={() => handleDownloadPDF(item)}
                        className="flex items-center gap-3 p-3 font-medium hover:bg-blue-50 focus:bg-blue-50"
                      >
                        <Download className="h-4 w-4 text-blue-600" />
                        <span>Download PDF</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleConvertToInvoice(item)}
                        className="flex items-center gap-3 p-3 font-medium hover:bg-green-50 focus:bg-green-50"
                      >
                        <Receipt className="h-4 w-4 text-green-600" />
                        <span>Convert to Invoice</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDuplicateQuotation(item)}
                        className="flex items-center gap-3 p-3 font-medium hover:bg-yellow-50 focus:bg-yellow-50"
                      >
                        <Copy className="h-4 w-4 text-yellow-600" />
                        <span>Duplicate</span>
                      </DropdownMenuItem>
                      <DeleteConfirmationDialog
                        title="Delete Quotation"
                        description={`Are you sure you want to delete quotation ${item.quotation_number}? This action cannot be undone.`}
                        onConfirm={() => handleDeleteQuotation(item.id)}
                      >
                        <DropdownMenuItem 
                          className="flex items-center gap-3 p-3 font-medium text-red-600 hover:bg-red-50 focus:bg-red-50"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DeleteConfirmationDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
        <EditQuotationDialog
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
