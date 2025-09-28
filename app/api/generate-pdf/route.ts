import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { document, company, options } = body

    if (!document || !company) {
      return NextResponse.json(
        { error: 'Document and company data are required' },
        { status: 400 }
      )
    }

    // Generate HTML content
    const htmlContent = generateDocumentHTML(document, company, options)
    
    // Convert HTML to PDF using Puppeteer or similar
    // For now, we'll return the HTML that can be converted client-side
    const pdfBuffer = await convertHTMLToPDF(htmlContent)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${document.metadata.documentType}-${document.metadata.documentNumber}.pdf"`,
      },
    })

  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

function generateDocumentHTML(document: any, company: any, options: any): string {
  const { template = 'modern', headerColor = '#3B82F6', accentColor = '#1E40AF' } = options || {}
  
  // Format data
  const issueDate = new Date(document.metadata.issueDate).toLocaleDateString('en-IN')
  const validUntil = document.metadata.validUntil 
    ? new Date(document.metadata.validUntil).toLocaleDateString('en-IN') 
    : null
  const dueDate = document.metadata.dueDate 
    ? new Date(document.metadata.dueDate).toLocaleDateString('en-IN') 
    : null

  const companyAddress = [
    company.profile?.address || company.company?.address,
    company.profile?.city || company.company?.city,
    company.profile?.state || company.company?.state,
    company.profile?.pin_code || company.company?.pin_code
  ].filter(Boolean).join(', ')

  const clientAddress = [
    document.client.address,
    document.client.city,
    document.client.state,
    document.client.pinCode
  ].filter(Boolean).join(', ')

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${document.metadata.documentType.toUpperCase()} ${document.metadata.documentNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif; 
          font-size: 12px; 
          line-height: 1.4; 
          color: #2d3748;
          background: white;
        }
        .document { 
          max-width: 210mm; 
          margin: 0 auto; 
          padding: 20mm; 
          background: white;
          min-height: 297mm;
        }
        
        /* Header Section */
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 30px;
          border-bottom: 3px solid ${headerColor};
          padding-bottom: 20px;
        }
        .company-section {
          flex: 1;
        }
        .company-logo { 
          max-height: 60px; 
          max-width: 150px; 
          margin-bottom: 10px;
        }
        .company-name { 
          color: ${headerColor}; 
          font-size: 20px; 
          font-weight: 700; 
          margin-bottom: 5px;
          letter-spacing: -0.5px;
        }
        .company-tagline { 
          color: ${accentColor}; 
          font-size: 12px; 
          margin-bottom: 15px;
          font-style: italic;
        }
        .company-contact {
          font-size: 11px;
          line-height: 1.6;
        }
        .company-legal {
          text-align: right;
          font-size: 11px;
        }
        .company-legal strong {
          display: inline-block;
          width: 60px;
          text-align: left;
        }
        
        /* Document Title */
        .document-title { 
          background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%);
          color: white; 
          padding: 15px 25px; 
          border-radius: 8px;
          text-align: center;
          font-size: 16px;
          font-weight: 600;
          margin: 20px 0;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        /* Info Sections */
        .info-section { 
          display: flex; 
          justify-content: space-between; 
          margin: 25px 0;
          gap: 30px;
        }
        .info-box { 
          flex: 1;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid ${accentColor};
        }
        .info-box h3 { 
          color: ${accentColor}; 
          font-size: 14px; 
          font-weight: 600; 
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-box p {
          margin-bottom: 8px;
          font-size: 11px;
        }
        .info-box strong {
          color: #2d3748;
        }
        
        /* Line Items Table */
        .line-items-section {
          margin: 30px 0;
        }
        .line-items-table { 
          width: 100%; 
          border-collapse: collapse; 
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .line-items-table th { 
          background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%);
          color: white; 
          padding: 12px 10px; 
          text-align: left; 
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .line-items-table td { 
          padding: 12px 10px; 
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
        }
        .line-items-table tr:nth-child(even) { 
          background-color: #f7fafc;
        }
        .line-items-table tr:hover {
          background-color: #edf2f7;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        
        /* Totals Section */
        .totals-section { 
          margin-top: 30px; 
          display: flex; 
          justify-content: flex-end;
        }
        .totals-box { 
          min-width: 350px; 
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .totals-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 10px 20px; 
          border-bottom: 1px solid #f1f5f9;
          font-size: 12px;
        }
        .totals-row:last-child {
          border-bottom: none;
        }
        .totals-row.subtotal {
          background: #f8fafc;
          font-weight: 500;
        }
        .totals-row.final { 
          background: linear-gradient(135deg, ${headerColor} 0%, ${accentColor} 100%);
          color: white; 
          font-weight: 700; 
          font-size: 14px;
          padding: 15px 20px;
        }
        
        /* Banking & Terms */
        .banking-section { 
          margin: 30px 0; 
          padding: 20px; 
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          border: 1px solid #cbd5e0;
        }
        .banking-section h3 { 
          color: ${accentColor}; 
          margin-bottom: 15px;
          font-size: 14px;
          font-weight: 600;
        }
        .banking-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }
        .banking-item {
          font-size: 11px;
        }
        .banking-item strong {
          display: block;
          color: #4a5568;
          margin-bottom: 3px;
        }
        
        .terms-section { 
          margin: 30px 0; 
          padding: 20px; 
          background: white;
          border: 1px solid #e2e8f0; 
          border-radius: 12px;
          border-left: 4px solid ${headerColor};
        }
        .terms-section h3 { 
          color: ${accentColor}; 
          margin-bottom: 15px;
          font-size: 14px;
          font-weight: 600;
        }
        .terms-content {
          white-space: pre-line;
          line-height: 1.6;
          font-size: 11px;
          color: #4a5568;
        }
        
        /* Footer */
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          color: #718096; 
          font-size: 10px;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        .footer .thank-you {
          font-size: 12px;
          color: ${accentColor};
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        /* Watermark for Draft */
        .watermark { 
          position: fixed; 
          top: 50%; 
          left: 50%; 
          transform: translate(-50%, -50%) rotate(-45deg); 
          font-size: 60px; 
          color: rgba(0,0,0,0.05); 
          z-index: -1; 
          pointer-events: none;
          font-weight: 900;
          user-select: none;
        }
        
        /* Print Styles */
        @media print {
          .document { 
            margin: 0; 
            padding: 15mm;
            box-shadow: none;
          }
          .watermark { position: absolute; }
        }
      </style>
    </head>
    <body>
      <div class="document">
        ${document.status === 'draft' ? '<div class="watermark">DRAFT</div>' : ''}
        
        <!-- Header -->
        <div class="header">
          <div class="company-section">
            ${company.branding?.logo_url ? `<img src="${company.branding.logo_url}" alt="Company Logo" class="company-logo" />` : ''}
            <div class="company-name">${company.profile?.company_name || company.company?.company_name || 'Your Company'}</div>
            ${(company.profile?.company_tagline || company.company?.company_tagline) ? `<div class="company-tagline">${company.profile.company_tagline || company.company.company_tagline}</div>` : ''}
            <div class="company-contact">
              ${companyAddress ? `<div>📍 ${companyAddress}</div>` : ''}
              ${(company.profile?.phone || company.company?.phone) ? `<div>📞 ${company.profile.phone || company.company.phone}</div>` : ''}
              ${(company.profile?.email || company.company?.email) ? `<div>✉️ ${company.profile.email || company.company.email}</div>` : ''}
              ${(company.profile?.website || company.company?.website) ? `<div>🌐 ${company.profile.website || company.company.website}</div>` : ''}
            </div>
          </div>
          <div class="company-legal">
            ${(company.profile?.gstin || company.company?.gstin) ? `<div><strong>GSTIN:</strong> ${company.profile.gstin || company.company.gstin}</div>` : ''}
            ${(company.profile?.pan || company.company?.pan) ? `<div><strong>PAN:</strong> ${company.profile.pan || company.company.pan}</div>` : ''}
            ${(company.profile?.cin || company.company?.cin) ? `<div><strong>CIN:</strong> ${company.profile.cin || company.company.cin}</div>` : ''}
          </div>
        </div>
        
        <!-- Document Title -->
        <div class="document-title">
          ${document.metadata.documentType.toUpperCase()} - ${document.metadata.documentNumber}
        </div>
        
        <!-- Document & Client Info -->
        <div class="info-section">
          <div class="info-box">
            <h3>Document Details</h3>
            <p><strong>Issue Date:</strong> ${issueDate}</p>
            ${validUntil ? `<p><strong>Valid Until:</strong> ${validUntil}</p>` : ''}
            ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
            <p><strong>Currency:</strong> ${document.metadata.currency}</p>
            ${document.metadata.quotationReference ? `<p><strong>Reference:</strong> ${document.metadata.quotationReference}</p>` : ''}
          </div>
          
          <div class="info-box">
            <h3>Bill To</h3>
            <p><strong>${document.client.name}</strong></p>
            ${document.client.company ? `<p>${document.client.company}</p>` : ''}
            ${clientAddress ? `<p>${clientAddress}</p>` : ''}
            ${document.client.phone ? `<p>📞 ${document.client.phone}</p>` : ''}
            ${document.client.email ? `<p>✉️ ${document.client.email}</p>` : ''}
            ${document.client.gstin ? `<p><strong>GSTIN:</strong> ${document.client.gstin}</p>` : ''}
          </div>
        </div>
        
        <!-- Line Items -->
        <div class="line-items-section">
          <table class="line-items-table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Description</th>
                <th style="width: 60px;" class="text-center">Qty</th>
                <th style="width: 60px;" class="text-center">Unit</th>
                <th style="width: 100px;" class="text-right">Rate</th>
                <th style="width: 120px;" class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${document.lineItems.map((item: any, index: number) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>
                    <strong>${item.description}</strong>
                    ${item.notes ? `<br><small style="color: #718096;">${item.notes}</small>` : ''}
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-center">${item.unit}</td>
                  <td class="text-right">₹${item.unitPrice.toFixed(2)}</td>
                  <td class="text-right"><strong>₹${item.total.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Totals -->
        <div class="totals-section">
          <div class="totals-box">
            <div class="totals-row subtotal">
              <span><strong>Subtotal:</strong></span>
              <span><strong>₹${document.totals.subtotal.toFixed(2)}</strong></span>
            </div>
            ${document.totals.discountAmount > 0 ? `
            <div class="totals-row" style="color: #38a169;">
              <span>Discount:</span>
              <span>-₹${document.totals.discountAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="totals-row">
              <span>Taxable Amount:</span>
              <span>₹${document.totals.taxableAmount.toFixed(2)}</span>
            </div>
            ${document.totals.igstAmount > 0 ? `
            <div class="totals-row">
              <span>IGST (${document.taxConfig.igst}%):</span>
              <span>₹${document.totals.igstAmount.toFixed(2)}</span>
            </div>
            ` : `
            ${document.totals.cgstAmount > 0 ? `
            <div class="totals-row">
              <span>CGST (${document.taxConfig.cgst}%):</span>
              <span>₹${document.totals.cgstAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            ${document.totals.sgstAmount > 0 ? `
            <div class="totals-row">
              <span>SGST (${document.taxConfig.sgst}%):</span>
              <span>₹${document.totals.sgstAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            `}
            ${document.totals.roundOffAmount !== 0 ? `
            <div class="totals-row">
              <span>Round Off:</span>
              <span>₹${document.totals.roundOffAmount.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="totals-row final">
              <span>Total Amount:</span>
              <span>₹${document.totals.finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <!-- Banking Details -->
        ${(company.banking && (company.banking.bank_name || company.banking.account_number)) ? `
        <div class="banking-section">
          <h3>Payment Information</h3>
          <div class="banking-grid">
            ${company.banking.bank_name ? `
            <div class="banking-item">
              <strong>Bank Name</strong>
              ${company.banking.bank_name}
            </div>
            ` : ''}
            ${company.banking.account_holder_name ? `
            <div class="banking-item">
              <strong>Account Holder</strong>
              ${company.banking.account_holder_name}
            </div>
            ` : ''}
            ${company.banking.account_number ? `
            <div class="banking-item">
              <strong>Account Number</strong>
              ${company.banking.account_number}
            </div>
            ` : ''}
            ${company.banking.ifsc_code ? `
            <div class="banking-item">
              <strong>IFSC Code</strong>
              ${company.banking.ifsc_code}
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        <!-- Terms & Conditions -->
        ${document.terms ? `
        <div class="terms-section">
          <h3>Terms & Conditions</h3>
          <div class="terms-content">${document.terms}</div>
        </div>
        ` : ''}
        
        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">Thank you for your business!</div>
          <div>This is a computer-generated ${document.metadata.documentType} and does not require a physical signature.</div>
          ${(company.profile?.website || company.company?.website) ? `<div>Visit us at: ${company.profile.website || company.company.website}</div>` : ''}
        </div>
      </div>
    </body>
    </html>
  `
}

async function convertHTMLToPDF(html: string): Promise<Buffer> {
  // For now, return the HTML as a simple text buffer
  // In production, you would use Puppeteer or similar to convert HTML to PDF
  
  // Simple HTML to PDF conversion using browser's print functionality
  // This would be handled client-side or with a proper PDF library
  const htmlBuffer = Buffer.from(html, 'utf-8')
  
  // In a real implementation, you'd use something like:
  // const puppeteer = require('puppeteer')
  // const browser = await puppeteer.launch()
  // const page = await browser.newPage()
  // await page.setContent(html)
  // const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true })
  // await browser.close()
  // return pdfBuffer
  
  return htmlBuffer
}