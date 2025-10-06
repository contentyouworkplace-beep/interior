// Shared currency formatting helper for INR values
// Ensures consistent two-decimal formatting and handles null/undefined gracefully.

export function formatCurrencyINR(amount: number | null | undefined, opts?: { withSymbol?: boolean }): string {
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0
  const formatted = value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return opts?.withSymbol === false ? formatted : `₹${formatted}`
}
