import { NextRequest, NextResponse } from 'next/server'
import { InvoiceService } from '@/lib/services/invoice-service'
import { pdfGenerationService } from '@/lib/services/simple-pdf-service'
import { BusinessSettingsService } from '@/lib/services/business-settings-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceService = new InvoiceService()
    const businessService = new BusinessSettingsService()
    
    // Get the invoice data
    const invoiceResult = await invoiceService.getInvoiceById(params.id)
    
    if (!invoiceResult.success || !invoiceResult.data) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }
    
    // Get business settings
    const businessResult = await businessService.getBusinessSettings()
    
    if (!businessResult.success || !businessResult.data) {
      return NextResponse.json(
        { error: 'Business settings not found' },
        { status: 500 }
      )
    }
    
    const invoice = invoiceResult.data
    const businessSettings = businessResult.data
    
    // Generate PDF with simple service
    const pdfBuffer = await pdfGenerationService.generateInvoicePDF(invoice, businessSettings)
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}