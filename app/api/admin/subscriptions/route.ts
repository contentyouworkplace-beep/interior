import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Create admin client with service role
const createAdminClient = () => {
  return createClient(process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  try {
    const adminClient = createAdminClient()
    
    const { data: subscriptions, error } = await adminClient
      .from('subscriptions')
      .select(`
        *,
        users:user_id (
          email,
          created_at
        ),
        organizations:organization_id (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ subscriptions })
  } catch (error) {
    console.error('Error in subscriptions API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, plan, expiryDate, status } = await request.json()
    
    if (!id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (plan) updateData.plan = plan
    if (expiryDate) updateData.expires_at = expiryDate
    if (status) updateData.status = status

    const { data, error } = await adminClient
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating subscription:', error)
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Subscription updated successfully',
      subscription: data
    })
  } catch (error) {
    console.error('Error in subscription update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}