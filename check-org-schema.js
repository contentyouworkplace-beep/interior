const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  // Check organizations table
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .limit(1)
  
  if (orgsError) {
    console.error('Error:', orgsError)
  } else {
    console.log('Organizations columns:', orgs[0] ? Object.keys(orgs[0]) : 'No data')
  }

  // Check organization_members table
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select('*')
    .limit(1)
  
  if (membersError) {
    console.error('Error:', membersError)
  } else {
    console.log('Organization_members columns:', members[0] ? Object.keys(members[0]) : 'No data')
  }

  // Check profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  
  if (profilesError) {
    console.error('Error:', profilesError)
  } else {
    console.log('Profiles columns:', profiles[0] ? Object.keys(profiles[0]) : 'No data')
  }

  // Check for company_settings or business_settings table
  const { data: companySettings, error: companyError } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
  
  if (!companyError) {
    console.log('Company_settings columns:', companySettings[0] ? Object.keys(companySettings[0]) : 'No data')
  } else {
    console.log('Company_settings error:', companyError.message)
  }

  const { data: businessSettings, error: businessError } = await supabase
    .from('business_settings')
    .select('*')
    .limit(1)
  
  if (!businessError) {
    console.log('Business_settings columns:', businessSettings[0] ? Object.keys(businessSettings[0]) : 'No data')
  } else {
    console.log('Business_settings error:', businessError.message)
  }
}

checkSchema().catch(console.error)
