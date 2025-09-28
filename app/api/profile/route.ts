import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    // Use the authenticated user from cookies/session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    // Get user profile - try both user_id and id fields for compatibility
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    // If not found by user_id, try by id field (for existing tables)
    if (!profile && error?.code === 'PGRST116') {
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      profile = result.data
      error = result.error
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    // If no profile exists, create a basic one initialized from auth user
    if (!profile) {
      const newProfile = {
        id: userId,
        user_id: userId,
        email: user.email,
        first_name: user.user_metadata?.first_name ?? null,
        last_name: user.user_metadata?.last_name ?? null,
        phone: user.user_metadata?.phone ?? null,
        role: user.user_metadata?.role ?? null,
        company_name: user.user_metadata?.company_name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as const

      const { data: createdProfile, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single()

      if (createError) {
        console.error('Error creating profile:', createError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      return NextResponse.json({
        profile: createdProfile
      })
    }

    return NextResponse.json({
      profile: profile
    })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    const body = await request.json()
    
    // Prepare profile update data (allow specific fields only; email is read-only here)
    const allowedFields = [
      'first_name',
      'last_name',
      'phone',
      'role',
      'company_name',
      'designation',
      'department',
      'avatar_url'
    ] as const

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const key of allowedFields) {
      if (key in body) {
        const value = typeof body[key] === 'string' ? body[key].trim?.() ?? body[key] : body[key]
        updateData[key] = value
      }
    }

    // Update profile - try user_id first, then id
    let { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()
      
    // If update by user_id failed, try by id
    if (error && error.code === 'PGRST116') {
      const result = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()
      updatedProfile = result.data
      error = result.error
    }

    // If no rows updated (profile missing), create it now
    if ((error && error.code === 'PGRST116') || !updatedProfile) {
      const insertData = {
        id: userId,
        user_id: userId,
        email: user.email,
        ...updateData
      }
      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert(insertData)
        .select()
        .single()
      if (insertError) {
        console.error('Error creating profile during update:', insertError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
      return NextResponse.json({ profile: created, success: true })
    }

    if (error) {
      console.error('Error updating profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({
      profile: updatedProfile,
      success: true
    })

  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}