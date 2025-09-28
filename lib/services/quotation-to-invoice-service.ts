import { QuotationInvoiceData } from '@/lib/types/document-types'

export interface ConversionOptions {
  generateNewInvoiceNumber?: boolean
  updateIssueDate?: boolean
  setDueDays?: number
  includePaymentTerms?: boolean
  copyNotes?: boolean
}

export interface ConversionResult {
  success: boolean
  data?: QuotationInvoiceData
  error?: string
  invoiceNumber?: string
}

export class QuotationToInvoiceService {
  private apiEndpoint = '/api/convert-quotation'

  async convertQuotationToInvoice(
    quotationId: string,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    try {
      const payload = {
        quotationId,
        options: {
          generateNewInvoiceNumber: true,
          updateIssueDate: true,
          setDueDays: 30,
          includePaymentTerms: true,
          copyNotes: true,
          ...options
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
        throw new Error(result.error || 'Failed to convert quotation')
      }

      return {
        success: true,
        data: result.data,
        invoiceNumber: result.invoiceNumber
      }

    } catch (error) {
      console.error('Conversion error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to convert quotation'
      }
    }
  }

  // Client-side conversion for preview/draft
  convertQuotationDataToInvoice(
    quotationData: QuotationInvoiceData,
    options: ConversionOptions = {}
  ): QuotationInvoiceData {
    const currentDate = new Date().toISOString().split('T')[0]
    const dueDays = options.setDueDays || 30
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + dueDays)

    // Generate new invoice number
    const invoiceNumber = options.generateNewInvoiceNumber 
      ? this.generateInvoiceNumber()
      : quotationData.metadata.documentNumber.replace('QTN', 'INV')

    // Convert quotation data to invoice format
    const invoiceData: QuotationInvoiceData = {
      ...quotationData,
      id: undefined, // New document, no ID yet
      metadata: {
        ...quotationData.metadata,
        documentNumber: invoiceNumber,
        documentType: 'invoice',
        issueDate: options.updateIssueDate ? currentDate : quotationData.metadata.issueDate,
        dueDate: dueDate.toISOString().split('T')[0],
        validUntil: undefined, // Invoices don't have validity period
        quotationReference: quotationData.metadata.documentNumber,
        paymentStatus: 'pending'
      },
      status: 'draft',
      notes: options.copyNotes ? quotationData.notes : undefined,
      terms: options.includePaymentTerms 
        ? this.getInvoicePaymentTerms(quotationData.terms)
        : quotationData.terms,
      paymentDetails: [], // Empty payment details for new invoice
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return invoiceData
  }

  private generateInvoiceNumber(): string {
    const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `INV-${date}-${random}`
  }

  private getInvoicePaymentTerms(quotationTerms?: string): string {
    const defaultInvoiceTerms = `1. Payment due within 30 days of invoice date
2. Late payment charges of 2% per month will be applied on overdue amounts
3. GST will be charged as applicable
4. All disputes subject to local jurisdiction
5. Payment should be made in favor of the company as mentioned in banking details`

    if (!quotationTerms) {
      return defaultInvoiceTerms
    }

    // Convert quotation terms to invoice terms
    let invoiceTerms = quotationTerms
      .replace(/quotation/gi, 'invoice')
      .replace(/valid for \d+ days/gi, 'payment due within 30 days')
      .replace(/advance required/gi, 'full payment required')

    // Add payment-specific terms if not already present
    if (!invoiceTerms.includes('payment due') && !invoiceTerms.includes('due date')) {
      invoiceTerms = `1. Payment due within 30 days of invoice date\n${invoiceTerms}`
    }

    if (!invoiceTerms.includes('late payment') && !invoiceTerms.includes('overdue')) {
      invoiceTerms += '\n6. Late payment charges of 2% per month will be applied on overdue amounts'
    }

    return invoiceTerms
  }

  // Track conversion history
  async getConversionHistory(quotationId: string): Promise<{
    success: boolean
    data?: Array<{
      id: string
      invoiceNumber: string
      convertedAt: string
      status: string
    }>
    error?: string
  }> {
    try {
      const response = await fetch(`${this.apiEndpoint}/${quotationId}/history`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch conversion history')
      }

      return { success: true, data: result.data }

    } catch (error) {
      console.error('Error fetching conversion history:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch conversion history'
      }
    }
  }

  // Validate if quotation can be converted
  validateQuotationForConversion(quotationData: QuotationInvoiceData): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if it's already an invoice
    if (quotationData.metadata.documentType === 'invoice') {
      errors.push('Document is already an invoice')
    }

    // Check status
    if (quotationData.status === 'rejected') {
      errors.push('Cannot convert rejected quotation')
    }

    if (quotationData.status === 'expired') {
      warnings.push('Quotation has expired, conversion will create invoice with current date')
    }

    // Check if quotation has already been converted
    if (quotationData.status === 'converted') {
      warnings.push('Quotation has already been converted to invoice')
    }

    // Check required fields
    if (!quotationData.client.name) {
      errors.push('Client name is required')
    }

    if (!quotationData.client.email && !quotationData.client.phone) {
      warnings.push('Client contact information (email or phone) is recommended')
    }

    if (!quotationData.lineItems.length) {
      errors.push('At least one line item is required')
    }

    if (quotationData.totals.finalTotal <= 0) {
      errors.push('Total amount must be greater than zero')
    }

    // Check validity period
    if (quotationData.metadata.validUntil) {
      const validUntil = new Date(quotationData.metadata.validUntil)
      const today = new Date()
      
      if (validUntil < today) {
        warnings.push('Quotation validity period has expired')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Preview conversion changes
  previewConversion(
    quotationData: QuotationInvoiceData,
    options: ConversionOptions = {}
  ): {
    originalQuotation: Partial<QuotationInvoiceData>
    convertedInvoice: Partial<QuotationInvoiceData>
    changes: Array<{
      field: string
      from: any
      to: any
      description: string
    }>
  } {
    const invoiceData = this.convertQuotationDataToInvoice(quotationData, options)

    const changes = [
      {
        field: 'documentType',
        from: 'quotation',
        to: 'invoice',
        description: 'Document type changed from quotation to invoice'
      },
      {
        field: 'documentNumber',
        from: quotationData.metadata.documentNumber,
        to: invoiceData.metadata.documentNumber,
        description: 'New invoice number generated'
      },
      {
        field: 'status',
        from: quotationData.status,
        to: 'draft',
        description: 'Status reset to draft for new invoice'
      }
    ]

    if (options.updateIssueDate) {
      changes.push({
        field: 'issueDate',
        from: quotationData.metadata.issueDate,
        to: invoiceData.metadata.issueDate,
        description: 'Issue date updated to current date'
      })
    }

    if (invoiceData.metadata.dueDate) {
      changes.push({
        field: 'dueDate',
        from: 'N/A',
        to: invoiceData.metadata.dueDate,
        description: `Due date set to ${options.setDueDays || 30} days from issue date`
      })
    }

    return {
      originalQuotation: {
        metadata: quotationData.metadata,
        status: quotationData.status,
        notes: quotationData.notes,
        terms: quotationData.terms
      },
      convertedInvoice: {
        metadata: invoiceData.metadata,
        status: invoiceData.status,
        notes: invoiceData.notes,
        terms: invoiceData.terms
      },
      changes
    }
  }
}