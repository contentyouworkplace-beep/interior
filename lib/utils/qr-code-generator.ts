/**
 * QR Code Generator Utility
 * Generates QR codes for portfolio sharing links
 * Using online service approach for compatibility
 */

// import QRCode from 'qrcode' // Commented out - using online service instead

export interface QRCodeOptions {
  size?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  type?: 'image/png' | 'image/jpeg' | 'image/webp'
  quality?: number
}

export class QRCodeGenerator {
  /**
   * Generate QR code as data URL
   */
  static async generateDataURL(
    text: string, 
    options: QRCodeOptions = {}
  ): Promise<string> {
    const defaultOptions = {
      width: options.size || 200,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      type: options.type || 'image/png',
      quality: options.quality || 0.92,
    }

    try {
      const dataURL = await QRCode.toDataURL(text, defaultOptions)
      return dataURL
    } catch (error) {
      console.error('QR Code generation failed:', error)
      throw new Error('Failed to generate QR code')
    }
  }

  /**
   * Generate QR code as SVG string
   */
  static async generateSVG(
    text: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    const defaultOptions = {
      width: options.size || 200,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    }

    try {
      const svg = await QRCode.toString(text, {
        ...defaultOptions,
        type: 'svg'
      })
      return svg
    } catch (error) {
      console.error('QR Code SVG generation failed:', error)
      throw new Error('Failed to generate QR code SVG')
    }
  }

  /**
   * Generate QR code as Canvas element
   */
  static async generateCanvas(
    text: string,
    options: QRCodeOptions = {}
  ): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas')
    
    const defaultOptions = {
      width: options.size || 200,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    }

    try {
      await QRCode.toCanvas(canvas, text, defaultOptions)
      return canvas
    } catch (error) {
      console.error('QR Code canvas generation failed:', error)
      throw new Error('Failed to generate QR code canvas')
    }
  }

  /**
   * Generate QR code with logo/image in center
   */
  static async generateWithLogo(
    text: string,
    logoUrl: string,
    options: QRCodeOptions = {}
  ): Promise<string> {
    const canvas = await this.generateCanvas(text, {
      ...options,
      errorCorrectionLevel: 'H' // Higher error correction for logo overlay
    })

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    try {
      // Load logo image
      const logo = new Image()
      logo.crossOrigin = 'anonymous'
      
      return new Promise((resolve, reject) => {
        logo.onload = () => {
          const canvasSize = canvas.width
          const logoSize = canvasSize * 0.15 // Logo takes up 15% of QR code
          const logoX = (canvasSize - logoSize) / 2
          const logoY = (canvasSize - logoSize) / 2

          // Draw white background for logo
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10)

          // Draw logo
          ctx.drawImage(logo, logoX, logoY, logoSize, logoSize)

          resolve(canvas.toDataURL())
        }
        
        logo.onerror = () => {
          reject(new Error('Failed to load logo image'))
        }
        
        logo.src = logoUrl
      })
    } catch (error) {
      console.error('QR Code with logo generation failed:', error)
      throw new Error('Failed to generate QR code with logo')
    }
  }

  /**
   * Generate QR code for portfolio share link with optional watermark
   */
  static async generatePortfolioQR(
    shareToken: string,
    baseUrl: string = window?.location?.origin || 'https://your-domain.com',
    options: QRCodeOptions & { includeWatermark?: boolean, logoUrl?: string } = {}
  ): Promise<string> {
    const shareUrl = `${baseUrl}/portfolio/shared/${shareToken}`
    
    const qrOptions: QRCodeOptions = {
      size: 300,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1a1a1a',
        light: '#ffffff'
      },
      ...options
    }

    // If logo watermark is requested, use the logo overlay method
    if (options.includeWatermark && options.logoUrl) {
      return this.generateWithLogo(shareUrl, options.logoUrl, qrOptions)
    }

    return this.generateDataURL(shareUrl, qrOptions)
  }

  /**
   * Generate QR code for vCard (contact info)
   */
  static async generateVCard(
    contactInfo: {
      name: string
      company?: string
      phone?: string
      email?: string
      website?: string
      address?: string
    },
    options: QRCodeOptions = {}
  ): Promise<string> {
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${contactInfo.name}`,
      contactInfo.company ? `ORG:${contactInfo.company}` : '',
      contactInfo.phone ? `TEL:${contactInfo.phone}` : '',
      contactInfo.email ? `EMAIL:${contactInfo.email}` : '',
      contactInfo.website ? `URL:${contactInfo.website}` : '',
      contactInfo.address ? `ADR:;;${contactInfo.address}` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n')

    return this.generateDataURL(vCard, options)
  }

  /**
   * Generate QR code for WiFi connection
   */
  static async generateWiFi(
    wifiInfo: {
      ssid: string
      password: string
      security?: 'WPA' | 'WEP' | 'nopass'
      hidden?: boolean
    },
    options: QRCodeOptions = {}
  ): Promise<string> {
    const wifiString = `WIFI:T:${wifiInfo.security || 'WPA'};S:${wifiInfo.ssid};P:${wifiInfo.password};H:${wifiInfo.hidden ? 'true' : 'false'};;`
    
    return this.generateDataURL(wifiString, options)
  }

  /**
   * Validate QR code text length and content
   */
  static validateText(text: string): { valid: boolean; message?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, message: 'Text cannot be empty' }
    }

    if (text.length > 2953) { // Max capacity for QR codes with error correction
      return { valid: false, message: 'Text is too long for QR code' }
    }

    return { valid: true }
  }

  /**
   * Get optimal error correction level based on text length
   */
  static getOptimalErrorCorrection(text: string): 'L' | 'M' | 'Q' | 'H' {
    const length = text.length

    if (length <= 1000) return 'H' // High error correction for short text
    if (length <= 2000) return 'Q' // Quarter error correction for medium text  
    if (length <= 2500) return 'M' // Medium error correction for longer text
    return 'L' // Low error correction for maximum text capacity
  }

  /**
   * Generate multiple QR codes with different error correction levels
   */
  static async generateMultiple(
    text: string,
    options: QRCodeOptions = {}
  ): Promise<{
    L: string
    M: string
    Q: string
    H: string
  }> {
    const levels: Array<'L' | 'M' | 'Q' | 'H'> = ['L', 'M', 'Q', 'H']
    const results: any = {}

    for (const level of levels) {
      try {
        results[level] = await this.generateDataURL(text, {
          ...options,
          errorCorrectionLevel: level
        })
      } catch (error) {
        console.warn(`Failed to generate QR code with error correction ${level}:`, error)
        results[level] = null
      }
    }

    return results
  }
}

export default QRCodeGenerator