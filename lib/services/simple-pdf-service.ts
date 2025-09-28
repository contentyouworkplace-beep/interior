import jsPDF from 'jspdf'

export class PDFGenerationService {
  async generateQuotationPDF(quotation: any, businessSettings: any): Promise<Blob> {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text(businessSettings?.company_name || 'Your Company', 20, 20)
    
    doc.setFontSize(16)
    doc.text('QUOTATION', 20, 40)
    
    // Quotation details
    doc.setFontSize(12)
    doc.text(`Quotation Number: ${quotation.quotation_number}`, 20, 60)
    doc.text(`Date: ${new Date(quotation.issue_date).toLocaleDateString()}`, 20, 70)
    doc.text(`Valid Until: ${new Date(quotation.valid_until).toLocaleDateString()}`, 20, 80)
    
    // Client details
    doc.text('Bill To:', 20, 100)
    const clientName = quotation.client 
      ? `${quotation.client.first_name} ${quotation.client.last_name}`
      : 'N/A'
    doc.text(clientName, 20, 110)
    
    // Items
    let yPos = 130
    doc.text('Items:', 20, yPos)
    yPos += 10
    
    quotation.items?.forEach((item: any, index: number) => {
      doc.text(`${index + 1}. ${item.description}`, 20, yPos)
      doc.text(`Qty: ${item.quantity}`, 100, yPos)
      doc.text(`Price: ${item.unit_price}`, 140, yPos)
      doc.text(`Total: ${item.amount}`, 180, yPos)
      yPos += 10
    })
    
    // Totals
    yPos += 10
    doc.text(`Subtotal: ${quotation.currency} ${quotation.subtotal}`, 20, yPos)
    yPos += 10
    doc.text(`Tax: ${quotation.currency} ${quotation.tax_amount}`, 20, yPos)
    yPos += 10
    doc.setFontSize(14)
    doc.text(`Total: ${quotation.currency} ${quotation.total_amount}`, 20, yPos)
    
    return new Blob([doc.output('blob')], { type: 'application/pdf' })
  }

  async generateInvoicePDF(invoice: any, businessSettings: any): Promise<Blob> {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text(businessSettings?.company_name || 'Your Company', 20, 20)
    
    doc.setFontSize(16)
    doc.text('INVOICE', 20, 40)
    
    // Invoice details
    doc.setFontSize(12)
    doc.text(`Invoice Number: ${invoice.invoice_number}`, 20, 60)
    doc.text(`Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}`, 20, 70)
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 20, 80)
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, 90)
    
    // Client details
    doc.text('Bill To:', 20, 120)
    const clientName = invoice.client 
      ? `${invoice.client.first_name} ${invoice.client.last_name}`
      : 'N/A'
    doc.text(clientName, 20, 130)
    
    // Items
    let yPos = 150
    doc.text('Items:', 20, yPos)
    yPos += 10
    
    invoice.items?.forEach((item: any, index: number) => {
      doc.text(`${index + 1}. ${item.description}`, 20, yPos)
      doc.text(`Qty: ${item.quantity}`, 100, yPos)
      doc.text(`Price: ${item.unit_price}`, 140, yPos)
      doc.text(`Total: ${item.amount}`, 180, yPos)
      yPos += 10
    })
    
    // Totals
    yPos += 10
    doc.text(`Subtotal: ${invoice.currency} ${invoice.subtotal}`, 20, yPos)
    yPos += 10
    doc.text(`Tax: ${invoice.currency} ${invoice.tax_amount}`, 20, yPos)
    yPos += 10
    if (invoice.discount_amount > 0) {
      doc.text(`Discount: ${invoice.currency} ${invoice.discount_amount}`, 20, yPos)
      yPos += 10
    }
    doc.setFontSize(14)
    doc.text(`Total: ${invoice.currency} ${invoice.total_amount}`, 20, yPos)
    
    return new Blob([doc.output('blob')], { type: 'application/pdf' })
  }
}

export const pdfGenerationService = new PDFGenerationService()