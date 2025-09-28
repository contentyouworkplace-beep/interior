import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Mail, MessageSquare, Send, Loader2, CreditCard } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Invoice, InvoiceService } from '@/lib/services/invoice-service'
import { PDFGenerationService } from '@/lib/services/pdf-generation-service'
import { CompanyDataService } from '@/lib/services/company-data-service'

interface ShareInvoiceDialogProps {
  invoice: Invoice
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShareInvoiceDialog({ invoice, children, open: controlledOpen, onOpenChange }: ShareInvoiceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailContent, setEmailContent] = useState({ subject: '', body: '' })
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [recipientEmail, setRecipientEmail] = useState(invoice.client?.email || '')
  const [recipientPhone, setRecipientPhone] = useState(invoice.client?.phone || '')
  
  const { toast } = useToast()
  const invoiceService = new InvoiceService()
  const pdfService = new PDFGenerationService()
  const companyService = new CompanyDataService()
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  React.useEffect(() => {
    if (open) {
      loadEmailTemplate()
      loadWhatsAppTemplate()
    }
  }, [open, invoice])

  const loadEmailTemplate = async () => {
    try {
      const { subject, body } = await invoiceService.prepareEmailContent(invoice, 'invoice_share')
      setEmailContent({ subject, body })
    } catch (error) {
      console.error('Error loading email template:', error)
    }
  }

  const loadWhatsAppTemplate = async () => {
    try {
      const message = await invoiceService.prepareWhatsAppMessage(invoice)
      setWhatsappMessage(message)
    } catch (error) {
      console.error('Error loading WhatsApp template:', error)
    }
  }

  const handleEmailShare = async () => {
    if (!recipientEmail) {
      toast({
        title: "Error",
        description: "Please enter recipient email address",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      toast({
        title: "Preparing email...",
        description: "Downloading PDF and opening email client"
      })

      // Generate and download PDF first
      const companyData = await companyService.getCompanyData()
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
          address: invoice.client?.address || '',
          city: invoice.client?.city || '',
          state: invoice.client?.state || '',
          pinCode: invoice.client?.zip_code || '',
          gstin: invoice.client?.gstin || ''
        },
        lineItems: invoice.items?.map((item: any) => ({
          description: item.description || item.name || 'Item',
          quantity: item.quantity || 1,
          unit: item.unit || 'piece',
          unitPrice: item.unit_price || item.price || 0,
          total: (item.quantity || 1) * (item.unit_price || item.price || 0),
          notes: item.notes || ''
        })) || [],
        totals: {
          subtotal: invoice.subtotal || 0,
          discountAmount: 0,
          taxableAmount: invoice.subtotal || 0,
          cgstAmount: invoice.gst_type === 'cgst_sgst' ? (invoice.tax_amount || 0) / 2 : 0,
          sgstAmount: invoice.gst_type === 'cgst_sgst' ? (invoice.tax_amount || 0) / 2 : 0,
          igstAmount: invoice.gst_type === 'igst' ? invoice.tax_amount || 0 : 0,
          roundOffAmount: 0,
          finalTotal: invoice.total_amount || 0
        },
        taxConfig: {
          cgst: invoice.gst_type === 'cgst_sgst' ? (invoice.tax_rate || 18) / 2 : 0,
          sgst: invoice.gst_type === 'cgst_sgst' ? (invoice.tax_rate || 18) / 2 : 0,
          igst: invoice.gst_type === 'igst' ? invoice.tax_rate || 18 : 0
        },
        terms: invoice.terms || '',
        status: invoice.status,
        paymentStatus: invoice.payment_status
      }

      // Download PDF first
      await pdfService.downloadDocument(documentData, companyData)

      // Open email client with pre-filled content
      const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`
      window.open(mailtoUrl, '_blank')
      
      toast({
        title: "Email client opened!",
        description: "PDF downloaded. Please attach the PDF file to your email and send."
      })
      setOpen(false)
    } catch (error) {
      console.error('Error preparing email:', error)
      toast({
        title: "Error",
        description: "Failed to prepare email",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsAppShare = async () => {
    if (!recipientPhone) {
      toast({
        title: "Error", 
        description: "Phone number is required",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      toast({
        title: "Preparing WhatsApp message...",
        description: "Downloading PDF and opening WhatsApp"
      })

      // Generate and download PDF first
      const companyData = await companyService.getCompanyData()
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
          address: invoice.client?.address || '',
          city: invoice.client?.city || '',
          state: invoice.client?.state || '',
          pinCode: invoice.client?.zip_code || '',
          gstin: invoice.client?.gstin || ''
        },
        lineItems: invoice.items?.map((item: any) => ({
          description: item.description || item.name || 'Item',
          quantity: item.quantity || 1,
          unit: item.unit || 'piece',
          unitPrice: item.unit_price || item.price || 0,
          total: (item.quantity || 1) * (item.unit_price || item.price || 0),
          notes: item.notes || ''
        })) || [],
        totals: {
          subtotal: invoice.subtotal || 0,
          discountAmount: 0,
          taxableAmount: invoice.subtotal || 0,
          cgstAmount: invoice.gst_type === 'cgst_sgst' ? (invoice.tax_amount || 0) / 2 : 0,
          sgstAmount: invoice.gst_type === 'cgst_sgst' ? (invoice.tax_amount || 0) / 2 : 0,
          igstAmount: invoice.gst_type === 'igst' ? invoice.tax_amount || 0 : 0,
          roundOffAmount: 0,
          finalTotal: invoice.total_amount || 0
        },
        taxConfig: {
          cgst: invoice.gst_type === 'cgst_sgst' ? (invoice.tax_rate || 18) / 2 : 0,
          sgst: invoice.gst_type === 'cgst_sgst' ? (invoice.tax_rate || 18) / 2 : 0,
          igst: invoice.gst_type === 'igst' ? invoice.tax_rate || 18 : 0
        },
        terms: invoice.terms || '',
        status: invoice.status,
        paymentStatus: invoice.payment_status
      }

      // Download PDF first
      await pdfService.downloadDocument(documentData, companyData)
      
      // Format phone number (remove spaces, dashes, and ensure country code)
      let formattedPhone = recipientPhone.replace(/\s|-|\+/g, '')
      
      // Add country code if not present (assuming India +91)
      if (formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`
      }
      
      // Open WhatsApp with pre-filled message
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappMessage)}`
      window.open(whatsappUrl, '_blank')
      
      toast({
        title: "WhatsApp opened!",
        description: "PDF downloaded. Please attach the PDF file to your WhatsApp message and send."
      })
      setOpen(false)
    } catch (error) {
      console.error('Error preparing WhatsApp:', error)
      toast({
        title: "Error",
        description: "Failed to prepare WhatsApp message",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyContent = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast({
        title: "Copied!",
        description: `${type} content copied to clipboard`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy content",
        variant: "destructive"
      })
    }
  }

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  const clientName = invoice.client 
    ? `${invoice.client.first_name} ${invoice.client.last_name}`
    : 'Client'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Share Invoice {invoice.invoice_number}
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Client:</span>
              <p className="font-medium">{clientName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <p className="font-medium">{formatCurrency(invoice.total_amount, invoice.currency)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Due Date:</span>
              <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-2">
                <span className="capitalize">{invoice.status}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 capitalize">
                  {invoice.payment_status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <Label htmlFor="email-subject">Subject</Label>
                <div className="relative">
                  <Input
                    id="email-subject"
                    value={emailContent.subject}
                    onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                    placeholder="Email subject"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => handleCopyContent(emailContent.subject, 'Subject')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="email-body">Message</Label>
                <div className="relative">
                  <Textarea
                    id="email-body"
                    value={emailContent.body}
                    onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                    placeholder="Email message"
                    rows={8}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => handleCopyContent(emailContent.body, 'Email')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleEmailShare} 
                disabled={loading || !recipientEmail}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Share via Email
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient-phone">Phone Number (optional)</Label>
                <Input
                  id="recipient-phone"
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Include country code for international numbers
                </p>
              </div>

              <div>
                <Label htmlFor="whatsapp-message">Message</Label>
                <div className="relative">
                  <Textarea
                    id="whatsapp-message"
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    placeholder="WhatsApp message"
                    rows={10}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => handleCopyContent(whatsappMessage, 'WhatsApp message')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleWhatsAppShare} 
                disabled={loading || !recipientPhone}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Share via WhatsApp
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}