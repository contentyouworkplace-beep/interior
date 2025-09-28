"use client"

// Legacy (quotationId-based) ShareQuotationDialog removed in favor of richer quotation-prop version below.
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Copy, Mail, MessageSquare, Send, Loader2, Download, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Quotation, QuotationService } from '@/lib/services/quotation-service'
import { PDFGenerationService } from '@/lib/services/pdf-generation-service'
import { EmailService } from '@/lib/services/email-service'
import { CompanyDataService } from '@/lib/services/company-data-service'

interface ShareQuotationDialogProps {
  quotation: Quotation
  children: React.ReactNode
}

export function ShareQuotationDialog({ quotation, children }: ShareQuotationDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailContent, setEmailContent] = useState({ subject: '', body: '' })
  const [whatsappMessage, setWhatsappMessage] = useState('')
  const [recipientEmail, setRecipientEmail] = useState(quotation.client?.email || '')
  const [recipientPhone, setRecipientPhone] = useState(quotation.client?.phone || '')
  const [copyToSelf, setCopyToSelf] = useState(false)
  const [additionalEmails, setAdditionalEmails] = useState('')
  
  const quotationService = new QuotationService()
  const pdfService = new PDFGenerationService()
  const emailService = new EmailService()
  const companyService = new CompanyDataService()

  React.useEffect(() => {
    if (open) {
      loadEmailTemplate()
      loadWhatsAppTemplate()
    }
  }, [open, quotation])

  const loadEmailTemplate = () => {
    const clientName = `${quotation.client?.first_name || ''} ${quotation.client?.last_name || ''}`.trim() || 'Valued Client'
    
    const subject = `Quotation ${quotation.quotation_number} - ${quotation.title || 'Your Project'}`
    
    const body = `Dear ${clientName},

Thank you for your inquiry. Please find attached your quotation ${quotation.quotation_number} for ${quotation.title || 'your project'}.

Quotation Details:
• Amount: ₹${quotation.total_amount?.toLocaleString() || '0'}
• Valid Until: ${new Date(quotation.valid_until).toLocaleDateString()}

If you have any questions or would like to discuss this quotation further, please don't hesitate to reach out. We look forward to working with you!

Best regards,
Your Team`
    
    setEmailContent({ subject, body })
  }

  const loadWhatsAppTemplate = () => {
    const clientName = `${quotation.client?.first_name || ''} ${quotation.client?.last_name || ''}`.trim() || 'Valued Client'
    
    const message = `Hi ${clientName}! 👋

Your quotation ${quotation.quotation_number} is ready!

💰 Amount: ₹${quotation.total_amount?.toLocaleString() || '0'}
📅 Valid Until: ${new Date(quotation.valid_until).toLocaleDateString()}
📄 Project: ${quotation.title || 'Your Project'}

I'm sending you the PDF document. Please review it and let me know if you have any questions!

Thank you for choosing us! 🙏`
    
    setWhatsappMessage(message)
  }

  const handleWhatsAppShare = async () => {
    if (!recipientPhone) {
      toast.error("Phone number is required")
      return
    }

    setLoading(true)
    try {
      toast.info("Preparing WhatsApp message...", {
        description: "Downloading PDF and opening WhatsApp"
      })

      // Generate and download PDF first
      const companyData = await companyService.getCompanyData()
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
          address: quotation.client?.address || '',
          city: quotation.client?.city || '',
          state: quotation.client?.state || '',
          pinCode: quotation.client?.zip_code || '',
          gstin: quotation.client?.gstin || ''
        },
        lineItems: quotation.items?.map((item: any) => ({
          description: item.description || item.name || 'Item',
          quantity: item.quantity || 1,
          unit: item.unit || 'piece',
          unitPrice: item.unit_price || item.price || 0,
          total: (item.quantity || 1) * (item.unit_price || item.price || 0),
          notes: item.notes || ''
        })) || [],
        totals: {
          subtotal: quotation.subtotal || 0,
          discountAmount: 0,
          taxableAmount: quotation.subtotal || 0,
          cgstAmount: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_amount || 0) / 2 : 0,
          sgstAmount: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_amount || 0) / 2 : 0,
          igstAmount: quotation.gst_type === 'igst' ? quotation.tax_amount || 0 : 0,
          roundOffAmount: 0,
          finalTotal: quotation.total_amount || 0
        },
        taxConfig: {
          cgst: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_rate || 18) / 2 : 0,
          sgst: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_rate || 18) / 2 : 0,
          igst: quotation.gst_type === 'igst' ? quotation.tax_rate || 18 : 0
        },
        terms: quotation.terms || '',
        status: quotation.status
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
      
      toast.success("WhatsApp opened!", {
        description: "PDF downloaded. Please attach the PDF file to your WhatsApp message and send."
      })
      
      setOpen(false)
    } catch (error) {
      console.error('Error preparing WhatsApp:', error)
      toast.error("Failed to prepare WhatsApp message", {
        description: "Please try again"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailShare = async () => {
    if (!recipientEmail) {
      toast.error("Email address is required")
      return
    }

    setLoading(true)
    try {
      toast.info("Preparing email and PDF...", {
        description: "Downloading PDF and opening email client"
      })

      // Generate and download PDF first
      const companyData = await companyService.getCompanyData()
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
          email: recipientEmail,
          phone: quotation.client?.phone || '',
          address: quotation.client?.address || '',
          city: quotation.client?.city || '',
          state: quotation.client?.state || '',
          pinCode: quotation.client?.zip_code || '',
          gstin: quotation.client?.gstin || ''
        },
        lineItems: quotation.items?.map((item: any) => ({
          description: item.description || item.name || 'Item',
          quantity: item.quantity || 1,
          unit: item.unit || 'piece',
          unitPrice: item.unit_price || item.price || 0,
          total: (item.quantity || 1) * (item.unit_price || item.price || 0),
          notes: item.notes || ''
        })) || [],
        totals: {
          subtotal: quotation.subtotal || 0,
          discountAmount: 0,
          taxableAmount: quotation.subtotal || 0,
          cgstAmount: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_amount || 0) / 2 : 0,
          sgstAmount: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_amount || 0) / 2 : 0,
          igstAmount: quotation.gst_type === 'igst' ? quotation.tax_amount || 0 : 0,
          roundOffAmount: 0,
          finalTotal: quotation.total_amount || 0
        },
        taxConfig: {
          cgst: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_rate || 18) / 2 : 0,
          sgst: quotation.gst_type === 'cgst_sgst' ? (quotation.tax_rate || 18) / 2 : 0,
          igst: quotation.gst_type === 'igst' ? quotation.tax_rate || 18 : 0
        },
        terms: quotation.terms || '',
        status: quotation.status
      }

      // Download PDF first
      await pdfService.downloadDocument(documentData, companyData)

      // Prepare email recipients
      let emailTo = recipientEmail
      if (additionalEmails) {
        const additional = additionalEmails.split(',').map(e => e.trim()).filter(e => e)
        if (additional.length > 0) {
          emailTo += ',' + additional.join(',')
        }
      }

      // Create mailto link
      const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(emailContent.subject)}&body=${encodeURIComponent(emailContent.body)}`
      
      // Open email client
      window.location.href = mailtoLink

      toast.success("Email client opened!", {
        description: "PDF downloaded. Please attach the PDF file to your email and send."
      })
      
      setOpen(false)
    } catch (error) {
      console.error('Error preparing email:', error)
      toast.error("Failed to prepare email", {
        description: "Please try again"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyContent = async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success("📋 Copied!", {
        description: `${type} content copied to clipboard`
      })
    } catch (error) {
      toast.error("❌ Error", {
        description: "Failed to copy content"
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

  const clientName = quotation.client 
    ? `${quotation.client.first_name} ${quotation.client.last_name}`
    : 'Client'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Share Quotation {quotation.quotation_number}
          </DialogTitle>
        </DialogHeader>

        {/* Quotation Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Client:</span>
              <p className="font-medium">{clientName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Amount:</span>
              <p className="font-medium">{formatCurrency(quotation.total_amount, quotation.currency)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Valid Until:</span>
              <p className="font-medium">{new Date(quotation.valid_until).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium capitalize">{quotation.status}</p>
            </div>
          </div>
        </div>

        {/* PDF Download Section */}
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Download PDF</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Download the quotation PDF to share directly</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              try {
                const pdfUrl = `${window.location.origin}/api/quotations/${quotation.id}/pdf`
                const link = document.createElement('a')
                link.href = pdfUrl
                link.download = `Quotation-${quotation.quotation_number}.pdf`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                
                toast.success("📄 PDF Downloaded", {
                  description: "Quotation PDF has been downloaded to your device"
                })
              } catch (error) {
                toast.error("❌ Download Failed", {
                  description: "Failed to download PDF"
                })
              }
            }}
            className="border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
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
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Email
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
                disabled={loading || !whatsappMessage}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4 mr-2" />
                )}
                Open WhatsApp
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}