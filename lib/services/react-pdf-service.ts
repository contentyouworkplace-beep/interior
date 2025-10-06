import { pdf } from '@react-pdf/renderer'
import { createQuotationPDFDocument } from '@/components/pdf/quotation-pdf-document'
import { QuotationInvoiceData } from '@/lib/types/document-types'
import { CompanyData } from './company-data-service'

export class ReactPDFService {
  /**
   * Generate PDF blob from quotation/invoice data using React PDF
   */
  static async generatePDF(
    documentData: QuotationInvoiceData,
    companyData: CompanyData
  ): Promise<Blob> {
    try {
      console.log('ReactPDFService: Starting PDF generation')
      console.log('Document data:', documentData)
      console.log('Company data:', companyData)

      // Create the PDF document
      const document = createQuotationPDFDocument(documentData, companyData)

      // Generate PDF blob
      const blob = await pdf(document).toBlob()

      console.log('ReactPDFService: PDF generated successfully', {
        size: blob.size,
        type: blob.type,
      })

      return blob
    } catch (error) {
      console.error('ReactPDFService: Error generating PDF:', error)
      throw new Error(
        `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Download PDF directly
   */
  static async downloadPDF(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    filename?: string
  ): Promise<void> {
    try {
      const blob = await this.generatePDF(documentData, companyData)

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download =
        filename || `${documentData.metadata.documentType}-${documentData.metadata.documentNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('ReactPDFService: PDF downloaded successfully')
    } catch (error) {
      console.error('ReactPDFService: Error downloading PDF:', error)
      throw error
    }
  }

  /**
   * Generate PDF and return as data URL for iframe display
   */
  static async generatePDFDataURL(
    documentData: QuotationInvoiceData,
    companyData: CompanyData
  ): Promise<string> {
    try {
      const blob = await this.generatePDF(documentData, companyData)
      const url = URL.createObjectURL(blob)
      console.log('ReactPDFService: PDF data URL generated:', url)
      return url
    } catch (error) {
      console.error('ReactPDFService: Error generating PDF data URL:', error)
      throw error
    }
  }

  /**
   * Print PDF directly
   */
  static async printPDF(
    documentData: QuotationInvoiceData,
    companyData: CompanyData
  ): Promise<void> {
    try {
      const blob = await this.generatePDF(documentData, companyData)
      const url = URL.createObjectURL(blob)

      // Open in a new window and trigger print
      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
      }

      // Cleanup after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)

      console.log('ReactPDFService: PDF print initiated')
    } catch (error) {
      console.error('ReactPDFService: Error printing PDF:', error)
      throw error
    }
  }
}
