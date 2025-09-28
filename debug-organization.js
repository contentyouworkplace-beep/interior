#!/usr/bin/env node

// Debug organization membership and RLS
const { createClient } = require('@supabase/supabase-js')

async function debugOrganization() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.error('Missing environment variables')
    process.exit(1)
  }

  console.log('🔍 Debugging organization setup...\n')

  // Test with service role (should always work)
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })

  try {
    console.log('1️⃣ Testing with SERVICE ROLE:')
    
    const { data: orgs, error: orgError } = await supabaseService
      .from('organizations')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')

    if (orgError) {
      console.log('❌ Service role org query failed:', orgError.message)
    } else {
      console.log('✅ Service role org query success:', orgs.length, 'organizations found')
      if (orgs.length > 0) {
        console.log('   Organization:', orgs[0].name)
      }
    }

    const { data: members, error: memberError } = await supabaseService
      .from('organization_members')
      .select('*')
      .eq('user_id', '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6')

    if (memberError) {
      console.log('❌ Service role membership query failed:', memberError.message)
    } else {
      console.log('✅ Service role membership query success:', members.length, 'memberships found')
      if (members.length > 0) {
        console.log('   Membership role:', members[0].role)
        console.log('   Organization ID:', members[0].organization_id)
      }
    }

    console.log('\n2️⃣ Testing with ANON KEY (simulating frontend):')
    
    // Test with anon key (what the frontend uses)
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

    // Simulate what happens in the frontend
    const { data: anonOrgs, error: anonOrgError } = await supabaseAnon
      .from('organizations')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')

    if (anonOrgError) {
      console.log('❌ Anon role org query failed:', anonOrgError.message)
      console.log('   This explains why the frontend is failing!')
    } else {
      console.log('✅ Anon role org query success:', anonOrgs.length, 'organizations found')
    }

    console.log('\n3️⃣ Checking RLS policies:')
    
    const { data: policies, error: policyError } = await supabaseService
      .from('pg_policies')
      .select('*')
      .in('tablename', ['organizations', 'organization_members'])

    if (policyError) {
      console.log('❌ Policy query failed:', policyError.message)
    } else {
      console.log('✅ Found', policies.length, 'RLS policies:')
      policies.forEach(policy => {
        console.log(`   - ${policy.tablename}.${policy.policyname}: ${policy.cmd}`)
      })
    }

    console.log('\n4️⃣ Checking if RLS function exists:')
    
    const { data: functions, error: funcError } = await supabaseService
      .from('pg_proc')
      .select('proname')
      .eq('proname', 'is_org_member')

    if (funcError) {
      console.log('❌ Function query failed:', funcError.message)
    } else {
      console.log('✅ Found', functions.length, 'is_org_member functions')
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message)
  }

  console.log('\n🔧 RECOMMENDED FIXES:')
  console.log('1. The anon role needs proper permissions')
  console.log('2. RLS policies might be too restrictive') 
  console.log('3. The is_org_member function might not work with anon auth')
}

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config({ path: '.env.local' })
}

debugOrganization()