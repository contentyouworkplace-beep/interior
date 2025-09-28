import { QuotationInvoiceData } from '@/lib/types/document-types'
import { CompanyData } from '@/lib/services/company-data-service'

export interface EmailTemplate {
  subject: string
  body: string
  attachmentName: string
}

export interface EmailOptions {
  template?: 'quotation' | 'invoice' | 'reminder' | 'custom'
  customSubject?: string
  customBody?: string
  includeCompanySignature?: boolean
  copyToSender?: boolean
  additionalRecipients?: string[]
}

export class EmailService {
  private apiEndpoint = '/api/send-email'

  async sendDocument(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    pdfBlob: Blob,
    options: EmailOptions = {}
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Prepare email template
      const emailTemplate = this.generateEmailTemplate(documentData, companyData, options)
      
      // Convert PDF to base64 for API transmission
      const pdfBuffer = await this.blobToBase64(pdfBlob)
      
      const payload = {
        recipient: documentData.client.email,
        additionalRecipients: options.additionalRecipients || [],
        copyToSender: options.copyToSender || false,
        subject: emailTemplate.subject,
        body: emailTemplate.body,
        attachment: {
          name: emailTemplate.attachmentName,
          content: pdfBuffer,
          type: 'application/pdf'
        },
        documentType: documentData.metadata.documentType,
        documentNumber: documentData.metadata.documentNumber,
        companyInfo: {
          name: companyData.profile.company_name,
          email: companyData.profile.email,
          phone: companyData.profile.phone
        }
      }

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email')
      }

      return { 
        success: true, 
        message: `${documentData.metadata.documentType} sent successfully to ${documentData.client.email}` 
      }

    } catch (error) {
      console.error('Email sending error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      }
    }
  }

  async sendReminder(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    reminderType: 'gentle' | 'urgent' | 'final' = 'gentle'
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const reminderTemplate = this.generateReminderTemplate(documentData, companyData, reminderType)
      
      const payload = {
        recipient: documentData.client.email,
        subject: reminderTemplate.subject,
        body: reminderTemplate.body,
        documentType: documentData.metadata.documentType,
        documentNumber: documentData.metadata.documentNumber,
        reminderType,
        companyInfo: {
          name: companyData.profile.company_name,
          email: companyData.profile.email,
          phone: companyData.profile.phone
        }
      }

      const response = await fetch(`${this.apiEndpoint}/reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send reminder')
      }

      return { 
        success: true, 
        message: `${reminderType} reminder sent successfully` 
      }

    } catch (error) {
      console.error('Reminder sending error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send reminder' 
      }
    }
  }

  private generateEmailTemplate(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    options: EmailOptions
  ): EmailTemplate {
    const isQuotation = documentData.metadata.documentType === 'quotation'
    const companyName = companyData.profile.company_name
    const clientName = documentData.client.name
    const documentNumber = documentData.metadata.documentNumber
    const amount = `₹${documentData.totals.finalTotal.toFixed(2)}`

    // Custom template
    if (options.template === 'custom' && options.customSubject && options.customBody) {
      return {
        subject: options.customSubject,
        body: options.customBody,
        attachmentName: `${documentData.metadata.documentType}-${documentNumber}.pdf`
      }
    }

    // Default templates
    const templates = {
      quotation: {
        subject: `Quotation ${documentNumber} from ${companyName}`,
        body: this.getQuotationEmailBody(clientName, documentNumber, amount, companyName, companyData),
        attachmentName: `Quotation-${documentNumber}.pdf`
      },
      invoice: {
        subject: `Invoice ${documentNumber} from ${companyName}`,
        body: this.getInvoiceEmailBody(clientName, documentNumber, amount, companyName, companyData, documentData),
        attachmentName: `Invoice-${documentNumber}.pdf`
      }
    }

    const template = options.template || (isQuotation ? 'quotation' : 'invoice')
    return templates[template as keyof typeof templates] || templates.quotation
  }

  private getQuotationEmailBody(
    clientName: string,
    documentNumber: string,
    amount: string,
    companyName: string,
    companyData: CompanyData
  ): string {
    return `
Dear ${clientName},

Thank you for your interest in our services. Please find attached the quotation ${documentNumber} for your project.

**Quotation Summary:**
- Quotation Number: ${documentNumber}
- Total Amount: ${amount}

We have carefully reviewed your requirements and prepared this detailed quotation. Our team is excited about the opportunity to work with you and bring your vision to life.

**Key Highlights:**
• Competitive pricing with transparent breakdown
• High-quality materials and workmanship
• Professional project management
• Timely delivery commitment
• Post-completion support

The quotation is valid for 30 days from the date of issue. Should you have any questions or require clarifications, please don't hesitate to contact us.

We look forward to hearing from you and the opportunity to serve you.

Best regards,
${companyName}

---
${companyData.profile.email ? `Email: ${companyData.profile.email}` : ''}
${companyData.profile.phone ? `Phone: ${companyData.profile.phone}` : ''}
${companyData.profile.website ? `Website: ${companyData.profile.website}` : ''}

This is an automated message. Please do not reply directly to this email.
    `.trim()
  }

  private getInvoiceEmailBody(
    clientName: string,
    documentNumber: string,
    amount: string,
    companyName: string,
    companyData: CompanyData,
    documentData: QuotationInvoiceData
  ): string {
    const dueDate = documentData.metadata.dueDate 
      ? new Date(documentData.metadata.dueDate).toLocaleDateString('en-IN')
      : 'N/A'

    return `
Dear ${clientName},

Thank you for choosing ${companyName} for your project. Please find attached invoice ${documentNumber} for the completed work.

**Invoice Details:**
- Invoice Number: ${documentNumber}
- Invoice Date: ${new Date(documentData.metadata.issueDate).toLocaleDateString('en-IN')}
- Due Date: ${dueDate}
- Total Amount: ${amount}

**Payment Information:**
${companyData.banking?.bank_name ? `Bank Name: ${companyData.banking.bank_name}` : ''}
${companyData.banking?.account_number ? `Account Number: ${companyData.banking.account_number}` : ''}
${companyData.banking?.ifsc_code ? `IFSC Code: ${companyData.banking.ifsc_code}` : ''}

Please ensure payment is made by the due date to avoid any late fees. Once payment is received, we will send you a payment confirmation.

If you have any questions regarding this invoice or need assistance with payment, please contact us immediately.

Thank you for your business. We appreciate the opportunity to serve you and look forward to working with you again.

Best regards,
${companyName}

---
${companyData.profile.email ? `Email: ${companyData.profile.email}` : ''}
${companyData.profile.phone ? `Phone: ${companyData.profile.phone}` : ''}
${companyData.profile.website ? `Website: ${companyData.profile.website}` : ''}

This is an automated message. Please do not reply directly to this email.
    `.trim()
  }

  private generateReminderTemplate(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    reminderType: 'gentle' | 'urgent' | 'final'
  ): EmailTemplate {
    const clientName = documentData.client.name
    const documentNumber = documentData.metadata.documentNumber
    const amount = `₹${documentData.totals.finalTotal.toFixed(2)}`
    const companyName = companyData.profile.company_name
    const isOverdue = documentData.metadata.dueDate 
      ? new Date(documentData.metadata.dueDate) < new Date()
      : false

    const templates = {
      gentle: {
        subject: `Friendly Reminder - ${documentData.metadata.documentType} ${documentNumber}`,
        body: `
Dear ${clientName},

I hope this message finds you well. This is a gentle reminder regarding ${documentData.metadata.documentType} ${documentNumber} with an amount of ${amount}.

${isOverdue 
  ? 'We notice that the payment is now overdue. We would appreciate your prompt attention to this matter.'
  : 'The payment is approaching its due date. We wanted to send this friendly reminder to help you stay on track.'
}

If you have already made the payment, please disregard this message. If you have any questions or concerns, please feel free to contact us.

Thank you for your attention to this matter.

Best regards,
${companyName}
        `.trim()
      },
      urgent: {
        subject: `URGENT: Payment Required - ${documentData.metadata.documentType} ${documentNumber}`,
        body: `
Dear ${clientName},

This is an urgent reminder regarding the overdue payment for ${documentData.metadata.documentType} ${documentNumber}.

**Outstanding Amount: ${amount}**

The payment was due on ${documentData.metadata.dueDate ? new Date(documentData.metadata.dueDate).toLocaleDateString('en-IN') : 'N/A'} and is now significantly overdue.

Please arrange for immediate payment to avoid any further collection actions. If there are any issues preventing payment, please contact us immediately to discuss alternative arrangements.

We value our business relationship and hope to resolve this matter promptly.

Urgent attention required.

${companyName}
        `.trim()
      },
      final: {
        subject: `FINAL NOTICE - ${documentData.metadata.documentType} ${documentNumber}`,
        body: `
Dear ${clientName},

This is the FINAL NOTICE regarding the overdue payment for ${documentData.metadata.documentType} ${documentNumber}.

**Outstanding Amount: ${amount}**
**Original Due Date: ${documentData.metadata.dueDate ? new Date(documentData.metadata.dueDate).toLocaleDateString('en-IN') : 'N/A'}**

Despite our previous reminders, the payment remains outstanding. If payment is not received within 7 days of this notice, we will have no choice but to:

1. Hand over this account to our collection agency
2. Report this to credit bureaus
3. Pursue legal action for recovery

This action will negatively affect your credit rating and may result in additional legal costs.

To avoid these consequences, please arrange for immediate payment or contact us within 48 hours to discuss payment arrangements.

This is your final opportunity to resolve this matter amicably.

${companyName}
Collection Department
        `.trim()
      }
    }

    return {
      subject: templates[reminderType].subject,
      body: templates[reminderType].body,
      attachmentName: `${documentData.metadata.documentType}-${documentNumber}-reminder.pdf`
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix (data:application/pdf;base64,)
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Validate email address
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Preview email template
  previewEmailTemplate(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    options: EmailOptions = {}
  ): EmailTemplate {
    return this.generateEmailTemplate(documentData, companyData, options)
  }
}