import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Share2, FileText, Download, Calendar, IndianRupee, Clock, User, Building2, Phone, Mail, CreditCard } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Invoice } from '@/lib/services/invoice-service'

interface ViewInvoiceDialogProps {
  invoice: Invoice
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onRequestDelete?: (invoice: Invoice) => void
}

export function ViewInvoiceDialog({ invoice, children, open: controlledOpen, onOpenChange, onRequestDelete }: ViewInvoiceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const { toast } = useToast()
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const handleCopyInvoiceNumber = () => {
    navigator.clipboard.writeText(invoice.invoice_number)
    toast({
      title: "Copied!",
      description: "Invoice number copied to clipboard"
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "paid":
        return "bg-green-100 text-green-800 border-green-200"
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200"
      case "cancelled":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Removed separate payment_status concept; using single invoice.status field now.

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  const clientName = invoice.client 
    ? `${invoice.client.first_name} ${invoice.client.last_name}`
    : 'N/A'

  const projectName = invoice.project?.name || 'N/A'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-green-600" />
              <div>
                <div className="flex items-center gap-2">
                  <span>Invoice {invoice.invoice_number}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyInvoiceNumber}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm font-normal text-muted-foreground">
                  {invoice.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
              </Badge>
              {/* Removed payment_status badge (no separate column in current schema) */}
              {onRequestDelete && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onRequestDelete(invoice)}
                >
                  Delete
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Client & Project Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Information */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Information
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{clientName}</p>
                    {invoice.client?.company && (
                      <p className="text-muted-foreground">{invoice.client.company}</p>
                    )}
                  </div>
                </div>
                {invoice.client?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{invoice.client.email}</span>
                  </div>
                )}
                {invoice.client?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{invoice.client.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Project Information */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3">Project Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Project:</span>
                  <p className="font-medium">{projectName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Template:</span>
                  <p className="font-medium capitalize">{invoice.template}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dates
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Issue Date:</span>
                  <p>{new Date(invoice.issue_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Due Date:</span>
                  <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
                {invoice.payment_date && (
                  <div>
                    <span className="text-muted-foreground">Payment Date:</span>
                    <p>{new Date(invoice.payment_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p>{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Items & Totals */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Invoice Items</h3>
              </div>
              <div className="divide-y">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <div key={item.id || index} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Qty: {item.quantity}</span>
                            <span>Rate: {formatCurrency(item.unit_price, invoice.currency)}</span>
                            {/* HSN/SAC removed from schema */}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(item.amount, invoice.currency)}
                          </p>
                          {/* Tax per item removed; only invoice-level tax retained */}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No items found
                  </div>
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="border rounded-lg">
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <IndianRupee className="h-4 w-4" />
                  Summary
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({invoice.tax_rate}%):</span>
                  <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            {(invoice.notes || invoice.terms) && (
              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Additional Information</h3>
                </div>
                <div className="p-4 space-y-4">
                  {invoice.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {invoice.notes}
                      </p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <h4 className="font-medium mb-2">Terms & Conditions:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {invoice.terms}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attachments */}
            {invoice.attachments && invoice.attachments.length > 0 && (
              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Attachments ({invoice.attachments.length})</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 gap-2">
                    {invoice.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-sm">{attachment.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(attachment.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}