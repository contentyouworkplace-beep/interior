const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^["']|["']$/g, '')
      process.env[key] = value
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('URL:', supabaseUrl ? '✅' : '❌')
  console.error('Key:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDemoUserPlan() {
  try {
    console.log('🔍 Checking plan for demo@admin.com...\n')

    // Get all users to find demo@admin.com
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching users:', authError)
      return
    }

    // Find demo@admin.com user
    const demoUser = authData.users.find(u => u.email === 'demo@admin.com')
    
    if (!demoUser) {
      console.log('❌ User demo@admin.com not found')
      console.log('\n📋 Available users:')
      authData.users.forEach(u => {
        console.log(`  - ${u.email}`)
      })
      return
    }

    console.log('✅ Found user: demo@admin.com')
    console.log(`   User ID: ${demoUser.id}`)
    console.log(`   Created: ${demoUser.created_at}`)
    console.log(`   Last Sign In: ${demoUser.last_sign_in_at || 'Never'}`)
    
    // Check user_metadata for plan
    console.log('\n📊 User Metadata:')
    console.log(JSON.stringify(demoUser.user_metadata, null, 2))
    
    const planId = demoUser.user_metadata?.plan_id
    const expiresAt = demoUser.user_metadata?.expires_at
    
    if (!planId) {
      console.log('\n❌ NO PLAN ASSIGNED')
      console.log('   user_metadata.plan_id is missing or null')
    } else {
      console.log('\n✅ PLAN ASSIGNED')
      console.log(`   Plan ID: ${planId}`)
      
      if (expiresAt) {
        const expiryDate = new Date(expiresAt)
        const now = new Date()
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
        
        console.log(`   Expires: ${expiresAt}`)
        console.log(`   Days Left: ${daysLeft}`)
        console.log(`   Status: ${daysLeft > 0 ? '✅ ACTIVE' : '❌ EXPIRED'}`)
      } else {
        console.log('   Expires: Not set')
      }
      
      // Fetch plan details
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()
      
      if (planError) {
        console.log(`\n⚠️  Could not fetch plan details: ${planError.message}`)
      } else if (plan) {
        console.log('\n📋 Plan Details:')
        console.log(`   Name: ${plan.name}`)
        console.log(`   Price: ₹${plan.price}`)
        console.log(`   Duration: ${plan.duration_days} days`)
        console.log(`   Active: ${plan.is_active ? '✅ Yes' : '❌ No'}`)
      }
    }
    
    // Check subscriptions table (legacy)
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', demoUser.id)
    
    if (!subError && subscriptions && subscriptions.length > 0) {
      console.log('\n📝 Subscriptions Table (Legacy):')
      subscriptions.forEach(sub => {
        console.log(`   - Plan ID: ${sub.plan_id}`)
        console.log(`     Status: ${sub.status}`)
        console.log(`     Expires: ${sub.expires_at}`)
      })
    }
    
    // Check organization membership
    const { data: orgMembers, error: orgError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', demoUser.id)
    
    if (!orgError && orgMembers && orgMembers.length > 0) {
      console.log('\n🏢 Organization Membership:')
      for (const member of orgMembers) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', member.organization_id)
          .single()
        
        console.log(`   - ${org?.name || 'Unknown'} (${member.role})`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkDemoUserPlan()
