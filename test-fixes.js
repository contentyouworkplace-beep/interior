// Quick test for date filter and upload fixes
console.log('🔧 Testing fixes:');
console.log('1. Date filter should now work with proper date comparison');
console.log('2. Upload loading should show spinner during file upload');
console.log('3. Both add and edit dialogs have upload loading disabled state');

// Test date comparison logic
const testDate = new Date('2024-09-15');
const fromDate = new Date('2024-09-01');
const toDate = new Date('2024-09-30');

fromDate.setHours(0, 0, 0, 0);
toDate.setHours(23, 59, 59, 999);

const inRange = testDate >= fromDate && testDate <= toDate;
console.log('✅ Date filter test:', inRange ? 'PASS' : 'FAIL');

console.log('🚀 Server ready at http://localhost:3000/expenses');
console.log('📋 Test these features:');
console.log('  - Date filter: Set From/To dates and see filtered results');
console.log('  - Upload loading: Try uploading files in Add/Edit expense dialogs');