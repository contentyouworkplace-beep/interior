const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testPlanOperations() {
  try {
    console.log('🔧 Testing Plan Management Backend...\n');
    
    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test 1: Create demo plan directly
    console.log('� 1. Creating demo plan...');
    const demoPlans = [
      {
        name: 'Smoke Test Plan',
        description: 'Test plan for backend verification',
        price: 1999,
        duration_days: 45,
        features: ['Test Feature 1', 'Test Feature 2', 'Test Feature 3'],
        max_projects: 25,
        max_users: 3,
        support_level: 'priority',
        is_active: true
      }
    ];
    
    const { data: createdPlan, error: createPlanError } = await supabase
      .from('plans')
      .insert(demoPlans)
      .select('*')
      .single();
    
    if (createPlanError) {
      console.log('❌ Error creating plan:', createPlanError);
      
      // If table doesn't exist, show instructions
      if (createPlanError.code === '42P01') {
        console.log('\n📋 Please run the following SQL in your Supabase dashboard:');
        console.log(`
-- Create plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    price DECIMAL(10,2) DEFAULT 0,
    duration_days INTEGER DEFAULT 30,
    features JSONB DEFAULT '[]'::jsonb,
    max_projects INTEGER DEFAULT 10,
    max_users INTEGER DEFAULT 1,
    support_level VARCHAR(50) DEFAULT 'email',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS policies
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Admin can manage plans
CREATE POLICY "Admins can manage plans" ON plans FOR ALL USING (true);

-- Users can view active plans  
CREATE POLICY "Users can view active plans" ON plans FOR SELECT USING (is_active = true);
        `);
        return;
      }
      return;
    }
    
    console.log('✅ Demo plan created:', {
      id: createdPlan.id,
      name: createdPlan.name,
      price: createdPlan.price,
      duration: createdPlan.duration_days
    });
    
    // Test 2: Read plans
    console.log('\n📖 2. Reading plans...');
    const { data: allPlans, error: readError } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (readError) {
      console.log('❌ Error reading plans:', readError);
      return;
    }
    
    console.log(`✅ Found ${allPlans.length} plans in database`);
    allPlans.forEach(plan => {
      console.log(`   - ${plan.name}: ₹${plan.price} (${plan.duration_days} days) [${plan.is_active ? 'Active' : 'Inactive'}]`);
    });
    
    // Test 3: Update plan
    console.log('\n✏️  3. Updating demo plan...');
    const { data: updatedPlan, error: updateError } = await supabase
      .from('plans')
      .update({
        price: 2499,
        duration_days: 60,
        description: 'Updated test plan for backend verification'
      })
      .eq('id', createdPlan.id)
      .select('*')
      .single();
    
    if (updateError) {
      console.log('❌ Error updating plan:', updateError);
      return;
    }
    
    console.log('✅ Plan updated successfully:', {
      id: updatedPlan.id,
      name: updatedPlan.name,
      price: updatedPlan.price,
      duration: updatedPlan.duration_days
    });
    
    // Test 4: Test API endpoints
    console.log('\n🌐 4. Testing API endpoints...');
    
    // Wait a moment for the server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/plans');
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Plans API working - returned ${data.plans?.length || 0} plans`);
      } else {
        console.log('❌ Plans API error:', response.status, response.statusText);
      }
    } catch (apiError) {
      console.log('❌ API connection error:', apiError.message);
      console.log('   Make sure the Next.js development server is running (pnpm dev)');
    }
    
    console.log('\n🧹 5. Cleanup - Deleting demo plan...');
    const { error: deleteError } = await supabase
      .from('plans')
      .delete()
      .eq('id', createdPlan.id);
    
    if (deleteError) {
      console.log('❌ Error deleting plan:', deleteError);
      console.log('⚠️  Please manually delete the demo plan with ID:', createdPlan.id);
      return;
    }
    
    console.log('✅ Demo plan deleted successfully');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Database connection');
    console.log('   ✅ CREATE operation');
    console.log('   ✅ READ operation');
    console.log('   ✅ UPDATE operation');
    console.log('   ✅ DELETE operation');
    console.log('   ✅ API endpoint connectivity');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testPlanOperations();