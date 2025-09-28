#!/usr/bin/env node

// Debug the Company settings to identify issues
const { createClient } = require('@supabase/supabase-js')

async function debugCompanySettings() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const userId = '4bdb74e7-7441-4ca0-9eb4-5ac3a73c22d6'
    const orgId = '00000000-0000-0000-0000-000000000001'

    console.log('🔍 Debugging Company Settings...\n')

    // 1. Check organization membership
    console.log('1️⃣ Checking organization membership:')
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId)

    if (memberError) {
      console.log('❌ Membership error:', memberError.message)
    } else {
      console.log('✅ Membership found:', membership.length, 'records')
      membership.forEach(m => console.log(`   - Org: ${m.organization_id}, Role: ${m.role}`))
    }

    // 2. Check company profiles
    console.log('\n2️⃣ Checking company profiles:')
    const { data: profiles, error: profileError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('organization_id', orgId)

    if (profileError) {
      console.log('❌ Profile error:', profileError.message)
    } else {
      console.log('✅ Profiles found:', profiles.length, 'records')
      if (profiles.length > 0) {
        console.log('   Company name:', profiles[0].company_name)
      }
    }

    // 3. Check branding data
    console.log('\n3️⃣ Checking branding data:')
    const { data: branding, error: brandingError } = await supabase
      .from('branding')
      .select('*')
      .eq('organization_id', orgId)

    if (brandingError) {
      console.log('❌ Branding error:', brandingError.message)
    } else {
      console.log('✅ Branding found:', branding.length, 'records')
      if (branding.length > 0) {
        const b = branding[0]
        console.log('   Logo URL:', b.logo_url ? '✅ Set' : '❌ Empty')
        console.log('   Signature URL:', b.signature_url ? '✅ Set' : '❌ Empty')
        console.log('   Primary Color:', b.primary_color)
        console.log('   Secondary Color:', b.secondary_color)
        console.log('   Quotation Template:', b.quotation_template || 'Not set')
        console.log('   Invoice Template:', b.invoice_template || 'Not set')
      }
    }

    // 4. Check branding table structure
    console.log('\n4️⃣ Checking branding table structure:')
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'branding')

    if (columnError) {
      console.log('❌ Column check error:', columnError.message)
    } else {
      console.log('✅ Branding columns:')
      columns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    }

    // 5. Check storage bucket
    console.log('\n5️⃣ Checking storage bucket:')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.log('❌ Bucket error:', bucketError.message)
    } else {
      const brandingBucket = buckets.find(b => b.name === 'branding')
      if (brandingBucket) {
        console.log('✅ Branding bucket exists:', brandingBucket.name)
        console.log('   Public:', brandingBucket.public)
      } else {
        console.log('❌ Branding bucket not found')
      }
    }

  } catch (error) {
    console.error('❌ Debug error:', error.message)
  }
}

// Load environment variables
if (typeof window === 'undefined') {
  require('dotenv').config({ path: '.env.local' })
}

debugCompanySettings()