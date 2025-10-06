const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixOrganizationMembers() {
  console.log('🔍 Checking organization_members table...\n')

  // Get all users
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError)
    return
  }

  console.log(`📊 Found ${users.users.length} total users\n`)

  // Get all profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, user_id, email, company_name, first_name, last_name')
  
  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError)
    return
  }

  // Get all organizations
  const { data: organizations, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name')
  
  if (orgsError) {
    console.error('❌ Error fetching organizations:', orgsError)
    return
  }

  console.log(`🏢 Found ${organizations.length} organizations\n`)

  // Get existing organization_members
  const { data: existingMembers, error: membersError } = await supabase
    .from('organization_members')
    .select('user_id, organization_id, role')
  
  if (membersError) {
    console.error('❌ Error fetching organization_members:', membersError)
    return
  }

  console.log(`📋 Found ${existingMembers.length} existing organization_members entries\n`)

  // Find users missing organization_members entry
  const usersNeedingOrg = users.users.filter(user => {
    return !existingMembers.some(member => member.user_id === user.id)
  })

  console.log(`🔧 Found ${usersNeedingOrg.length} users missing organization_members entry\n`)

  if (usersNeedingOrg.length === 0) {
    console.log('✅ All users already have organization_members entries!')
    return
  }

  console.log('👥 Users to fix:')
  usersNeedingOrg.forEach(user => {
    console.log(`  - ${user.email}`)
  })
  console.log()

  // For each user, create organization and link them
  for (const user of usersNeedingOrg) {
    const profile = profiles.find(p => p.user_id === user.id)
    const orgName = profile?.company_name || `${user.email?.split('@')[0]}'s Company`

    console.log(`📝 Creating organization for ${user.email}...`)

    // Create organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        description: `Organization for ${user.email}`
      })
      .select()
      .single()

    if (orgError) {
      console.error(`  ❌ Error creating organization:`, orgError)
      continue
    }

    console.log(`  ✅ Created organization: ${newOrg.name}`)

    // Create organization_members entry
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        user_id: user.id,
        organization_id: newOrg.id,
        role: 'owner'
      })

    if (memberError) {
      console.error(`  ❌ Error creating organization_members:`, memberError)
      continue
    }

    console.log(`  ✅ Linked ${user.email} to organization as owner\n`)
  }

  // Verify the fix
  const { data: updatedMembers, error: verifyError } = await supabase
    .from('organization_members')
    .select('user_id, organization_id, role')
  
  if (!verifyError) {
    console.log(`✅ Verification: Now have ${updatedMembers.length} total organization_members entries\n`)
  }

  console.log('🎉 Fix completed successfully!')
}

fixOrganizationMembers().catch(console.error)
