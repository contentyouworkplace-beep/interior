import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch team members for the authenticated user
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    return NextResponse.json({ 
      data: teamMembers || [],
      message: 'Team members fetched successfully'
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate required fields
    const { name, email, phone, role, status = 'active', monthly_salary } = body
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 })
    }

    // Create team member
    const { data: teamMember, error } = await supabase
      .from('team_members')
      .insert({
        name,
        email,
        phone,
        role,
        status,
        salary: monthly_salary, // Map monthly_salary to existing salary column
        user_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
    }

    return NextResponse.json({ 
      data: teamMember,
      message: 'Team member created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}