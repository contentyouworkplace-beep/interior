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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPlan() {
  const planId = '91dc9236-071a-4f5f-85e3-f7020e42e3af'
  
  console.log('🔍 Checking if plan exists in database...\n')
  console.log('Plan ID:', planId)
  
  // Check plans table
  const { data: plans, error } = await supabase
    .from('plans')
    .select('*')
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log('\n📋 All plans in database:')
  plans.forEach(plan => {
    const isMatch = plan.id === planId
    console.log(`${isMatch ? '👉' : '  '} ${plan.id} - ${plan.name} (₹${plan.price})`)
  })
  
  const matchingPlan = plans.find(p => p.id === planId)
  
  if (matchingPlan) {
    console.log('\n✅ PLAN FOUND:')
    console.log(JSON.stringify(matchingPlan, null, 2))
  } else {
    console.log('\n❌ PLAN NOT FOUND IN DATABASE!')
    console.log('   The plan_id in user_metadata is invalid/orphaned')
    console.log('\n✅ SOLUTION:')
    console.log('   1. Go to Admin Panel → Users')
    console.log('   2. Edit demo@admin.com')
    console.log('   3. Reassign a valid plan from the dropdown')
    console.log('   4. Save')
  }
}

checkPlan()
