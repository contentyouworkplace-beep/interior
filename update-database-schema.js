// Execute database schema updates for QR code and Terms & Conditions
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateDatabaseSchema() {
  console.log('🚀 Updating database schema for QR codes and Terms & Conditions...')

  try {
    // 1. Add QR code URL column to branding table
    console.log('📊 Adding qr_code_url column to branding table...')
    const { error: qrError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.branding ADD COLUMN IF NOT EXISTS qr_code_url text;'
    })

    if (qrError && !qrError.message.includes('already exists')) {
      console.error('❌ Error adding qr_code_url column:', qrError)
    } else {
      console.log('✅ QR code URL column added to branding table')
    }

    // 2. Add terms and conditions column to company_profiles table
    console.log('📋 Adding terms_and_conditions column to company_profiles table...')
    const { error: termsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS terms_and_conditions text;'
    })

    if (termsError && !termsError.message.includes('already exists')) {
      console.error('❌ Error adding terms_and_conditions column:', termsError)
    } else {
      console.log('✅ Terms and conditions column added to company_profiles table')
    }

    // 3. Insert sample terms and conditions
    console.log('📝 Adding sample terms and conditions...')
    const sampleTerms = `Payment Terms:
1. Full payment is due within 30 days of invoice date
2. Late payments may incur a 1.5% monthly service charge
3. All disputes must be raised within 7 days of invoice receipt

Design Terms:
1. All designs remain the property of Interior Design Company until full payment
2. Minor revisions (up to 3) are included in the quoted price
3. Major design changes will incur additional charges

General Terms:
1. Client must provide accurate measurements and site access
2. Project timeline may be affected by unforeseen circumstances
3. All materials are subject to availability and may have substitutions
4. Installation services are subject to separate agreement

Liability:
1. Our liability is limited to the contract value
2. Client is responsible for obtaining necessary permits
3. We are not liable for damages due to structural issues

By proceeding with this project, you agree to these terms and conditions.`

    const { error: updateError } = await supabase
      .from('company_profiles')
      .update({ terms_and_conditions: sampleTerms })
      .is('terms_and_conditions', null)

    if (updateError) {
      console.log('⚠️ Could not update terms (table might not exist yet):', updateError.message)
    } else {
      console.log('✅ Sample terms and conditions added')
    }

    // 4. Verify the changes
    console.log('🔍 Verifying database structure...')
    
    const { data: brandingData, error: brandingError } = await supabase
      .from('branding')
      .select('organization_id, logo_url, signature_url, qr_code_url, quotation_template, invoice_template')
      .limit(1)

    if (brandingError) {
      console.log('⚠️ Could not verify branding table:', brandingError.message)
    } else {
      console.log('✅ Branding table structure verified')
      console.log('📊 Sample branding data:', brandingData)
    }

    const { data: profileData, error: profileError } = await supabase
      .from('company_profiles')
      .select('organization_id, company_name, terms_and_conditions')
      .limit(1)

    if (profileError) {
      console.log('⚠️ Could not verify company_profiles table:', profileError.message)
    } else {
      console.log('✅ Company profiles table structure verified')
      console.log('📋 Sample profile data:', profileData)
    }

    console.log('🎉 Database schema update completed successfully!')

  } catch (error) {
    console.error('❌ Error updating database schema:', error)
  }
}

// Execute the update
updateDatabaseSchema()