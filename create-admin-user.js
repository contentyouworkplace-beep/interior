const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function createAdminUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase environment variables')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    console.log('🔧 Creating admin user account...')
    
    const adminEmail = 'admin@goplnr.com'
    const adminPassword = 'Millions@RM7890'
    
    // Check if admin user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingAdmin = existingUsers?.users.find(user => user.email === adminEmail)
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', adminEmail)
      console.log('🔑 User ID:', existingAdmin.id)
      return existingAdmin
    }
    
    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        role: 'super_admin',
        name: 'Super Admin'
      }
    })

    if (authError) {
      throw authError
    }

    const userId = authData.user.id
    console.log('✅ Admin user created successfully!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 User ID:', userId)
    
    // Create profile for admin
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin'
      })

    if (profileError) {
      console.log('⚠️ Profile creation error (might already exist):', profileError.message)
    } else {
      console.log('✅ Admin profile created')
    }
    
    // Get or create default organization
    const defaultOrgId = '00000000-0000-0000-0000-000000000001'
    
    // Ensure default organization exists
    const { error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: defaultOrgId,
        name: 'GoPLNR Admin Organization',
        description: 'Super admin organization for system management'
      })

    if (orgError) {
      console.log('⚠️ Organization error:', orgError.message)
    }
    
    // Add admin to organization
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert({
        organization_id: defaultOrgId,
        user_id: userId,
        role: 'super_admin'
      })

    if (memberError) {
      console.log('⚠️ Membership error (might already exist):', memberError.message)
    } else {
      console.log('✅ Admin added to default organization')
    }
    
    console.log('\n🎉 Admin setup complete!')
    console.log('🌐 Admin login URL: http://localhost:3000/admin/login')
    console.log('📧 Email: admin@goplnr.com')
    console.log('🔐 Password: Millions@RM7890')
    
    return authData.user
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    throw error
  }
}

if (require.main === module) {
  createAdminUser().catch(console.error)
}

module.exports = { createAdminUser }