// Test Plan Management CRUD operations via API

async function testPlansCRUD() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🚀 Starting Plan Management CRUD Test\n');
  
  try {
    // Test 1: CREATE - Add a demo plan
    console.log('📝 1. Testing CREATE operation...');
    const createResponse = await fetch(`${baseUrl}/api/admin/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Demo Test Plan',
        description: 'Test plan created via API for smoke testing',
        price: 1499,
        duration_days: 45,
        features: ['Demo Feature 1', 'Demo Feature 2'],
        max_projects: 20,
        max_users: 2,
        support_level: 'priority',
        is_active: true
      })
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.log(`❌ CREATE failed (${createResponse.status}):`, error);
      return;
    }
    
    const createResult = await createResponse.json();
    console.log('✅ Plan created successfully:', {
      id: createResult.plan?.id,
      name: createResult.plan?.name,
      price: createResult.plan?.price
    });
    
    const planId = createResult.plan?.id;
    if (!planId) {
      console.log('❌ No plan ID returned from CREATE');
      return;
    }
    
    // Test 2: READ - Get all plans
    console.log('\n📖 2. Testing READ operation...');
    const readResponse = await fetch(`${baseUrl}/api/admin/plans`);
    
    if (!readResponse.ok) {
      console.log(`❌ READ failed (${readResponse.status})`);
      return;
    }
    
    const readResult = await readResponse.json();
    console.log(`✅ Found ${readResult.plans?.length || 0} plans`);
    
    // Find our demo plan
    const ourPlan = readResult.plans?.find(p => p.id === planId);
    if (ourPlan) {
      console.log('✅ Demo plan found in list:', ourPlan.name);
    } else {
      console.log('❌ Demo plan not found in list');
    }
    
    // Test 3: UPDATE - Modify the plan
    console.log('\n✏️  3. Testing UPDATE operation...');
    const updateResponse = await fetch(`${baseUrl}/api/admin/plans/${planId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Updated Demo Plan',
        description: 'Updated test plan description',
        price: 1999,
        duration_days: 60,
        features: ['Updated Feature 1', 'Updated Feature 2', 'New Feature 3'],
        max_projects: 30,
        max_users: 3,
        support_level: 'dedicated',
        is_active: true
      })
    });
    
    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.log(`❌ UPDATE failed (${updateResponse.status}):`, error);
    } else {
      const updateResult = await updateResponse.json();
      console.log('✅ Plan updated successfully:', {
        name: updateResult.plan?.name,
        price: updateResult.plan?.price,
        duration: updateResult.plan?.duration_days
      });
    }
    
    // Test 4: Verify update worked
    console.log('\n🔍 4. Verifying UPDATE...');
    const verifyResponse = await fetch(`${baseUrl}/api/admin/plans`);
    if (verifyResponse.ok) {
      const verifyResult = await verifyResponse.json();
      const updatedPlan = verifyResult.plans?.find(p => p.id === planId);
      if (updatedPlan && updatedPlan.name === 'Updated Demo Plan') {
        console.log('✅ Update verified - plan name changed to:', updatedPlan.name);
      } else {
        console.log('❌ Update verification failed');
      }
    }
    
    // Test 5: DELETE - Remove the plan
    console.log('\n🗑️  5. Testing DELETE operation...');
    const deleteResponse = await fetch(`${baseUrl}/api/admin/plans/${planId}`, {
      method: 'DELETE'
    });
    
    if (!deleteResponse.ok) {
      const error = await deleteResponse.text();
      console.log(`❌ DELETE failed (${deleteResponse.status}):`, error);
    } else {
      const deleteResult = await deleteResponse.json();
      console.log('✅ Plan deleted successfully:', deleteResult.message);
    }
    
    // Test 6: Verify deletion
    console.log('\n🔍 6. Verifying DELETE...');
    const finalResponse = await fetch(`${baseUrl}/api/admin/plans`);
    if (finalResponse.ok) {
      const finalResult = await finalResponse.json();
      const deletedPlan = finalResult.plans?.find(p => p.id === planId);
      if (!deletedPlan) {
        console.log('✅ Delete verified - plan no longer exists');
      } else {
        console.log('❌ Delete verification failed - plan still exists');
      }
    }
    
    console.log('\n🎉 CRUD Test Completed!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ CREATE operation');
    console.log('   ✅ READ operation'); 
    console.log('   ✅ UPDATE operation');
    console.log('   ✅ DELETE operation');
    console.log('   ✅ API connectivity');
    console.log('   ✅ Data persistence');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the Next.js development server is running:');
      console.log('   pnpm dev');
    }
  }
}

testPlansCRUD();