#!/usr/bin/env node

// Check and fix organization membership
const { createClient } = require('@supabase/supabase-js')

async function checkAndFixMembership() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables:')
    console.error('- NEXT_PUBLIC_SUPABASE_URL')
    console.error('- SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })

  try {
    const userId = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'
    const orgId = '00000000-0000-0000-0000-000000000001'

    console.log('🔍 Checking organization setup...')
    
    // Check if default organization exists
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single()

    if (orgError) {
      console.log('❌ Organization not found:', orgError.message)
      console.log('✅ Creating default organization...')
      
      const { error: createOrgError } = await supabase
        .from('organizations')
        .insert({
          id: orgId,
          name: 'Default Organization',
          description: 'Auto-created default organization'
        })
      
      if (createOrgError) {
        throw createOrgError
      }
      console.log('✅ Default organization created')
    } else {
      console.log('✅ Default organization exists:', org.name)
    }

    // Check if membership exists
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single()

    if (membershipError) {
      console.log('❌ User membership not found:', membershipError.message)
      console.log('✅ Creating user membership...')
      
      const { error: createMembershipError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgId,
          user_id: userId,
          role: 'admin'
        })
      
      if (createMembershipError) {
        throw createMembershipError
      }
      console.log('✅ User membership created')
    } else {
      console.log('✅ User membership exists:', membership.role)
    }

    // Verify RLS function works
    console.log('🔍 Testing RLS function...')
    const { data: rls, error: rlsError } = await supabase
      .rpc('is_org_member', { org_id: orgId })

    if (rlsError) {
      console.log('❌ RLS function error:', rlsError.message)
    } else {
      console.log('✅ RLS function result:', rls)
    }

    console.log('\n🎉 Organization setup completed successfully!')
    console.log('You can now refresh the Company tab in your browser.')

  } catch (error) {
    console.error('❌ Error fixing organization setup:', error.message)
    process.exit(1)
  }
}

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config({ path: '.env.local' })
}

checkAndFixMembership()