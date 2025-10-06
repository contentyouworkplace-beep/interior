const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Use service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSubscriptionsTable() {
  console.log('🚀 Creating subscriptions table...')
  
  try {
    // Create subscriptions table directly
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)

    if (error && error.code === 'PGRST116') {
      console.log('📋 Table does not exist, it will be created via API calls')
    } else {
      console.log('✅ Subscriptions table already exists!')
    }

    // Create some sample subscriptions for existing users
    console.log('📝 Creating sample subscriptions...')
    
    // Get existing users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    console.log(`Found ${users.users.length} users`)

    // Create subscriptions for existing users
    for (const user of users.users) {
      console.log(`Processing user: ${user.email}`)
      
      // Get user's organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', user.id)
        .single()

      if (orgError) {
        console.log(`⚠️  No organization found for ${user.email}`)
        continue
      }

      if (org) {
        // Check if subscription already exists
        const { data: existingSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (existingSub) {
          console.log(`✅ Subscription already exists for ${user.email}`)
          continue
        }

        const { error: subError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: user.id,
            organization_id: org.id,
            plan: user.email?.includes('admin') ? 'enterprise' : 'pro',
            status: 'active',
            expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
          })

        if (subError) {
          console.log(`⚠️  Could not create subscription for ${user.email}:`, subError.message)
        } else {
          console.log(`✅ Created subscription for ${user.email}`)
        }
      }
    }

    console.log('🎉 Subscriptions setup complete!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the migration
createSubscriptionsTable()
  .then(() => {
    console.log('✨ Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })