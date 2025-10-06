const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyAdmin() {
  const adminEmail = 'admin@goplnr.com'
  
  // Get admin user
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
  const adminUser = users.find(u => u.email === adminEmail)
  
  if (!adminUser) {
    console.log('❌ Admin user not found')
    return
  }

  console.log(`✅ Found admin user: ${adminEmail} (${adminUser.id})\n`)

  // Check organization_members
  const { data: orgMember, error: memberError } = await supabase
    .from('organization_members')
    .select('*, organizations(name)')
    .eq('user_id', adminUser.id)
    .single()

  if (memberError) {
    console.log('❌ No organization_members entry:', memberError.message)
  } else {
    console.log('✅ Organization membership found:')
    console.log(`   Organization: ${orgMember.organizations.name}`)
    console.log(`   Role: ${orgMember.role}`)
    console.log(`   Organization ID: ${orgMember.organization_id}\n`)
  }

  // Show all organization_members
  const { data: allMembers } = await supabase
    .from('organization_members')
    .select('user_id, organization_id, role')

  console.log(`📊 Total organization_members entries: ${allMembers.length}`)
}

verifyAdmin().catch(console.error)
