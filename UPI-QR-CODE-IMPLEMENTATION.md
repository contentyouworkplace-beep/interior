# Payment QR Code & Banking Details Enhancement

## Changes Implemented

### 1. **Enhanced Company Data Interface** (`lib/services/company-data-service.ts`)
Added QR code support to BankingInfo interface:
```typescript
export interface BankingInfo {
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  branch_name?: string
  account_holder_name?: string
  swift_code?: string
  upi_id?: string              // UPI ID for text display
  qr_code_url?: string         // NEW: URL/path to uploaded QR code image
}
```

### 2. **Fixed Quotation Items Fetching** (`app/api/quotations/route.ts`)
Updated GET endpoint to properly fetch quotation items:
```typescript
.select(`
  *,
  client:clients!quotations_client_id_fkey (...),
  items:quotation_items (          // NEW: Fetch items
    id,
    description,
    quantity,
    unit_price,
    total,
    item_order
  )
`)
```

### 3. **Enhanced PDF Banking Section**
Added new styles for QR code display:
```typescript
bankingContent: {
  flexDirection: 'row',
  gap: 15,
},
qrCodeContainer: {
  width: 120,
  alignItems: 'center',
  padding: 10,
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
},
qrCode: {
  width: 100,
  height: 100,
},
```

**Updated Banking Section Layout:**
- Left side: Banking details grid (bank name, account number, IFSC, UPI ID)
- Right side: QR code image (if uploaded in settings)

### 4. **Simplified Approach - No Dynamic Generation**
- QR code is **uploaded by admin** in Settings > Banking
- Stored as URL in database (`qr_code_url` field)
- PDF simply displays the uploaded image
- **No amount pre-filling** - static QR code for all transactions
- Works with any payment method (UPI, bank transfer QR, etc.)

## How It Works

### Flow:
1. **Admin uploads QR code** in Settings > Banking tab
   - Can be UPI QR, bank QR, or any payment QR code
   - Image stored in Supabase storage or external URL
2. **QR URL saved** to `banking_info.qr_code_url`
3. **User generates PDF** (View/Download quotation)
4. **Service fetches** banking data including QR code URL
5. **PDF displays** QR code alongside banking details
6. **Customer scans** QR code to pay (manually enters amount)

### PDF Layout:
```
┌─────────────────────────────────────────────┐
│         Payment Information                 │
├──────────────────────────┬──────────────────┤
│ Bank Name: XYZ Bank      │                  │
│ Account Holder: John Doe │   ▀▀▀▀▀▀▀▀▀▀    │
│ Account Number: xxxxxxx  │   █ █▀▀▀█ █     │
│ IFSC Code: XXXX0000123   │   █ ▄▄▄▄ █ █    │
│ Branch: Main Branch      │   ▀▀▀▀▀▀▀▀▀▀    │
│ UPI ID: merchant@upi     │   Scan to Pay   │
└──────────────────────────┴──────────────────┘
```

## Database Schema Update Needed

Add QR code URL column to `banking_info` table:

```sql
ALTER TABLE banking_info 
  ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
```

## Usage

### 1. Upload QR Code in Settings:
- Navigate to Company Settings > Banking
- Enter UPI ID (optional, for text display)
- Upload your payment QR code image
  - Can be UPI QR code
  - Bank-specific payment QR
  - Any static payment QR
- System stores the image URL in database

### 2. Generate PDFs:
- Open any quotation
- Click "View" or "Download"
- PDF automatically includes:
  - All banking details
  - UPI ID text (if provided)
  - Your uploaded QR code image

### 3. Customer Experience:
Customers can:
- View banking details for manual transfer
- See UPI ID for direct payment
- Scan QR code with payment app
- **Manually enter the amount** from invoice

## Benefits

✅ **Simple Setup**: Just upload one QR code image
✅ **Universal**: Works with any QR-based payment system
✅ **Static**: No dynamic generation needed
✅ **Flexible**: Can use UPI, bank QR, or other payment QR codes
✅ **Professional**: Shows modern payment options
✅ **Easy Management**: Update QR code anytime from settings
✅ **Complete Info**: Shows both traditional and QR payment methods
✅ **No Libraries Needed**: No dynamic QR generation dependencies

## Supported QR Code Types

- **UPI QR Codes**: From PhonePe, GPay, Paytm, etc.
- **Bank QR Codes**: From ICICI, HDFC, SBI, etc.
- **Payment Gateway QRs**: From Razorpay, PayU, etc.
- **Custom QR Codes**: Any payment QR you have

## Testing

1. **Upload QR Code**:
   - Go to Settings > Banking
   - Upload your payment QR code image
   - Save settings

2. **View Quotation PDF**:
   - Should show banking grid on left
   - QR code on right
   - All details properly formatted

3. **Scan QR Code**:
   - Open payment app
   - Scan the QR code
   - Manually enter amount
   - Complete payment

## Error Handling

- If `qr_code_url` is empty: QR section hidden, only banking details shown
- If image fails to load: PDF continues without QR code
- If UPI ID is empty but QR exists: Only QR code shown
- All errors logged to console for debugging

## File Structure

```
banking_info table:
├── bank_name
├── account_number
├── ifsc_code
├── branch_name
├── account_holder_name
├── upi_id           (optional text display)
└── qr_code_url      (uploaded image URL)
```

---

**Status**: ✅ Complete - Ready for QR Code Upload
**Next Step**: Add file upload field in Settings > Banking tab

## Changes Implemented

### 1. **Enhanced Company Data Interface** (`lib/services/company-data-service.ts`)
Added UPI support to BankingInfo interface:
```typescript
export interface BankingInfo {
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  branch_name?: string
  account_holder_name?: string
  swift_code?: string
  upi_id?: string              // NEW: UPI ID for payment
  upi_qr_enabled?: boolean     // NEW: Enable/disable QR code in PDFs
}
```

### 2. **Fixed Quotation Items Fetching** (`app/api/quotations/route.ts`)
Updated GET endpoint to properly fetch quotation items:
```typescript
.select(`
  *,
  client:clients!quotations_client_id_fkey (...),
  items:quotation_items (          // NEW: Fetch items
    id,
    description,
    quantity,
    unit_price,
    total,
    item_order
  )
`)
```

### 3. **UPI QR Code Generation** (`components/pdf/quotation-pdf-document.tsx`)
Added helper function to generate UPI payment QR codes:
```typescript
export const generateUPIQRCode = async (
  upiId: string,
  amount: number,
  companyName: string,
  currency: string,
  documentType: string,
  documentNumber: string
): Promise<string | null>
```

**UPI Payment String Format:**
```
upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=CURRENCY&tn=NOTE
```

### 4. **Enhanced PDF Banking Section**
Added new styles for QR code display:
```typescript
bankingContent: {
  flexDirection: 'row',
  gap: 15,
},
qrCodeContainer: {
  width: 120,
  alignItems: 'center',
  padding: 10,
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
},
qrCode: {
  width: 100,
  height: 100,
},
```

**Updated Banking Section Layout:**
- Left side: Banking details grid (bank name, account number, IFSC, UPI ID)
- Right side: UPI QR code (if enabled) with "Scan to Pay via UPI" label

### 5. **Updated React PDF Service** (`lib/services/react-pdf-service.ts`)
Modified to generate QR code before creating PDF:
```typescript
static async generatePDF(documentData, companyData): Promise<Blob> {
  // Generate UPI QR code if enabled
  let upiQRCode: string | null = null
  if (companyData.banking?.upi_id && companyData.banking?.upi_qr_enabled) {
    upiQRCode = await generateUPIQRCode(...)
  }
  
  // Create document with QR code
  const document = createQuotationPDFDocument(documentData, companyData, upiQRCode)
  ...
}
```

## How It Works

### Flow:
1. **User clicks "View" or "Download"** on quotation
2. **Service fetches company data** (including UPI ID and qr_enabled flag)
3. **If UPI is enabled**, generate QR code:
   - Create UPI payment string with amount and details
   - Convert to QR code using `qrcode` library
   - Return base64 data URL
4. **Create PDF** with QR code embedded
5. **Display/Download** PDF with banking details and QR code

### PDF Layout:
```
┌─────────────────────────────────────────────┐
│         Payment Information                 │
├──────────────────────────┬──────────────────┤
│ Bank Name: XYZ Bank      │                  │
│ Account Holder: John Doe │   ▀▀▀▀▀▀▀▀▀▀    │
│ Account Number: xxxxxxx  │   █ █▀▀▀█ █     │
│ IFSC Code: XXXX0000123   │   █ ▄▄▄▄ █ █    │
│ Branch: Main Branch      │   ▀▀▀▀▀▀▀▀▀▀    │
│ UPI ID: merchant@upi     │   Scan to Pay   │
└──────────────────────────┴──────────────────┘
```

## Database Schema Update Needed

To use this feature, add these columns to `banking_info` table:

```sql
ALTER TABLE banking_info 
  ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS upi_qr_enabled BOOLEAN DEFAULT false;
```

## Usage

### 1. Add UPI Details in Settings:
- Navigate to Company Settings > Banking
- Enter UPI ID (e.g., `merchant@paytm`, `9876543210@ybl`)
- Enable "Show UPI QR Code in PDFs" checkbox

### 2. Generate PDFs:
- Open any quotation
- Click "View" or "Download"
- PDF will automatically include:
  - All banking details
  - UPI ID text
  - Scannable QR code (if enabled)

### 3. Customer Experience:
Customers can:
- View banking details for manual transfer
- See UPI ID for direct payment
- Scan QR code with any UPI app (PhonePe, Google Pay, Paytm, etc.)
- Amount is pre-filled in QR code

## Libraries Used

- **qrcode**: ^1.5.4 - Generates QR codes from UPI payment strings
- **@types/qrcode**: For TypeScript support

## Benefits

✅ **Instant Payments**: Customers scan QR and pay directly
✅ **No Manual Entry**: Amount pre-filled, reduces errors
✅ **Universal**: Works with all UPI apps
✅ **Professional**: Shows modern payment options
✅ **Flexibility**: Can be disabled if not needed
✅ **Complete Info**: Shows both traditional and UPI payment methods

## Testing

Once UPI details are added to database:

1. **Generate Test QR Code:**
   ```javascript
   const qrString = 'upi://pay?pa=test@upi&pn=TestCompany&am=1000&cu=INR&tn=Test'
   ```

2. **View Quotation PDF**:
   - Should show banking grid on left
   - QR code on right (if enabled)
   - All details properly formatted

3. **Scan QR Code**:
   - Open any UPI app
   - Scan the QR code
   - Verify amount and merchant name appear

## Error Handling

- If UPI ID is empty: QR section hidden
- If QR generation fails: PDF continues without QR
- If `upi_qr_enabled` is false: Only shows UPI ID text, no QR code
- All errors logged to console for debugging

---

**Status**: ✅ Complete - Ready for Database Update
