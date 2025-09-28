"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, X, Building2 } from 'lucide-react'

interface CompanyData {
  profile: {
    company_name?: string
    company_tagline?: string
    address?: string
    city?: string
    state?: string
    pin_code?: string
    phone?: string
    email?: string
    gstin?: string
    pan?: string
    cin?: string
    website?: string
  } | null
  banking: {
    bank_name?: string
    account_number?: string
    ifsc_code?: string
  } | null
  branding: {
    logo_url?: string
    primary_color?: string
    secondary_color?: string
    qr_code_url?: string
  } | null
}

interface DocumentTemplatePreviewProps {
  isOpen: boolean
  onClose: () => void
  template: {
    value: string
    label: string
    description: string
  }
  type: 'quotation' | 'invoice'
}

// Fallback sample data
const fallbackCompany = {
  name: "Your Company Name",
  tagline: "Your Company Tagline",
  address: "Your Company Address",
  phone: "Your Phone Number",
  email: "your-email@company.com",
  gstin: "Your GSTIN Number"
}

const sampleClient = {
  name: "Rajesh Kumar",
  address: "456 Client Avenue, Pune, Maharashtra 411001",
  phone: "+91 87654 32109"
}

const sampleItems = [
  { description: "Living Room Interior Design", quantity: 1, rate: 125000, amount: 125000 },
  { description: "Bedroom Furniture & Fittings", quantity: 2, rate: 85000, amount: 170000 },
  { description: "Kitchen Modular Design", quantity: 1, rate: 200000, amount: 200000 }
]

export function DocumentTemplatePreview({ isOpen, onClose, template, type }: DocumentTemplatePreviewProps) {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch company data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCompanyData()
    }
  }, [isOpen])

  const fetchCompanyData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/company-settings?orgId=00000000-0000-0000-0000-000000000001')
      const result = await response.json()
      if (response.ok) {
        setCompanyData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Use real company data or fallback
  const company = {
    name: companyData?.profile?.company_name || fallbackCompany.name,
    tagline: companyData?.profile?.company_tagline || fallbackCompany.tagline,
    address: companyData?.profile?.address || fallbackCompany.address,
    city: companyData?.profile?.city || '',
    state: companyData?.profile?.state || '',
    pin_code: companyData?.profile?.pin_code || '',
    phone: companyData?.profile?.phone || fallbackCompany.phone,
    email: companyData?.profile?.email || fallbackCompany.email,
    gstin: companyData?.profile?.gstin || fallbackCompany.gstin,
    pan: companyData?.profile?.pan || '',
    cin: companyData?.profile?.cin || '',
    website: companyData?.profile?.website || '',
    logo: companyData?.branding?.logo_url || '',
    primaryColor: companyData?.branding?.primary_color || '#3B82F6',
    secondaryColor: companyData?.branding?.secondary_color || '#1E40AF'
  }

  // Format full address
  const fullAddress = [
    company.address,
    company.city,
    company.state,
    company.pin_code
  ].filter(Boolean).join(', ')

  const total = sampleItems.reduce((sum, item) => sum + item.amount, 0)
  const tax = total * 0.18 // 18% GST
  const grandTotal = total + tax

  const getTemplateStyles = () => {
    const primaryColor = company.primaryColor || '#3B82F6'
    const secondaryColor = company.secondaryColor || '#1E40AF'
    
    switch (template.value) {
      case 'modern':
        return {
          headerBg: `bg-gradient-to-r from-[${primaryColor}] to-[${secondaryColor}]`,
          accentColor: `text-[${primaryColor}]`,
          borderColor: `border-[${primaryColor}33]`,
          headerText: 'text-white'
        }
      case 'classic':
        return {
          headerBg: 'bg-gray-800',
          accentColor: `text-[${primaryColor}]`,
          borderColor: 'border-gray-300',
          headerText: 'text-white'
        }
      case 'minimalist':
        return {
          headerBg: `bg-gray-100 border-b-4 border-[${primaryColor}]`,
          accentColor: `text-[${primaryColor}]`,
          borderColor: 'border-gray-200',
          headerText: 'text-gray-800'
        }
      case 'corporate':
        return {
          headerBg: 'bg-gradient-to-r from-gray-900 to-black',
          accentColor: `text-[${primaryColor}]`,
          borderColor: 'border-gray-400',
          headerText: 'text-white'
        }
      case 'creative':
        return {
          headerBg: `bg-gradient-to-r from-[${primaryColor}] via-purple-600 to-[${secondaryColor}]`,
          accentColor: `text-[${primaryColor}]`,
          borderColor: `border-[${primaryColor}33]`,
          headerText: 'text-white'
        }
      case 'premium':
        return {
          headerBg: `bg-gradient-to-r from-yellow-600 to-[${secondaryColor}]`,
          accentColor: `text-[${primaryColor}]`,
          borderColor: 'border-yellow-300',
          headerText: 'text-white'
        }
      default:
        return {
          headerBg: `bg-[${primaryColor}]`,
          accentColor: `text-[${primaryColor}]`,
          borderColor: `border-[${primaryColor}33]`,
          headerText: 'text-white'
        }
    }
  }

  const styles = getTemplateStyles()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Template Preview: {template.label}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">{type === 'quotation' ? 'Quotation' : 'Invoice'}</Badge>
            <span className="text-sm text-gray-600">{template.description}</span>
            {loading && <span className="text-xs text-blue-600">Loading company data...</span>}
          </div>

          {/* Template Preview */}
          <div className={`border ${styles.borderColor} rounded-lg overflow-hidden bg-white shadow-lg`}>
            {/* Header */}
            <div className={`${styles.headerBg} p-6`}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  {company.logo ? (
                    <div className="w-16 h-16 bg-white rounded-lg p-2 flex items-center justify-center">
                      <img 
                        src={company.logo} 
                        alt="Company Logo" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className={`w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center ${styles.headerText}`}>
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                  
                  {/* Company Info */}
                  <div>
                    <h1 className={`text-2xl font-bold ${styles.headerText}`}>{company.name}</h1>
                    {company.tagline && (
                      <p className={`${styles.headerText} opacity-90`}>{company.tagline}</p>
                    )}
                  </div>
                </div>
                
                <div className={`text-right ${styles.headerText}`}>
                  <h2 className="text-xl font-semibold">
                    {type === 'quotation' ? 'QUOTATION' : 'INVOICE'}
                  </h2>
                  <p className="opacity-90">#{type === 'quotation' ? 'QUO' : 'INV'}-2025-001</p>
                  <p className="text-sm opacity-75 mt-1">{new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Company & Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`font-semibold ${styles.accentColor} mb-2`}>From:</h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{company.name}</p>
                    {fullAddress && <p>{fullAddress}</p>}
                    {company.phone && <p>Phone: {company.phone}</p>}
                    {company.email && <p>Email: {company.email}</p>}
                    {company.website && <p>Website: {company.website}</p>}
                    {company.gstin && <p>GSTIN: {company.gstin}</p>}
                    {company.pan && <p>PAN: {company.pan}</p>}
                    {company.cin && <p>CIN: {company.cin}</p>}
                  </div>
                </div>
                <div>
                  <h3 className={`font-semibold ${styles.accentColor} mb-2`}>To:</h3>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">{sampleClient.name}</p>
                    <p>{sampleClient.address}</p>
                    <p>Phone: {sampleClient.phone}</p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h3 className={`font-semibold ${styles.accentColor} mb-3`}>Items:</h3>
                <div className={`border ${styles.borderColor} rounded-lg overflow-hidden`}>
                  <table className="w-full">
                    <thead className={`${styles.headerBg} ${styles.headerText}`}>
                      <tr>
                        <th className="text-left p-3">Description</th>
                        <th className="text-center p-3">Qty</th>
                        <th className="text-right p-3">Rate</th>
                        <th className="text-right p-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleItems.map((item, index) => (
                        <tr key={index} className={`border-t ${styles.borderColor}`}>
                          <td className="p-3">{item.description}</td>
                          <td className="text-center p-3">{item.quantity}</td>
                          <td className="text-right p-3">₹{item.rate.toLocaleString('en-IN')}</td>
                          <td className="text-right p-3">₹{item.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18%):</span>
                    <span>₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`flex justify-between font-bold text-lg ${styles.accentColor} border-t pt-2`}>
                    <span>Total:</span>
                    <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Banking Information & Footer */}
              <div className="border-t pt-4 space-y-4">
                {/* Banking Details */}
                {companyData?.banking && (companyData.banking.bank_name || companyData.banking.account_number || companyData.banking.ifsc_code) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className={`font-semibold ${styles.accentColor} mb-2`}>Banking Details:</h3>
                    <div className="flex gap-4">
                      <div className="flex-1 text-sm space-y-1">
                        {companyData.banking.bank_name && <p>Bank Name: {companyData.banking.bank_name}</p>}
                        {companyData.banking.account_number && <p>Account Number: {companyData.banking.account_number}</p>}
                        {companyData.banking.ifsc_code && <p>IFSC Code: {companyData.banking.ifsc_code}</p>}
                      </div>
                      {companyData?.branding?.qr_code_url && (
                        <div className="flex-shrink-0">
                          <p className="text-sm font-medium text-gray-700 mb-1">Scan to Pay:</p>
                          <img 
                            src={companyData.branding.qr_code_url} 
                            alt="Payment QR Code" 
                            className="w-20 h-20 border border-gray-300 rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Footer */}
                <div className="text-center text-sm text-gray-600">
                  <p>Thank you for your business!</p>
                  <p className="mt-2">Terms & Conditions: Payment due within 30 days</p>
                  {company.website && (
                    <p className="mt-1">Visit us: {company.website}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}