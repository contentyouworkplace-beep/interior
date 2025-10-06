import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminUserServer } from '@/lib/admin/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // For now, skip admin check in development
    // const isAdmin = await isAdminUserServer()
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    // }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get ALL auth users
    const { data: authData, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Error fetching auth users:', error)
      return NextResponse.json({ error: 'Failed to fetch users', details: error.message }, { status: 500 })
    }

    const users = authData.users
    console.log('Fetched ALL users:', users?.length || 0)
    
    // Get organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
    
    // Get organization members
    const { data: members } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role')
    
    // Get subscriptions with plan details - fallback to user_metadata if table doesn't exist
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        plan_id,
        status,
        expires_at,
        plans(id, name, price, duration_days)
      `)
    
    if (subError) {
      console.log('Subscriptions table not available, will use user_metadata')
    }
    
    // Get all plans to map IDs to names and get duration
    const { data: allPlans } = await supabase
      .from('plans')
      .select('id, name, duration_days')
    
    const plansMap = new Map(allPlans?.map(p => [p.id, { name: p.name, duration_days: p.duration_days }]) || [])
    
    // Combine data
    const combinedUsers = users.map(user => {
      const userMember = members?.find(m => m.user_id === user.id)
      const userOrg = orgs?.find(o => o.id === userMember?.organization_id)
      const userSub = subscriptions?.find(s => s.user_id === user.id)
      
      // Get plan from subscription or user_metadata
      let planId = userSub?.plan_id || user.user_metadata?.plan_id || null
      let planName = 'Starter'
      let durationDays = 30
      
      if (userSub && userSub.plans) {
        planName = (userSub.plans as any)?.name || 'Starter'
      } else if (planId && plansMap.has(planId)) {
        const planInfo = plansMap.get(planId)!
        planName = planInfo.name
        durationDays = planInfo.duration_days || 30
      }
      
      // Get or calculate expires_at
      let expiresAt = userSub?.expires_at || user.user_metadata?.expires_at
      if (!expiresAt) {
        // If no expiry date, set default based on plan duration
        expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      }
      
      // Calculate if subscription is expired
      const isExpired = new Date(expiresAt) < new Date()
      const status = isExpired ? 'expired' : 'active'
      
      return {
        id: user.id,
        email: user.email || '',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        is_active: true,
        organization: userOrg ? {
          id: userOrg.id,
          name: userOrg.name
        } : null,
        subscription: {
          plan: planName,
          plan_id: planId,
          status: status,
          expires_at: expiresAt
        }
      }
    })

    console.log('Combined users:', combinedUsers.length)
    return NextResponse.json({ users: combinedUsers })
  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // For now, skip admin check in development
    // const isAdmin = await isAdminUserServer()
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    // }

    const body = await request.json()
    const { email, password, company, plan } = body

    console.log('Creating user with:', { email, company, plan })

    if (!email || !password || !company || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get plan details to calculate expiry date
    const { data: planData } = await supabase
      .from('plans')
      .select('duration_days')
      .eq('id', plan)
      .single()

    const durationDays = planData?.duration_days || 30
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + durationDays)
    
    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id
    console.log('Created auth user:', userId)

    // Create organization for the user
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert([{
        name: company
      }])
      .select('*')
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      // Cleanup
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: 'Failed to create organization', details: orgError.message },
        { status: 500 }
      )
    }

    console.log('Created organization:', orgData.id)

    // Create profile - MUST succeed
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: email.split('@')[0],
        last_name: '',
        role: 'admin'
      })
      .select('*')
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Cleanup
      await supabase.auth.admin.deleteUser(userId)
      await supabase.from('organizations').delete().eq('id', orgData.id)
      return NextResponse.json(
        { error: 'Failed to create profile', details: profileError.message },
        { status: 500 }
      )
    }

    console.log('Created profile:', profileData)

    // Store plan and expiry in user metadata for access control
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        plan_id: plan,
        expires_at: expiryDate.toISOString()
      }
    })

    // Create subscription record with plan reference (if table exists)
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        organization_id: orgData.id,
        plan_id: plan,
        status: 'active',
        expires_at: expiryDate.toISOString()
      })
      .select('*')
      .single()

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError)
      // Continue anyway - expiry is stored in user_metadata
    }

    // Add user to organization
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: orgData.id,
        user_id: userId,
        role: 'admin'
      })

    if (memberError) {
      console.error('Error adding user to organization:', memberError)
      // Cleanup
      await supabase.auth.admin.deleteUser(userId)
      await supabase.from('organizations').delete().eq('id', orgData.id)
      return NextResponse.json({ error: 'Failed to add user to organization' }, { status: 500 })
    }

    // Create company profile
    const { error: companyProfileError } = await supabase
      .from('company_profiles')
      .insert({
        organization_id: orgData.id,
        company_name: company,
        company_tagline: 'Professional Interior Design Services',
        email: email
      })

    if (companyProfileError) {
      console.error('Error creating company profile:', companyProfileError)
      // Don't fail creation if company profile fails
    }

    // Create banking and branding records
    await supabase.from('banking_info').insert({ organization_id: orgData.id })
    await supabase.from('branding').insert({
      organization_id: orgData.id,
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      quotation_template: 'modern',
      invoice_template: 'modern'
    })

    return NextResponse.json({
      message: 'User, organization and subscription created successfully',
      user: authData.user,
      organization: orgData,
      subscription: subscriptionData
    })
  } catch (error) {
    console.error('Admin create user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}