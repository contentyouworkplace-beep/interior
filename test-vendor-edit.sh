#!/bin/bash

echo "Testing vendor editing functionality..."
echo "Starting the application..."

echo "1. Testing database connection..."
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'
);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('vendors').select('*').limit(1);
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    console.log('✅ Database connection successful');
    return true;
  } catch (e) {
    console.log('❌ Database connection failed with exception:', e.message);
    return false;
  }
}

testConnection();
"

echo "2. Testing fallback API..."
curl -s -X GET http://localhost:3000/api/vendors-fallback | grep -q "data" && echo "✅ Fallback API is working" || echo "❌ Fallback API failed"

echo "3. Testing vendor by ID API..."
curl -s -X GET http://localhost:3000/api/vendors-fallback/b6a1b150-d2a2-4b9c-9bc5-73d94b4dcfc1 | grep -q "data" && echo "✅ Vendor by ID API is working" || echo "❌ Vendor by ID API failed"

echo "4. Testing vendor update API..."
curl -s -X PUT http://localhost:3000/api/vendors-fallback/b6a1b150-d2a2-4b9c-9bc5-73d94b4dcfc1 \
  -H "Content-Type: application/json" \
  -d '{"vendor_name":"Creative Carpenters", "category": "carpenter"}' | grep -q "successfully" && echo "✅ Vendor update API is working" || echo "❌ Vendor update API failed"

echo ""
echo "All tests completed. You can now test the vendor edit dialog in the UI."
echo "The category should be auto-selected and the 'Failed to fetch' error should be resolved."