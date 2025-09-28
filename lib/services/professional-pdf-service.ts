import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Import Invoice interface from the actual invoice service
import type { Invoice } from './invoice-service'

// Company settings interfaces
export interface CompanyProfile {
  organization_id: string
  company_name: string
  company_tagline?: string | null
  gstin?: string | null
  pan?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  pin_code?: string | null
  website?: string | null
  cin?: string | null
  terms_and_conditions?: string | null
}

export interface BankingInfo {
  organization_id: string
  bank_name?: string | null
  account_number?: string | null
  ifsc_code?: string | null
}

export interface BrandingInfo {
  organization_id: string
  logo_url?: string | null
  signature_url?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  quotation_template?: string | null
  invoice_template?: string | null
  qr_code_url?: string | null
}

export interface CompanySettings {
  profile: CompanyProfile | null
  banking: BankingInfo | null
  branding: BrandingInfo | null
}

export class ProfessionalPDFService {
  private primaryColor: string = '#3B82F6'
  private secondaryColor: string = '#1E40AF'
  private textColor: string = '#1F2937'
  private lightGray: string = '#F3F4F6'
  private darkGray: string = '#6B7280'

  constructor() {}

  /**
   * Convert color to proper hex format
   */
  private convertToHex(color?: string | null): string | null {
    if (!color) return null
    
    // If already hex, return as is
    if (color.startsWith('#')) {
      return color
    }
    
    // Handle rgb/rgba formats if needed
    if (color.startsWith('rgb')) {
      // Convert rgb to hex (basic implementation)
      return color
    }
    
    // Add # if missing
    return `#${color}`
  }

  /**
   * Convert hex color to RGB array for jsPDF
   */
  private hexToRgb(hex: string): [number, number, number] {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('')
    }
    
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    return [r, g, b]
  }

  /**
   * Load image with better quality and error handling
   */
  private loadImageWithQuality(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      // Set high quality attributes
      img.style.imageRendering = 'high-quality'
      img.style.imageRendering = '-webkit-optimize-contrast'
      
      img.onload = () => {
        // Wait for image to fully load
        if (img.complete && img.naturalHeight !== 0) {
          resolve(img)
        } else {
          reject(new Error('Image failed to load properly'))
        }
      }
      
      img.onerror = () => {
        console.error('Failed to load image:', url)
        reject(new Error(`Failed to load image: ${url}`))
      }
      
      // Add timeout for loading
      setTimeout(() => {
        if (!img.complete) {
          reject(new Error('Image loading timeout'))
        }
      }, 10000)
      
      img.src = url
    })
  }

  /**
   * Create high quality canvas from image
   */
  private createHighQualityCanvas(img: HTMLImageElement, maxWidth: number, maxHeight: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }

    // Calculate dimensions with higher DPI
    const dpi = 2 // Retina display support
    let { width, height } = img
    
    // Scale to fit within max dimensions while maintaining aspect ratio
    const aspectRatio = width / height
    
    if (width > maxWidth) {
      width = maxWidth
      height = width / aspectRatio
    }
    
    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }
    
    // Set canvas size with higher DPI
    canvas.width = width * dpi
    canvas.height = height * dpi
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    
    // Configure context for high quality
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.scale(dpi, dpi)
    
    // Draw image with high quality
    ctx.drawImage(img, 0, 0, width, height)
    
    return canvas
  }

  /**
   * Generate a professional invoice PDF
   */
  async generateInvoicePDF(invoice: Invoice, companySettings: CompanySettings): Promise<ArrayBuffer> {
    // Create new PDF document with high quality settings
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      precision: 16 // Higher precision for better quality
    })
    
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    
    // Set high quality settings
    doc.setProperties({
      title: `Invoice ${invoice.invoice_number}`,
      subject: 'Professional Invoice',
      author: companySettings.profile?.company_name || 'Your Company',
      creator: 'Professional PDF Service'
    })
    
    // Set colors from branding with proper hex conversion
    this.primaryColor = this.convertToHex(companySettings.branding?.primary_color) || '#3B82F6'
    this.secondaryColor = this.convertToHex(companySettings.branding?.secondary_color) || '#1E40AF'

    console.log('Using colors:', this.primaryColor, this.secondaryColor)

    let yPosition = 20

    try {
      // 1. Add company logo if available
      yPosition = await this.addCompanyLogo(doc, yPosition, companySettings.branding?.logo_url)

      // 2. Add company header information
      yPosition = this.addCompanyHeader(doc, companySettings.profile, yPosition, pageWidth)

      // 3. Add invoice title and details
      yPosition = this.addInvoiceTitle(doc, invoice, yPosition, pageWidth)

      // 4. Add billing information section
      yPosition = this.addBillingSection(doc, invoice, companySettings.profile, yPosition, pageWidth)

      // 5. Add invoice items table
      yPosition = this.addInvoiceItemsTable(doc, invoice, yPosition, pageWidth)

      // 6. Add totals section
      yPosition = this.addTotalsSection(doc, invoice, yPosition, pageWidth)

      // 7. Add payment information (banking details)
      if (companySettings.banking) {
        yPosition = this.addPaymentInformation(doc, companySettings.banking, yPosition, pageWidth)
      }

      // 8. Add terms and conditions
      if (companySettings.profile?.terms_and_conditions) {
        yPosition = this.addTermsAndConditions(doc, companySettings.profile.terms_and_conditions, yPosition, pageWidth, pageHeight)
      }

      // 9. Add QR code if available
      if (companySettings.branding?.qr_code_url) {
        await this.addQRCode(doc, companySettings.branding.qr_code_url, pageWidth, pageHeight)
      }

      // 10. Add signature if available
      if (companySettings.branding?.signature_url) {
        await this.addSignature(doc, companySettings.branding.signature_url, pageWidth, pageHeight)
      }

      // 11. Add footer
      this.addFooter(doc, companySettings.profile, pageWidth, pageHeight)

    } catch (error) {
      console.error('Error generating PDF:', error)
    }

    return doc.output('arraybuffer')
  }

  /**
   * Add company logo to the PDF with high quality
   */
  private async addCompanyLogo(doc: jsPDF, yPosition: number, logoUrl?: string | null): Promise<number> {
    if (!logoUrl) return yPosition

    try {
      console.log('Loading logo:', logoUrl)
      
      // Load image with high quality
      const img = await this.loadImageWithQuality(logoUrl)
      
      // Create high quality canvas
      const maxWidth = 50 // Increased size for better visibility
      const maxHeight = 30
      const canvas = this.createHighQualityCanvas(img, maxWidth, maxHeight)
      
      // Get final dimensions
      const finalWidth = canvas.style.width ? parseFloat(canvas.style.width) : canvas.width
      const finalHeight = canvas.style.height ? parseFloat(canvas.style.height) : canvas.height
      
      // Convert to high quality PNG
      const logoData = canvas.toDataURL('image/png', 1.0) // Maximum quality
      
      // Add to PDF with better positioning
      doc.addImage(logoData, 'PNG', 15, yPosition, finalWidth, finalHeight)
      
      console.log('Logo added successfully with dimensions:', finalWidth, 'x', finalHeight)
      return yPosition + finalHeight + 10
      
    } catch (error) {
      console.error('Error adding high quality logo:', error)
      
      // Fallback: Add company name as text if logo fails
      doc.setFontSize(20)
      doc.setTextColor(this.primaryColor)
      doc.setFont('helvetica', 'bold')
      doc.text('COMPANY LOGO', 15, yPosition + 10)
      
      return yPosition + 20
    }
  }

  /**
   * Add company header information
   */
  private addCompanyHeader(doc: jsPDF, profile: CompanyProfile | null, yPosition: number, pageWidth: number): number {
    if (!profile) return yPosition

    const rightX = pageWidth - 15

    // Company name
    doc.setFontSize(24)
    doc.setTextColor(this.primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text(profile.company_name || 'Your Company', rightX, yPosition, { align: 'right' })
    yPosition += 8

    // Company tagline
    if (profile.company_tagline) {
      doc.setFontSize(12)
      doc.setTextColor(this.darkGray)
      doc.setFont('helvetica', 'normal')
      doc.text(profile.company_tagline, rightX, yPosition, { align: 'right' })
      yPosition += 6
    }

    // Contact information
    doc.setFontSize(10)
    doc.setTextColor(this.textColor)
    
    if (profile.address || profile.city || profile.state) {
      const address = [profile.address, profile.city, profile.state, profile.pin_code].filter(Boolean).join(', ')
      doc.text(address, rightX, yPosition, { align: 'right' })
      yPosition += 4
    }

    if (profile.phone) {
      doc.text(`Phone: ${profile.phone}`, rightX, yPosition, { align: 'right' })
      yPosition += 4
    }

    if (profile.email) {
      doc.text(`Email: ${profile.email}`, rightX, yPosition, { align: 'right' })
      yPosition += 4
    }

    if (profile.website) {
      doc.text(`Website: ${profile.website}`, rightX, yPosition, { align: 'right' })
      yPosition += 4
    }

    if (profile.gstin) {
      doc.text(`GSTIN: ${profile.gstin}`, rightX, yPosition, { align: 'right' })
      yPosition += 4
    }

    return yPosition + 10
  }

  /**
   * Add invoice title and basic details
   */
  private addInvoiceTitle(doc: jsPDF, invoice: Invoice, yPosition: number, pageWidth: number): number {
    // Invoice title
    doc.setFontSize(28)
    doc.setTextColor(this.primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 15, yPosition)

    // Invoice number and dates on the right
    const rightX = pageWidth - 15
    doc.setFontSize(12)
    doc.setTextColor(this.textColor)
    doc.setFont('helvetica', 'normal')

    doc.text(`Invoice #: ${invoice.invoice_number}`, rightX, yPosition, { align: 'right' })
    yPosition += 6
    doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, rightX, yPosition, { align: 'right' })
    yPosition += 6
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, rightX, yPosition, { align: 'right' })

    return yPosition + 15
  }

  /**
   * Add billing section with client and company information
   */
  private addBillingSection(doc: jsPDF, invoice: Invoice, profile: CompanyProfile | null, yPosition: number, pageWidth: number): number {
    const leftColumnWidth = (pageWidth - 40) / 2
    
    // Bill From section
    doc.setFontSize(14)
    doc.setTextColor(this.primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill From:', 15, yPosition)
    
    // Bill To section
    doc.text('Bill To:', 15 + leftColumnWidth + 10, yPosition)
    
    yPosition += 8

    // Bill From details
    doc.setFontSize(10)
    doc.setTextColor(this.textColor)
    doc.setFont('helvetica', 'normal')
    
    let fromY = yPosition
    let toY = yPosition

    if (profile) {
      doc.setFont('helvetica', 'bold')
      doc.text(profile.company_name || 'Your Company', 15, fromY)
      fromY += 5
      doc.setFont('helvetica', 'normal')
      
      if (profile.address || profile.city) {
        const address = [profile.address, profile.city, profile.state, profile.pin_code].filter(Boolean).join(', ')
        const addressLines = doc.splitTextToSize(address, leftColumnWidth - 10)
        doc.text(addressLines, 15, fromY)
        fromY += addressLines.length * 4
      }
      
      if (profile.phone) {
        doc.text(`Phone: ${profile.phone}`, 15, fromY)
        fromY += 4
      }
      
      if (profile.email) {
        doc.text(`Email: ${profile.email}`, 15, fromY)
        fromY += 4
      }
    }

    // Bill To details
    const client = invoice.client
    if (client) {
      doc.setFont('helvetica', 'bold')
      doc.text(`${client.first_name} ${client.last_name}`, 15 + leftColumnWidth + 10, toY)
      toY += 5
      doc.setFont('helvetica', 'normal')
      
      if (client.company) {
        doc.text(client.company, 15 + leftColumnWidth + 10, toY)
        toY += 4
      }
      
      if (client.phone) {
        doc.text(`Phone: ${client.phone}`, 15 + leftColumnWidth + 10, toY)
        toY += 4
      }
      
      if (client.email) {
        doc.text(`Email: ${client.email}`, 15 + leftColumnWidth + 10, toY)
        toY += 4
      }
    } else {
      doc.setFont('helvetica', 'bold')
      doc.text('Client Information', 15 + leftColumnWidth + 10, toY)
      toY += 5
      doc.setFont('helvetica', 'normal')
      doc.text('No client information available', 15 + leftColumnWidth + 10, toY)
      toY += 4
    }

    return Math.max(fromY, toY) + 15
  }

  /**
   * Add invoice items table
   */
  private addInvoiceItemsTable(doc: jsPDF, invoice: Invoice, yPosition: number, pageWidth: number): number {
    const tableColumns = ['#', 'Description', 'Qty', 'Unit Price', 'Total']
    const items = invoice.items || []
    
    // Debug logging
    console.log('PDF Service - Invoice items:', items)
    console.log('PDF Service - Items count:', items.length)
    
    const tableRows = items.map((item, index) => [
      (index + 1).toString(),
      item.description,
      item.quantity.toString(),
      `Rs. ${item.unit_price.toFixed(2)}`,
      `Rs. ${(item.quantity * item.unit_price).toFixed(2)}`
    ])

    // Convert colors to RGB for jsPDF
    const primaryRGB = this.hexToRgb(this.primaryColor)
    const lightGrayRGB = this.hexToRgb(this.lightGray)

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: yPosition,
      margin: { left: 15, right: 15 },
      styles: {
        fontSize: 10,
        cellPadding: 8, // Increased padding
        textColor: [31, 41, 55], // RGB for better compatibility
        lineColor: [209, 213, 219],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: primaryRGB,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 11,
        cellPadding: 10,
      },
      alternateRowStyles: {
        fillColor: lightGrayRGB,
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto', cellPadding: { left: 8, right: 8, top: 6, bottom: 6 } },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
        4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
      },
      theme: 'grid', // Better table theme
      tableLineColor: [209, 213, 219],
      tableLineWidth: 0.5,
    })

    return (doc as any).lastAutoTable.finalY + 10
  }

  /**
   * Add totals section
   */
  private addTotalsSection(doc: jsPDF, invoice: Invoice, yPosition: number, pageWidth: number): number {
    const rightX = pageWidth - 15
    const labelX = rightX - 60

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Subtotal
    doc.setTextColor(this.textColor)
    doc.text('Subtotal:', labelX, yPosition)
    doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, rightX, yPosition, { align: 'right' })
    yPosition += 6

    // Tax
    if (invoice.tax_rate > 0) {
      doc.text(`Tax (${invoice.tax_rate}%):`, labelX, yPosition)
      doc.text(`Rs. ${invoice.tax_amount.toFixed(2)}`, rightX, yPosition, { align: 'right' })
      yPosition += 6
    }

    // Draw line above total
    doc.setDrawColor(this.darkGray)
    doc.line(labelX, yPosition, rightX, yPosition)
    yPosition += 8

    // Total
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(this.primaryColor)
    doc.text('Total Amount:', labelX, yPosition)
    doc.text(`Rs. ${invoice.total_amount.toFixed(2)}`, rightX, yPosition, { align: 'right' })

    return yPosition + 15
  }

  /**
   * Add payment information (banking details)
   */
  private addPaymentInformation(doc: jsPDF, banking: BankingInfo, yPosition: number, pageWidth: number): number {
    // Section title
    doc.setFontSize(14)
    doc.setTextColor(this.primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('Payment Information', 15, yPosition)
    yPosition += 8

    // Banking details box with better styling
    const primaryRGB = this.hexToRgb(this.primaryColor)
    const lightGrayRGB = this.hexToRgb(this.lightGray)
    
    doc.setDrawColor(...primaryRGB)
    doc.setFillColor(...lightGrayRGB)
    doc.setLineWidth(1)
    doc.roundedRect(15, yPosition, pageWidth - 30, 28, 5, 5, 'FD')

    yPosition += 6

    doc.setFontSize(10)
    doc.setTextColor(this.textColor)
    doc.setFont('helvetica', 'normal')

    if (banking.bank_name) {
      doc.setFont('helvetica', 'bold')
      doc.text('Bank Name:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(banking.bank_name, 50, yPosition)
      yPosition += 5
    }

    if (banking.account_number) {
      doc.setFont('helvetica', 'bold')
      doc.text('Account Number:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(banking.account_number, 50, yPosition)
      yPosition += 5
    }

    if (banking.ifsc_code) {
      doc.setFont('helvetica', 'bold')
      doc.text('IFSC Code:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(banking.ifsc_code, 50, yPosition)
      yPosition += 5
    }

    return yPosition + 15
  }

  /**
   * Add terms and conditions
   */
  private addTermsAndConditions(doc: jsPDF, terms: string, yPosition: number, pageWidth: number, pageHeight: number): number {
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = 20
    }

    // Section title
    doc.setFontSize(14)
    doc.setTextColor(this.primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text('Terms & Conditions', 15, yPosition)
    yPosition += 8

    // Terms content
    doc.setFontSize(9)
    doc.setTextColor(this.textColor)
    doc.setFont('helvetica', 'normal')

    const maxWidth = pageWidth - 30
    const termsLines = doc.splitTextToSize(terms, maxWidth)
    
    // Split terms into chunks that fit on the page
    let lineIndex = 0
    while (lineIndex < termsLines.length) {
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
      }
      
      const availableHeight = pageHeight - yPosition - 30
      const linesPerPage = Math.floor(availableHeight / 4)
      const chunkLines = termsLines.slice(lineIndex, lineIndex + linesPerPage)
      
      doc.text(chunkLines, 15, yPosition)
      yPosition += chunkLines.length * 4
      lineIndex += linesPerPage
    }

    return yPosition + 10
  }

  /**
   * Add QR code with high quality
   */
  private async addQRCode(doc: jsPDF, qrCodeUrl: string, pageWidth: number, pageHeight: number): Promise<void> {
    try {
      console.log('Loading QR code:', qrCodeUrl)
      
      // Load QR code with high quality
      const img = await this.loadImageWithQuality(qrCodeUrl)
      
      // Create high quality canvas
      const size = 30 // Increased size for better readability
      const canvas = this.createHighQualityCanvas(img, size, size)
      
      // Convert to high quality PNG
      const qrData = canvas.toDataURL('image/png', 1.0)
      
      // Position QR code in bottom right
      doc.addImage(qrData, 'PNG', pageWidth - 45, pageHeight - 40, size, size)
      
      // Add QR code label
      doc.setFontSize(7)
      doc.setTextColor(this.darkGray)
      doc.setFont('helvetica', 'normal')
      doc.text('Scan for verification', pageWidth - 45, pageHeight - 8, { align: 'left' })
      
      console.log('QR code added successfully')
      
    } catch (error) {
      console.error('Error adding high quality QR code:', error)
      
      // Fallback: Add text instead
      doc.setFontSize(8)
      doc.setTextColor(this.darkGray)
      doc.setFont('helvetica', 'normal')
      doc.text('QR Code', pageWidth - 30, pageHeight - 25)
    }
  }

  /**
   * Add signature with high quality
   */
  private async addSignature(doc: jsPDF, signatureUrl: string, pageWidth: number, pageHeight: number): Promise<void> {
    try {
      console.log('Loading signature:', signatureUrl)
      
      // Load signature with high quality
      const img = await this.loadImageWithQuality(signatureUrl)
      
      // Create high quality canvas
      const maxWidth = 45 // Increased size
      const maxHeight = 25
      const canvas = this.createHighQualityCanvas(img, maxWidth, maxHeight)
      
      // Get final dimensions
      const finalWidth = canvas.style.width ? parseFloat(canvas.style.width) : canvas.width
      const finalHeight = canvas.style.height ? parseFloat(canvas.style.height) : canvas.height
      
      // Convert to high quality PNG
      const signatureData = canvas.toDataURL('image/png', 1.0)
      
      // Position signature in bottom left
      doc.addImage(signatureData, 'PNG', 15, pageHeight - 40, finalWidth, finalHeight)
      
      // Add signature label with better styling
      doc.setFontSize(8)
      doc.setTextColor(this.darkGray)
      doc.setFont('helvetica', 'normal')
      doc.text('Authorized Signature', 15, pageHeight - 10)
      
      // Add a line above the signature
      doc.setDrawColor(this.darkGray)
      doc.line(15, pageHeight - 12, 15 + finalWidth, pageHeight - 12)
      
      console.log('Signature added successfully')
      
    } catch (error) {
      console.error('Error adding high quality signature:', error)
      
      // Fallback: Add text signature line
      doc.setFontSize(8)
      doc.setTextColor(this.darkGray)
      doc.setFont('helvetica', 'normal')
      doc.text('Authorized Signature', 15, pageHeight - 15)
      doc.line(15, pageHeight - 18, 60, pageHeight - 18)
    }
  }

  /**
   * Add footer
   */
  private addFooter(doc: jsPDF, profile: CompanyProfile | null, pageWidth: number, pageHeight: number): void {
    doc.setFontSize(8)
    doc.setTextColor(this.darkGray)
    doc.setFont('helvetica', 'normal')
    
    const footerText = `Generated on ${new Date().toLocaleString()}`
    doc.text(footerText, pageWidth / 2, pageHeight - 5, { align: 'center' })

    if (profile?.company_name) {
      doc.text(`© ${new Date().getFullYear()} ${profile.company_name}. All rights reserved.`, pageWidth / 2, pageHeight - 2, { align: 'center' })
    }
  }
}

// Export a singleton instance
export const professionalPDFService = new ProfessionalPDFService()