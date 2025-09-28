import { createApiClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createApiClient(request)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Auth check - Error:', authError)
    console.log('Auth check - User:', user)
    
    if (authError || !user) {
      return NextResponse.json({ 
        authenticated: false, 
        error: authError?.message || 'No user found',
        authError 
      })
    }

    // Check organization membership
    const { data: memberships, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', user.id)

    console.log('Membership check - Error:', memberError)
    console.log('Membership check - Data:', memberships)

    // Test if we can read company_profiles with RLS
    const { data: profiles, error: profileError } = await supabase
      .from('company_profiles')
      .select('*')
      .limit(5)

    console.log('Profile read test - Error:', profileError)
    console.log('Profile read test - Data:', profiles)

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      },
      memberships: memberships || [],
      membershipError: memberError?.message,
      profiles: profiles || [],
      profileError: profileError?.message,
      canReadProfiles: !profileError && Array.isArray(profiles)
    })

  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      error: error.message,
      authenticated: false 
    }, { status: 500 })
  }
}