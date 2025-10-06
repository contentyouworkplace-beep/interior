import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create admin client with service role
const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    console.log('Admin plans API: Fetching all plans...')
    const adminClient = createAdminClient()
    
    const { data: plans, error } = await adminClient
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching plans:', error)
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      )
    }

    console.log(`Found ${plans?.length || 0} plans`)

    // Get ALL users from auth to count plan assignments
    const { data: authData, error: authError } = await adminClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching users:', authError)
      return NextResponse.json({ plans: plans || [] })
    }

    // Count users for each plan from user_metadata.plan_id
    const plansWithCounts = (plans || []).map((plan) => {
      const userCount = authData.users.filter(
        (user) => user.user_metadata?.plan_id === plan.id
      ).length
      
      return {
        ...plan,
        user_count: userCount
      }
    })

    console.log('Plans with user counts:', plansWithCounts.map(p => ({ name: p.name, user_count: p.user_count })))

    return NextResponse.json({ plans: plansWithCounts })
  } catch (error) {
    console.error('Error in plans API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    console.log('Admin plans API: Creating new plan...')
    const { 
      name, 
      description, 
      price, 
      duration_days, 
      features, 
      max_projects, 
      max_users, 
      support_level, 
      is_active 
    } = await request.json()
    
    console.log('Plan data received:', { name, price, duration_days, is_active })
    
    if (!name) {
      return NextResponse.json(
        { error: 'Plan name is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    
    // Auto-generate description if not provided
    const autoDescription = description || `${name} - ₹${price || 0} for ${duration_days || 30} days`
    
    const planData = {
      name,
      description: autoDescription,
      price: price || 0,
      duration_days: duration_days || 30,
      features: features || ['Basic CRM Features'],
      max_projects: max_projects || 50,
      max_users: max_users || 5,
      support_level: support_level || 'email',
      is_active: is_active !== undefined ? is_active : true
    }
    
    console.log('Creating plan with data:', planData)
    
    const { data, error } = await adminClient
      .from('plans')
      .insert(planData)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating plan:', error)
      return NextResponse.json(
        { error: 'Failed to create plan', details: error.message },
        { status: 500 }
      )
    }

    console.log('Plan created successfully:', data)
    return NextResponse.json({
      message: 'Plan created successfully',
      plan: data
    })
  } catch (error) {
    console.error('Error in plan creation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}