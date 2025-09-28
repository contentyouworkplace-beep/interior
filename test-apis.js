// Test Dashboard APIs with your User ID
// Run this in browser console or Node.js

const userId = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6';
const baseUrl = 'http://localhost:3001';

// Test Dashboard Metrics API
async function testMetrics() {
  try {
    const response = await fetch(`${baseUrl}/api/dashboard/metrics`);
    const data = await response.json();
    console.log('📊 Dashboard Metrics:', data);
  } catch (error) {
    console.error('❌ Metrics Error:', error);
  }
}

// Test Recent Projects API
async function testProjects() {
  try {
    const response = await fetch(`${baseUrl}/api/projects/recent`);
    const data = await response.json();
    console.log('🏗️ Recent Projects:', data);
  } catch (error) {
    console.error('❌ Projects Error:', error);
  }
}

// Test Tasks API
async function testTasks(date = new Date().toISOString().split('T')[0]) {
  try {
    const response = await fetch(`${baseUrl}/api/tasks?date=${date}`);
    const data = await response.json();
    console.log('📅 Tasks for', date + ':', data);
  } catch (error) {
    console.error('❌ Tasks Error:', error);
  }
}

// Test all APIs
async function testAllAPIs() {
  console.log('🚀 Testing GoPLNR CRM APIs...');
  console.log('👤 User ID:', userId);
  console.log('');
  
  await testMetrics();
  await testProjects();
  await testTasks();
  
  console.log('✅ API testing complete!');
}

// Uncomment to run tests
// testAllAPIs();

// Export for browser use
if (typeof window !== 'undefined') {
  window.testGoPLNRAPIs = testAllAPIs;
  window.testMetrics = testMetrics;
  window.testProjects = testProjects;
  window.testTasks = testTasks;
}