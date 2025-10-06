// Invoice PDF Viewer - Component Verification Test
// Run with: node verify-invoice-pdf-viewer.js

const fs = require('fs');
const path = require('path');

console.log('🧪 Invoice PDF Viewer - Component Verification\n');
console.log('=' .repeat(50));

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, condition, details = '') {
  const status = condition ? '✅ PASS' : '❌ FAIL';
  const result = { name, status, passed: condition, details };
  results.tests.push(result);
  
  if (condition) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  console.log(`${status} - ${name}`);
  if (details) console.log(`   ${details}`);
}

// Test 1: Check if invoice PDF viewer component exists
const viewerPath = path.join(__dirname, 'components', 'invoice-pdf-viewer-dialog.tsx');
test(
  'Invoice PDF Viewer Dialog component file exists',
  fs.existsSync(viewerPath),
  viewerPath
);

// Test 2: Check if component is properly imported in invoices page
const invoicesPagePath = path.join(__dirname, 'app', 'invoices', 'page.tsx');
if (fs.existsSync(invoicesPagePath)) {
  const content = fs.readFileSync(invoicesPagePath, 'utf8');
  test(
    'InvoicePDFViewerDialog imported in invoices page',
    content.includes('import { InvoicePDFViewerDialog }'),
    'Found import statement'
  );
  
  test(
    'PDF viewer state variables exist',
    content.includes('pdfViewerOpen') && content.includes('viewingInvoice'),
    'Found state management'
  );
  
  test(
    'handleViewInvoice function exists',
    content.includes('handleViewInvoice'),
    'Found handler function'
  );
  
  test(
    'InvoicePDFViewerDialog component rendered',
    content.includes('<InvoicePDFViewerDialog'),
    'Found component usage'
  );
} else {
  test('Invoices page file exists', false, invoicesPagePath);
}

// Test 3: Check if PDF viewer component has required features
if (fs.existsSync(viewerPath)) {
  const viewerContent = fs.readFileSync(viewerPath, 'utf8');
  
  test(
    'PDF viewer has loading state',
    viewerContent.includes('loading') && viewerContent.includes('Loader2'),
    'Found loading indicator'
  );
  
  test(
    'PDF viewer has error handling',
    viewerContent.includes('error') && viewerContent.includes('Try Again'),
    'Found error handling'
  );
  
  test(
    'PDF viewer has download functionality',
    viewerContent.includes('handleDownload') && viewerContent.includes('Download'),
    'Found download button'
  );
  
  test(
    'PDF viewer has print functionality',
    viewerContent.includes('handlePrint') && viewerContent.includes('Printer'),
    'Found print button'
  );
  
  test(
    'PDF viewer uses ReactPDFService',
    viewerContent.includes('ReactPDFService'),
    'Found PDF generation service'
  );
  
  test(
    'PDF viewer uses CompanyDataService',
    viewerContent.includes('CompanyDataService'),
    'Found company data service'
  );
  
  test(
    'PDF viewer uses documentStorage',
    viewerContent.includes('documentStorage'),
    'Found storage service'
  );
  
  test(
    'PDF viewer uses activityLogger',
    viewerContent.includes('activityLogger'),
    'Found activity logging'
  );
  
  test(
    'PDF viewer has memory cleanup',
    viewerContent.includes('revokeObjectURL'),
    'Found memory management'
  );
}

// Test 4: Check if ReactPDFService exists
const pdfServicePath = path.join(__dirname, 'lib', 'services', 'react-pdf-service.ts');
test(
  'ReactPDFService file exists',
  fs.existsSync(pdfServicePath),
  pdfServicePath
);

// Test 5: Check if PDF document template exists
const pdfDocPath = path.join(__dirname, 'components', 'pdf', 'quotation-pdf-document.tsx');
test(
  'PDF document template exists',
  fs.existsSync(pdfDocPath),
  'Shared template for quotations and invoices'
);

// Test 6: Check View button in invoices page
if (fs.existsSync(invoicesPagePath)) {
  const content = fs.readFileSync(invoicesPagePath, 'utf8');
  test(
    'View button exists with Eye icon',
    content.includes('handleViewInvoice') && content.includes('<Eye'),
    'Found View button with icon'
  );
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary:');
console.log(`   Total Tests: ${results.passed + results.failed}`);
console.log(`   ✅ Passed: ${results.passed}`);
console.log(`   ❌ Failed: ${results.failed}`);
console.log('='.repeat(50));

if (results.failed === 0) {
  console.log('\n🎉 All tests passed! Invoice PDF Viewer is ready!');
  console.log('\n🚀 Next Steps:');
  console.log('   1. Start dev server: pnpm dev');
  console.log('   2. Open browser: http://localhost:3002/invoices');
  console.log('   3. Click "View" button on any invoice');
  console.log('   4. Test PDF generation, download, and print');
} else {
  console.log('\n⚠️  Some tests failed. Please review the results above.');
  console.log('\n🔍 Failed Tests:');
  results.tests
    .filter(t => !t.passed)
    .forEach(t => console.log(`   - ${t.name}`));
}

console.log('\n' + '='.repeat(50));

// Export results for CI/CD
if (process.env.CI) {
  fs.writeFileSync(
    'test-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('📝 Results saved to test-results.json');
}

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
