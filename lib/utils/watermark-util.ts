/**
 * Watermark Utility
 * Adds watermarks to images and videos for download/sharing
 * Client-side watermarking with canvas manipulation
 */

export interface WatermarkOptions {
  text?: string
  logoUrl?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity?: number
  fontSize?: number
  fontFamily?: string
  color?: string
  logoSize?: number
  margin?: number
}

export class WatermarkUtil {
  /**
   * Add text watermark to image
   */
  static async addTextWatermark(
    imageUrl: string,
    options: WatermarkOptions = {}
  ): Promise<string> {
    const {
      text = 'Portfolio CRM',
      position = 'bottom-right',
      opacity = 0.7,
      fontSize = 24,
      fontFamily = 'Arial',
      color = 'rgba(255, 255, 255, 0.8)',
      margin = 20
    } = options

    try {
      // Load the image
      const img = await this.loadImage(imageUrl)
      
      // Create canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Set canvas size to image size
      canvas.width = img.width
      canvas.height = img.height

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Configure watermark text
      ctx.globalAlpha = opacity
      ctx.font = `${fontSize}px ${fontFamily}`
      ctx.fillStyle = color
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'

      // Calculate text position
      const textMetrics = ctx.measureText(text)
      const textWidth = textMetrics.width
      const textHeight = fontSize

      let x = margin
      let y = margin

      switch (position) {
        case 'top-left':
          x = margin
          y = margin
          break
        case 'top-right':
          x = canvas.width - textWidth - margin
          y = margin
          break
        case 'bottom-left':
          x = margin
          y = canvas.height - textHeight - margin
          break
        case 'bottom-right':
          x = canvas.width - textWidth - margin
          y = canvas.height - textHeight - margin
          break
        case 'center':
          x = (canvas.width - textWidth) / 2
          y = (canvas.height - textHeight) / 2
          break
      }

      // Add background for better readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(x - 5, y - 5, textWidth + 10, textHeight + 10)

      // Draw watermark text
      ctx.fillStyle = color
      ctx.fillText(text, x, y)

      // Reset alpha
      ctx.globalAlpha = 1

      return canvas.toDataURL('image/png', 0.9)

    } catch (error) {
      console.error('Failed to add text watermark:', error)
      throw new Error('Watermark creation failed')
    }
  }

  /**
   * Add logo watermark to image
   */
  static async addLogoWatermark(
    imageUrl: string,
    logoUrl: string,
    options: WatermarkOptions = {}
  ): Promise<string> {
    const {
      position = 'bottom-right',
      opacity = 0.8,
      logoSize = 100,
      margin = 20
    } = options

    try {
      // Load both images
      const [img, logo] = await Promise.all([
        this.loadImage(imageUrl),
        this.loadImage(logoUrl)
      ])
      
      // Create canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Set canvas size to image size
      canvas.width = img.width
      canvas.height = img.height

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Configure watermark logo
      ctx.globalAlpha = opacity

      // Calculate logo size maintaining aspect ratio
      const logoAspect = logo.width / logo.height
      let logoWidth = logoSize
      let logoHeight = logoSize / logoAspect

      // Ensure logo fits within reasonable bounds
      const maxLogoSize = Math.min(canvas.width, canvas.height) * 0.2
      if (logoWidth > maxLogoSize) {
        logoWidth = maxLogoSize
        logoHeight = logoWidth / logoAspect
      }

      // Calculate logo position
      let x = margin
      let y = margin

      switch (position) {
        case 'top-left':
          x = margin
          y = margin
          break
        case 'top-right':
          x = canvas.width - logoWidth - margin
          y = margin
          break
        case 'bottom-left':
          x = margin
          y = canvas.height - logoHeight - margin
          break
        case 'bottom-right':
          x = canvas.width - logoWidth - margin
          y = canvas.height - logoHeight - margin
          break
        case 'center':
          x = (canvas.width - logoWidth) / 2
          y = (canvas.height - logoHeight) / 2
          break
      }

      // Add semi-transparent background for logo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.fillRect(x - 5, y - 5, logoWidth + 10, logoHeight + 10)

      // Draw watermark logo
      ctx.drawImage(logo, x, y, logoWidth, logoHeight)

      // Reset alpha
      ctx.globalAlpha = 1

      return canvas.toDataURL('image/png', 0.9)

    } catch (error) {
      console.error('Failed to add logo watermark:', error)
      throw new Error('Logo watermark creation failed')
    }
  }

  /**
   * Add combined text and logo watermark
   */
  static async addCombinedWatermark(
    imageUrl: string,
    logoUrl: string,
    text: string,
    options: WatermarkOptions = {}
  ): Promise<string> {
    const {
      position = 'bottom-right',
      opacity = 0.8,
      logoSize = 60,
      fontSize = 18,
      fontFamily = 'Arial',
      color = 'rgba(255, 255, 255, 0.9)',
      margin = 20
    } = options

    try {
      // Load both images
      const [img, logo] = await Promise.all([
        this.loadImage(imageUrl),
        this.loadImage(logoUrl)
      ])
      
      // Create canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Set canvas size
      canvas.width = img.width
      canvas.height = img.height

      // Draw original image
      ctx.drawImage(img, 0, 0)

      // Configure watermark
      ctx.globalAlpha = opacity

      // Calculate sizes
      const logoAspect = logo.width / logo.height
      const logoWidth = logoSize
      const logoHeight = logoSize / logoAspect

      ctx.font = `${fontSize}px ${fontFamily}`
      const textMetrics = ctx.measureText(text)
      const textWidth = textMetrics.width
      const textHeight = fontSize

      // Calculate total watermark size
      const totalWidth = logoWidth + 10 + textWidth
      const totalHeight = Math.max(logoHeight, textHeight)

      // Calculate position
      let x = margin
      let y = margin

      switch (position) {
        case 'top-left':
          x = margin
          y = margin
          break
        case 'top-right':
          x = canvas.width - totalWidth - margin
          y = margin
          break
        case 'bottom-left':
          x = margin
          y = canvas.height - totalHeight - margin
          break
        case 'bottom-right':
          x = canvas.width - totalWidth - margin
          y = canvas.height - totalHeight - margin
          break
        case 'center':
          x = (canvas.width - totalWidth) / 2
          y = (canvas.height - totalHeight) / 2
          break
      }

      // Add background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
      ctx.fillRect(x - 8, y - 8, totalWidth + 16, totalHeight + 16)

      // Draw logo
      const logoY = y + (totalHeight - logoHeight) / 2
      ctx.drawImage(logo, x, logoY, logoWidth, logoHeight)

      // Draw text
      ctx.fillStyle = color
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const textY = y + totalHeight / 2
      ctx.fillText(text, x + logoWidth + 10, textY)

      // Reset alpha
      ctx.globalAlpha = 1

      return canvas.toDataURL('image/png', 0.9)

    } catch (error) {
      console.error('Failed to add combined watermark:', error)
      throw new Error('Combined watermark creation failed')
    }
  }

  /**
   * Load image from URL
   */
  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      
      img.src = url
    })
  }

  /**
   * Create watermarked download
   */
  static async createWatermarkedDownload(
    imageUrl: string,
    filename: string,
    watermarkOptions: WatermarkOptions & {
      logoUrl?: string
      text?: string
      useWatermark: boolean
    }
  ): Promise<void> {
    try {
      let finalImageUrl = imageUrl

      if (watermarkOptions.useWatermark) {
        if (watermarkOptions.logoUrl && watermarkOptions.text) {
          // Combined watermark
          finalImageUrl = await this.addCombinedWatermark(
            imageUrl,
            watermarkOptions.logoUrl,
            watermarkOptions.text,
            watermarkOptions
          )
        } else if (watermarkOptions.logoUrl) {
          // Logo only
          finalImageUrl = await this.addLogoWatermark(
            imageUrl,
            watermarkOptions.logoUrl,
            watermarkOptions
          )
        } else if (watermarkOptions.text) {
          // Text only
          finalImageUrl = await this.addTextWatermark(
            imageUrl,
            watermarkOptions
          )
        }
      }

      // Trigger download
      const a = document.createElement('a')
      a.href = finalImageUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

    } catch (error) {
      console.error('Watermarked download failed:', error)
      throw new Error('Failed to create watermarked download')
    }
  }

  /**
   * Batch watermark multiple images
   */
  static async batchWatermark(
    imageUrls: string[],
    watermarkOptions: WatermarkOptions & {
      logoUrl?: string
      text?: string
    }
  ): Promise<string[]> {
    const results: string[] = []

    for (const imageUrl of imageUrls) {
      try {
        let watermarkedUrl: string

        if (watermarkOptions.logoUrl && watermarkOptions.text) {
          watermarkedUrl = await this.addCombinedWatermark(
            imageUrl,
            watermarkOptions.logoUrl,
            watermarkOptions.text,
            watermarkOptions
          )
        } else if (watermarkOptions.logoUrl) {
          watermarkedUrl = await this.addLogoWatermark(
            imageUrl,
            watermarkOptions.logoUrl,
            watermarkOptions
          )
        } else if (watermarkOptions.text) {
          watermarkedUrl = await this.addTextWatermark(
            imageUrl,
            watermarkOptions
          )
        } else {
          watermarkedUrl = imageUrl
        }

        results.push(watermarkedUrl)
      } catch (error) {
        console.error(`Failed to watermark image ${imageUrl}:`, error)
        results.push(imageUrl) // Use original if watermarking fails
      }
    }

    return results
  }
}

export default WatermarkUtil