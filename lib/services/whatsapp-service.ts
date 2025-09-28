export interface WhatsAppMessage {
  recipient: string
  message: string
  attachmentUrl?: string
}

export interface WhatsAppOptions {
  includeBusinessInfo?: boolean
  customMessage?: string
  templateType?: 'quotation' | 'invoice' | 'reminder' | 'custom'
}

export class WhatsAppService {
  private baseUrl = 'https://wa.me/'

  /**
   * Format phone number for WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      return `91${cleaned}`
    }
    
    // If already has country code, use as is
    if (cleaned.length > 10) {
      return cleaned
    }
    
    throw new Error('Invalid phone number format')
  }

  /**
   * Generate message template based on document type
   */
  generateMessage(
    documentType: 'quotation' | 'invoice',
    documentNumber: string,
    clientName: string,
    amount: number,
    options: WhatsAppOptions = {}
  ): string {
    const { customMessage, includeBusinessInfo = true } = options

    if (customMessage) {
      return customMessage
    }

    const greeting = `Hi ${clientName}! 👋`
    const businessInfo = includeBusinessInfo ? '\n\nThank you for choosing us! 🙏\n\nBest regards,\nYour Team' : ''

    switch (documentType) {
      case 'quotation':
        return `${greeting}

Your quotation ${documentNumber} is ready! 📋

💰 Amount: ₹${amount.toLocaleString()}
📄 Please find the attached PDF document.

Review it and let me know if you have any questions!${businessInfo}`

      case 'invoice':
        return `${greeting}

Your invoice ${documentNumber} is ready! 📋

💰 Amount: ₹${amount.toLocaleString()}
📄 Please find the attached PDF document.

Thank you for your business!${businessInfo}`

      default:
        return `${greeting}

Your document ${documentNumber} is ready!

💰 Amount: ₹${amount.toLocaleString()}
📄 Please find the attached PDF document.${businessInfo}`
    }
  }

  /**
   * Open WhatsApp web/app with pre-filled message
   */
  async sendMessage(
    phone: string,
    message: string,
    options: { downloadPDF?: () => Promise<void> } = {}
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const formattedPhone = this.formatPhoneNumber(phone)
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `${this.baseUrl}${formattedPhone}?text=${encodedMessage}`

      // Download PDF first if provided
      if (options.downloadPDF) {
        await options.downloadPDF()
      }

      // Open WhatsApp
      window.open(whatsappUrl, '_blank')

      return {
        success: true,
        message: 'WhatsApp opened successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to open WhatsApp'
      }
    }
  }

  /**
   * Generate WhatsApp Cloud API message (for direct sending without user interaction)
   * Note: Requires WhatsApp Business API setup
   */
  async sendDirectMessage(
    phone: string,
    message: string,
    attachmentUrl?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // This would require WhatsApp Cloud API credentials
      const apiToken = process.env.WHATSAPP_API_TOKEN
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

      if (!apiToken || !phoneNumberId) {
        throw new Error('WhatsApp API not configured')
      }

      const formattedPhone = this.formatPhoneNumber(phone)
      
      const payload: any = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message
        }
      }

      // Add document attachment if provided
      if (attachmentUrl) {
        payload.type = 'document'
        payload.document = {
          link: attachmentUrl,
          caption: message
        }
        delete payload.text
      }

      const response = await fetch(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'WhatsApp API error')
      }

      const result = await response.json()
      
      return {
        success: true,
        messageId: result.messages[0]?.id
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp message'
      }
    }
  }

  /**
   * Get WhatsApp status (for Business API)
   */
  async getMessageStatus(messageId: string): Promise<{
    status: 'sent' | 'delivered' | 'read' | 'failed'
    timestamp?: string
    error?: string
  }> {
    try {
      // This would query WhatsApp API for message status
      // Implementation depends on webhook setup
      return {
        status: 'sent'
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Status check failed'
      }
    }
  }
}