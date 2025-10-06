// Check where QR code should be stored and fetched from
console.log('=== QR Code Storage Investigation ===\n');

console.log('From CompanyPageNew.tsx (Settings):');
console.log('- Line 546: uploadBrandFile("qr_code", orgId, qrCodeFile, qrCodePreview)');
console.log('- Line 603: qr_code_url: qrCodeUrl (in normalizedBranding object)');
console.log('- Line 360: result.data.branding.qr_code_url (fetching)');
console.log('✅ RESULT: QR code is stored in BRANDING table\n');

console.log('From company-data-service.ts:');
console.log('- Line 19-26: BrandingDetails interface includes qr_code_url');
console.log('- Line 269-276: branding fetch includes qr_code_url');
console.log('- Line 290-333: banking fetch also checks for qr_code_url');
console.log('✅ RESULT: Service checks BOTH branding and banking_info\n');

console.log('From quotation-pdf-document.tsx:');
console.log('- Line 627: {(companyData.banking?.qr_code_url || companyData.branding?.qr_code_url) && (');
console.log('- Line 634: src={companyData.banking?.qr_code_url || companyData.branding?.qr_code_url}');
console.log('✅ RESULT: PDF checks BOTH sources (banking first, then branding)\n');

console.log('🔍 CONCLUSION:');
console.log('The QR code is stored in branding.qr_code_url');
console.log('But all code correctly checks both locations');
console.log('The issue is that the API is being called with wrong orgId');
console.log('\nReal orgId: 422fe3dc-2470-40e7-944a-6e46a48ebd30');
console.log('Dummy orgId being used: 00000000-0000-0000-0000-000000000001');
console.log('\n✅ Fix applied: Updated useCompanyLogo.ts to fetch real orgId from company_profiles');
console.log('❗ User needs to HARD REFRESH browser (Cmd+Shift+R) to clear cache');
