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

