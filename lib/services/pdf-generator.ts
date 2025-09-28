/**
 * PDF Generator Service
 * Creates professional PDF reports for portfolio projects
 * Uses jsPDF and html2canvas for client-side PDF generation
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import QRCodeGenerator from './qr-code-generator'
import type { PortfolioProject, PortfolioMedia, PortfolioShare } from '@/types/portfolio'

export interface PDFOptions {
  includeMedia?: boolean
  includeQRCode?: boolean
  includeWatermark?: boolean
  format?: 'a4' | 'letter' | 'legal'
  orientation?: 'portrait' | 'landscape'
  quality?: number
  compression?: boolean
  branding?: {
    logo?: string
    companyName?: string
    contactInfo?: string
    website?: string
  }
}

export interface PortfolioPDFData {
  project: PortfolioProject
  media: PortfolioMedia[]
  share?: PortfolioShare
  shareUrl?: string
}

export class PDFGenerator {
  private static readonly PAGE_MARGINS = {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  }

  private static readonly COLORS = {
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#f1f5f9',
    text: '#1e293b',
    muted: '#64748b'
  }

  /**
   * Generate portfolio PDF report
   */
  static async generatePortfolioPDF(
    data: PortfolioPDFData,
    options: PDFOptions = {}
  ): Promise<Blob> {
    const {
      includeMedia = true,
      includeQRCode = true,
      includeWatermark = false,
      format = 'a4',
      orientation = 'portrait',
      quality = 0.85,
      compression = true,
      branding
    } = options

    // Create new PDF document
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
      compress: compression
    })

    const pageWidth = pdf.internal.pageSize.width
    const pageHeight = pdf.internal.pageSize.height
    const contentWidth = pageWidth - this.PAGE_MARGINS.left - this.PAGE_MARGINS.right

    let currentY = this.PAGE_MARGINS.top

    try {
      // Add header with branding
      currentY = await this.addHeader(pdf, data, branding, currentY, pageWidth, contentWidth)

      // Add project overview
      currentY = await this.addProjectOverview(pdf, data.project, currentY, contentWidth)

      // Add QR code if requested
      if (includeQRCode && data.shareUrl) {
        currentY = await this.addQRCode(pdf, data.shareUrl, currentY, contentWidth)
      }

      // Add media gallery if requested
      if (includeMedia && data.media.length > 0) {
        currentY = await this.addMediaGallery(pdf, data.media, currentY, contentWidth, pageWidth, pageHeight)
      }

      // Add footer
      this.addFooter(pdf, data, branding, pageHeight)

      // Add watermark if requested
      if (includeWatermark) {
        this.addWatermark(pdf, pageWidth, pageHeight, branding?.logo)
      }

      // Return PDF as blob
      const pdfBlob = pdf.output('blob')
      return pdfBlob

    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error('Failed to generate PDF')
    }
  }

  /**
   * Add PDF header with branding
   */
  private static async addHeader(
    pdf: jsPDF,
    data: PortfolioPDFData,
    branding?: PDFOptions['branding'],
    currentY: number,
    pageWidth: number,
    contentWidth: number
  ): Promise<number> {
    const startY = currentY

    // Add logo if provided
    if (branding?.logo) {
      try {
        const logoImg = await this.loadImage(branding.logo)
        const logoHeight = 15
        const logoWidth = logoHeight * (logoImg.width / logoImg.height)
        pdf.addImage(logoImg, 'PNG', this.PAGE_MARGINS.left, currentY, logoWidth, logoHeight)
      } catch (error) {
        console.warn('Failed to load logo for PDF:', error)
      }
    }

    // Add company info on the right
    if (branding?.companyName || branding?.website) {
      pdf.setFontSize(10)
      pdf.setTextColor(this.COLORS.secondary)
      
      const rightX = pageWidth - this.PAGE_MARGINS.right
      let headerY = currentY + 5

      if (branding.companyName) {
        pdf.text(branding.companyName, rightX, headerY, { align: 'right' })
        headerY += 5
      }
      
      if (branding.website) {
        pdf.text(branding.website, rightX, headerY, { align: 'right' })
        headerY += 5
      }

      if (branding.contactInfo) {
        pdf.text(branding.contactInfo, rightX, headerY, { align: 'right' })
      }
    }

    currentY += 25

    // Add title
    pdf.setFontSize(24)
    pdf.setTextColor(this.COLORS.primary)
    pdf.setFont('helvetica', 'bold')
    
    const title = `Portfolio: ${data.project.title}`
    pdf.text(title, this.PAGE_MARGINS.left, currentY)
    currentY += 15

    // Add subtitle with date
    pdf.setFontSize(12)
    pdf.setTextColor(this.COLORS.secondary)
    pdf.setFont('helvetica', 'normal')
    
    const subtitle = `Generated on ${new Date().toLocaleDateString()}`
    pdf.text(subtitle, this.PAGE_MARGINS.left, currentY)
    currentY += 15

    // Add separator line
    pdf.setDrawColor(this.COLORS.accent)
    pdf.setLineWidth(0.5)
    pdf.line(this.PAGE_MARGINS.left, currentY, pageWidth - this.PAGE_MARGINS.right, currentY)
    currentY += 10

    return currentY
  }

  /**
   * Add project overview section
   */
  private static async addProjectOverview(
    pdf: jsPDF,
    project: PortfolioProject,
    currentY: number,
    contentWidth: number
  ): Promise<number> {
    // Section title
    pdf.setFontSize(16)
    pdf.setTextColor(this.COLORS.text)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Project Overview', this.PAGE_MARGINS.left, currentY)
    currentY += 10

    // Project details
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')

    const details = [
      { label: 'Project Name', value: project.title },
      { label: 'Description', value: project.description || 'No description provided' },
      { label: 'Category', value: project.category || 'Uncategorized' },
      { label: 'Location', value: project.location || 'Not specified' },
      { label: 'Client', value: project.client_name || 'Internal project' },
      { label: 'Status', value: project.status },
      { label: 'Created', value: new Date(project.created_at).toLocaleDateString() },
      { label: 'Updated', value: new Date(project.updated_at).toLocaleDateString() }
    ]

    for (const detail of details) {
      if (detail.value) {
        pdf.setTextColor(this.COLORS.secondary)
        pdf.text(`${detail.label}:`, this.PAGE_MARGINS.left, currentY)
        
        pdf.setTextColor(this.COLORS.text)
        const labelWidth = pdf.getTextWidth(`${detail.label}: `)
        
        // Handle long text with wrapping
        const maxWidth = contentWidth - labelWidth - 5
        const lines = pdf.splitTextToSize(detail.value, maxWidth)
        
        if (Array.isArray(lines)) {
          pdf.text(lines, this.PAGE_MARGINS.left + labelWidth, currentY)
          currentY += lines.length * 5
        } else {
          pdf.text(detail.value, this.PAGE_MARGINS.left + labelWidth, currentY)
          currentY += 5
        }
      }
    }

    return currentY + 10
  }

  /**
   * Add QR code for easy sharing
   */
  private static async addQRCode(
    pdf: jsPDF,
    shareUrl: string,
    currentY: number,
    contentWidth: number
  ): Promise<number> {
    try {
      // Section title
      pdf.setFontSize(16)
      pdf.setTextColor(this.COLORS.text)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Share This Portfolio', this.PAGE_MARGINS.left, currentY)
      currentY += 10

      // Generate QR code
      const qrCodeDataURL = await QRCodeGenerator.generateDataURL(shareUrl, {
        size: 150,
        margin: 2
      })

      // Add QR code image
      const qrSize = 30 // mm
      pdf.addImage(qrCodeDataURL, 'PNG', this.PAGE_MARGINS.left, currentY, qrSize, qrSize)

      // Add explanation text
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(this.COLORS.text)
      
      const textX = this.PAGE_MARGINS.left + qrSize + 10
      pdf.text('Scan this QR code to view', textX, currentY + 8)
      pdf.text('the online portfolio', textX, currentY + 13)
      
      // Add URL below QR code
      pdf.setFontSize(9)
      pdf.setTextColor(this.COLORS.secondary)
      pdf.text('Or visit:', this.PAGE_MARGINS.left, currentY + qrSize + 8)
      pdf.text(shareUrl, this.PAGE_MARGINS.left, currentY + qrSize + 13)

      return currentY + qrSize + 20

    } catch (error) {
      console.warn('Failed to add QR code to PDF:', error)
      return currentY
    }
  }

  /**
   * Add media gallery section
   */
  private static async addMediaGallery(
    pdf: jsPDF,
    media: PortfolioMedia[],
    currentY: number,
    contentWidth: number,
    pageWidth: number,
    pageHeight: number
  ): Promise<number> {
    // Section title
    pdf.setFontSize(16)
    pdf.setTextColor(this.COLORS.text)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Media Gallery', this.PAGE_MARGINS.left, currentY)
    currentY += 10

    // Media statistics
    const stats = {
      total: media.length,
      images: media.filter(m => m.file_type === 'image').length,
      videos: media.filter(m => m.file_type === 'video').length,
      featured: media.filter(m => m.is_featured).length
    }

    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(this.COLORS.text)
    
    const statsText = `Total: ${stats.total} items (${stats.images} images, ${stats.videos} videos, ${stats.featured} featured)`
    pdf.text(statsText, this.PAGE_MARGINS.left, currentY)
    currentY += 15

    // List featured media
    const featuredMedia = media.filter(m => m.is_featured).slice(0, 10)
    
    if (featuredMedia.length > 0) {
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Featured Media', this.PAGE_MARGINS.left, currentY)
      currentY += 8

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      for (const item of featuredMedia) {
        // Check if we need a new page
        if (currentY > pageHeight - 30) {
          pdf.addPage()
          currentY = this.PAGE_MARGINS.top
        }

        pdf.setTextColor(this.COLORS.text)
        pdf.text(`• ${item.title}`, this.PAGE_MARGINS.left + 5, currentY)
        
        pdf.setTextColor(this.COLORS.secondary)
        const typeText = `(${item.file_type.toUpperCase()}) - ${this.formatFileSize(item.file_size)}`
        pdf.text(typeText, this.PAGE_MARGINS.left + 15 + pdf.getTextWidth(`• ${item.title} `), currentY)
        
        currentY += 5

        if (item.description) {
          pdf.setTextColor(this.COLORS.muted)
          const descriptionLines = pdf.splitTextToSize(item.description, contentWidth - 20)
          if (Array.isArray(descriptionLines)) {
            pdf.text(descriptionLines, this.PAGE_MARGINS.left + 10, currentY)
            currentY += descriptionLines.length * 4
          } else {
            pdf.text(item.description, this.PAGE_MARGINS.left + 10, currentY)
            currentY += 4
          }
        }
        
        currentY += 3
      }
    }

    // List all media (if space permits)
    if (currentY < pageHeight - 60) {
      currentY += 10
      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(this.COLORS.text)
      pdf.text('All Media', this.PAGE_MARGINS.left, currentY)
      currentY += 8

      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')

      for (const item of media.slice(0, 20)) { // Limit to first 20 items
        if (currentY > pageHeight - 25) {
          pdf.text('...and more items available online', this.PAGE_MARGINS.left, currentY)
          break
        }

        pdf.setTextColor(this.COLORS.text)
        const itemText = `${item.title} (${item.file_type.toUpperCase()}) - ${this.formatFileSize(item.file_size)}`
        pdf.text(itemText, this.PAGE_MARGINS.left + 5, currentY)
        currentY += 4
      }
    }

    return currentY + 10
  }

  /**
   * Add footer to all pages
   */
  private static addFooter(
    pdf: jsPDF,
    data: PortfolioPDFData,
    branding?: PDFOptions['branding'],
    pageHeight: number
  ): void {
    const pageCount = pdf.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      
      // Footer line
      pdf.setDrawColor(this.COLORS.accent)
      pdf.setLineWidth(0.3)
      const footerY = pageHeight - 15
      pdf.line(this.PAGE_MARGINS.left, footerY, pdf.internal.pageSize.width - this.PAGE_MARGINS.right, footerY)
      
      // Footer text
      pdf.setFontSize(8)
      pdf.setTextColor(this.COLORS.muted)
      pdf.setFont('helvetica', 'normal')
      
      const leftText = branding?.companyName || 'Portfolio CRM'
      pdf.text(leftText, this.PAGE_MARGINS.left, footerY + 7)
      
      const rightText = `Page ${i} of ${pageCount}`
      pdf.text(rightText, pdf.internal.pageSize.width - this.PAGE_MARGINS.right, footerY + 7, { align: 'right' })
      
      const centerText = `Generated ${new Date().toLocaleDateString()}`
      pdf.text(centerText, pdf.internal.pageSize.width / 2, footerY + 7, { align: 'center' })
    }
  }

  /**
   * Add watermark with logo
   */
  private static addWatermark(pdf: jsPDF, pageWidth: number, pageHeight: number, logo?: string): void {
    const pageCount = pdf.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      
      // Save current state
      pdf.saveGraphicsState()
      
      const centerX = pageWidth / 2
      const centerY = pageHeight / 2

      if (logo) {
        // Add logo watermark
        pdf.setGState(pdf.GState({ opacity: 0.1 }))
        
        // For now, add text-based watermark
        // In production, you'd load and add the actual logo image
        pdf.setFontSize(40)
        pdf.setTextColor(this.COLORS.secondary)
        pdf.setFont('helvetica', 'bold')
        
        pdf.text('PORTFOLIO', centerX, centerY - 10, {
          align: 'center',
          angle: -45
        })
        
        pdf.setFontSize(20)
        pdf.text('Your Company Name', centerX, centerY + 10, {
          align: 'center',
          angle: -45
        })
      } else {
        // Standard text watermark
        pdf.setGState(pdf.GState({ opacity: 0.1 }))
        pdf.setFontSize(50)
        pdf.setTextColor(this.COLORS.secondary)
        pdf.setFont('helvetica', 'bold')
        
        pdf.text('PORTFOLIO', centerX, centerY, {
          align: 'center',
          angle: -45
        })
      }
      
      // Restore state
      pdf.restoreGraphicsState()
    }
  }

  /**
   * Load image from URL
   */
  private static async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  /**
   * Format file size
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  /**
   * Generate simple media list PDF
   */
  static async generateMediaListPDF(
    project: PortfolioProject,
    media: PortfolioMedia[]
  ): Promise<Blob> {
    const pdf = new jsPDF()
    
    // Title
    pdf.setFontSize(18)
    pdf.text(`Media List: ${project.title}`, 20, 30)
    
    // Headers
    pdf.setFontSize(12)
    pdf.text('Filename', 20, 50)
    pdf.text('Type', 80, 50)
    pdf.text('Size', 120, 50)
    pdf.text('Featured', 160, 50)
    
    // Data rows
    pdf.setFontSize(10)
    let y = 60
    
    media.forEach((item, index) => {
      if (y > 270) {
        pdf.addPage()
        y = 30
      }
      
      pdf.text(item.title, 20, y)
      pdf.text(item.file_type.toUpperCase(), 80, y)
      pdf.text(this.formatFileSize(item.file_size), 120, y)
      pdf.text(item.is_featured ? 'Yes' : 'No', 160, y)
      
      y += 8
    })
    
    return pdf.output('blob')
  }
}

export default PDFGenerator