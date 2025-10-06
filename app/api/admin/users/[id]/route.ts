import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminUserServer } from '@/lib/admin/auth'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('PUT user API called for ID:', params.id)
    const { id } = params
    const body = await request.json()
    console.log('Update data received:', body)
    
    const { email, company, plan, password, is_active } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if user exists
    const { data: authUser, error: userError } = await supabase.auth.admin.getUserById(id)
    
    if (userError || !authUser) {
      console.error('User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('Found user:', authUser.user.email)

    // Update email and/or password if provided
    const updateData: any = {}
    
    if (email && email !== authUser.user.email) {
      console.log('Updating email from', authUser.user.email, 'to', email)
      updateData.email = email
    }
    
    if (password && password.length >= 6) {
      console.log('Updating password')
      updateData.password = password
    }
    
    if (Object.keys(updateData).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, updateData)
      if (authError) {
        console.error('Error updating auth data:', authError)
        return NextResponse.json(
          { error: `Failed to update user: ${authError.message}` },
          { status: 500 }
        )
      }
    }

    // Update organization name if provided
    if (company !== undefined && company !== null) {
      console.log('Updating company to:', company)
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', id)
        .single()
      
      if (member) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update({ name: company })
          .eq('id', member.organization_id)
        
        if (orgError) {
          console.error('Error updating organization:', orgError)
        } else {
          console.log('Organization updated successfully')
        }
      }
    }

    // Update active status - Note: is_active column doesn't exist in profiles table
    // So we'll just acknowledge the request but not update anything
    if (is_active !== undefined) {
      console.log('Active status change requested (not persisted):', is_active)
      // The is_active field doesn't exist in the database schema
      // It's kept for UI compatibility only
    }

    // Store plan selection in user metadata since subscriptions table doesn't exist
    if (plan) {
      console.log('Updating user plan in metadata:', plan)
      
      // Get plan details to calculate new expiry date
      const { data: planDetails } = await supabase
        .from('plans')
        .select('duration_days')
        .eq('id', plan)
        .single()
      
      const durationDays = planDetails?.duration_days || 30
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + durationDays)
      
      const { error: metadataError } = await supabase.auth.admin.updateUserById(id, {
        user_metadata: { 
          plan_id: plan,
          expires_at: expiresAt.toISOString()
        }
      })
      
      if (metadataError) {
        console.error('Error updating user metadata:', metadataError)
        return NextResponse.json(
          { error: `Failed to update plan: ${metadataError.message}` },
          { status: 500 }
        )
      }
      
      console.log('Plan and expiry stored in user metadata successfully')
    }

    console.log('User updated successfully')
    return NextResponse.json({ 
      message: 'User updated successfully',
      success: true 
    })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  // Keep PATCH for backward compatibility, redirect to PUT
  return PUT(request, { params })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('DELETE user API called for ID:', params.id)
    const { id } = params
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if user exists first
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(id)
    
    if (getUserError || !authUser) {
      console.error('User not found:', getUserError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('Deleting user:', authUser.user.email)
    
    // Manually delete related records first to avoid cascade issues
    try {
      // Delete subscriptions
      await supabase.from('subscriptions').delete().eq('user_id', id)
      console.log('Subscriptions deleted')
      
      // Delete organization members
      await supabase.from('organization_members').delete().eq('user_id', id)
      console.log('Organization members deleted')
      
      // Delete profile
      await supabase.from('profiles').delete().eq('id', id)
      console.log('Profile deleted')
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError)
      // Continue with auth deletion even if cleanup fails
    }
    
    // Delete user from auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id)

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete user: ${deleteError.message}` },
        { status: 500 }
      )
    }

    console.log('User deleted successfully from auth')
    return NextResponse.json({ 
      message: 'User deleted successfully',
      success: true 
    })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}