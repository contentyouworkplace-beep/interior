import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's plan_id and expires_at from user_metadata
    const planId = user.user_metadata?.plan_id
    const expiresAt = user.user_metadata?.expires_at

    // Fetch plan details from plans table
    let planDetails = null
    if (planId) {
      const { data: plan } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single()
      
      planDetails = plan
    }

    // Get user's organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        organizations:organization_id (
          name
        )
      `)
      .eq('user_id', user.id)
      .single()

    // Calculate status based on expiry
    let status = 'active'
    if (expiresAt) {
      const now = new Date()
      const expiry = new Date(expiresAt)
      status = expiry < now ? 'expired' : 'active'
    }

    // Get subscription history (we'll store in subscriptions table for history)
    const { data: subscriptionHistory } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plans:plan_id (
          name,
          price,
          duration_days
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      subscription: {
        plan_id: planId,
        plan_name: planDetails?.name || 'No Plan',
        plan_price: planDetails?.price || 0,
        plan_duration: planDetails?.duration_days || 0,
        plan_features: planDetails?.features || [],
        status: status,
        expires_at: expiresAt || null,
        created_at: user.created_at,
        organization: orgMember?.organizations?.name || 'N/A'
      },
      planDetails: planDetails,
      history: subscriptionHistory || []
    })
  } catch (error) {
    console.error('Error in user subscription API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}