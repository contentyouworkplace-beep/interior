import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting (default INR)
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export function formatINR(amount: number | null | undefined, opts?: { showSymbol?: boolean }) {
  if (amount === null || amount === undefined || isNaN(amount as number)) return opts?.showSymbol === false ? '' : '₹0'
  if (opts?.showSymbol === false) {
    // strip currency symbol & narrow no-break space variations
    return inrFormatter.format(Number(amount)).replace(/^₹\s?/, '')
  }
  return inrFormatter.format(Number(amount))
}

export function formatCurrency(amount: number | null | undefined, currency: string = 'INR') {
  if (amount === null || amount === undefined || isNaN(amount as number)) return '₹0'
  if (currency === 'INR') return formatINR(amount)
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(amount))
  } catch {
    return `₹${Number(amount).toLocaleString('en-IN')}`
  }
}

export const RUPEE_SYMBOL = '₹'

// Basic Indian phone formatting: keeps digits, enforces +91 prefix, groups as +91 XXXXX XXXXX
export function formatIndianPhone(input: string): string {
  if (!input) return ''
  const digits = input.replace(/\D/g, '')
  // Remove leading country codes like 091 or 0091
  let number = digits
  if (number.startsWith('0091')) number = number.slice(4)
  else if (number.startsWith('091')) number = number.slice(3)
  else if (number.startsWith('91') && number.length > 10) number = number.slice(2)

  // Take last 10 digits as core mobile if longer
  if (number.length > 10) number = number.slice(-10)

  // If less than 10 digits, just return partial with +91 prefix
  if (number.length <= 5) return `+91 ${number}`.trim()
  if (number.length <= 10) {
    return `+91 ${number.slice(0,5)} ${number.slice(5)}`.trim()
  }
  return `+91 ${number}`
}
