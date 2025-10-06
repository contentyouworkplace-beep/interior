const https = require('https');
require('dotenv').config({ path: '.env.local' });

// Simulate a browser request to the API
const url = 'http://localhost:3000/api/quotations';

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('=== API Response ===');
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    try {
      const json = JSON.parse(data);
      console.log('\nParsed:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Could not parse JSON');
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
