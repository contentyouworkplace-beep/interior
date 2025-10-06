const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testPlansAccess() {
  try {
    console.log('🔍 Testing Plans Database Access...\n');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:');
    console.log('- Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('- Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('\n❌ Missing environment variables');
      return;
    }
    
    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('\n📊 Testing direct database access...');
    
    // Test 1: Check if plans table exists and fetch all plans
    const { data: plans, error: plansError } = await adminClient
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (plansError) {
      console.log('❌ Error fetching plans:', plansError);
      return;
    }
    
    console.log(`✅ Found ${plans?.length || 0} plans in database:`);
    
    if (plans && plans.length > 0) {
      plans.forEach((plan, index) => {
        console.log(`  ${index + 1}. ${plan.name} - ₹${plan.price} (${plan.duration_days} days) [${plan.is_active ? 'Active' : 'Inactive'}]`);
      });
    } else {
      console.log('  No plans found in database');
    }
    
    // Test 2: Check if subscriptions table exists
    console.log('\n📋 Testing subscriptions table...');
    const { data: subscriptions, error: subError } = await adminClient
      .from('subscriptions')
      .select('id, plan_id')
      .limit(5);
    
    if (subError) {
      console.log('❌ Error accessing subscriptions:', subError.message);
    } else {
      console.log(`✅ Subscriptions table accessible (${subscriptions?.length || 0} records)`);
    }
    
    // Test 3: Test the exact API logic
    console.log('\n🔧 Testing API logic...');
    
    const plansWithCounts = await Promise.all(
      (plans || []).map(async (plan) => {
        const { data: subs, error: subError } = await adminClient
          .from('subscriptions')
          .select('id')
          .eq('plan_id', plan.id);
        
        return {
          ...plan,
          user_count: subs?.length || 0
        };
      })
    );
    
    console.log('✅ Plans with user counts processed successfully');
    
    // Test 4: Test API endpoint directly
    console.log('\n🌐 Testing API endpoint...');
    
    try {
      const response = await fetch('http://localhost:3000/api/admin/plans');
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const apiData = await response.json();
        console.log('✅ API returned plans:', apiData.plans?.length || 0);
      } else {
        const errorText = await response.text();
        console.log('❌ API error:', errorText);
      }
    } catch (apiError) {
      console.log('❌ API connection failed:', apiError.message);
      console.log('   Make sure Next.js dev server is running (pnpm dev)');
    }
    
    console.log('\n🎯 Summary:');
    console.log(`- Database plans: ${plans?.length || 0}`);
    console.log(`- Direct access: ${plansError ? '❌' : '✅'}`);
    console.log(`- Service role: ${supabaseServiceKey ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPlansAccess();