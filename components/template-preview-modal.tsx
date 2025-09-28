"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X, Download, FileText, Loader2 } from "lucide-react"

interface CompanyData {
  profile?: {
    company_name?: string
    company_tagline?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    country?: string
    phone?: string
    email?: string
    website?: string
    gstin?: string
    pan?: string
    cin?: string
    terms_and_conditions?: string
  }
  banking?: {
    bank_name?: string
    account_number?: string
    ifsc_code?: string
    account_holder_name?: string
  }
  branding?: {
    logo_url?: string
    signature_url?: string
    primary_color?: string
    secondary_color?: string
    quotation_template?: string
    invoice_template?: string
  }
}

interface TemplatePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'quotation' | 'invoice'
  template: string
  companyData: CompanyData
}

interface SampleData {
  company: CompanyData
  client: {
    first_name: string
    last_name: string
    company: string
    email: string
    phone: string
    address: string
  }
  items: Array<{
    id: string
    name: string
    description: string
    quantity: number
    unit_price: number
    total: number
  }>
  subtotal: number
  gst_amount: number
  total_amount: number
  number: string
  date: string
  valid_until?: string
}

export function TemplatePreviewModal({ 
  isOpen, 
  onClose, 
  type,
  template,
  companyData 
}: TemplatePreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  // Template styling configurations
  const getTemplateStyles = (templateName: string, primaryColor: string, secondaryColor: string) => {
    const templates = {
      modern: {
        css: `
          .modern-gradient { background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); }
          .modern-card { box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 12px; }
        `,
        headerStyle: `
          background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
          color: white;
          border-radius: 12px 12px 0 0;
          margin: -30px -30px 40px -30px;
          padding: 40px 30px 30px 30px;
        `,
        tableStyle: `background: linear-gradient(90deg, ${primaryColor} 0%, ${secondaryColor} 100%);`
      },
      classic: {
        css: `
          .classic-border { border: 2px solid ${primaryColor}; }
          .classic-accent { border-left: 4px solid ${primaryColor}; }
        `,
        headerStyle: `
          border-bottom: 3px double ${primaryColor};
          border-top: 1px solid ${secondaryColor};
        `,
        tableStyle: `background: ${primaryColor};`
      },
      minimalist: {
        css: `
          .minimal-line { border-bottom: 1px solid #e5e7eb; }
          .minimal-accent { color: ${primaryColor}; }
        `,
        headerStyle: `
          border-bottom: 1px solid ${primaryColor};
        `,
        tableStyle: `background: ${primaryColor};`
      },
      corporate: {
        css: `
          .corporate-box { background: #f8fafc; border-left: 4px solid ${primaryColor}; }
          .corporate-header { background: #1e293b; color: white; }
        `,
        headerStyle: `
          background: linear-gradient(90deg, #1e293b 0%, ${primaryColor} 100%);
          color: white;
          margin: -30px -30px 40px -30px;
          padding: 40px 30px 30px 30px;
        `,
        tableStyle: `background: linear-gradient(90deg, #1e293b 0%, ${primaryColor} 100%);`
      },
      creative: {
        css: `
          .creative-shape { clip-path: polygon(0 0, 100% 0, 95% 100%, 0% 100%); }
          .creative-accent { transform: skew(-5deg); }
        `,
        headerStyle: `
          background: linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor} 50%, #6366f1 100%);
          color: white;
          margin: -30px -30px 40px -30px;
          padding: 40px 30px 30px 30px;
          position: relative;
        `,
        tableStyle: `background: linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor} 100%);`
      },
      premium: {
        css: `
          .premium-gold { background: linear-gradient(135deg, #d4af37 0%, #ffd700 100%); }
          .premium-shadow { box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        `,
        headerStyle: `
          background: linear-gradient(135deg, #1a1a1a 0%, ${primaryColor} 100%);
          color: #ffd700;
          margin: -30px -30px 40px -30px;
          padding: 40px 30px 30px 30px;
          position: relative;
          &::after { 
            content: ''; 
            position: absolute; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            height: 3px; 
            background: linear-gradient(90deg, #d4af37 0%, #ffd700 100%); 
          }
        `,
        tableStyle: `background: linear-gradient(135deg, #1a1a1a 0%, ${primaryColor} 100%);`
      }
    }
    
    return templates[templateName as keyof typeof templates] || templates.modern
  }

  // Sample data for preview
  const sampleData: SampleData = {
    company: companyData,
    client: {
      first_name: 'Rajesh',
      last_name: 'Sharma',
      company: 'Sharma Enterprises Pvt. Ltd.',
      email: 'rajesh.sharma@sharmaenterprises.com',
      phone: '+91 98765 43210',
      address: 'Plot No. 45, Sector 18, Gurugram, Haryana, 122015'
    },
    items: [
      {
        id: '1',
        name: 'Premium Interior Design Consultation',
        description: 'Complete home interior design consultation with 3D visualization and planning',
        quantity: 1,
        unit_price: 35000,
        total: 35000
      },
      {
        id: '2', 
        name: 'Living & Dining Room Design Package',
        description: 'Luxury living and dining room design with premium furniture selection',
        quantity: 1,
        unit_price: 125000,
        total: 125000
      },
      {
        id: '3',
        name: 'Master Bedroom Interior Suite',
        description: 'Complete master bedroom design with walk-in wardrobe and en-suite bathroom',
        quantity: 1,
        unit_price: 185000,
        total: 185000
      },
      {
        id: '4',
        name: 'Modern Kitchen Design & Installation',
        description: 'Modular kitchen with premium appliances, granite countertop and smart storage',
        quantity: 1,
        unit_price: 225000,
        total: 225000
      },
      {
        id: '5',
        name: 'Project Management & Supervision',
        description: 'Complete project management, vendor coordination and quality supervision',
        quantity: 1,
        unit_price: 65000,
        total: 65000
      }
    ],
    subtotal: 635000,
    gst_amount: 114300, // 18% GST
    total_amount: 749300,
    number: type === 'quotation' ? 'QUO-2024-001' : 'INV-2024-001',
    date: new Date().toLocaleDateString('en-IN'),
    valid_until: type === 'quotation' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN') : undefined
  }

  const handleDownloadPDF = async () => {
    setIsGenerating(true)
    try {
      // For now, we'll create a simple HTML to PDF conversion
      // In a production app, you'd use a proper PDF library
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(generatePDFContent())
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePDFContent = () => {
    const primaryColor = companyData.branding?.primary_color || '#3B82F6'
    const secondaryColor = companyData.branding?.secondary_color || '#1E40AF'
    const templateStyle = getTemplateStyles(template, primaryColor, secondaryColor)
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${type === 'quotation' ? 'Quotation' : 'Invoice'} Preview</title>
        <style>
          body { 
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            color: #1f2937;
            line-height: 1.6;
            font-size: 14px;
          }
          ${templateStyle.css}
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            margin-bottom: 40px; 
            ${templateStyle.headerStyle}
            padding: 40px 0;
            position: relative;
          }
          .company-logo-section {
            display: flex;
            align-items: center;
            gap: 25px;
          }
          .company-logo {
            max-width: 140px;
            max-height: 90px;
            object-fit: contain;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
          }
          .company-info h1 { 
            color: ${primaryColor}; 
            margin: 0; 
            font-size: 36px;
            font-weight: 800;
            letter-spacing: -0.8px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .company-tagline {
            color: ${secondaryColor};
            font-style: italic;
            font-size: 15px;
            margin-top: 8px;
            font-weight: 500;
          }
          .company-info p { 
            margin: 10px 0; 
            color: #4b5563;
            font-size: 14px;
            font-weight: 500;
          }
          .company-legal {
            margin-top: 15px;
            padding: 15px;
            background: rgba(255,255,255,0.95);
            border-radius: 8px;
            border-left: 4px solid ${primaryColor};
            backdrop-filter: blur(10px);
          }
          .company-legal p {
            margin: 8px 0;
            font-size: 13px;
            color: #374151;
            font-weight: 600;
          }
          .document-info { 
            text-align: right; 
            background: rgba(255,255,255,0.15);
            padding: 30px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          }
          .document-info h2 { 
            color: white; 
            margin: 0 0 20px 0;
            font-size: 28px;
            font-weight: 900;
            text-shadow: 0 2px 8px rgba(0,0,0,0.3);
            letter-spacing: 1px;
          }
          .document-meta {
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.3);
          }
          .document-meta p {
            color: white;
            margin: 8px 0;
            font-weight: 600;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          }
          .client-info, .items-section { 
            margin: 40px 0; 
          }
          .client-info h3 { 
            color: ${primaryColor}; 
            border-bottom: 2px solid ${primaryColor};
            padding-bottom: 12px;
            margin-bottom: 20px;
            font-size: 20px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .client-details {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 25px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .client-details p {
            margin: 8px 0;
            font-weight: 500;
          }
          .client-name {
            font-size: 18px;
            font-weight: 700;
            color: ${primaryColor};
            margin-bottom: 10px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border-radius: 12px;
            overflow: hidden;
          }
          th { 
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); 
            color: white; 
            padding: 18px 15px; 
            text-align: left;
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }
          td { 
            padding: 18px 15px; 
            border-bottom: 1px solid #e5e7eb;
            font-weight: 500;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          tr:hover {
            background: #f3f4f6;
          }
          .item-name {
            font-weight: 700;
            color: ${primaryColor};
            font-size: 15px;
          }
          .item-description {
            color: #6b7280;
            font-size: 13px;
            line-height: 1.4;
            margin-top: 4px;
          }
          .total-section { 
            margin-top: 40px; 
            text-align: right;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 30px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 15px 0;
            padding: 12px 0;
            font-weight: 600;
          }
          .total-row.final { 
            background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); 
            color: white; 
            padding: 20px 25px;
            font-weight: 800;
            font-size: 20px;
            border-radius: 8px;
            margin-top: 20px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
          .footer { 
            margin-top: 60px; 
            border-top: 2px solid ${primaryColor};
            padding-top: 30px;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .terms { 
            margin-top: 40px;
            padding: 25px;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 12px;
            border-left: 5px solid #f59e0b;
          }
          .terms h4 { 
            color: #92400e;
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .terms-content {
            color: #78350f;
            line-height: 1.6;
            font-weight: 500;
          }
          .signature-section {
            margin-top: 40px;
            text-align: center;
            padding: 25px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .signature-section p {
            margin-bottom: 15px;
            font-weight: 600;
            color: ${primaryColor};
          }
          .signature-image {
            max-width: 220px;
            max-height: 90px;
            object-fit: contain;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px;
            background: white;
          }
          @media print {
            body { margin: 0; padding: 15px; }
            .header { page-break-inside: avoid; }
            .total-section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo-section">
            ${companyData.branding?.logo_url ? `
              <img src="${companyData.branding.logo_url}" alt="Company Logo" class="company-logo">
            ` : ''}
            <div class="company-info">
              <h1>${companyData.profile?.company_name || 'Your Company Name'}</h1>
              ${companyData.profile?.company_tagline ? `<p class="company-tagline">${companyData.profile.company_tagline}</p>` : ''}
              <div style="margin-top: 15px;">
                <p>📍 ${companyData.profile?.address || ''}</p>
                <p>${companyData.profile?.city || ''}, ${companyData.profile?.state || ''} ${companyData.profile?.pincode || ''}</p>
                <p>📞 ${companyData.profile?.phone || ''} | ✉️ ${companyData.profile?.email || ''}</p>
                ${companyData.profile?.website ? `<p>🌐 ${companyData.profile.website}</p>` : ''}
              </div>
              ${(companyData.profile?.gstin || companyData.profile?.pan || companyData.profile?.cin) ? `
                <div class="company-legal">
                  ${companyData.profile?.gstin ? `<p><strong>GSTIN:</strong> ${companyData.profile.gstin}</p>` : ''}
                  ${companyData.profile?.pan ? `<p><strong>PAN:</strong> ${companyData.profile.pan}</p>` : ''}
                  ${companyData.profile?.cin ? `<p><strong>CIN:</strong> ${companyData.profile.cin}</p>` : ''}
                </div>
              ` : ''}
            </div>
          </div>
          <div class="document-info">
            <h2>${type === 'quotation' ? 'QUOTATION' : 'INVOICE'}</h2>
            <div class="document-meta">
              <p><strong>${type === 'quotation' ? 'Quote' : 'Invoice'} #:</strong> ${sampleData.number}</p>
              <p><strong>Date:</strong> ${sampleData.date}</p>
              ${type === 'quotation' && sampleData.valid_until ? `<p><strong>Valid Until:</strong> ${sampleData.valid_until}</p>` : ''}
            </div>
            </div>
          </div>
        </div>

        <div class="client-info">
          <h3>📋 Bill To:</h3>
          <div class="client-details">
            <p class="client-name">${sampleData.client.first_name} ${sampleData.client.last_name}</p>
            <p><strong>${sampleData.client.company}</strong></p>
            <p>${sampleData.client.address}</p>
            <p>📞 ${sampleData.client.phone}</p>
            <p>✉️ ${sampleData.client.email}</p>
          </div>
        </div>

        <div class="items-section">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="width: 80px;">Qty</th>
                <th style="width: 120px;">Unit Price</th>
                <th style="width: 120px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${sampleData.items.map(item => `
                <tr>
                  <td>
                    <div class="item-name">${item.name}</div>
                    <div class="item-description">${item.description}</div>
                  </td>
                  <td style="text-align: center; font-weight: 600;">${item.quantity}</td>
                  <td style="text-align: right; font-weight: 600;">₹${item.unit_price.toLocaleString('en-IN')}</td>
                  <td style="text-align: right; font-weight: 700;">₹${item.total.toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <div class="total-row">
            <span><strong>Subtotal:</strong></span>
            <span><strong>₹${sampleData.subtotal.toLocaleString('en-IN')}</strong></span>
          </div>
          <div class="total-row">
            <span><strong>GST (18%):</strong></span>
            <span><strong>₹${sampleData.gst_amount.toLocaleString('en-IN')}</strong></span>
          </div>
          <div class="total-row final">
            <span>TOTAL AMOUNT:</span>
            <span>₹${sampleData.total_amount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        ${companyData.profile?.terms_and_conditions ? `
          <div class="terms">
            <h4>📋 Terms & Conditions:</h4>
            <div class="terms-content">
              ${companyData.profile.terms_and_conditions}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p style="font-size: 16px; font-weight: 600; color: ${primaryColor};">Thank you for your business! 🙏</p>
          ${companyData.branding?.signature_url ? `
            <div class="signature-section">
              <p>Authorized Signature</p>
              <img src="${companyData.branding.signature_url}" alt="Signature" class="signature-image">
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `
  }

  const renderPreview = () => {
    const primaryColor = companyData.branding?.primary_color || '#3B82F6'
    const secondaryColor = companyData.branding?.secondary_color || '#1E40AF'
    const templateStyle = getTemplateStyles(template, primaryColor, secondaryColor)
    
    return (
      <div className="bg-white text-sm shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="text-white p-6" style={{ 
          background: template === 'modern' ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` :
                     template === 'corporate' ? `linear-gradient(90deg, #1e293b 0%, ${primaryColor} 100%)` :
                     template === 'creative' ? `linear-gradient(45deg, ${primaryColor} 0%, ${secondaryColor} 50%, #6366f1 100%)` :
                     template === 'premium' ? `linear-gradient(135deg, #1a1a1a 0%, ${primaryColor} 100%)` :
                     primaryColor
        }}>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {companyData.branding?.logo_url && (
                <img 
                  src={companyData.branding.logo_url} 
                  alt="Company Logo" 
                  className="w-16 h-16 object-contain bg-white/10 rounded-lg p-2"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold mb-1 text-white drop-shadow-lg">
                  {companyData.profile?.company_name || 'Your Company Name'}
                </h1>
                {companyData.profile?.company_tagline && (
                  <p className="italic text-white/90 text-sm mb-3">{companyData.profile.company_tagline}</p>
                )}
                <div className="text-white/80 text-xs space-y-1">
                  <p>📍 {companyData.profile?.address || ''}</p>
                  <p>{companyData.profile?.city || ''}, {companyData.profile?.state || ''} {companyData.profile?.pincode || ''}</p>
                  <p>📞 {companyData.profile?.phone || ''} | ✉️ {companyData.profile?.email || ''}</p>
                  {companyData.profile?.website && <p>🌐 {companyData.profile.website}</p>}
                  {companyData.profile?.gstin && <p><strong>GSTIN:</strong> {companyData.profile.gstin}</p>}
                  {companyData.profile?.pan && <p><strong>PAN:</strong> {companyData.profile.pan}</p>}
                  {companyData.profile?.cin && <p><strong>CIN:</strong> {companyData.profile.cin}</p>}
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold mb-3 text-white drop-shadow-lg">
                {type === 'quotation' ? 'QUOTATION' : 'INVOICE'}
              </h2>
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-4 text-white">
                <p className="mb-2"><strong>{type === 'quotation' ? 'Quote' : 'Invoice'} #:</strong> {sampleData.number}</p>
                <p className="mb-2"><strong>Date:</strong> {sampleData.date}</p>
                {type === 'quotation' && <p><strong>Valid Until:</strong> {sampleData.valid_until}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Client Info */}
          <div className="mb-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-l-4 shadow-sm" style={{ borderLeftColor: primaryColor }}>
            <h3 className="font-bold mb-4 text-xl flex items-center gap-2" style={{ color: primaryColor }}>
              📋 Bill To:
            </h3>
            <div className="space-y-2">
              <p className="font-bold text-lg text-gray-900">{sampleData.client.first_name} {sampleData.client.last_name}</p>
              <p className="font-semibold text-gray-700">{sampleData.client.company}</p>
              <p className="text-gray-600">{sampleData.client.address}</p>
              <div className="flex gap-4 text-sm">
                <p className="text-gray-600"><strong>📞</strong> {sampleData.client.phone}</p>
                <p className="text-gray-600"><strong>✉️</strong> {sampleData.client.email}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse rounded-xl overflow-hidden shadow-lg">
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
                  <th className="text-white p-4 text-left font-bold">Description</th>
                  <th className="text-white p-4 text-center font-bold w-20">Qty</th>
                  <th className="text-white p-4 text-right font-bold w-28">Unit Price</th>
                  <th className="text-white p-4 text-right font-bold w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {sampleData.items.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900" style={{ color: primaryColor }}>{item.name}</div>
                      <div className="text-gray-600 text-sm mt-1 leading-tight">{item.description}</div>
                    </td>
                    <td className="p-4 text-center font-semibold">{item.quantity}</td>
                    <td className="p-4 text-right font-semibold">₹{item.unit_price.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right font-bold">₹{item.total.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mb-6 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl">
            <div className="space-y-3 text-right">
              <div className="flex justify-between py-2 text-lg font-semibold">
                <span>Subtotal:</span>
                <span>₹{sampleData.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-semibold">
                <span>GST (18%):</span>
                <span>₹{sampleData.gst_amount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-4 px-6 text-white font-bold text-xl rounded-lg shadow-lg" 
                   style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}>
                <span>TOTAL AMOUNT:</span>
                <span>₹{sampleData.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {companyData.profile?.terms_and_conditions && (
            <div className="mb-6 p-6 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl border-l-4 border-yellow-500">
              <h4 className="font-bold mb-3 text-lg flex items-center gap-2" style={{ color: primaryColor }}>
                📋 Terms & Conditions:
              </h4>
              <div className="text-sm whitespace-pre-line leading-relaxed text-gray-700">
                {companyData.profile.terms_and_conditions}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-6 border-t-2 border-gray-200">
            <p className="mb-4 text-lg font-semibold" style={{ color: primaryColor }}>
              Thank you for your business! 🙏
            </p>
            {companyData.branding?.signature_url && (
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <p className="mb-3 font-semibold" style={{ color: primaryColor }}>Authorized Signature</p>
                <img 
                  src={companyData.branding.signature_url} 
                  alt="Signature" 
                  className="mx-auto border-2 border-gray-200 rounded-lg p-2 bg-white"
                  style={{ maxWidth: '220px', maxHeight: '90px' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {type === 'quotation' ? 'Quotation' : 'Invoice'} Template Preview - {template}
          </DialogTitle>
          <DialogDescription>
            Preview how your {type} will look with the {template} template
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Content */}
          <div className="border rounded-lg overflow-hidden">
            {renderPreview()}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button onClick={handleDownloadPDF} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}