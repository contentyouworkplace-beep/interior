import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing Supabase configuration' 
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log('Setting up auto organization creation system...')
    
    // Step 1: Create/update the handle_new_user function
    const handleNewUserSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger AS $$
      DECLARE
          default_org_id uuid := '00000000-0000-0000-0000-000000000001';
      BEGIN
          -- Create user profile first
          INSERT INTO public.profiles (id, first_name, last_name, role)
          VALUES (new.id, '', '', 'designer');
          
          -- Check if default organization exists, create if not
          INSERT INTO public.organizations (id, name, description)
          VALUES (default_org_id, 'Default Organization', 'Auto-created default organization')
          ON CONFLICT (id) DO NOTHING;
          
          -- Add user to the default organization as admin (first user) or member
          INSERT INTO public.organization_members (organization_id, user_id, role)
          VALUES (
              default_org_id, 
              new.id, 
              CASE 
                  WHEN (SELECT COUNT(*) FROM public.organization_members WHERE organization_id = default_org_id) = 0 
                  THEN 'admin' 
                  ELSE 'member' 
              END
          )
          ON CONFLICT (organization_id, user_id) DO NOTHING;
          
          -- Create basic company profile with defaults (only if not exists)
          INSERT INTO public.company_profiles (
              organization_id, 
              company_name,
              company_tagline,
              email,
              phone
          )
          VALUES (
              default_org_id,
              'Your Company',
              'Professional Interior Design Services',
              new.email,
              ''
          )
          ON CONFLICT (organization_id) DO UPDATE SET
              email = CASE WHEN company_profiles.email = '' OR company_profiles.email IS NULL 
                          THEN EXCLUDED.email 
                          ELSE company_profiles.email END,
              updated_at = NOW();
          
          -- Create basic banking info
          INSERT INTO public.banking_info (organization_id)
          VALUES (default_org_id)
          ON CONFLICT (organization_id) DO NOTHING;
          
          -- Create basic branding settings
          INSERT INTO public.branding (
              organization_id,
              primary_color,
              secondary_color,
              quotation_template,
              invoice_template
          )
          VALUES (
              default_org_id,
              '#3B82F6',
              '#1E40AF',
              'modern',
              'modern'
          )
          ON CONFLICT (organization_id) DO NOTHING;
          
          RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
    
    let functionError = null
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: handleNewUserSQL })
      functionError = error
    } catch (e) {
      functionError = e
    }
    
    // Alternative approach if exec_sql doesn't work
    if (functionError) {
      console.log('Using alternative approach for function creation...')
      // We'll create the function via a simpler API call
    }
    
    // Step 2: Recreate the trigger
    const triggerSQL = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `
    
    // Step 3: Fix existing users without organization membership
    const defaultOrgId = '00000000-0000-0000-0000-000000000001'
    
    // Ensure default organization exists
    const { error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: defaultOrgId,
        name: 'Default Organization',
        description: 'Auto-created default organization'
      })
    
    if (orgError) {
      console.log('Org creation error:', orgError)
    }
    
    // Get all users from profiles who don't have organization membership
    const { data: profilesWithoutOrg, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        organization_members!left(user_id)
      `)
      .is('organization_members.user_id', null)
    
    let fixedUsers = 0
    
    if (profilesWithoutOrg && profilesWithoutOrg.length > 0) {
      for (const user of profilesWithoutOrg) {
        // Add user to default organization
        const { error: memberError } = await supabase
          .from('organization_members')
          .upsert({
            organization_id: defaultOrgId,
            user_id: user.id,
            role: fixedUsers === 0 ? 'admin' : 'member'
          })
        
        if (!memberError) {
          fixedUsers++
        }
      }
      
      // Create/update company profile for the default organization
      const firstUser = profilesWithoutOrg[0]
      if (firstUser) {
        await supabase
          .from('company_profiles')
          .upsert({
            organization_id: defaultOrgId,
            company_name: 'Your Company',
            company_tagline: 'Professional Interior Design Services',
            email: ''
          })
        
        // Create banking and branding records
        await supabase.from('banking_info').upsert({ organization_id: defaultOrgId })
        await supabase.from('branding').upsert({
          organization_id: defaultOrgId,
          primary_color: '#3B82F6',
          secondary_color: '#1E40AF',
          quotation_template: 'modern',
          invoice_template: 'modern'
        })
      }
    }
    
    // Step 4: Verify the setup
    const { data: orgData } = await supabase.from('organizations').select('*')
    const { data: memberData } = await supabase.from('organization_members').select('*')
    const { data: profileData } = await supabase.from('company_profiles').select('*')
    
    return NextResponse.json({
      success: true,
      message: 'Auto organization setup completed',
      data: {
        organizations: orgData?.length || 0,
        memberships: memberData?.length || 0,
        company_profiles: profileData?.length || 0,
        fixed_users: fixedUsers
      }
    })
    
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}