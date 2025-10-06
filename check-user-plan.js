const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUserPlan() {
  try {
    console.log('🔍 Checking plan for demo@admin.com...\n')

    // Get user from auth
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
    
    if (userError) {
      console.error('❌ Error fetching users:', userError)
      return
    }

    const user = users.find(u => u.email === 'demo@admin.com')
    
    if (!user) {
      console.log('❌ User demo@admin.com not found')
      return
    }

    console.log('✅ User found:', user.email)
    console.log('📋 User ID:', user.id)
    console.log('\n📦 User Metadata:')
    console.log(JSON.stringify(user.user_metadata, null, 2))

    // Check if plan_id exists in user_metadata
    const planId = user.user_metadata?.plan_id
    const expiresAt = user.user_metadata?.expires_at

    if (!planId) {
      console.log('\n⚠️  NO PLAN ASSIGNED')
      console.log('   user_metadata.plan_id is not set')
      console.log('   This is why "No Plan" is showing in the UI')
    } else {
      console.log('\n✅ Plan ID:', planId)
      console.log('📅 Expires At:', expiresAt)

      // Fetch plan details
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (planError) {
        console.log('❌ Error fetching plan details:', planError.message)
      } else if (plan) {
        console.log('\n📊 Plan Details:')
        console.log('   Name:', plan.name)
        console.log('   Price: ₹' + plan.price)
        console.log('   Duration:', plan.duration_days, 'days')
        console.log('   Active:', plan.is_active)
      }

      // Calculate days remaining
      if (expiresAt) {
        const expiryDate = new Date(expiresAt)
        const today = new Date()
        const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
        console.log('\n⏰ Days Remaining:', daysLeft)
      }
    }

    // Check subscriptions table (old system)
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subscription) {
      console.log('\n📝 Subscriptions table entry found:')
      console.log(JSON.stringify(subscription, null, 2))
    } else {
      console.log('\n⚠️  No entry in subscriptions table')
    }

    // Check organization membership
    const { data: orgMembership, error: orgError } = await supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', user.id)
      .single()

    if (orgMembership) {
      console.log('\n🏢 Organization:', orgMembership.organizations?.name)
      console.log('   Organization ID:', orgMembership.organization_id)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkUserPlan()
