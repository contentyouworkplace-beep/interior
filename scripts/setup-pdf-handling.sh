#!/bin/bash
# Comprehensive PDF & File Handling Setup Script
# This script sets up all PDF viewing, downloading, and sharing features

echo "======================================================="
echo "  PDF & File Handling System Setup"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_step() {
    echo -e "${BLUE}🔄${NC} $1"
}

# Step 1: Check if components exist
print_step "Checking if PDF handling components exist..."

if [ -f "components/pdf-viewer.tsx" ]; then
    print_status "PDF Viewer component exists"
else
    print_error "PDF Viewer component missing"
    exit 1
fi

if [ -f "lib/services/pdf-service.ts" ]; then
    print_status "PDF Service exists"
else
    print_error "PDF Service missing"
    exit 1
fi

if [ -f "components/file-attachment-handler.tsx" ]; then
    print_status "File Attachment Handler exists"
else
    print_error "File Attachment Handler missing"
    exit 1
fi

# Step 2: Install required dependencies if needed
print_step "Checking and installing required dependencies..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found"
    exit 1
fi

# Install lucide-react if not present
if ! grep -q "lucide-react" package.json; then
    print_step "Installing lucide-react icons..."
    pnpm add lucide-react
    print_status "lucide-react installed"
fi

# Step 3: Create integration examples
print_step "Creating integration examples..."

# Create example usage file
cat > "examples/pdf-handling-examples.tsx" << 'EOF'
/**
 * PDF Handling Examples
 * Shows how to use the PDF viewer, service, and file handler components
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import PDFViewer from '@/components/pdf-viewer'
import PDFService from '@/lib/services/pdf-service'
import FileAttachmentHandler from '@/components/file-attachment-handler'

export function PDFHandlingExamples() {
  const [showViewer, setShowViewer] = useState(false)

  // Example file attachments
  const exampleFiles = [
    {
      id: '1',
      name: 'invoice-001.pdf',
      path: 'user123/expense456/invoice-001.pdf',
      type: 'application/pdf',
      size: 245760,
      bucket: 'expense-documents-new'
    },
    {
      id: '2',
      name: 'receipt-002.pdf',
      path: 'user123/expense456/receipt-002.pdf',
      type: 'application/pdf',
      size: 123456,
      bucket: 'expense-documents-new'
    }
  ]

  // Example: Direct PDF operations
  const handleDirectDownload = async () => {
    const result = await PDFService.downloadPDFToBrowser(
      'expense-documents-new',
      'user123/expense456/invoice-001.pdf',
      'invoice-001.pdf'
    )
    
    if (result.success) {
      console.log('✅ PDF downloaded successfully')
    } else {
      console.error('❌ Download failed:', result.error)
    }
  }

  const handleDirectShare = async () => {
    const result = await PDFService.sharePDF(
      'expense-documents-new',
      'user123/expense456/invoice-001.pdf',
      'invoice-001.pdf',
      'Invoice Document',
      'Sharing invoice document'
    )
    
    if (result.success) {
      console.log('✅ PDF shared successfully')
    } else {
      console.error('❌ Share failed:', result.error)
    }
  }

  const handleDirectPrint = async () => {
    const result = await PDFService.printPDF(
      'expense-documents-new',
      'user123/expense456/invoice-001.pdf',
      'invoice-001.pdf'
    )
    
    if (result.success) {
      console.log('✅ PDF print dialog opened')
    } else {
      console.error('❌ Print failed:', result.error)
    }
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">PDF Handling Examples</h1>

      {/* Example 1: File Attachment Handler */}
      <div>
        <h2 className="text-xl font-semibold mb-4">1. File Attachment Handler</h2>
        <p className="text-gray-600 mb-4">
          Complete file management with viewing, downloading, and sharing
        </p>
        <FileAttachmentHandler
          files={exampleFiles}
          bucketName="expense-documents-new"
          title="Expense Documents"
          allowBatchOperations={true}
          showThumbnails={true}
        />
      </div>

      {/* Example 2: Direct PDF Viewer */}
      <div>
        <h2 className="text-xl font-semibold mb-4">2. Direct PDF Viewer</h2>
        <p className="text-gray-600 mb-4">
          Open PDF in inline viewer with controls
        </p>
        <Button onClick={() => setShowViewer(true)}>
          Open PDF Viewer
        </Button>

        <PDFViewer
          filePath="user123/expense456/invoice-001.pdf"
          bucketName="expense-documents-new"
          fileName="invoice-001.pdf"
          isOpen={showViewer}
          onClose={() => setShowViewer(false)}
          onDownload={(blob, fileName) => {
            console.log('Custom download handler:', fileName)
          }}
          onShare={(blob, fileName) => {
            console.log('Custom share handler:', fileName)
          }}
        />
      </div>

      {/* Example 3: Direct Service Calls */}
      <div>
        <h2 className="text-xl font-semibold mb-4">3. Direct PDF Service Calls</h2>
        <p className="text-gray-600 mb-4">
          Use PDF service directly for custom operations
        </p>
        <div className="flex gap-2">
          <Button onClick={handleDirectDownload} variant="outline">
            Direct Download
          </Button>
          <Button onClick={handleDirectShare} variant="outline">
            Direct Share
          </Button>
          <Button onClick={handleDirectPrint} variant="outline">
            Direct Print
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PDFHandlingExamples
EOF

print_status "Integration examples created"

# Step 4: Update the view expense dialog
print_step "Integrating PDF handler into view expense dialog..."

# Check if view-expense-dialog.tsx exists
if [ -f "components/view-expense-dialog.tsx" ]; then
    # Create backup
    cp "components/view-expense-dialog.tsx" "components/view-expense-dialog.tsx.backup"
    
    print_info "Created backup of view-expense-dialog.tsx"
    print_warning "Manual integration required for view-expense-dialog.tsx"
    print_info "See integration instructions below"
else
    print_warning "view-expense-dialog.tsx not found, skipping integration"
fi

# Step 5: Create TypeScript declarations
print_step "Creating TypeScript declarations..."

mkdir -p "types"

cat > "types/pdf.d.ts" << 'EOF'
/**
 * PDF Handling Type Declarations
 */

export interface PDFFile {
  id: string
  name: string
  path: string
  bucket: string
  size?: number
  type?: string
  createdAt?: Date
  metadata?: Record<string, any>
}

export interface PDFOperationResult {
  success: boolean
  data?: any
  error?: string
  blob?: Blob
}

export interface FileAttachment {
  id?: string
  name: string
  path?: string
  url?: string
  type?: string
  size?: number
  bucket: string
}

export type PDFOperation = 'download' | 'share' | 'print'
export type FileType = 'pdf' | 'image' | 'other'
EOF

print_status "TypeScript declarations created"

# Step 6: Create test utilities
print_step "Creating test utilities..."

cat > "scripts/test-pdf-handling.js" << 'EOF'
/**
 * Test PDF Handling Functions
 * Run this script to test PDF operations
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPDFOperations() {
  console.log('🧪 Testing PDF handling operations...');
  
  try {
    // Test 1: List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return;
    }
    
    console.log('✅ Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Test 2: Check if new bucket exists
    const newBucket = buckets.find(b => b.name === 'expense-documents-new');
    if (newBucket) {
      console.log('✅ New expense documents bucket found');
      
      // Test 3: List files in bucket
      const { data: files, error: filesError } = await supabase.storage
        .from('expense-documents-new')
        .list('', { limit: 10 });
        
      if (filesError) {
        console.log('⚠️ Could not list files (may be empty):', filesError.message);
      } else {
        console.log(`✅ Found ${files.length} files in new bucket`);
      }
      
    } else {
      console.log('⚠️ New expense documents bucket not found');
    }
    
    console.log('✅ PDF handling test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPDFOperations();
EOF

print_status "Test utilities created"

# Step 7: Create documentation
print_step "Creating documentation..."

cat > "docs/PDF_HANDLING_GUIDE.md" << 'EOF'
# PDF Handling System Documentation

This system provides comprehensive PDF and file handling capabilities including inline viewing, direct downloads, and sharing without exposing URLs.

## Components

### 1. PDFViewer
Advanced PDF viewer with inline display, zoom, rotation, and controls.

```tsx
import PDFViewer from '@/components/pdf-viewer'

<PDFViewer
  filePath="user123/expense456/document.pdf"
  bucketName="expense-documents-new"
  fileName="document.pdf"
  isOpen={isViewerOpen}
  onClose={() => setIsViewerOpen(false)}
/>
```

### 2. PDFService
Backend service for PDF operations without URL exposure.

```tsx
import PDFService from '@/lib/services/pdf-service'

// Download PDF
const result = await PDFService.downloadPDFToBrowser(
  'bucket-name',
  'path/to/file.pdf',
  'filename.pdf'
)

// Share PDF
const shareResult = await PDFService.sharePDF(
  'bucket-name',
  'path/to/file.pdf',
  'filename.pdf'
)

// Print PDF
const printResult = await PDFService.printPDF(
  'bucket-name',
  'path/to/file.pdf',
  'filename.pdf'
)
```

### 3. FileAttachmentHandler
Universal file handler with support for multiple file types.

```tsx
import FileAttachmentHandler from '@/components/file-attachment-handler'

const files = [
  {
    id: '1',
    name: 'document.pdf',
    path: 'user/expense/document.pdf',
    bucket: 'expense-documents-new',
    size: 123456
  }
]

<FileAttachmentHandler
  files={files}
  bucketName="expense-documents-new"
  title="Documents"
  allowBatchOperations={true}
/>
```

## Features

### PDF Viewing
- Inline PDF display with native browser support
- Zoom controls (25% to 300%)
- Page rotation
- Fullscreen mode
- Print functionality

### Direct Downloads
- No URL exposure - direct blob downloads
- Automatic filename handling
- Progress indicators
- Error handling

### Sharing
- Web Share API support
- Clipboard fallback
- Direct blob sharing
- Custom share handlers

### Batch Operations
- Download multiple PDFs
- Share multiple documents
- Print multiple files
- Progress tracking

## Integration Examples

### In Expense View Dialog
```tsx
// Replace existing file display with:
<FileAttachmentHandler
  files={expense.attachments}
  bucketName="expense-documents-new"
  title="Expense Attachments"
  allowBatchOperations={true}
/>
```

### Custom PDF Operations
```tsx
const handleCustomOperation = async () => {
  const result = await PDFService.downloadPDF(bucketName, filePath)
  
  if (result.success && result.blob) {
    // Custom processing of PDF blob
    processMyPDF(result.blob)
  }
}
```

## Security Features

- No URL exposure in client code
- Direct Supabase storage integration
- RLS policy enforcement
- Secure blob handling
- Automatic cleanup

## Browser Support

- PDF viewing: Modern browsers with PDF support
- Download: All browsers
- Sharing: Web Share API or clipboard fallback
- Print: All browsers

## Performance

- Lazy loading of PDF content
- Blob cleanup and memory management
- Efficient batch operations
- Progress indicators for long operations

EOF

print_status "Documentation created"

# Final status report
echo ""
echo "======================================================="
echo "  PDF & File Handling Setup Complete!"
echo "======================================================="

print_status "✅ PDF Viewer Component: components/pdf-viewer.tsx"
print_status "✅ PDF Service: lib/services/pdf-service.ts" 
print_status "✅ File Handler: components/file-attachment-handler.tsx"
print_status "✅ TypeScript Types: types/pdf.d.ts"
print_status "✅ Examples: examples/pdf-handling-examples.tsx"
print_status "✅ Test Script: scripts/test-pdf-handling.js"
print_status "✅ Documentation: docs/PDF_HANDLING_GUIDE.md"

echo ""
echo "======================================================="
echo "  Next Steps"
echo "======================================================="

echo "1. Run the test script:"
echo "   node scripts/test-pdf-handling.js"
echo ""

echo "2. View examples page (add to your routing):"
echo "   /examples/pdf-handling-examples"
echo ""

echo "3. Integrate into existing components:"
echo "   Replace file attachment displays with FileAttachmentHandler"
echo ""

echo "4. Manual integration for view-expense-dialog.tsx:"
echo "   - Import: import FileAttachmentHandler from '@/components/file-attachment-handler'"
echo "   - Replace file display section with:"
echo "   <FileAttachmentHandler"
echo "     files={files.map(url => ({"
echo "       name: extractFileName(url),"
echo "       path: extractFilePath(url),"
echo "       url: url,"
echo "       bucket: 'expense-documents-new'"
echo "     }))}"
echo "     bucketName=\"expense-documents-new\""
echo "     title=\"Expense Attachments\""
echo "     allowBatchOperations={true}"
echo "   />"
echo ""

echo "5. Test the complete system:"
echo "   - Create an expense with PDF attachments"
echo "   - View, download, share, and print PDFs"
echo "   - Test batch operations"

echo ""
print_status "Setup completed successfully! 🎉"