export interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  discount?: number
  discountType?: 'percentage' | 'amount'
  taxable: boolean
  category?: string
  notes?: string
  total: number // calculated field
}

export interface TaxConfiguration {
  gstRate: number
  cgst: number
  sgst: number
  igst: number
  cessRate?: number
  tdsRate?: number
}

export interface DiscountConfiguration {
  type: 'percentage' | 'amount'
  value: number
  description?: string
}

export interface DocumentTotals {
  subtotal: number
  discountAmount: number
  taxableAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  cessAmount?: number
  tdsAmount?: number
  totalTaxAmount: number
  roundOffAmount: number
  finalTotal: number
}

export interface ClientDetails {
  id?: string
  name: string
  email: string
  phone: string
  company?: string
  address: string
  city: string
  state: string
  pinCode: string
  gstin?: string
  pan?: string
}

export interface ProjectDetails {
  id?: string
  name: string
  description?: string
  location?: string
  startDate?: string
  expectedEndDate?: string
  status?: string
}

export interface DocumentMetadata {
  documentNumber: string
  documentType: 'quotation' | 'invoice'
  issueDate: string
  validUntil?: string // For quotations
  dueDate?: string // For invoices
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'overdue' // For invoices
  quotationReference?: string // For invoices converted from quotations
  revisionNumber?: number
  currency: string
  template: string
}

export interface PaymentDetails {
  method?: string
  reference?: string
  amount?: number
  date?: string
  notes?: string
}

export interface QuotationInvoiceData {
  id?: string
  metadata: DocumentMetadata
  client: ClientDetails
  project?: ProjectDetails
  lineItems: LineItem[]
  taxConfig: TaxConfiguration
  discount?: DiscountConfiguration
  totals: DocumentTotals
  notes?: string
  terms?: string
  internalNotes?: string
  attachments?: string[]
  paymentDetails?: PaymentDetails[]
  createdBy?: string
  createdAt?: string
  updatedAt?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted'
}

// Helper functions for calculations
export class DocumentCalculator {
  static calculateLineItemTotal(item: LineItem): number {
    const subtotal = item.quantity * item.unitPrice
    let discountAmount = 0
    
    if (item.discount && item.discountType) {
      if (item.discountType === 'percentage') {
        discountAmount = (subtotal * item.discount) / 100
      } else {
        discountAmount = item.discount
      }
    }
    
    return subtotal - discountAmount
  }

  static calculateSubtotal(lineItems: LineItem[]): number {
    return lineItems.reduce((sum, item) => {
      item.total = this.calculateLineItemTotal(item)
      return sum + item.total
    }, 0)
  }

  static calculateTaxableAmount(
    subtotal: number, 
    discount?: DiscountConfiguration
  ): { taxableAmount: number; discountAmount: number } {
    let discountAmount = 0
    
    if (discount) {
      if (discount.type === 'percentage') {
        discountAmount = (subtotal * discount.value) / 100
      } else {
        discountAmount = discount.value
      }
    }
    
    const taxableAmount = subtotal - discountAmount
    return { taxableAmount, discountAmount }
  }

  static calculateTaxAmounts(
    taxableAmount: number, 
    taxConfig: TaxConfiguration,
    isInterState: boolean = false
  ): {
    cgstAmount: number
    sgstAmount: number
    igstAmount: number
    cessAmount: number
    tdsAmount: number
    totalTaxAmount: number
  } {
    let cgstAmount = 0
    let sgstAmount = 0
    let igstAmount = 0
    
    if (isInterState) {
      // Inter-state transaction - use IGST
      igstAmount = (taxableAmount * taxConfig.gstRate) / 100
    } else {
      // Intra-state transaction - use CGST + SGST
      cgstAmount = (taxableAmount * (taxConfig.gstRate / 2)) / 100
      sgstAmount = (taxableAmount * (taxConfig.gstRate / 2)) / 100
    }
    
    const cessAmount = taxConfig.cessRate 
      ? (taxableAmount * taxConfig.cessRate) / 100 
      : 0
    
    const tdsAmount = taxConfig.tdsRate 
      ? (taxableAmount * taxConfig.tdsRate) / 100 
      : 0
    
    const totalTaxAmount = cgstAmount + sgstAmount + igstAmount + cessAmount
    
    return {
      cgstAmount,
      sgstAmount, 
      igstAmount,
      cessAmount,
      tdsAmount,
      totalTaxAmount
    }
  }

  static calculateFinalTotal(
    taxableAmount: number,
    totalTaxAmount: number,
    tdsAmount: number = 0
  ): { finalTotal: number; roundOffAmount: number } {
    const calculatedTotal = taxableAmount + totalTaxAmount - tdsAmount
    const roundedTotal = Math.round(calculatedTotal)
    const roundOffAmount = roundedTotal - calculatedTotal
    
    return {
      finalTotal: roundedTotal,
      roundOffAmount: parseFloat(roundOffAmount.toFixed(2))
    }
  }

  static calculateCompleteDocument(
    lineItems: LineItem[],
    taxConfig: TaxConfiguration,
    discount?: DiscountConfiguration,
    clientState?: string,
    companyState?: string
  ): DocumentTotals {
    // Calculate subtotal
    const subtotal = this.calculateSubtotal(lineItems)
    
    // Calculate taxable amount after discount
    const { taxableAmount, discountAmount } = this.calculateTaxableAmount(subtotal, discount)
    
    // Determine if inter-state transaction
    const isInterState = clientState !== companyState && clientState && companyState
    
    // Calculate tax amounts
    const {
      cgstAmount,
      sgstAmount,
      igstAmount,
      cessAmount,
      tdsAmount,
      totalTaxAmount
    } = this.calculateTaxAmounts(taxableAmount, taxConfig, isInterState)
    
    // Calculate final total with rounding
    const { finalTotal, roundOffAmount } = this.calculateFinalTotal(
      taxableAmount, 
      totalTaxAmount, 
      tdsAmount
    )
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxableAmount: parseFloat(taxableAmount.toFixed(2)),
      cgstAmount: parseFloat(cgstAmount.toFixed(2)),
      sgstAmount: parseFloat(sgstAmount.toFixed(2)),
      igstAmount: parseFloat(igstAmount.toFixed(2)),
      cessAmount: parseFloat(cessAmount.toFixed(2)),
      tdsAmount: parseFloat(tdsAmount.toFixed(2)),
      totalTaxAmount: parseFloat(totalTaxAmount.toFixed(2)),
      roundOffAmount,
      finalTotal
    }
  }
}

// Template configurations
export const DOCUMENT_TEMPLATES = {
  modern: {
    name: 'Modern Professional',
    description: 'Clean, contemporary design with blue accent',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF'
  },
  classic: {
    name: 'Classic Business',
    description: 'Traditional professional layout',
    primaryColor: '#1F2937',
    secondaryColor: '#4B5563'
  },
  minimalist: {
    name: 'Minimalist',
    description: 'Simple, clean design with minimal colors',
    primaryColor: '#000000',
    secondaryColor: '#6B7280'
  },
  corporate: {
    name: 'Corporate Elite',
    description: 'Professional corporate styling',
    primaryColor: '#1E40AF',
    secondaryColor: '#3B82F6'
  },
  creative: {
    name: 'Creative Studio',
    description: 'Artistic design for creative professionals',
    primaryColor: '#7C3AED',
    secondaryColor: '#A855F7'
  },
  luxury: {
    name: 'Luxury Premium',
    description: 'High-end design with gold accents',
    primaryColor: '#D97706',
    secondaryColor: '#F59E0B'
  }
} as const

export type TemplateType = keyof typeof DOCUMENT_TEMPLATES

// Default configurations
export const DEFAULT_TAX_CONFIG: TaxConfiguration = {
  gstRate: 18,
  cgst: 9,
  sgst: 9,
  igst: 18,
  cessRate: 0,
  tdsRate: 0
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
] as const

export const UNITS = [
  'Pcs', 'Nos', 'Sq.Ft', 'Sq.Mt', 'Linear Ft', 'Linear Mt', 'Cubic Ft', 'Cubic Mt',
  'Hours', 'Days', 'Months', 'Years', 'Kg', 'Gm', 'Ltr', 'Ml', 'Set', 'Box',
  'Bundle', 'Roll', 'Sheet', 'Plate', 'Pair', 'Dozen', 'Gross'
] as const