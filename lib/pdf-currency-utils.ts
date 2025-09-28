// Utility for PDF currency formatting to handle rupee symbol rendering issues
export function formatCurrencyForPDF(amount: number, options?: { showSymbol?: boolean }) {
  const formattedAmount = amount.toLocaleString('en-IN');
  
  if (options?.showSymbol === false) {
    return formattedAmount;
  }
  
  // For PDF exports, we use a space between symbol and amount for better rendering
  // This helps avoid font encoding issues where ₹ might render as "1"
  return `₹ ${formattedAmount}`;
}

// Alternative format using "Rs." for maximum PDF compatibility
export function formatCurrencyForPDFSafe(amount: number) {
  const formattedAmount = amount.toLocaleString('en-IN');
  return `Rs. ${formattedAmount}`;
}

// Alternative using INR prefix
export function formatCurrencyForPDFINR(amount: number) {
  const formattedAmount = amount.toLocaleString('en-IN');
  return `INR ${formattedAmount}`;
}

// Format for web display (always use ₹)
export function formatCurrencyForWeb(amount: number) {
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Detect if we're in a PDF context and choose appropriate formatter
export function formatCurrencyAuto(amount: number, context: 'web' | 'pdf' = 'web') {
  if (context === 'pdf') {
    return formatCurrencyForPDFSafe(amount);
  }
  return formatCurrencyForWeb(amount);
}