"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Quotation } from "@/lib/services/quotation-service"
import { ReactPDFService } from "@/lib/services/react-pdf-service"
import { CompanyDataService } from "@/lib/services/company-data-service"
import { documentStorage } from "@/lib/services/document-storage-service"
import { activityLogger } from "@/lib/services/activity-logging-service"

interface QuotationPDFViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation
}

export function QuotationPDFViewerDialog({
  open,
  onOpenChange,
  quotation
}: QuotationPDFViewerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [embeddedCompanyData, setEmbeddedCompanyData] = useState<any>(null)

  useEffect(() => {
    if (open && quotation) {
      generatePDF()
    }
    
    // Cleanup: revoke object URL when dialog closes
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [open, quotation])

  const generatePDF = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Starting PDF generation for quotation:', quotation.quotation_number)
      
      // Import services
      const companyService = new CompanyDataService()
      
      // Get company data
      console.log('📦 Fetching company data...')
      const companyDataResult = await companyService.getCompanyData()
      console.log('✅ Company data result:', companyDataResult)
      console.log('🏦 QR Code URLs in company data:', {
        banking_qr: companyDataResult.data?.banking?.qr_code_url,
        branding_qr: companyDataResult.data?.branding?.qr_code_url,
        has_qr: !!(companyDataResult.data?.banking?.qr_code_url || companyDataResult.data?.branding?.qr_code_url)
      })
      
      if (!companyDataResult.success || !companyDataResult.data) {
        throw new Error(companyDataResult.error || 'Failed to fetch company data')
      }
      const companyData = companyDataResult.data

      // Helper to fetch & embed image as base64
  const fetchAndEmbed = async (url: string, label: string, forcePng?: boolean): Promise<{ dataUri: string; base64: string; format: string } | undefined> => {
        try {
          if (!url) return
          console.log(`🖼️ Fetching ${label} image for embedding:`, url)
          const resp = await fetch(url, { cache: 'no-store' })
          if (!resp.ok) {
            console.warn(`⚠️ ${label} fetch failed (status):`, resp.status)
            return
          }
            let contentType = resp.headers.get('content-type') || 'image/png'
            let blob = await resp.blob()
            // Transcode unsupported formats OR if forcePng flag present (used for QR reliability)
            const needsTranscode = forcePng || /image\/(webp|gif|svg\+xml|svg)/i.test(contentType)
            if (needsTranscode && typeof window !== 'undefined') {
              try {
                // Create HTMLImageElement to draw
                const arrayBufferRaw = await blob.arrayBuffer()
                const bytesRaw = new Uint8Array(arrayBufferRaw)
                let binaryRaw = ''
                for (let i = 0; i < bytesRaw.length; i++) binaryRaw += String.fromCharCode(bytesRaw[i])
                const rawBase64 = window.btoa(binaryRaw)
                const tempSrc = `data:${contentType};base64,${rawBase64}`
                const img = new Image()
                const transcodeResult: {promise: Promise<Blob>} = { promise: Promise.resolve(blob) }
                const blobPromise = new Promise<Blob>((resolve, reject) => {
                  img.onload = () => {
                    try {
                      const canvas = document.createElement('canvas')
                      canvas.width = img.width
                      canvas.height = img.height
                      const ctx = canvas.getContext('2d')
                      if (!ctx) return reject('No 2d context')
                      ctx.drawImage(img, 0, 0)
                      canvas.toBlob((pngBlob) => {
                        if (pngBlob) {
                          resolve(pngBlob)
                        } else {
                          reject('Failed to toBlob PNG')
                        }
                      }, 'image/png')
                    } catch (e) {
                      reject(e)
                    }
                  }
                  img.onerror = (e) => reject(e)
                  img.src = tempSrc
                })
                blob = await blobPromise
                contentType = 'image/png'
                console.log(`🔄 Transcoded ${label} to PNG for PDF compatibility`)
              } catch (tErr) {
                console.warn(`⚠️ Failed to transcode ${label}, using original format:`, tErr)
              }
            }
            const arrayBuffer = await blob.arrayBuffer()
            const bytes = new Uint8Array(arrayBuffer)
            let binary = ''
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
            const base64 = typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(binary, 'binary').toString('base64')
            const dataUri = `data:${contentType};base64,${base64}`
            const format = (contentType.split('/')[1] || 'png').split(';')[0]
            console.log(`✅ Embedded ${label} (format=${format}) (length):`, dataUri.length)
            return { dataUri, base64, format }
        } catch (e) {
          console.warn(`⚠️ Failed to embed ${label}:`, e)
        }
      }

      // Embed logo first (if available) - force PNG for better compatibility
      if (companyData.branding?.logo_url) {
        const logoEmbedded = await fetchAndEmbed(companyData.branding.logo_url, 'logo', true)
        if (logoEmbedded) {
          companyData.logo_data_uri = logoEmbedded.dataUri
          companyData.logo_base64 = logoEmbedded.base64
          companyData.logo_format = logoEmbedded.format
        }
      } else {
        console.log('ℹ️ No logo URL available to embed.')
      }

      // Embed QR (branding preferred, then banking)
      const qrUrl = companyData.branding?.qr_code_url || companyData.banking?.qr_code_url
      if (qrUrl) {
        const qrEmbedded = await fetchAndEmbed(qrUrl, 'QR', true)
        if (qrEmbedded) {
          companyData.qr_code_data_uri = qrEmbedded.dataUri
          companyData.qr_code_base64 = qrEmbedded.base64
          companyData.qr_code_format = qrEmbedded.format
        }
      } else {
        console.log('ℹ️ No QR URL available to embed.')
      }

      // Embed signature (if available) - force PNG for better compatibility
      if (companyData.branding?.signature_url) {
        const signatureEmbedded = await fetchAndEmbed(companyData.branding.signature_url, 'signature', true)
        if (signatureEmbedded) {
          companyData.signature_data_uri = signatureEmbedded.dataUri
          companyData.signature_base64 = signatureEmbedded.base64
          companyData.signature_format = signatureEmbedded.format
        }
      } else {
        console.log('ℹ️ No signature URL available to embed.')
      }
      
      console.log('🏢 Company Data:', {
        name: companyData.profile?.company_name,
        hasLogo: !!companyData.branding?.logo_url,
        hasSignature: !!companyData.branding?.signature_url,
        hasBanking: !!companyData.banking?.bank_name,
        primaryColor: companyData.branding?.primary_color
      })

      // Save embedded company data for download
      setEmbeddedCompanyData(companyData)
      
      // Convert quotation to document format
      console.log('📄 Converting quotation data...')
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
        totals: (() => {
          // Calculate subtotal from line items if not provided
          const calculatedSubtotal = quotation.items?.reduce((sum: number, item: any) => {
            return sum + ((item.quantity || 1) * (item.unit_price || item.price || 0))
          }, 0) || 0
          
          const subtotal = quotation.subtotal || calculatedSubtotal
          const taxRate = quotation.tax_rate || 18
          const gstType = quotation.gst_type || 'cgst_sgst' // Default to CGST/SGST
          
          // Calculate tax amount
          const calculatedTaxAmount = (subtotal * taxRate) / 100
          const taxAmount = quotation.tax_amount || calculatedTaxAmount
          
          // Calculate total
          const calculatedTotal = subtotal + taxAmount
          const finalTotal = quotation.total_amount || calculatedTotal
          
          return {
            subtotal: subtotal,
            discountAmount: 0,
            taxableAmount: subtotal,
            cgstAmount: gstType === 'cgst_sgst' ? taxAmount / 2 : 0,
            sgstAmount: gstType === 'cgst_sgst' ? taxAmount / 2 : 0,
            igstAmount: gstType === 'igst' ? taxAmount : 0,
            totalTaxAmount: taxAmount,
            roundOffAmount: 0,
            finalTotal: finalTotal
          }
        })(),
        taxConfig: {
          gstRate: quotation.tax_rate || 18,
          cgst: (quotation.gst_type || 'cgst_sgst') === 'cgst_sgst' ? (quotation.tax_rate || 18) / 2 : 0,
          sgst: (quotation.gst_type || 'cgst_sgst') === 'cgst_sgst' ? (quotation.tax_rate || 18) / 2 : 0,
          igst: quotation.gst_type === 'igst' ? quotation.tax_rate || 18 : 0
        },
        terms: quotation.terms || '',
        status: quotation.status === 'approved' ? 'accepted' as const : quotation.status === 'rejected' ? 'rejected' as const : 'sent' as const
      }
      
      console.log('📝 Document data prepared:', {
        documentNumber: documentData.metadata.documentNumber,
        itemCount: documentData.lineItems.length,
        subtotal: documentData.totals.subtotal,
        taxAmount: documentData.totals.totalTaxAmount,
        total: documentData.totals.finalTotal,
        taxRate: documentData.taxConfig.gstRate,
        gstType: quotation.gst_type
      })
      
      // Generate PDF using React PDF
      console.log('🎨 Generating PDF with React PDF...')
      const pdfUrl = await ReactPDFService.generatePDFDataURL(documentData, companyData)
      
      console.log('✅ PDF generated successfully')
      
      // Set PDF URL for display
      setPdfUrl(pdfUrl)
      
      console.log('✅ PDF ready for display')
      setLoading(false)
    } catch (error) {
      console.error('❌ Failed to generate PDF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF'
      setError(errorMessage)
      setLoading(false)
      toast.error("Failed to generate PDF preview", {
        description: errorMessage
      })
    }
  }

  const handleDownload = async () => {
    if (!pdfUrl) return
    
    try {
      const fileName = `Quotation-${quotation.quotation_number}-${new Date().toISOString().split('T')[0]}.pdf`
      
      // Create download link
      const a = document.createElement('a')
      a.href = pdfUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      // Log activity
      await activityLogger.logDocumentDownloaded(
        'quotation',
        quotation.id,
        quotation.quotation_number,
        'pdf'
      )
      
      toast.success("PDF downloaded successfully!")
    } catch (error) {
      console.error('Download failed:', error)
      toast.error("Failed to download PDF")
    }
  }

  const handlePrint = () => {
    if (!pdfUrl) return
    
    const printWindow = window.open(pdfUrl)
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                Quotation Preview - {quotation.quotation_number}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {quotation.client ? `${quotation.client.first_name} ${quotation.client.last_name}` : 'No client'}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!pdfUrl || loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={!pdfUrl || loading}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* PDF Viewer Area */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Generating PDF preview...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <X className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-sm text-red-600 font-medium mb-2">Failed to generate PDF</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={generatePDF}>Try Again</Button>
            </div>
          )}

          {pdfUrl && !loading && !error && (
            <div className="flex justify-center">
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0`}
                className="bg-white shadow-lg rounded-lg"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '800px',
                  border: 'none'
                }}
                title={`Quotation ${quotation.quotation_number}`}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
