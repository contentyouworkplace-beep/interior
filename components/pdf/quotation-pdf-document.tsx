"use client"

import React from 'react'
// Node Buffer polyfill may be needed in some environments; ensure Buffer exists
// @ts-ignore
const toBuffer = (b64?: string) => (typeof Buffer !== 'undefined' && b64 ? Buffer.from(b64, 'base64') : undefined)
const imgSourceObject = (base64?: string, format?: string) => {
  if (!base64) return undefined
  const fmt = format && (format.includes('png') ? 'png' : format.includes('jpg') || format.includes('jpeg') ? 'jpg' : undefined)
  if (!fmt) return undefined
  return { data: toBuffer(base64), format: fmt as 'png' | 'jpg' }
}
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import { QuotationInvoiceData } from '@/lib/types/document-types'
import { CompanyData } from '@/lib/services/company-data-service'

// Register fonts (optional - for better typography)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf'
// })

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '3 solid',
  },
  logo: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  companyInfo: {
    flex: 1,
    marginLeft: 20,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyTagline: {
    fontSize: 11,
    color: '#000000',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  contactInfo: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.5,
  },
  contactDetail: {
    fontSize: 9,
    color: '#000000',
    marginBottom: 3,
  },
  legalInfo: {
    fontSize: 9,
    color: '#000000',
    textAlign: 'right',
    lineHeight: 1.6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    padding: 15,
    textAlign: 'center',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
    gap: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    borderLeft: '4 solid',
  },
  infoBoxTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    color: '#000000',
    marginRight: 5,
  },
  value: {
    color: '#000000',
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    color: '#FFFFFF',
    padding: 10,
    fontWeight: 'bold',
    fontSize: 10,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #E5E7EB',
    padding: 10,
    minHeight: 40,
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    fontSize: 9,
    color: '#000000',
    paddingRight: 5,
  },
  tableCellBold: {
    fontWeight: 'bold',
  },
  totalsSection: {
    marginLeft: 'auto',
    width: '45%',
    marginTop: 10,
  },
  totalsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    overflow: 'hidden',
    border: '1 solid #E5E7EB',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottom: '1 solid #E5E7EB',
    fontSize: 10,
    color: '#000000',
  },
  totalRowFinal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  bankingSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    border: '1 solid #BFDBFE',
  },
  bankingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bankingContent: {
    flexDirection: 'row',
    gap: 15,
  },
  bankingGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  bankingItem: {
    width: '45%',
    marginBottom: 8,
  },
  bankingLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 2,
  },
  bankingValue: {
    fontSize: 9,
    color: '#6B7280',
  },
  qrCodeContainer: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    border: '1 solid #BFDBFE',
  },
  qrCode: {
    width: 100,
    height: 100,
  },
  qrLabel: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 5,
    textAlign: 'center',
  },
  termsSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#FFFFFF',
    border: '1 solid #E5E7EB',
    borderRadius: 10,
    borderLeft: '4 solid',
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  termsContent: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.6,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1 solid #E5E7EB',
    fontSize: 9,
    color: '#000000',
    textAlign: 'center',
  },
  thankYou: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    lineHeight: 1.5,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 80,
    color: 'rgba(0, 0, 0, 0.05)',
    fontWeight: 'bold',
    zIndex: -1,
  },
})

interface QuotationPDFDocumentProps {
  documentData: QuotationInvoiceData
  companyData: CompanyData
}

export const createQuotationPDFDocument = (
  documentData: QuotationInvoiceData,
  companyData: CompanyData
): React.ReactElement => {
  // Use branding colors or defaults
  const primaryColor = companyData.branding?.primary_color || '#3B82F6'
  const secondaryColor = companyData.branding?.secondary_color || '#1E40AF'
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return 'Rs. ' + new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // Check if we have company data to display
  const hasCompanyData = companyData.profile?.company_name || companyData.branding?.logo_url
  const hasContactInfo = companyData.profile?.email || companyData.profile?.phone || companyData.profile?.website
  const hasBankingInfo = companyData.banking?.bank_name || companyData.banking?.account_number || companyData.banking?.qr_code_url

  // Build full company address from all available parts, avoiding duplicates
  const addressParts = [
    companyData.profile?.address,
    companyData.profile?.city,
    companyData.profile?.state,
    companyData.profile?.pin_code,
  ].filter(Boolean)
  
  // Remove duplicate city/state if already in address
  const addressLower = (companyData.profile?.address || '').toLowerCase()
  const filteredParts = addressParts.filter((part, index) => {
    if (index === 0) return true // Always include base address
    const partLower = (part || '').toLowerCase()
    // Check if this part is already contained in the base address
    return !addressLower.includes(partLower)
  })
  
  const companyAddress = filteredParts.join(', ')
  
  console.log('📍 Company Address Parts:', {
    address: companyData.profile?.address,
    city: companyData.profile?.city,
    state: companyData.profile?.state,
    pin_code: companyData.profile?.pin_code,
    final: companyAddress
  })

  console.log('🏦 QR Code Debug:', {
    banking_qr: companyData.banking?.qr_code_url,
    branding_qr: companyData.branding?.qr_code_url,
    has_either: !!(companyData.banking?.qr_code_url || companyData.branding?.qr_code_url),
    branding_data: companyData.branding,
    embedded_data_uri: companyData.qr_code_data_uri ? `len=${companyData.qr_code_data_uri.length}` : 'none'
  })

  const clientAddress = [
    documentData.client.address,
    documentData.client.city,
    documentData.client.state,
    documentData.client.pinCode,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark for Draft */}
        {documentData.status === 'draft' && (
          <View style={styles.watermark}>
            <Text>DRAFT</Text>
          </View>
        )}

        {/* Header - Only show if company data exists */}
        {hasCompanyData && (
          <View style={[styles.header, { borderBottomColor: primaryColor }]}>
            <View style={{ flexDirection: 'row', flex: 1 }}>
              {companyData.logo_data_uri || companyData.branding?.logo_url ? (
                <Image
                  src={companyData.logo_data_uri || companyData.branding?.logo_url!}
                  style={styles.logo}
                />
              ) : (
                <View style={{ width: 120, height: 60, border: '1 solid #E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 8, color: '#9CA3AF' }}>No Logo</Text>
                </View>
              )}
              <View style={styles.companyInfo}>
                {companyData.profile?.company_name && (
                  <Text style={[styles.companyName, { color: secondaryColor }]}>
                    {companyData.profile.company_name}
                  </Text>
                )}
                {companyData.profile?.company_tagline && (
                  <Text style={styles.companyTagline}>
                    {companyData.profile.company_tagline}
                  </Text>
                )}
                {/* Contact Details - Always visible right below company name */}
                <View style={styles.contactInfo}>
                  {companyData.profile?.phone && (
                    <Text style={styles.contactDetail}>Phone: {companyData.profile.phone}</Text>
                  )}
                  {companyData.profile?.email && (
                    <Text style={styles.contactDetail}>Email: {companyData.profile.email}</Text>
                  )}
                  {companyData.profile?.website && (
                    <Text style={styles.contactDetail}>Website: {companyData.profile.website}</Text>
                  )}
                  {companyAddress && (
                    <Text style={styles.contactDetail}>Address: {companyAddress}</Text>
                  )}
                </View>
              </View>
            </View>

            {(companyData.profile?.gstin || companyData.profile?.pan || companyData.profile?.cin) && (
              <View style={styles.legalInfo}>
                {companyData.profile?.gstin && (
                  <Text>GSTIN: {companyData.profile.gstin}</Text>
                )}
                {companyData.profile?.pan && (
                  <Text>PAN: {companyData.profile.pan}</Text>
                )}
                {companyData.profile?.cin && (
                  <Text>CIN: {companyData.profile.cin}</Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Document Title */}
        <View style={[styles.title, { backgroundColor: primaryColor }]}>
          <Text>
            {documentData.metadata.documentType.toUpperCase()} -{' '}
            {documentData.metadata.documentNumber}
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={[styles.infoBox, { borderLeftColor: primaryColor }]}>
            <Text style={[styles.infoBoxTitle, { color: secondaryColor }]}>Document Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Issue Date:</Text>
              <Text style={styles.value}>
                {formatDate(documentData.metadata.issueDate)}
              </Text>
            </View>
            {documentData.metadata.validUntil && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Valid Until:</Text>
                <Text style={styles.value}>
                  {formatDate(documentData.metadata.validUntil)}
                </Text>
              </View>
            )}
            {documentData.metadata.dueDate && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>Due Date:</Text>
                <Text style={styles.value}>
                  {formatDate(documentData.metadata.dueDate)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Bill To</Text>
            <Text style={{ ...styles.value, fontWeight: 'bold', marginBottom: 5 }}>
              {documentData.client.name}
            </Text>
            {documentData.client.company && (
              <Text style={styles.value}>{documentData.client.company}</Text>
            )}
            {clientAddress && <Text style={styles.value}>{clientAddress}</Text>}
            {documentData.client.phone && (
              <Text style={styles.value}>Phone: {documentData.client.phone}</Text>
            )}
            {documentData.client.email && (
              <Text style={styles.value}>Email: {documentData.client.email}</Text>
            )}
            {documentData.client.gstin && (
              <View style={styles.infoRow}>
                <Text style={styles.label}>GSTIN:</Text>
                <Text style={styles.value}>{documentData.client.gstin}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Line Items Table */}
          <View style={styles.table}>
            <View style={[styles.tableHeader, { backgroundColor: primaryColor }]}>
            <Text style={{ width: '5%', textAlign: 'center' }}>#</Text>
            <Text style={{ width: '40%' }}>Description</Text>
            <Text style={{ width: '10%', textAlign: 'center' }}>Qty</Text>
            <Text style={{ width: '10%', textAlign: 'center' }}>Unit</Text>
            <Text style={{ width: '17%', textAlign: 'right' }}>Rate</Text>
            <Text style={{ width: '18%', textAlign: 'right' }}>Amount</Text>
          </View>

          {documentData.lineItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                index % 2 === 1 ? styles.tableRowAlt : {},
              ]}
            >
              <Text style={{ ...styles.tableCell, width: '5%', textAlign: 'center' }}>
                {index + 1}
              </Text>
              <View style={{ width: '40%' }}>
                <Text style={{ ...styles.tableCell, ...styles.tableCellBold }}>
                  {item.description}
                </Text>
                {item.notes && (
                  <Text style={{ ...styles.tableCell, fontSize: 8, color: '#000000' }}>
                    {item.notes}
                  </Text>
                )}
              </View>
              <Text style={{ ...styles.tableCell, width: '10%', textAlign: 'center' }}>
                {item.quantity}
              </Text>
              <Text style={{ ...styles.tableCell, width: '10%', textAlign: 'center' }}>
                {item.unit}
              </Text>
              <Text style={{ ...styles.tableCell, width: '17%', textAlign: 'right' }}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text
                style={{
                  ...styles.tableCell,
                  ...styles.tableCellBold,
                  width: '18%',
                  textAlign: 'right',
                }}
              >
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.tableCellBold}>Subtotal:</Text>
              <Text style={styles.tableCellBold}>
                {formatCurrency(documentData.totals.subtotal)}
              </Text>
            </View>

            {documentData.totals.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={{ color: '#10B981' }}>Discount:</Text>
                <Text style={{ color: '#10B981' }}>
                  -{formatCurrency(documentData.totals.discountAmount)}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text>Taxable Amount:</Text>
              <Text>{formatCurrency(documentData.totals.taxableAmount)}</Text>
            </View>

            {documentData.totals.igstAmount > 0 ? (
              <View style={styles.totalRow}>
                <Text>IGST ({documentData.taxConfig.igst}%):</Text>
                <Text>{formatCurrency(documentData.totals.igstAmount)}</Text>
              </View>
            ) : (
              <>
                {documentData.totals.cgstAmount > 0 && (
                  <View style={styles.totalRow}>
                    <Text>CGST ({documentData.taxConfig.cgst}%):</Text>
                    <Text>{formatCurrency(documentData.totals.cgstAmount)}</Text>
                  </View>
                )}
                {documentData.totals.sgstAmount > 0 && (
                  <View style={styles.totalRow}>
                    <Text>SGST ({documentData.taxConfig.sgst}%):</Text>
                    <Text>{formatCurrency(documentData.totals.sgstAmount)}</Text>
                  </View>
                )}
              </>
            )}

            {documentData.totals.roundOffAmount !== 0 && (
              <View style={styles.totalRow}>
                <Text>Round Off:</Text>
                <Text>{formatCurrency(documentData.totals.roundOffAmount)}</Text>
              </View>
            )}

            <View style={[styles.totalRow, styles.totalRowFinal, { backgroundColor: primaryColor }]}>
              <Text>Total Amount:</Text>
              <Text>{formatCurrency(documentData.totals.finalTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Banking Details - Show on same page */}
        {hasBankingInfo && (
          <View style={styles.bankingSection} wrap={false}>
            <Text style={[styles.bankingTitle, { color: secondaryColor }]}>Payment Information</Text>
            <View style={styles.bankingContent}>
              <View style={styles.bankingGrid}>
                {companyData.banking?.bank_name && (
                  <View style={styles.bankingItem}>
                    <Text style={styles.bankingLabel}>Bank Name</Text>
                    <Text style={styles.bankingValue}>
                      {companyData.banking.bank_name}
                    </Text>
                  </View>
                )}
                {companyData.banking?.account_holder_name && (
                  <View style={styles.bankingItem}>
                    <Text style={styles.bankingLabel}>Account Holder</Text>
                    <Text style={styles.bankingValue}>
                      {companyData.banking.account_holder_name}
                    </Text>
                  </View>
                )}
                {companyData.banking?.account_number && (
                  <View style={styles.bankingItem}>
                    <Text style={styles.bankingLabel}>Account Number</Text>
                    <Text style={styles.bankingValue}>
                      {companyData.banking.account_number}
                    </Text>
                  </View>
                )}
                {companyData.banking?.ifsc_code && (
                  <View style={styles.bankingItem}>
                    <Text style={styles.bankingLabel}>IFSC Code</Text>
                    <Text style={styles.bankingValue}>
                      {companyData.banking.ifsc_code}
                    </Text>
                  </View>
                )}
                {companyData.banking?.branch_name && (
                  <View style={styles.bankingItem}>
                    <Text style={styles.bankingLabel}>Branch</Text>
                    <Text style={styles.bankingValue}>
                      {companyData.banking.branch_name}
                    </Text>
                  </View>
                )}
                {companyData.banking?.upi_id && (
                  <View style={styles.bankingItem}>
                    <Text style={styles.bankingLabel}>UPI ID</Text>
                    <Text style={styles.bankingValue}>
                      {companyData.banking.upi_id}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Payment QR Code */}
              <View style={styles.qrCodeContainer}>
                <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#000000', marginBottom: 8 }}>
                  Scan to Pay!
                </Text>
                {companyData.qr_code_data_uri || companyData.branding?.qr_code_url || companyData.banking?.qr_code_url ? (
                  <Image
                    src={
                      companyData.qr_code_data_uri ||
                      companyData.branding?.qr_code_url ||
                      companyData.banking?.qr_code_url!
                    }
                    style={styles.qrCode}
                  />
                ) : (
                  <View style={{ width: 100, height: 100, border: '1 solid #E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 8, color: '#9CA3AF' }}>No QR</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Terms & Conditions */}
        {documentData.terms && (
          <View style={[styles.termsSection, { borderLeftColor: primaryColor }]} wrap={false}>
            <Text style={[styles.termsTitle, { color: secondaryColor }]}>Terms & Conditions</Text>
            <Text style={styles.termsContent}>{documentData.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.thankYou, { color: primaryColor }]}>Thank you for your business!</Text>
          <Text style={styles.footerText}>
            This is a computer-generated {documentData.metadata.documentType} and
            does not require a physical signature.
          </Text>
          {companyData.profile?.website && (
            <Text style={styles.footerText}>
              Visit us at: {companyData.profile.website}
            </Text>
          )}
        </View>

        {/* Digital Signature - Show if available */}
        {(companyData.signature_data_uri || companyData.branding?.signature_url) && (
          <View style={{ marginTop: 30, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, color: '#000000', marginBottom: 5 }}>
              Authorized Signatory
            </Text>
            <Image 
              src={companyData.signature_data_uri || companyData.branding?.signature_url!}
              style={{ width: 150, height: 60, objectFit: 'contain' }} 
            />
            <Text style={{ fontSize: 9, color: '#000000', marginTop: 5 }}>
              {companyData.signatory_name || 'Authorized Person'}
            </Text>
          </View>
        )}
      </Page>
    </Document>
  )
}
