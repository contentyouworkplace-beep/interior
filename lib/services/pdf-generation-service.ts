import { QuotationInvoiceData } from '@/lib/types/document-types'
import { CompanyData } from '@/lib/services/company-data-service'

export interface PDFGenerationOptions {
  template: string
  includeWatermark?: boolean
  headerColor?: string
  accentColor?: string
}

export class PDFGenerationService {
  private apiEndpoint = '/api/generate-pdf'

  async generateDocument(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    options?: PDFGenerationOptions
  ): Promise<Blob> {
    try {
      // First try the API endpoint
      return await this.generateViaPuppeteer(documentData, companyData, options)
    } catch (error) {
      console.warn('API PDF generation failed, trying client-side:', error)
      // Fallback to client-side PDF generation
      return await this.generateClientSide(documentData, companyData, options)
    }
  }

  private async generateViaPuppeteer(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    options?: PDFGenerationOptions
  ): Promise<Blob> {
    const payload = {
      document: documentData,
      company: companyData,
      options: {
        template: documentData.metadata.template || 'modern',
        includeWatermark: documentData.status === 'draft',
        headerColor: companyData.branding?.primary_color || '#3B82F6',
        accentColor: companyData.branding?.secondary_color || '#1E40AF',
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

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`PDF API error: ${response.status} - ${errorText}`)
    }

    return await response.blob()
  }

  private async generateClientSide(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    options?: PDFGenerationOptions
  ): Promise<Blob> {
    // Generate HTML and convert using browser's print functionality
    const htmlContent = this.generateHTMLContent(documentData, companyData, options)
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow pop-ups and try again.')
    }

    return new Promise((resolve, reject) => {
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      // Wait for content to load
      printWindow.onload = () => {
        try {
          // Trigger print dialog
          printWindow.print()
          
          // Create a blob with the HTML content as fallback
          const blob = new Blob([htmlContent], { type: 'text/html' })
          
          // Close the window after a short delay
          setTimeout(() => {
            printWindow.close()
            resolve(blob)
          }, 1000)
        } catch (error) {
          printWindow.close()
          reject(error)
        }
      }
    })
  }

  private generateHTMLContent(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    options?: PDFGenerationOptions
  ): string {
    const { template = 'modern', headerColor = '#3B82F6', accentColor = '#1E40AF' } = options || {}
    
    // Format data
    const issueDate = new Date(documentData.metadata.issueDate).toLocaleDateString('en-IN')
    const validUntil = documentData.metadata.validUntil 
      ? new Date(documentData.metadata.validUntil).toLocaleDateString('en-IN') 
      : null
    const dueDate = documentData.metadata.dueDate 
      ? new Date(documentData.metadata.dueDate).toLocaleDateString('en-IN') 
      : null

    const companyAddress = [
      companyData.profile?.address || companyData.company?.address,
      companyData.profile?.city || companyData.company?.city,
      companyData.profile?.state || companyData.company?.state,
      companyData.profile?.pin_code || companyData.company?.pin_code
    ].filter(Boolean).join(', ')

    const clientAddress = [
      documentData.client.address,
      documentData.client.city,
      documentData.client.state,
      documentData.client.pinCode
    ].filter(Boolean).join(', ')

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentData.metadata.documentType.toUpperCase()} ${documentData.metadata.documentNumber}</title>
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
          ${documentData.status === 'draft' ? '<div class="watermark">DRAFT</div>' : ''}
          
          <!-- Header -->
          <div class="header">
            <div class="company-section">
              ${companyData.branding?.logo_url ? `<img src="${companyData.branding.logo_url}" alt="Company Logo" class="company-logo" />` : ''}
              <div class="company-name">${companyData.profile?.company_name || companyData.company?.company_name || 'Your Company'}</div>
              ${(companyData.profile?.company_tagline || companyData.company?.company_tagline) ? `<div class="company-tagline">${companyData.profile.company_tagline || companyData.company.company_tagline}</div>` : ''}
              <div class="company-contact">
                ${companyAddress ? `<div>📍 ${companyAddress}</div>` : ''}
                ${(companyData.profile?.phone || companyData.company?.phone) ? `<div>📞 ${companyData.profile.phone || companyData.company.phone}</div>` : ''}
                ${(companyData.profile?.email || companyData.company?.email) ? `<div>✉️ ${companyData.profile.email || companyData.company.email}</div>` : ''}
                ${(companyData.profile?.website || companyData.company?.website) ? `<div>🌐 ${companyData.profile.website || companyData.company.website}</div>` : ''}
              </div>
            </div>
            <div class="company-legal">
              ${(companyData.profile?.gstin || companyData.company?.gstin) ? `<div><strong>GSTIN:</strong> ${companyData.profile.gstin || companyData.company.gstin}</div>` : ''}
              ${(companyData.profile?.pan || companyData.company?.pan) ? `<div><strong>PAN:</strong> ${companyData.profile.pan || companyData.company.pan}</div>` : ''}
              ${(companyData.profile?.cin || companyData.company?.cin) ? `<div><strong>CIN:</strong> ${companyData.profile.cin || companyData.company.cin}</div>` : ''}
            </div>
          </div>
          
          <!-- Document Title -->
          <div class="document-title">
            ${documentData.metadata.documentType.toUpperCase()} - ${documentData.metadata.documentNumber}
          </div>
          
          <!-- Document & Client Info -->
          <div class="info-section">
            <div class="info-box">
              <h3>Document Details</h3>
              <p><strong>Issue Date:</strong> ${issueDate}</p>
              ${validUntil ? `<p><strong>Valid Until:</strong> ${validUntil}</p>` : ''}
              ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
              <p><strong>Currency:</strong> ${documentData.metadata.currency}</p>
              ${documentData.metadata.quotationReference ? `<p><strong>Reference:</strong> ${documentData.metadata.quotationReference}</p>` : ''}
            </div>
            
            <div class="info-box">
              <h3>Bill To</h3>
              <p><strong>${documentData.client.name}</strong></p>
              ${documentData.client.company ? `<p>${documentData.client.company}</p>` : ''}
              ${clientAddress ? `<p>${clientAddress}</p>` : ''}
              ${documentData.client.phone ? `<p>📞 ${documentData.client.phone}</p>` : ''}
              ${documentData.client.email ? `<p>✉️ ${documentData.client.email}</p>` : ''}
              ${documentData.client.gstin ? `<p><strong>GSTIN:</strong> ${documentData.client.gstin}</p>` : ''}
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
                ${documentData.lineItems.map((item: any, index: number) => `
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
                <span><strong>₹${documentData.totals.subtotal.toFixed(2)}</strong></span>
              </div>
              ${documentData.totals.discountAmount > 0 ? `
              <div class="totals-row" style="color: #38a169;">
                <span>Discount:</span>
                <span>-₹${documentData.totals.discountAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="totals-row">
                <span>Taxable Amount:</span>
                <span>₹${documentData.totals.taxableAmount.toFixed(2)}</span>
              </div>
              ${documentData.totals.igstAmount > 0 ? `
              <div class="totals-row">
                <span>IGST (${documentData.taxConfig.igst}%):</span>
                <span>₹${documentData.totals.igstAmount.toFixed(2)}</span>
              </div>
              ` : `
              ${documentData.totals.cgstAmount > 0 ? `
              <div class="totals-row">
                <span>CGST (${documentData.taxConfig.cgst}%):</span>
                <span>₹${documentData.totals.cgstAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              ${documentData.totals.sgstAmount > 0 ? `
              <div class="totals-row">
                <span>SGST (${documentData.taxConfig.sgst}%):</span>
                <span>₹${documentData.totals.sgstAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              `}
              ${documentData.totals.roundOffAmount !== 0 ? `
              <div class="totals-row">
                <span>Round Off:</span>
                <span>₹${documentData.totals.roundOffAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="totals-row final">
                <span>Total Amount:</span>
                <span>₹${documentData.totals.finalTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <!-- Banking Details -->
          ${(companyData.banking && (companyData.banking.bank_name || companyData.banking.account_number)) ? `
          <div class="banking-section">
            <h3>Payment Information</h3>
            <div class="banking-grid">
              ${companyData.banking.bank_name ? `
              <div class="banking-item">
                <strong>Bank Name</strong>
                ${companyData.banking.bank_name}
              </div>
              ` : ''}
              ${companyData.banking.account_holder_name ? `
              <div class="banking-item">
                <strong>Account Holder</strong>
                ${companyData.banking.account_holder_name}
              </div>
              ` : ''}
              ${companyData.banking.account_number ? `
              <div class="banking-item">
                <strong>Account Number</strong>
                ${companyData.banking.account_number}
              </div>
              ` : ''}
              ${companyData.banking.ifsc_code ? `
              <div class="banking-item">
                <strong>IFSC Code</strong>
                ${companyData.banking.ifsc_code}
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}
          
          <!-- Terms & Conditions -->
          ${documentData.terms ? `
          <div class="terms-section">
            <h3>Terms & Conditions</h3>
            <div class="terms-content">${documentData.terms}</div>
          </div>
          ` : ''}
          
          <!-- Footer -->
          <div class="footer">
            <div class="thank-you">Thank you for your business!</div>
            <div>This is a computer-generated ${documentData.metadata.documentType} and does not require a physical signature.</div>
            ${(companyData.profile?.website || companyData.company?.website) ? `<div>Visit us at: ${companyData.profile.website || companyData.company.website}</div>` : ''}
          </div>
        </div>
      </body>
      </html>
    `
  }

  async downloadDocument(
    documentData: QuotationInvoiceData,
    companyData: CompanyData,
    filename?: string
  ): Promise<void> {
    try {
      const blob = await this.generateDocument(documentData, companyData)
      
      // Check if we got HTML (fallback) or PDF
      const isHtml = blob.type.includes('text/html')
      const fileExtension = isHtml ? '.html' : '.pdf'
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = (filename || `${documentData.metadata.documentType}-${documentData.metadata.documentNumber}`) + fileExtension
      
      document.body.appendChild(a)
      a.click()
      
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      // Show appropriate message to user
      if (isHtml) {
        console.info('Downloaded as HTML. Use browser\'s print function to save as PDF.')
      }
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  }

  // Generate HTML for preview
  generateHTMLPreview(
    documentData: QuotationInvoiceData,
    companyData: CompanyData
  ): string {
    const { document: doc, company } = this.prepareDocumentData(documentData, companyData)
    
    return this.renderTemplate(doc, company, documentData.metadata.template)
  }

  private prepareDocumentData(documentData: QuotationInvoiceData, companyData: CompanyData) {
    // Format addresses
    const companyAddress = [
      company.profile.address,
      company.profile.city,
      company.profile.state,
      company.profile.pin_code
    ].filter(Boolean).join(', ')

    const clientAddress = [
      documentData.client.address,
      documentData.client.city,
      documentData.client.state,
      documentData.client.pinCode
    ].filter(Boolean).join(', ')

    // Format dates
    const issueDate = new Date(documentData.metadata.issueDate).toLocaleDateString('en-IN')
    const validUntil = documentData.metadata.validUntil 
      ? new Date(documentData.metadata.validUntil).toLocaleDateString('en-IN')
      : null
    const dueDate = documentData.metadata.dueDate 
      ? new Date(documentData.metadata.dueDate).toLocaleDateString('en-IN')
      : null

    return {
      document: {
        ...documentData,
        formattedIssueDate: issueDate,
        formattedValidUntil: validUntil,
        formattedDueDate: dueDate,
        clientAddress,
        isInterState: documentData.client.state !== companyData.profile.state
      },
      company: {
        ...companyData,
        formattedAddress: companyAddress
      }
    }
  }

  private renderTemplate(doc: any, company: any, template: string): string {
    const templateStyles = this.getTemplateStyles(template, company.branding.primary_color, company.branding.secondary_color)
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${doc.metadata.documentType.toUpperCase()} ${doc.metadata.documentNumber}</title>
      <style>
        ${templateStyles}
      </style>
    </head>
    <body>
      <div class="document">
        ${this.renderHeader(doc, company)}
        ${this.renderDocumentInfo(doc)}
        ${this.renderClientInfo(doc)}
        ${this.renderLineItems(doc)}
        ${this.renderTotals(doc)}
        ${this.renderBankingInfo(company)}
        ${this.renderTerms(doc, company)}
        ${this.renderFooter(doc, company)}
      </div>
    </body>
    </html>
    `
  }

  private getTemplateStyles(template: string, primaryColor: string, secondaryColor: string): string {
    const baseStyles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        font-size: 12px; 
        line-height: 1.4; 
        color: #333;
      }
      .document { 
        max-width: 210mm; 
        margin: 0 auto; 
        padding: 20mm; 
        background: white;
      }
      .header { 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-start; 
        margin-bottom: 30px;
        border-bottom: 3px solid ${primaryColor};
        padding-bottom: 20px;
      }
      .company-info h1 { 
        color: ${primaryColor}; 
        font-size: 24px; 
        font-weight: bold; 
        margin-bottom: 5px;
      }
      .company-tagline { 
        color: ${secondaryColor}; 
        font-size: 14px; 
        margin-bottom: 10px;
      }
      .company-logo { 
        max-height: 80px; 
        max-width: 200px; 
      }
      .document-title { 
        background: ${primaryColor}; 
        color: white; 
        padding: 15px 25px; 
        border-radius: 8px;
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        margin: 20px 0;
      }
      .info-section { 
        display: flex; 
        justify-content: space-between; 
        margin: 30px 0;
      }
      .info-box { 
        flex: 1; 
        margin: 0 10px;
      }
      .info-box h3 { 
        color: ${secondaryColor}; 
        font-size: 14px; 
        font-weight: bold; 
        margin-bottom: 10px;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      .line-items-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 30px 0;
      }
      .line-items-table th { 
        background: ${primaryColor}; 
        color: white; 
        padding: 12px 8px; 
        text-align: left; 
        font-weight: bold;
      }
      .line-items-table td { 
        padding: 10px 8px; 
        border-bottom: 1px solid #eee;
      }
      .line-items-table tr:nth-child(even) { 
        background-color: #f9f9f9;
      }
      .totals-section { 
        margin-top: 30px; 
        display: flex; 
        justify-content: flex-end;
      }
      .totals-box { 
        min-width: 300px; 
        border: 2px solid ${primaryColor}; 
        border-radius: 8px;
      }
      .totals-row { 
        display: flex; 
        justify-content: space-between; 
        padding: 8px 15px; 
        border-bottom: 1px solid #eee;
      }
      .totals-row.final { 
        background: ${primaryColor}; 
        color: white; 
        font-weight: bold; 
        font-size: 16px;
      }
      .banking-section { 
        margin: 30px 0; 
        padding: 20px; 
        background: #f8f9fa; 
        border-radius: 8px;
      }
      .banking-section h3 { 
        color: ${secondaryColor}; 
        margin-bottom: 15px;
      }
      .banking-details { 
        display: flex; 
        justify-content: space-between; 
        flex-wrap: wrap;
      }
      .banking-details > div { 
        margin-right: 30px; 
        margin-bottom: 10px;
      }
      .terms-section { 
        margin: 30px 0; 
        padding: 20px; 
        border: 1px solid #ddd; 
        border-radius: 8px;
      }
      .terms-section h3 { 
        color: ${secondaryColor}; 
        margin-bottom: 15px;
      }
      .footer { 
        margin-top: 50px; 
        text-align: center; 
        color: #666; 
        font-size: 11px;
        border-top: 1px solid #eee;
        padding-top: 20px;
      }
      .watermark { 
        position: absolute; 
        top: 50%; 
        left: 50%; 
        transform: translate(-50%, -50%) rotate(-45deg); 
        font-size: 72px; 
        color: rgba(0,0,0,0.1); 
        z-index: -1; 
        pointer-events: none;
      }
    `

    // Template-specific overrides
    const templateOverrides = {
      classic: `
        .header { border-bottom-color: #1F2937; }
        .company-info h1 { color: #1F2937; }
        .company-tagline { color: #4B5563; }
      `,
      minimalist: `
        .header { border-bottom: 1px solid #E5E7EB; }
        .document-title { background: #000; }
        .line-items-table th { background: #000; }
      `,
      luxury: `
        .header { border-bottom: 3px solid #D97706; }
        .company-info h1 { color: #D97706; background: linear-gradient(45deg, #D97706, #F59E0B); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `
    }

    return baseStyles + (templateOverrides[template as keyof typeof templateOverrides] || '')
  }

  private renderHeader(doc: any, company: any): string {
    return `
      <div class="header">
        <div class="company-info">
          ${company.branding.logo_url ? `<img src="${company.branding.logo_url}" alt="Company Logo" class="company-logo" />` : ''}
          <h1>${company.profile.company_name}</h1>
          ${company.profile.company_tagline ? `<p class="company-tagline">${company.profile.company_tagline}</p>` : ''}
          <div style="margin-top: 15px;">
            ${company.formattedAddress ? `<p>📍 ${company.formattedAddress}</p>` : ''}
            ${company.profile.phone ? `<p>📞 ${company.profile.phone}</p>` : ''}
            ${company.profile.email ? `<p>✉️ ${company.profile.email}</p>` : ''}
            ${company.profile.website ? `<p>🌐 ${company.profile.website}</p>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          ${company.profile.gstin ? `<p><strong>GSTIN:</strong> ${company.profile.gstin}</p>` : ''}
          ${company.profile.pan ? `<p><strong>PAN:</strong> ${company.profile.pan}</p>` : ''}
          ${company.profile.cin ? `<p><strong>CIN:</strong> ${company.profile.cin}</p>` : ''}
        </div>
      </div>
      
      <div class="document-title">
        ${doc.metadata.documentType.toUpperCase()} - ${doc.metadata.documentNumber}
        ${doc.status === 'draft' ? '<div class="watermark">DRAFT</div>' : ''}
      </div>
    `
  }

  private renderDocumentInfo(doc: any): string {
    return `
      <div class="info-section">
        <div class="info-box">
          <h3>Document Information</h3>
          <p><strong>Issue Date:</strong> ${doc.formattedIssueDate}</p>
          ${doc.formattedValidUntil ? `<p><strong>Valid Until:</strong> ${doc.formattedValidUntil}</p>` : ''}
          ${doc.formattedDueDate ? `<p><strong>Due Date:</strong> ${doc.formattedDueDate}</p>` : ''}
          <p><strong>Currency:</strong> ${doc.metadata.currency}</p>
        </div>
      </div>
    `
  }

  private renderClientInfo(doc: any): string {
    return `
      <div class="info-section">
        <div class="info-box">
          <h3>Bill To</h3>
          <p><strong>${doc.client.name}</strong></p>
          ${doc.client.company ? `<p>${doc.client.company}</p>` : ''}
          ${doc.clientAddress ? `<p>${doc.clientAddress}</p>` : ''}
          ${doc.client.phone ? `<p>📞 ${doc.client.phone}</p>` : ''}
          ${doc.client.email ? `<p>✉️ ${doc.client.email}</p>` : ''}
          ${doc.client.gstin ? `<p><strong>GSTIN:</strong> ${doc.client.gstin}</p>` : ''}
          ${doc.client.pan ? `<p><strong>PAN:</strong> ${doc.client.pan}</p>` : ''}
        </div>
        ${doc.project ? `
        <div class="info-box">
          <h3>Project Details</h3>
          <p><strong>${doc.project.name}</strong></p>
          ${doc.project.description ? `<p>${doc.project.description}</p>` : ''}
          ${doc.project.location ? `<p>📍 ${doc.project.location}</p>` : ''}
        </div>
        ` : ''}
      </div>
    `
  }

  private renderLineItems(doc: any): string {
    const items = doc.lineItems.map((item: any, index: number) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>${item.description}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: center;">${item.unit}</td>
        <td style="text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
        <td style="text-align: right;">₹${item.total.toFixed(2)}</td>
      </tr>
    `).join('')

    return `
      <table class="line-items-table">
        <thead>
          <tr>
            <th style="width: 40px; text-align: center;">#</th>
            <th>Description</th>
            <th style="width: 60px; text-align: center;">Qty</th>
            <th style="width: 60px; text-align: center;">Unit</th>
            <th style="width: 100px; text-align: right;">Rate</th>
            <th style="width: 120px; text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${items}
        </tbody>
      </table>
    `
  }

  private renderTotals(doc: any): string {
    return `
      <div class="totals-section">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal:</span>
            <span>₹${doc.totals.subtotal.toFixed(2)}</span>
          </div>
          ${doc.totals.discountAmount > 0 ? `
          <div class="totals-row" style="color: green;">
            <span>Discount:</span>
            <span>-₹${doc.totals.discountAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="totals-row">
            <span>Taxable Amount:</span>
            <span>₹${doc.totals.taxableAmount.toFixed(2)}</span>
          </div>
          ${doc.isInterState ? `
          <div class="totals-row">
            <span>IGST (${doc.taxConfig.igst}%):</span>
            <span>₹${doc.totals.igstAmount.toFixed(2)}</span>
          </div>
          ` : `
          <div class="totals-row">
            <span>CGST (${doc.taxConfig.cgst}%):</span>
            <span>₹${doc.totals.cgstAmount.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>SGST (${doc.taxConfig.sgst}%):</span>
            <span>₹${doc.totals.sgstAmount.toFixed(2)}</span>
          </div>
          `}
          ${doc.totals.roundOffAmount !== 0 ? `
          <div class="totals-row">
            <span>Round Off:</span>
            <span>₹${doc.totals.roundOffAmount.toFixed(2)}</span>
          </div>
          ` : ''}
          <div class="totals-row final">
            <span>Total Amount:</span>
            <span>₹${doc.totals.finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `
  }

  private renderBankingInfo(company: any): string {
    if (!company.banking || (!company.banking.bank_name && !company.banking.account_number && !company.banking.ifsc_code)) {
      return ''
    }

    return `
      <div class="banking-section">
        <h3>Banking Details</h3>
        <div class="banking-details">
          ${company.banking.bank_name ? `<div><strong>Bank Name:</strong><br>${company.banking.bank_name}</div>` : ''}
          ${company.banking.account_holder_name ? `<div><strong>Account Holder:</strong><br>${company.banking.account_holder_name}</div>` : ''}
          ${company.banking.account_number ? `<div><strong>Account Number:</strong><br>${company.banking.account_number}</div>` : ''}
          ${company.banking.ifsc_code ? `<div><strong>IFSC Code:</strong><br>${company.banking.ifsc_code}</div>` : ''}
          ${company.banking.branch_name ? `<div><strong>Branch:</strong><br>${company.banking.branch_name}</div>` : ''}
        </div>
      </div>
    `
  }

  private renderTerms(doc: any, company: any): string {
    const terms = doc.terms || company.terms?.quotation_terms || ''
    
    if (!terms) return ''

    return `
      <div class="terms-section">
        <h3>Terms & Conditions</h3>
        <div style="white-space: pre-line; line-height: 1.6;">${terms}</div>
      </div>
    `
  }

  private renderFooter(doc: any, company: any): string {
    return `
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>This is a computer generated ${doc.metadata.documentType} and does not require signature.</p>
        ${company.profile.website ? `<p>Visit us at: ${company.profile.website}</p>` : ''}
      </div>
    `
  }
}