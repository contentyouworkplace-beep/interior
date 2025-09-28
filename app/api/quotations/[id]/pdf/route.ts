import { NextRequest, NextResponse } from 'next/server'
import { QuotationService } from '@/lib/services/quotation-service'
import { pdfGenerationService } from '@/lib/services/simple-pdf-service'
import { BusinessSettingsService } from '@/lib/services/business-settings-service'

// Single handler (removed duplicate). Using simple pdf service for now.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quotationService = new QuotationService()
    const businessService = new BusinessSettingsService()

    // Fetch quotation
    const quotationResult = await quotationService.getQuotationById(params.id)
    if (!quotationResult.success || !quotationResult.data) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 })
    }

    // Fetch business settings
    const businessResult = await businessService.getBusinessSettings()
    if (!businessResult.success || !businessResult.data) {
      return NextResponse.json({ error: 'Business settings not found' }, { status: 500 })
    }

    const quotation = quotationResult.data
    const businessSettings = businessResult.data

    // Generate PDF (quotation variant)
    const pdfBuffer = await pdfGenerationService.generateQuotationPDF(quotation, businessSettings)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Quotation-${quotation.quotation_number || quotation.id}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Error generating quotation PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}