const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  try {
    console.log('Creating test user...')
    
    // Create user with admin service role
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User',
        company_name: 'Test Company'
      }
    })

    if (error) {
      console.error('Error creating user:', error)
      return
    }

    console.log('User created:', data.user.id, data.user.email)

    // Create or update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        first_name: 'Test',
        last_name: 'User',
        company_name: 'Test Company',
        phone: '+1-555-123-4567',
        role: 'designer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return
    }

    console.log('Test user and profile created successfully!')
    console.log('Email: test@example.com')
    console.log('Password: password123')

  } catch (error) {
    console.error('Script error:', error)
  }
}

createTestUser()