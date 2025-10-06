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
    const adminClient = createAdminClient()
    
    // Get all active plans for admin selection
    const { data: plans, error } = await adminClient
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) {
      console.error('Error fetching active plans:', error)
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      )
    }

    return NextResponse.json({ plans: plans || [] })
  } catch (error) {
    console.error('Error in active plans API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}