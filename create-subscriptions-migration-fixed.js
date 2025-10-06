const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Use service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Key:', supabaseServiceKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSubscriptionsTable() {
  console.log('🚀 Creating subscriptions table...')
  
  try {
    // Create subscriptions table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create subscriptions table for validity management
        CREATE TABLE IF NOT EXISTS subscriptions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
            plan VARCHAR(50) NOT NULL DEFAULT 'trial',
            status VARCHAR(20) NOT NULL DEFAULT 'active',
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            
            CONSTRAINT unique_user_subscription UNIQUE(user_id),
            CONSTRAINT valid_plan CHECK (plan IN ('trial', 'basic', 'pro', 'enterprise')),
            CONSTRAINT valid_status CHECK (status IN ('active', 'expired', 'cancelled', 'suspended'))
        );

        -- Enable RLS
        ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

        -- RLS Policies for subscriptions
        DROP POLICY IF EXISTS "Users can view their own subscription" ON subscriptions;
        CREATE POLICY "Users can view their own subscription" ON subscriptions
            FOR SELECT USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON subscriptions;
        CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
            FOR ALL USING (auth.role() = 'service_role');

        -- Add indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at ON subscriptions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
      `
    })

    if (error) {
      console.error('❌ Error creating subscriptions table:', error)
    } else {
      console.log('✅ Subscriptions table created successfully!')
    }

    // Create some sample subscriptions for existing users
    console.log('📝 Creating sample subscriptions...')
    
    // Get existing users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    // Create subscriptions for existing users
    for (const user of users.users) {
      // Get user's organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('created_by', user.id)
        .single()

      if (org) {
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
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