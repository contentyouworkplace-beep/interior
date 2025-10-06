// Just print the real organization ID from logs
console.log('FOUND THE ISSUE:');
console.log('');
console.log('Settings page uses organization_id: 422fe3dc-2470-40e7-944a-6e46a48ebd30');
console.log('PDF generation uses organization_id: 00000000-0000-0000-0000-000000000001');
console.log('');
console.log('These are DIFFERENT! Your data is saved with the real org ID (422fe...) but PDF is looking for the dummy ID (00000...)');
console.log('');
console.log('SOLUTION: Need to fetch the correct organization_id from user profile!');
